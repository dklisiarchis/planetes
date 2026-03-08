import { generateFromKeplerian, G_AU, type SystemConfig } from './shared';

// Sagittarius A* — supermassive black hole at the center of the Milky Way
// Mass: 4.15 × 10^6 M☉ (GRAVITY Collaboration 2020)
// Distance: 8.178 kpc (26,673 ly)
// Real S-star orbits from Gillessen et al. 2017, GRAVITY Collaboration 2020
// Semi-major axes in AU (converted from arcseconds at 8178 AU/arcsec)

const BH_MASS = 4.15e6; // solar masses

// S-stars with real orbital elements
// Masses are estimates (1–10 M☉ main sequence B-type stars) — negligible vs the BH
const S_STARS = [
	// S2 (S0-2): the most studied S-star, 16 yr orbit, highly eccentric
	{ name: 'S2', a: 1026, e: 0.884, I: 134.2,
	  L: 120, wBar: 294.4, Omega: 228.2,
	  mass: 14.0, color: [0.7, 0.8, 1.0] as const, radius: 0.04 },
	// S38 (S0-38): 19.2 yr orbit
	{ name: 'S38', a: 1157, e: 0.820, I: 170.8,
	  L: 250, wBar: 117.2, Omega: 99.4,
	  mass: 8.0, color: [0.8, 0.85, 1.0] as const, radius: 0.035 },
	// S55 (S0-102): 12.8 yr, one of the shortest periods
	{ name: 'S55', a: 835, e: 0.721, I: 151.4,
	  L: 30, wBar: 298.2, Omega: 325.8,
	  mass: 10.0, color: [0.75, 0.82, 1.0] as const, radius: 0.035 },
	// S62: 9.9 yr orbit, extremely eccentric (0.976!)
	{ name: 'S62', a: 740, e: 0.976, I: 72.8,
	  L: 180, wBar: 165.2, Omega: 122.6,
	  mass: 6.0, color: [0.9, 0.9, 1.0] as const, radius: 0.03 },
	// S14: ~38 yr orbit
	{ name: 'S14', a: 1820, e: 0.963, I: 100.4,
	  L: 300, wBar: 339.6, Omega: 226.4,
	  mass: 8.0, color: [0.65, 0.75, 1.0] as const, radius: 0.03 },
	// S1: ~166 yr orbit, more distant
	{ name: 'S1', a: 4250, e: 0.556, I: 119.1,
	  L: 60, wBar: 122.3, Omega: 342.0,
	  mass: 10.0, color: [0.7, 0.8, 1.0] as const, radius: 0.035 },
	// S4714: potential closest approach star
	{ name: 'S4714', a: 950, e: 0.985, I: 127.7,
	  L: 210, wBar: 129.3, Omega: 22.1,
	  mass: 4.0, color: [0.85, 0.9, 1.0] as const, radius: 0.025 },
	// S12: ~58.9 yr orbit
	{ name: 'S12', a: 2410, e: 0.888, I: 33.6,
	  L: 90, wBar: 230.1, Omega: 230.0,
	  mass: 7.0, color: [0.72, 0.8, 1.0] as const, radius: 0.03 },
];

const BH_VISUAL = { name: 'Sgr A*', color: [0.0, 0.0, 0.0] as const, radius: 0.25, emissive: 0.0 };

export const sgrAStar: SystemConfig = {
	id: 'sgr-a-star',
	name: 'Sagittarius A*',
	description: 'The supermassive black hole at the center of our galaxy — 4 million solar masses. Watch S-stars whip around it at thousands of km/s on extreme orbits.',
	cardGradient: 'from-violet-600/20 via-purple-900/10 to-transparent',
	bodyCount: S_STARS.length + 1,
	experimental: true,
	defaults: {
		g: G_AU,
		dt: 0.002,       // small dt needed — S62/S4714 have e~0.98 perihelion passages
		softening: 20,   // larger softening for AU-scale orbits around a supermassive object
		timeScale: 10,
	},
	visualScale: 0.01,   // 1000 AU orbits → 10 visual units
	bodyNames: [BH_VISUAL.name, ...S_STARS.map(p => p.name)],
	renderConfig: [
		{ texture: '/textures/planets/sun.jpg', isStar: true, materialColor: '#000000', rotationSpeed: 0 },
		...S_STARS.map(() => ({
			texture: '/textures/planets/sun.jpg' as string,
			isStar: true as const,
			materialColor: '#aabbff',
			rotationSpeed: 0,
		})),
	],
	blackHole: {
		bodyIndices: [0],
		accretionDisk: {
			innerRadius: 0.3,
			outerRadius: 1.5,
			color: '#ff8844',
			opacity: 0.6,
			speed: 0.5,
		},
		lensingStrength: 0.08,
	},
	starGlow: {
		// Minimal glow — the BH itself doesn't glow, but the accretion region does
		gradientStops: [
			'rgba(255, 140, 60, 0.3)',
			'rgba(200, 80, 30, 0.15)',
			'rgba(100, 30, 10, 0.03)',
			'rgba(0, 0, 0, 0)',
		],
		lightColor: '#ff9955',
		lightIntensity: 0.8,
		lightDistance: 50,
	},
	whatIf: [
		{ label: '🕳️ BH 10× Mass', type: 'star_mass', value: BH_MASS * 10 },
		{ label: '🕳️ BH ½× Mass', type: 'star_mass', value: BH_MASS * 0.5 },
		{ label: '🕳️ BH → Stellar', type: 'star_mass', value: 30 },
		{ label: '⭐ S2 100× Mass', type: 'body_mass', bodyIndex: 1, value: 14.0 * 100 },
		{ label: '⭐ S62 → BH', type: 'body_mass', bodyIndex: 4, value: 1e5 },
		{ label: '💫 2× Gravity', type: 'g_mult', value: 2.0 },
		{ label: '💫 ½× Gravity', type: 'g_mult', value: 0.5 },
	],
	generate() {
		return generateFromKeplerian(BH_MASS, BH_VISUAL, S_STARS);
	},
};
