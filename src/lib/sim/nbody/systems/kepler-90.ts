import { generateFromKeplerian, G_AU, M_EARTH, type SystemConfig } from './shared';

const STAR_MASS = 1.2;

const PLANETS = [
	{ name: 'b', a: 0.0762, e: 0.001, I: 0.3,
	  L: 0, wBar: 15, Omega: 0,
	  mass: 2.3 * M_EARTH, color: [0.8, 0.5, 0.3] as const, radius: 0.03 },
	{ name: 'c', a: 0.0881, e: 0.001, I: 0.5,
	  L: 55, wBar: 40, Omega: 8,
	  mass: 1.8 * M_EARTH, color: [0.7, 0.6, 0.5] as const, radius: 0.028 },
	{ name: 'i', a: 0.1233, e: 0.001, I: 0.2,
	  L: 130, wBar: 80, Omega: 3,
	  mass: 2.3 * M_EARTH, color: [0.85, 0.45, 0.3] as const, radius: 0.03 },
	{ name: 'd', a: 0.3176, e: 0.003, I: 0.6,
	  L: 200, wBar: 120, Omega: 12,
	  mass: 7.5 * M_EARTH, color: [0.4, 0.65, 0.7] as const, radius: 0.05 },
	{ name: 'e', a: 0.4236, e: 0.002, I: 0.4,
	  L: 260, wBar: 170, Omega: 18,
	  mass: 6.5 * M_EARTH, color: [0.35, 0.6, 0.75] as const, radius: 0.047 },
	{ name: 'f', a: 0.5196, e: 0.01, I: 0.7,
	  L: 310, wBar: 210, Omega: 5,
	  mass: 7.5 * M_EARTH, color: [0.3, 0.55, 0.8] as const, radius: 0.05 },
	{ name: 'g', a: 0.7363, e: 0.002, I: 0.3,
	  L: 45, wBar: 260, Omega: 22,
	  mass: 15.0 * M_EARTH, color: [0.9, 0.75, 0.5] as const, radius: 0.10 },
	{ name: 'h', a: 0.9964, e: 0.003, I: 0.5,
	  L: 160, wBar: 300, Omega: 15,
	  mass: 203.0 * M_EARTH, color: [0.8, 0.6, 0.35] as const, radius: 0.13 },
];

const STAR = { name: 'Kepler-90', color: [1.0, 0.95, 0.8] as const, radius: 0.15, emissive: 2.0 };

export const kepler90: SystemConfig = {
	id: 'kepler-90',
	name: 'Kepler-90',
	description: '8 planets crammed within 1 AU — a compressed mini solar system 2,790 light-years away. Features a "super-puff" gas giant with the density of cotton candy and a Jupiter-class world at Earth\'s orbital distance.',
	cardGradient: 'from-yellow-500/20 via-amber-600/10 to-transparent',
	bodyCount: PLANETS.length + 1,
	defaults: {
		g: G_AU,
		dt: 0.0001,
		softening: 0.0005,
		timeScale: 1,
	},
	visualScale: 8,
	bodyNames: [STAR.name, ...PLANETS.map(p => p.name)],
	renderConfig: [
		{ texture: '/textures/planets/sun.jpg', isStar: true, rotationSpeed: 0.001 },
		{ texture: '/textures/planets/mercury.jpg', materialColor: '#cc8855', rotationSpeed: 0.002 },
		{ texture: '/textures/planets/mercury.jpg', rotationSpeed: 0.002 },
		{ texture: '/textures/planets/mars.jpg', rotationSpeed: 0.003 },
		{ texture: '/textures/planets/neptune.jpg', materialColor: '#66aabb', rotationSpeed: 0.005 },
		{ texture: '/textures/planets/neptune.jpg', materialColor: '#5599aa', rotationSpeed: 0.005 },
		{ texture: '/textures/planets/neptune.jpg', rotationSpeed: 0.004 },
		{ texture: '/textures/planets/saturn.jpg', materialColor: '#ddbb77', rotationSpeed: 0.015 },
		{ texture: '/textures/planets/jupiter.jpg', rotationSpeed: 0.018 },
	],
	starGlow: {
		gradientStops: [
			'rgba(255, 235, 140, 0.8)',
			'rgba(255, 200, 80, 0.4)',
			'rgba(255, 170, 40, 0.1)',
			'rgba(255, 130, 10, 0)',
		],
		lightColor: '#fffae8',
		lightIntensity: 3.5,
		lightDistance: 100,
	},
	whatIf: [
		{ label: '⭐ Star 2× Mass', type: 'star_mass', value: STAR_MASS * 2 },
		{ label: '⭐ Star ½× Mass', type: 'star_mass', value: STAR_MASS * 0.5 },
		{ label: '🪐 Remove h (Jupiter)', type: 'body_mass', bodyIndex: 8, value: 0 },
		{ label: '🪐 h → 5× Mass', type: 'body_mass', bodyIndex: 8, value: 203.0 * M_EARTH * 5 },
		{ label: '💨 Super-puff g → Dense', type: 'body_mass', bodyIndex: 7, value: 15.0 * M_EARTH * 100 },
		{ label: '🤖 Planet i → Gas Giant', type: 'body_mass', bodyIndex: 3, value: 9.55e-4 },
		{ label: '💫 2× Gravity', type: 'g_mult', value: 2.0 },
		{ label: '💫 ½× Gravity', type: 'g_mult', value: 0.5 },
	],
	generate() {
		return generateFromKeplerian(STAR_MASS, STAR, PLANETS);
	},
};
