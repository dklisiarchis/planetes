import { getSystem } from './presets';

/** Reactive N-Body simulation state */
export const nbody = $state({
	isPlaying: false,
	systemId: 'solar-system',
	gConstant: 4 * Math.PI * Math.PI,
	softening: 0.001,
	timeScale: 5,
	dt: 0.0005,
	currentStep: 0,
	trailLength: 120,
	/** Bumped to trigger re-init */
	generation: 0
});

/** Simulated time in years */
export function simYears(): number {
	return nbody.currentStep * nbody.dt;
}

/** Human-readable elapsed sim time */
export function simTimeLabel(): string {
	const years = simYears();
	if (Math.abs(years) < 1 / 365.25) {
		const hours = years * 365.25 * 24;
		return `${hours.toFixed(1)} hours`;
	}
	if (Math.abs(years) < 1) {
		const days = years * 365.25;
		return `${days.toFixed(1)} days`;
	}
	if (Math.abs(years) < 1000) {
		return `${years.toFixed(2)} years`;
	}
	return `${(years / 1000).toFixed(2)}k years`;
}

/** Speed label: how fast sim time passes per real second (at 60fps) */
export function simSpeedLabel(): string {
	const yrsPerSec = 60 * nbody.timeScale * nbody.dt;
	if (yrsPerSec < 1 / 365.25) {
		const hrsPerSec = yrsPerSec * 365.25 * 24;
		return `${hrsPerSec.toFixed(1)} hrs/s`;
	}
	if (yrsPerSec < 1) {
		const daysPerSec = yrsPerSec * 365.25;
		return `${daysPerSec.toFixed(1)} days/s`;
	}
	return `${yrsPerSec.toFixed(2)} yrs/s`;
}

/** Apply a system's defaults to the state */
export function applySystemDefaults(systemId: string) {
	const sys = getSystem(systemId);
	nbody.systemId = systemId;
	nbody.dt = sys.defaults.dt;
	nbody.gConstant = sys.defaults.g;
	nbody.softening = sys.defaults.softening;
	nbody.timeScale = sys.defaults.timeScale;
}

/** Body selection and live stats */
export const bodySelection = $state({
	index: -1,       // -1 = none selected
	following: false,
	name: '',
	distFromStar: 0, // AU
	speed: 0,        // km/s
	x: 0, y: 0, z: 0, // AU (real units)
});

export function selectBody(index: number, name: string) {
	bodySelection.index = index;
	bodySelection.name = name;
}

export function deselectBody() {
	bodySelection.index = -1;
	bodySelection.following = false;
	bodySelection.name = '';
}

export function resetNBody() {
	nbody.isPlaying = false;
	nbody.currentStep = 0;
	nbody.generation += 1;
	deselectBody();
}
