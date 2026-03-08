import { G_AU, M_EARTH, type SystemConfig, type BodyVisuals } from './shared';

// Binary Black Hole system — two supermassive BHs in a decaying orbit
// with test particles (stars) scattered around them.
// Inspired by OJ 287 (one of the best binary SMBH candidates)
// This is a fictional setup for dramatic visualization.

const BH1_MASS = 1e5; // 100,000 M☉ primary
const BH2_MASS = 3e4; // 30,000 M☉ secondary

// Circular-ish binary orbit parameters
const BINARY_SEP = 500; // AU separation
const BINARY_V = Math.sqrt(G_AU * (BH1_MASS + BH2_MASS) / BINARY_SEP); // orbital velocity

// Test particles (stars) orbiting the center of mass at various distances
const TEST_STARS = [
	{ name: 'Star A', dist: 2000, angle: 0, mass: 5.0, color: [0.8, 0.85, 1.0] as const, radius: 0.025 },
	{ name: 'Star B', dist: 2500, angle: 72, mass: 3.0, color: [0.9, 0.9, 1.0] as const, radius: 0.02 },
	{ name: 'Star C', dist: 3000, angle: 144, mass: 8.0, color: [0.7, 0.8, 1.0] as const, radius: 0.03 },
	{ name: 'Star D', dist: 1800, angle: 216, mass: 4.0, color: [1.0, 0.9, 0.7] as const, radius: 0.022 },
	{ name: 'Star E', dist: 3500, angle: 288, mass: 6.0, color: [0.85, 0.85, 1.0] as const, radius: 0.025 },
	{ name: 'Star F', dist: 1500, angle: 36, mass: 2.0, color: [1.0, 0.85, 0.6] as const, radius: 0.018 },
	{ name: 'Star G', dist: 2800, angle: 108, mass: 7.0, color: [0.75, 0.8, 1.0] as const, radius: 0.028 },
	{ name: 'Star H', dist: 4000, angle: 180, mass: 5.0, color: [0.9, 0.85, 0.75] as const, radius: 0.025 },
	{ name: 'Star I', dist: 2200, angle: 252, mass: 3.5, color: [0.8, 0.9, 1.0] as const, radius: 0.022 },
	{ name: 'Star J', dist: 3200, angle: 324, mass: 4.5, color: [0.95, 0.9, 0.8] as const, radius: 0.024 },
];

const BODY_NAMES = ['BH Primary', 'BH Secondary', ...TEST_STARS.map(s => s.name)];

function generate(): { bodies: Float32Array; visuals: BodyVisuals } {
	const n = 2 + TEST_STARS.length;
	const bodies = new Float32Array(n * 7);
	const colors = new Float32Array(n * 3);
	const radii = new Float32Array(n);
	const emissive = new Float32Array(n);

	const totalMass = BH1_MASS + BH2_MASS;
	// BH1 and BH2 orbit their center of mass
	const r1 = BINARY_SEP * BH2_MASS / totalMass;
	const r2 = BINARY_SEP * BH1_MASS / totalMass;
	const v1 = BINARY_V * BH2_MASS / totalMass;
	const v2 = BINARY_V * BH1_MASS / totalMass;

	// BH1 (primary) — offset in +x, velocity in +y
	bodies[0] = r1;  bodies[1] = 0;  bodies[2] = 0;
	bodies[3] = 0;   bodies[4] = v1; bodies[5] = 0;
	bodies[6] = BH1_MASS;
	colors[0] = 0.05; colors[1] = 0.0; colors[2] = 0.1;
	radii[0] = 0.25;
	emissive[0] = 0;

	// BH2 (secondary) — offset in -x, velocity in -y
	bodies[7] = -r2;  bodies[8] = 0;   bodies[9] = 0;
	bodies[10] = 0;   bodies[11] = -v2; bodies[12] = 0;
	bodies[13] = BH2_MASS;
	colors[3] = 0.1; colors[4] = 0.0; colors[5] = 0.15;
	radii[1] = 0.18;
	emissive[1] = 0;

	// Test particles in circular orbits around CoM
	for (let i = 0; i < TEST_STARS.length; i++) {
		const s = TEST_STARS[i];
		const idx = i + 2;
		const off = idx * 7;
		const angle = s.angle * Math.PI / 180;

		const x = s.dist * Math.cos(angle);
		const y = s.dist * Math.sin(angle);
		const v = Math.sqrt(G_AU * totalMass / s.dist);
		const vx = -v * Math.sin(angle);
		const vy = v * Math.cos(angle);

		bodies[off] = x;
		bodies[off + 1] = y;
		bodies[off + 2] = (Math.random() - 0.5) * 100; // slight z scatter
		bodies[off + 3] = vx;
		bodies[off + 4] = vy;
		bodies[off + 5] = 0;
		bodies[off + 6] = s.mass;

		colors[idx * 3] = s.color[0];
		colors[idx * 3 + 1] = s.color[1];
		colors[idx * 3 + 2] = s.color[2];
		radii[idx] = s.radius;
		emissive[idx] = 0.8;
	}

	return { bodies, visuals: { colors, radii, emissive, names: BODY_NAMES } };
}

