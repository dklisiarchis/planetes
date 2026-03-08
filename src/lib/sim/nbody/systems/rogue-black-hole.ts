import { G_AU, type SystemConfig, type BodyVisuals } from './shared';

// A rogue stellar-mass black hole (30 M☉) drifting through our solar system.
// Starts far away and passes through the inner system.
// Watch planets get scattered, captured, or flung into interstellar space.

const BH_MASS = 30; // 30 M☉ stellar-mass black hole
const SUN_MASS = 1.0;

// Simplified solar system (Sun + 6 key planets for performance & drama)
const PLANETS = [
	{ name: 'Earth',   a: 1.0,   mass: 3.0e-6,  color: [0.2, 0.5, 1.0] as const, radius: 0.05 },
	{ name: 'Mars',    a: 1.52,  mass: 3.2e-7,  color: [0.9, 0.3, 0.2] as const, radius: 0.04 },
	{ name: 'Jupiter', a: 5.2,   mass: 9.55e-4, color: [0.8, 0.6, 0.3] as const, radius: 0.12 },
	{ name: 'Saturn',  a: 9.54,  mass: 2.86e-4, color: [0.9, 0.8, 0.5] as const, radius: 0.10 },
	{ name: 'Uranus',  a: 19.2,  mass: 4.37e-5, color: [0.5, 0.8, 0.9] as const, radius: 0.07 },
	{ name: 'Neptune', a: 30.1,  mass: 5.15e-5, color: [0.3, 0.4, 0.9] as const, radius: 0.07 },
];

const BODY_NAMES = ['Sun', 'Rogue BH', ...PLANETS.map(p => p.name)];

function generate(): { bodies: Float32Array; visuals: BodyVisuals } {
	const n = 2 + PLANETS.length; // Sun + BH + planets
	const bodies = new Float32Array(n * 7);
	const colors = new Float32Array(n * 3);
	const radii = new Float32Array(n);
	const emissive = new Float32Array(n);

	// Sun at origin
	bodies[6] = SUN_MASS;
	colors[0] = 1.0; colors[1] = 0.9; colors[2] = 0.3;
	radii[0] = 0.15;
	emissive[0] = 2.0;

	// Rogue BH — starts at 60 AU out, moving inward
	const bhOff = 7;
	bodies[bhOff + 0] = 60;     // x: far right
	bodies[bhOff + 1] = 15;     // y: slight offset for asymmetric pass
	bodies[bhOff + 2] = 0;
	bodies[bhOff + 3] = -4.0;   // vx: moving inward (~19 km/s)
	bodies[bhOff + 4] = -0.8;   // vy: slight downward
	bodies[bhOff + 5] = 0;
	bodies[bhOff + 6] = BH_MASS;
	colors[3] = 0.05; colors[4] = 0.0; colors[5] = 0.1;
	radii[1] = 0.2;
	emissive[1] = 0;

	// Planets in circular orbits
	for (let i = 0; i < PLANETS.length; i++) {
		const p = PLANETS[i];
		const idx = i + 2;
		const off = idx * 7;
		const angle = Math.random() * Math.PI * 2; // random orbital phase
		const v = Math.sqrt(G_AU * SUN_MASS / p.a);

		bodies[off + 0] = p.a * Math.cos(angle);
		bodies[off + 1] = p.a * Math.sin(angle);
		bodies[off + 2] = 0;
		bodies[off + 3] = -v * Math.sin(angle);
		bodies[off + 4] = v * Math.cos(angle);
		bodies[off + 5] = 0;
		bodies[off + 6] = p.mass;

		colors[idx * 3] = p.color[0];
		colors[idx * 3 + 1] = p.color[1];
		colors[idx * 3 + 2] = p.color[2];
		radii[idx] = p.radius;
		emissive[idx] = 0.15;
	}

	return { bodies, visuals: { colors, radii, emissive, names: BODY_NAMES } };
}

export const rogueBlackHole: SystemConfig = {
	id: 'rogue-black-hole',
	name: 'Rogue Black Hole',
	description: 'A 30-solar-mass black hole drifts into our solar system. Watch as planets are scattered, captured, or flung into the void.',
	cardGradient: 'from-orange-600/20 via-red-900/10 to-transparent',
	bodyCount: 2 + PLANETS.length,
	experimental: true,
	defaults: {
		g: G_AU,
		dt: 0.0005,
		softening: 0.3,
		timeScale: 5,
	},
	visualScale: 1.0,
	bodyNames: BODY_NAMES,
	renderConfig: [
		{ texture: '/textures/planets/sun.jpg', isStar: true, rotationSpeed: 0.001 },
		{ texture: '/textures/planets/sun.jpg', isStar: true, materialColor: '#000000', rotationSpeed: 0 },
		{ texture: '/textures/planets/earth_day.jpg', rotationSpeed: 0.01 },
		{ texture: '/textures/planets/mars.jpg', rotationSpeed: 0.009 },
		{ texture: '/textures/planets/jupiter.jpg', rotationSpeed: 0.02 },
		{ texture: '/textures/planets/saturn.jpg', hasRings: true, ringTexture: '/textures/planets/saturn_ring.png', rotationSpeed: 0.018 },
		{ texture: '/textures/planets/uranus.jpg', rotationSpeed: -0.012 },
		{ texture: '/textures/planets/neptune.jpg', rotationSpeed: 0.011 },
	],
	blackHole: {
		bodyIndices: [1], // BH is body index 1 (Sun is 0)
		accretionDisk: {
			innerRadius: 0.15,
			outerRadius: 0.8,
			color: '#ff6633',
			opacity: 0.4,
			speed: 1.0,
		},
		lensingStrength: 0.05,
	},
	starGlow: {
		// Sun glow (body 0 is still the Sun)
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
	whatIf: [
		{ label: '🕳️ BH 100× Mass', type: 'body_mass', bodyIndex: 1, value: BH_MASS * 100 },
		{ label: '🕳️ BH ½× Mass', type: 'body_mass', bodyIndex: 1, value: BH_MASS * 0.5 },
		{ label: '🕳️ Remove BH', type: 'body_mass', bodyIndex: 1, value: 0 },
		{ label: '☀️ Sun 10× Mass', type: 'star_mass', value: 10.0 },
		{ label: '🪐 Jupiter 100×', type: 'body_mass', bodyIndex: 4, value: 9.55e-2 },
		{ label: '💫 2× Gravity', type: 'g_mult', value: 2.0 },
		{ label: '💫 ½× Gravity', type: 'g_mult', value: 0.5 },
	],
	generate,
};
