import { generateFromKeplerian, G_AU, M_EARTH, type SystemConfig } from './shared';

const STAR_MASS = 0.0898;

const PLANETS = [
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

const STAR = { name: 'TRAPPIST-1', color: [0.95, 0.25, 0.1] as const, radius: 0.08, emissive: 1.5 };

export const trappist1: SystemConfig = {
	id: 'trappist-1',
	name: 'TRAPPIST-1',
	description: '7 Earth-sized worlds orbiting an ultra-cool red dwarf 40 light-years away. Three planets sit in the habitable zone. A near-resonant orbital chain makes this system uniquely fragile.',
	cardGradient: 'from-red-600/20 via-rose-800/10 to-transparent',
	bodyCount: PLANETS.length + 1,
	defaults: {
		g: G_AU,
		dt: 0.00004,
		softening: 0.0001,
		timeScale: 1,
	},
	visualScale: 100,
	bodyNames: [STAR.name, ...PLANETS.map(p => p.name)],
	renderConfig: [
		{ texture: '/textures/planets/sun.jpg', isStar: true, materialColor: '#ff4422', rotationSpeed: 0.001 },
		{ texture: '/textures/planets/mercury.jpg', materialColor: '#dd7733', rotationSpeed: 0.001 },
		{ texture: '/textures/planets/venus_atmosphere.jpg', rotationSpeed: 0.001 },
		{ texture: '/textures/planets/mercury.jpg', materialColor: '#998877', rotationSpeed: 0.001 },
		{ texture: '/textures/planets/earth_day.jpg', rotationSpeed: 0.001 },
		{ texture: '/textures/planets/earth_day.jpg', materialColor: '#6699cc', rotationSpeed: 0.001 },
		{ texture: '/textures/planets/earth_day.jpg', materialColor: '#5577aa', rotationSpeed: 0.001 },
		{ texture: '/textures/planets/neptune.jpg', materialColor: '#aabbcc', rotationSpeed: 0.001 },
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
		{ label: '⭐ Star 2× Mass', type: 'star_mass', value: STAR_MASS * 2 },
		{ label: '⭐ Star ½× Mass', type: 'star_mass', value: STAR_MASS * 0.5 },
		{ label: '⭐ Star → Sun', type: 'star_mass', value: 1.0 },
		{ label: '💥 Remove d (break chain)', type: 'body_mass', bodyIndex: 3, value: 0 },
		{ label: '💥 Remove g (largest)', type: 'body_mass', bodyIndex: 6, value: 0 },
		{ label: '🪐 Planet b → Gas Giant', type: 'body_mass', bodyIndex: 1, value: 9.55e-4 },
		{ label: '🌍 Planet e 100× Mass', type: 'body_mass', bodyIndex: 4, value: 0.692 * M_EARTH * 100 },
		{ label: '💫 2× Gravity', type: 'g_mult', value: 2.0 },
		{ label: '💫 ½× Gravity', type: 'g_mult', value: 0.5 },
	],
	generate() {
		return generateFromKeplerian(STAR_MASS, STAR, PLANETS);
	},
};