export const binaryBlackHoles: SystemConfig = {
	id: 'binary-black-holes',
	name: 'Binary Black Holes',
	description: 'Two supermassive black holes locked in a gravitational dance, flinging nearby stars into chaotic trajectories. Inspired by systems like OJ 287.',
	cardGradient: 'from-purple-600/20 via-indigo-900/10 to-transparent',
	bodyCount: 2 + TEST_STARS.length,
	experimental: true,
	defaults: {
		g: G_AU,
		dt: 0.001,
		softening: 20,
		timeScale: 5,
	},
	visualScale: 0.005, // 4000 AU orbits → 20 visual units
	bodyNames: BODY_NAMES,
	renderConfig: [
		{ texture: '/textures/planets/sun.jpg', isStar: true, materialColor: '#000000', rotationSpeed: 0 },
		{ texture: '/textures/planets/sun.jpg', isStar: true, materialColor: '#000000', rotationSpeed: 0 },
		...TEST_STARS.map(() => ({
			texture: '/textures/planets/sun.jpg' as string,
			isStar: true as const,
			materialColor: '#aabbff',
			rotationSpeed: 0,
		})),
	],
	blackHole: {
		bodyIndices: [0, 1],
		accretionDisk: {
			innerRadius: 0.2,
			outerRadius: 1.0,
			color: '#cc66ff',
			opacity: 0.5,
			speed: 0.8,
		},
		lensingStrength: 0.06,
	},
	starGlow: {
		gradientStops: [
			'rgba(150, 80, 255, 0.25)',
			'rgba(100, 40, 200, 0.12)',
			'rgba(60, 20, 100, 0.03)',
			'rgba(0, 0, 0, 0)',
		],
		lightColor: '#aa77ff',
		lightIntensity: 0.6,
		lightDistance: 40,
	},
	whatIf: [
		{ label: '🕳️ Primary 10× Mass', type: 'star_mass', value: BH1_MASS * 10 },
		{ label: '🕳️ Primary ½× Mass', type: 'star_mass', value: BH1_MASS * 0.5 },
		{ label: '🕳️ Remove Secondary', type: 'body_mass', bodyIndex: 1, value: 0 },
		{ label: '🕳️ Equal Mass BHs', type: 'body_mass', bodyIndex: 1, value: BH1_MASS },
		{ label: '⭐ Star A → BH', type: 'body_mass', bodyIndex: 2, value: 1e4 },
		{ label: '💫 2× Gravity', type: 'g_mult', value: 2.0 },
		{ label: '💫 ½× Gravity', type: 'g_mult', value: 0.5 },
	],
	generate,
};
