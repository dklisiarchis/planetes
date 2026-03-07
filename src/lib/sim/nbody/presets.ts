/**
 * N-body simulation presets.
 * Each system defines its physics, visuals, rendering config, and "What If?" scenarios.
 */

// ── Interfaces ──

export interface BodyVisuals {
	colors: Float32Array;
	radii: Float32Array;
	emissive?: Float32Array;
	names?: string[];
}

export interface BodyRenderConfig {
	texture: string;
	isStar?: boolean;
	hasRings?: boolean;
	ringTexture?: string;
	hasAtmosphere?: boolean;
	cloudsTexture?: string;
	rotationSpeed: number;
	materialColor?: string;
}

export interface StarGlow {
	gradientStops: [string, string, string, string];
	lightColor: string;
	lightIntensity: number;
	lightDistance: number;
}

export interface WhatIfAction {
	label: string;
	type: 'star_mass' | 'body_mass' | 'g_mult';
	bodyIndex?: number;
	value: number;
}

export interface SystemConfig {
	id: string;
	name: string;
	description: string;
	cardGradient: string; // tailwind gradient for selector card
	bodyCount: number;
	defaults: { g: number; dt: number; softening: number; timeScale: number };
	visualScale: number;
	renderConfig: BodyRenderConfig[];
	starGlow: StarGlow;
	whatIf: WhatIfAction[];
	bodyNames: string[];
	asteroidBelt?: { count: number; inner: number; outer: number };
	generate(): { bodies: Float32Array; visuals: BodyVisuals };
}

// ── Keplerian math (shared) ──

const DEG = Math.PI / 180;
const G_AU = 4 * Math.PI * Math.PI; // G in AU³/(M☉·yr²)

function solveKepler(M: number, e: number): number {
	let E = M;
	for (let i = 0; i < 30; i++) {
		const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
		E -= dE;
		if (Math.abs(dE) < 1e-12) break;
	}
	return E;
}

function keplerianToCartesian(
	a: number, e: number, I_deg: number,
	Omega_deg: number, wBar_deg: number, L_deg: number,
	mu: number
): [number, number, number, number, number, number] {
	const omega = (wBar_deg - Omega_deg) * DEG;
	const M = ((L_deg - wBar_deg) % 360) * DEG;
	const Omega = Omega_deg * DEG;
	const inc = I_deg * DEG;

	const E = solveKepler(M, e);

	const cosE = Math.cos(E);
	const sinE = Math.sin(E);
	const x_orb = a * (cosE - e);
	const y_orb = a * Math.sqrt(1 - e * e) * sinE;

	const r = a * (1 - e * cosE);
	const n = Math.sqrt(mu / (a * a * a));
	const edot = n / (1 - e * cosE);
	const vx_orb = -a * sinE * edot;
	const vy_orb = a * Math.sqrt(1 - e * e) * cosE * edot;

	const cosW = Math.cos(omega), sinW = Math.sin(omega);
	const cosO = Math.cos(Omega), sinO = Math.sin(Omega);
	const cosI = Math.cos(inc), sinI = Math.sin(inc);

	const Px = cosW * cosO - sinW * sinO * cosI;
	const Py = cosW * sinO + sinW * cosO * cosI;
	const Pz = sinW * sinI;
	const Qx = -sinW * cosO - cosW * sinO * cosI;
	const Qy = -sinW * sinO + cosW * cosO * cosI;
	const Qz = cosW * sinI;

	return [
		Px * x_orb + Qx * y_orb,
		Py * x_orb + Qy * y_orb,
		Pz * x_orb + Qz * y_orb,
		Px * vx_orb + Qx * vy_orb,
		Py * vx_orb + Qy * vy_orb,
		Pz * vx_orb + Qz * vy_orb,
	];
}

