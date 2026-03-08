/**
 * Shared types, constants, and Keplerian math for all systems.
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

export interface BlackHoleConfig {
	/** Indices of bodies that are black holes (rendered as BH instead of star) */
	bodyIndices: number[];
	/** Accretion disk visual */
	accretionDisk?: {
		innerRadius: number;
		outerRadius: number;
		color: string;
		opacity: number;
		speed: number;
	};
	/** Screen-space gravitational lensing strength */
	lensingStrength: number;
}

export interface SystemConfig {
	id: string;
	name: string;
	description: string;
	cardGradient: string;
	bodyCount: number;
	defaults: { g: number; dt: number; softening: number; timeScale: number };
	visualScale: number;
	renderConfig: BodyRenderConfig[];
	starGlow: StarGlow;
	whatIf: WhatIfAction[];
	bodyNames: string[];
	experimental?: boolean;
	blackHole?: BlackHoleConfig;
	asteroidBelt?: { count: number; inner: number; outer: number };
	generate(): { bodies: Float32Array; visuals: BodyVisuals };
}

// ── Constants ──

const DEG = Math.PI / 180;
export const G_AU = 4 * Math.PI * Math.PI; // G in AU³/(M☉·yr²)
export const M_EARTH = 3.00348e-6; // solar masses

// ── Keplerian math ──

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
export function generateFromKeplerian(
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

	bodies[3] = -px / starMass;
	bodies[4] = -py / starMass;
	bodies[5] = -pz / starMass;

	const names = [starVisual.name, ...planets.map((p) => p.name)];
	return { bodies, visuals: { colors, radii, emissive, names } };
}
