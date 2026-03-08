import { generateFromKeplerian, G_AU, M_EARTH, type SystemConfig } from './shared';

// Data: Faria et al. 2022, Suárez Mascareño et al. 2020, Damasso et al. 2020
// Star: M5.5V red dwarf, 0.1221 M☉, 3042 K — nearest star to the Sun (4.24 ly)
// 3 confirmed planets:
//   b: 1.07 M_earth in the habitable zone (11.2 day orbit)
//   c: ~7 M_earth sub-Neptune/super-Earth (5.2 yr orbit, far out)
//   d: 0.26 M_earth candidate (5.1 day orbit, very close in)

const STAR_MASS = 0.1221;

const PLANETS = [
	// d: ultra-close, sub-Earth — candidate from 2022
	{ name: 'd', a: 0.02885, e: 0.04, I: 0.3,
	  L: 0, wBar: 30, Omega: 0,
	  mass: 0.26 * M_EARTH, color: [0.75, 0.55, 0.4] as const, radius: 0.022 },
	// b: habitable zone rocky world — confirmed 2016
	{ name: 'b', a: 0.04857, e: 0.11, I: 0.5,
	  L: 110, wBar: 310, Omega: 5,
	  mass: 1.07 * M_EARTH, color: [0.3, 0.55, 0.7] as const, radius: 0.033 },
	// c: distant sub-Neptune/super-Earth — confirmed 2020
	{ name: 'c', a: 1.489, e: 0.04, I: 1.0,
	  L: 250, wBar: 150, Omega: 15,
	  mass: 7.0 * M_EARTH, color: [0.5, 0.6, 0.85] as const, radius: 0.06 },
];

const STAR = { name: 'Proxima Centauri', color: [1.0, 0.35, 0.15] as const, radius: 0.06, emissive: 1.2 };

export const proximaCentauri: SystemConfig = {
	id: 'proxima-centauri',
	name: 'Proxima Centauri',
	description: 'Our nearest stellar neighbor at 4.24 light-years — a red dwarf with a rocky world in the habitable zone, a distant sub-Neptune, and an ultra-close sub-Earth candidate.',
	cardGradient: 'from-rose-500/20 via-red-700/10 to-transparent',
	bodyCount: PLANETS.length + 1,
	defaults: {
		g: G_AU,
		dt: 0.00005,     // tight inner orbits need small timestep
		softening: 0.0002,
		timeScale: 1,    // planet d orbits every ~3s at 60fps
	},
	visualScale: 40, // scale 1.5 AU → ~60 AU for visibility
	bodyNames: [STAR.name, ...PLANETS.map(p => p.name)],
	renderConfig: [
		{ texture: '/textures/planets/sun.jpg', isStar: true, materialColor: '#ff4422', rotationSpeed: 0.001 },
		{ texture: '/textures/planets/mercury.jpg', materialColor: '#bb8866', rotationSpeed: 0.001 },  // d: hot bare rock
		{ texture: '/textures/planets/earth_day.jpg', materialColor: '#5588aa', rotationSpeed: 0.002 }, // b: habitable rocky
		{ texture: '/textures/planets/neptune.jpg', materialColor: '#7799cc', rotationSpeed: 0.005 },   // c: sub-Neptune
	],
	starGlow: {
		gradientStops: [
			'rgba(255, 70, 25, 0.7)',
			'rgba(200, 35, 15, 0.35)',
			'rgba(150, 15, 5, 0.08)',
			'rgba(100, 5, 0, 0)',
		],
		lightColor: '#ff5030',
		lightIntensity: 1.2,
		lightDistance: 40,
	},
	whatIf: [
		{ label: '⭐ Star 2× Mass', type: 'star_mass', value: STAR_MASS * 2 },
		{ label: '⭐ Star ½× Mass', type: 'star_mass', value: STAR_MASS * 0.5 },
		{ label: '⭐ Star → Sun', type: 'star_mass', value: 1.0 },
		{ label: '🌍 Planet b 100× Mass', type: 'body_mass', bodyIndex: 2, value: 1.07 * M_EARTH * 100 },
		{ label: '🪐 Planet c → Gas Giant', type: 'body_mass', bodyIndex: 3, value: 9.55e-4 },
		{ label: '💥 Remove c', type: 'body_mass', bodyIndex: 3, value: 0 },
		{ label: '💫 2× Gravity', type: 'g_mult', value: 2.0 },
		{ label: '💫 ½× Gravity', type: 'g_mult', value: 0.5 },
	],
	generate() {
		return generateFromKeplerian(STAR_MASS, STAR, PLANETS);
	},
};