/** Generate bodies from Keplerian planet data + a central star */
function generateFromKeplerian(
	starMass: number,
	starVisual: { name: string; color: readonly [number, number, number]; radius: number; emissive: number },
	planets: {
		name: string; a: number; e: number; I: number;
		L: number; wBar: number; Omega: number; mass: number;
		color: readonly [number, number, number]; radius: number;
	}[]
): { bodies: Float32Array; visuals: BodyVisuals } {
	const n = planets.length + 1;
	const bodies = new Float32Array(n * 7);
	const colors = new Float32Array(n * 3);
	const radii = new Float32Array(n);
	const emissive = new Float32Array(n);

	// Star at index 0
	bodies[6] = starMass;
	colors[0] = starVisual.color[0];
	colors[1] = starVisual.color[1];
	colors[2] = starVisual.color[2];
	radii[0] = starVisual.radius;
	emissive[0] = starVisual.emissive;

	let px = 0, py = 0, pz = 0;

	for (let i = 0; i < planets.length; i++) {
		const p = planets[i];
		const idx = i + 1;
		const off = idx * 7;
		const mu = G_AU * (starMass + p.mass);

		const [x, y, z, vx, vy, vz] = keplerianToCartesian(
			p.a, p.e, p.I, p.Omega, p.wBar, p.L, mu
		);

		bodies[off] = x;
		bodies[off + 1] = y;
		bodies[off + 2] = z;
		bodies[off + 3] = vx;
		bodies[off + 4] = vy;
		bodies[off + 5] = vz;
		bodies[off + 6] = p.mass;

		px += p.mass * vx;
		py += p.mass * vy;
		pz += p.mass * vz;

		colors[idx * 3] = p.color[0];
		colors[idx * 3 + 1] = p.color[1];
		colors[idx * 3 + 2] = p.color[2];
		radii[idx] = p.radius;
		emissive[idx] = 0.15;
	}

	// CoM correction
	bodies[3] = -px / starMass;
	bodies[4] = -py / starMass;
	bodies[5] = -pz / starMass;

	const names = [starVisual.name, ...planets.map((p) => p.name)];
	return { bodies, visuals: { colors, radii, emissive, names } };
}

// ══════════════════════════════════════════════
// SOLAR SYSTEM
// ══════════════════════════════════════════════

const SOLAR_PLANETS = [
	{ name: 'Mercury', a: 0.38709843, e: 0.20563661, I: 7.00559432,
	  L: 252.25166724, wBar: 77.45771895, Omega: 48.33961819,
	  mass: 1.66014e-7, color: [0.7, 0.6, 0.5] as const, radius: 0.04 },
	{ name: 'Venus', a: 0.72332102, e: 0.00676399, I: 3.39777545,
	  L: 181.97970850, wBar: 131.76755713, Omega: 76.67261496,
	  mass: 2.44783e-6, color: [0.9, 0.7, 0.3] as const, radius: 0.06 },
	{ name: 'Earth', a: 1.00000018, e: 0.01673163, I: 0.00054346,
	  L: 100.46691572, wBar: 102.93005885, Omega: -5.11260389,
	  mass: 3.00348e-6, color: [0.2, 0.5, 1.0] as const, radius: 0.065 },
	{ name: 'Mars', a: 1.52371243, e: 0.09336511, I: 1.85181869,
	  L: -4.56813164, wBar: -23.91744784, Omega: 49.71320984,
	  mass: 3.22715e-7, color: [0.9, 0.3, 0.2] as const, radius: 0.05 },
	{ name: 'Jupiter', a: 5.20248019, e: 0.04853590, I: 1.29861416,
	  L: 34.33479152, wBar: 14.27495244, Omega: 100.29282654,
	  mass: 9.54789e-4, color: [0.8, 0.6, 0.3] as const, radius: 0.14 },
	{ name: 'Saturn', a: 9.54149883, e: 0.05550825, I: 2.49424102,
	  L: 50.07571329, wBar: 92.86136063, Omega: 113.63998702,
	  mass: 2.85886e-4, color: [0.9, 0.8, 0.5] as const, radius: 0.12 },
	{ name: 'Uranus', a: 19.18797948, e: 0.04685740, I: 0.77298127,
	  L: 314.20276625, wBar: 172.43404441, Omega: 73.96250215,
	  mass: 4.36625e-5, color: [0.5, 0.8, 0.9] as const, radius: 0.09 },
	{ name: 'Neptune', a: 30.06952752, e: 0.00895439, I: 1.77005520,
	  L: 304.22289287, wBar: 46.68158724, Omega: 131.78635853,
	  mass: 5.15138e-5, color: [0.3, 0.4, 0.9] as const, radius: 0.09 },
	{ name: 'Pluto', a: 39.48211675, e: 0.24882730, I: 17.14001206,
	  L: 238.92903833, wBar: 224.06891629, Omega: 110.30393684,
	  mass: 6.58e-9, color: [0.8, 0.7, 0.6] as const, radius: 0.035 },
];

const SOLAR_STAR = { name: 'Sun', color: [1.0, 0.9, 0.3] as const, radius: 0.18, emissive: 2.0 };

const solarSystem: SystemConfig = {
	id: 'solar-system',
	name: 'Solar System',
	description: 'Our home system — 8 planets and Pluto orbiting a G-type main-sequence star. Features Saturn\'s rings, Earth\'s cloud layer, and a detailed asteroid belt.',
	cardGradient: 'from-amber-500/20 via-orange-600/10 to-transparent',
	bodyCount: SOLAR_PLANETS.length + 1,
	defaults: {
		g: G_AU,
		dt: 0.0005,
		softening: 0.001,
		timeScale: 5,
	},
	visualScale: 1.0,
	bodyNames: [SOLAR_STAR.name, ...SOLAR_PLANETS.map(p => p.name)],
	renderConfig: [
		{ texture: '/textures/planets/sun.jpg', isStar: true, rotationSpeed: 0.001 },
		{ texture: '/textures/planets/mercury.jpg', rotationSpeed: 0.002 },
		{ texture: '/textures/planets/venus_atmosphere.jpg', rotationSpeed: -0.0015 },
		{ texture: '/textures/planets/earth_day.jpg', hasAtmosphere: true, cloudsTexture: '/textures/planets/earth_clouds.jpg', rotationSpeed: 0.01 },
		{ texture: '/textures/planets/mars.jpg', rotationSpeed: 0.009 },
		{ texture: '/textures/planets/jupiter.jpg', rotationSpeed: 0.02 },
		{ texture: '/textures/planets/saturn.jpg', hasRings: true, ringTexture: '/textures/planets/saturn_ring.png', rotationSpeed: 0.018 },
		{ texture: '/textures/planets/uranus.jpg', rotationSpeed: -0.012 },
		{ texture: '/textures/planets/neptune.jpg', rotationSpeed: 0.011 },
		{ texture: '/textures/planets/mercury.jpg', rotationSpeed: -0.008 },
	],
	starGlow: {
		gradientStops: [
			'rgba(255, 220, 100, 0.8)',
			'rgba(255, 180, 50, 0.4)',
			'rgba(255, 140, 20, 0.1)',
			'rgba(255, 100, 0, 0)',
		],
		lightColor: '#fff4e0',
		lightIntensity: 3,
		lightDistance: 100,
	},
	asteroidBelt: { count: 3000, inner: 2.1, outer: 3.3 },
	whatIf: [
		{ label: '☀️ Sun 2× Mass', type: 'star_mass', value: 2.0 },
		{ label: '☀️ Sun ½× Mass', type: 'star_mass', value: 0.5 },
		{ label: '☀️ Sun 10× Mass', type: 'star_mass', value: 10.0 },
		{ label: '🪐 Remove Jupiter', type: 'body_mass', bodyIndex: 5, value: 0 },
		{ label: '🪐 Jupiter → Star', type: 'body_mass', bodyIndex: 5, value: 0.08 },
		{ label: '🌍 Earth 100× Mass', type: 'body_mass', bodyIndex: 3, value: 3.0e-4 },
		{ label: '💫 2× Gravity', type: 'g_mult', value: 2.0 },
		{ label: '💫 ½× Gravity', type: 'g_mult', value: 0.5 },
		{ label: '💫 No Gravity', type: 'g_mult', value: 0.001 },
	],
	generate() {
		return generateFromKeplerian(1.0, SOLAR_STAR, SOLAR_PLANETS);
	},
};

// ══════════════════════════════════════════════
// TRAPPIST-1
// ══════════════════════════════════════════════
// Data: Agol et al. 2021 (PSJ), NASA Exoplanet Archive
// Star: M8V ultra-cool red dwarf, 0.0898 M☉, 2566 K
// 7 Earth-sized planets in tight orbits, near-resonant chain
// 3 planets (e, f, g) in the habitable zone

const TRAPPIST1_STAR_MASS = 0.0898;
const M_EARTH = 3.00348e-6; // solar masses

const TRAPPIST1_PLANETS = [
	{ name: 'b', a: 0.01154, e: 0.00622, I: 0.5,
	  L: 0, wBar: 20, Omega: 0,
	  mass: 1.374 * M_EARTH, color: [0.85, 0.45, 0.2] as const, radius: 0.035 },
	{ name: 'c', a: 0.01580, e: 0.00654, I: 0.3,
	  L: 72, wBar: 50, Omega: 5,
	  mass: 1.308 * M_EARTH, color: [0.9, 0.7, 0.4] as const, radius: 0.034 },
	{ name: 'd', a: 0.02227, e: 0.00837, I: 0.8,
	  L: 144, wBar: 90, Omega: 10,
	  mass: 0.388 * M_EARTH, color: [0.6, 0.55, 0.5] as const, radius: 0.028 },
	{ name: 'e', a: 0.02925, e: 0.00510, I: 0.2,
	  L: 200, wBar: 140, Omega: 15,
	  mass: 0.692 * M_EARTH, color: [0.3, 0.6, 0.65] as const, radius: 0.032 },
	{ name: 'f', a: 0.03849, e: 0.01007, I: 0.6,
	  L: 255, wBar: 180, Omega: 20,
	  mass: 1.039 * M_EARTH, color: [0.3, 0.5, 0.8] as const, radius: 0.034 },
	{ name: 'g', a: 0.04683, e: 0.00208, I: 0.4,
	  L: 310, wBar: 220, Omega: 25,
	  mass: 1.321 * M_EARTH, color: [0.35, 0.55, 0.85] as const, radius: 0.036 },
	{ name: 'h', a: 0.06189, e: 0.00567, I: 1.0,
	  L: 30, wBar: 270, Omega: 30,
	  mass: 0.326 * M_EARTH, color: [0.7, 0.75, 0.85] as const, radius: 0.026 },
];

const TRAPPIST1_STAR = { name: 'TRAPPIST-1', color: [0.95, 0.25, 0.1] as const, radius: 0.08, emissive: 1.5 };

const trappist1: SystemConfig = {
	id: 'trappist-1',
	name: 'TRAPPIST-1',
	description: '7 Earth-sized worlds orbiting an ultra-cool red dwarf 40 light-years away. Three planets sit in the habitable zone. A near-resonant orbital chain makes this system uniquely fragile.',
	cardGradient: 'from-red-600/20 via-rose-800/10 to-transparent',
	bodyCount: TRAPPIST1_PLANETS.length + 1,
	defaults: {
		g: G_AU,
		dt: 0.00004,     // ~0.35 hours — keeps tight orbits stable
		softening: 0.0001,
		timeScale: 1,    // ~0.58 days/sec at 60fps — planet b orbits every ~2.6s
	},
	visualScale: 100, // scale 0.06 AU → 6 AU for camera compatibility
	bodyNames: [TRAPPIST1_STAR.name, ...TRAPPIST1_PLANETS.map(p => p.name)],
	renderConfig: [
		{ texture: '/textures/planets/sun.jpg', isStar: true, materialColor: '#ff4422', rotationSpeed: 0.001 },
		{ texture: '/textures/planets/mercury.jpg', materialColor: '#dd7733', rotationSpeed: 0.001 },   // b: hot rocky
		{ texture: '/textures/planets/venus_atmosphere.jpg', rotationSpeed: 0.001 },                     // c: thick atmosphere
		{ texture: '/textures/planets/mercury.jpg', materialColor: '#998877', rotationSpeed: 0.001 },    // d: small rocky
		{ texture: '/textures/planets/earth_day.jpg', rotationSpeed: 0.001 },                            // e: habitable
		{ texture: '/textures/planets/earth_day.jpg', materialColor: '#6699cc', rotationSpeed: 0.001 },  // f: habitable
		{ texture: '/textures/planets/earth_day.jpg', materialColor: '#5577aa', rotationSpeed: 0.001 },  // g: largest, habitable
		{ texture: '/textures/planets/neptune.jpg', materialColor: '#aabbcc', rotationSpeed: 0.001 },    // h: cold, icy
	],
	starGlow: {
		gradientStops: [
			'rgba(255, 80, 30, 0.7)',
			'rgba(200, 40, 20, 0.35)',
			'rgba(150, 20, 10, 0.08)',
			'rgba(100, 10, 0, 0)',
		],
		lightColor: '#ff6040',
		lightIntensity: 1.5,
		lightDistance: 50,
	},
	whatIf: [
		{ label: '⭐ Star 2× Mass', type: 'star_mass', value: TRAPPIST1_STAR_MASS * 2 },
		{ label: '⭐ Star ½× Mass', type: 'star_mass', value: TRAPPIST1_STAR_MASS * 0.5 },
		{ label: '⭐ Star → Sun', type: 'star_mass', value: 1.0 },
		{ label: '💥 Remove d (break chain)', type: 'body_mass', bodyIndex: 3, value: 0 },
		{ label: '💥 Remove g (largest)', type: 'body_mass', bodyIndex: 6, value: 0 },
		{ label: '🪐 Planet b → Gas Giant', type: 'body_mass', bodyIndex: 1, value: 9.55e-4 },
		{ label: '🌍 Planet e 100× Mass', type: 'body_mass', bodyIndex: 4, value: 0.692 * M_EARTH * 100 },
		{ label: '💫 2× Gravity', type: 'g_mult', value: 2.0 },
		{ label: '💫 ½× Gravity', type: 'g_mult', value: 0.5 },
	],
	generate() {
		return generateFromKeplerian(TRAPPIST1_STAR_MASS, TRAPPIST1_STAR, TRAPPIST1_PLANETS);
	},
};

// ══════════════════════════════════════════════
// SYSTEM REGISTRY
// ══════════════════════════════════════════════

export const SYSTEMS: Record<string, SystemConfig> = {
	'solar-system': solarSystem,
	'trappist-1': trappist1,
};

export type SystemId = keyof typeof SYSTEMS;

export function getSystem(id: string): SystemConfig {
	return SYSTEMS[id] ?? solarSystem;
}
