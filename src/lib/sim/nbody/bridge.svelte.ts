/**
 * Main-thread bridge to the N-Body Web Worker.
 * Manages the worker lifecycle, circular buffer timeline, and reactive position state.
 */

const RING_SIZE = 500;

let worker: Worker | null = null;
let onPositions: ((data: Float32Array) => void) | null = null;
let onState: ((data: Float32Array) => void) | null = null;

/** Visual scale factor — positions are multiplied by this before rendering */
export const scaleState = $state({ value: 1.0 });

/** Circular buffer for rewind (last RING_SIZE frames of positions) */
export const ring = $state({
	frames: [] as Float32Array[],
	head: 0,
	count: 0
});

/** Latest position buffer from the worker */
export const positions = $state<{ data: Float32Array | null }>({
	data: null
});

function pushFrame(frame: Float32Array) {
	if (ring.frames.length < RING_SIZE) {
		ring.frames.push(frame);
	} else {
		ring.frames[ring.head] = frame;
	}
	ring.head = (ring.head + 1) % RING_SIZE;
	ring.count = Math.min(ring.count + 1, RING_SIZE);
}

/** Get a frame from the circular buffer (0 = oldest available, count-1 = newest) */
export function getFrame(index: number): Float32Array | null {
	if (index < 0 || index >= ring.count) return null;
	const total = ring.frames.length;
	const oldest = ring.count < RING_SIZE ? 0 : ring.head;
	const i = (oldest + index) % total;
	return ring.frames[i] ?? null;
}

function handleWorkerMessage(e: MessageEvent) {
	const { type } = e.data;
	if (type === 'positions') {
		const buf = e.data.data as Float32Array;
		const s = scaleState.value;
		if (s !== 1) {
			for (let i = 0; i < buf.length; i++) buf[i] *= s;
		}
		positions.data = buf;
		pushFrame(new Float32Array(buf)); // copy for the ring
		onPositions?.(buf);
	} else if (type === 'state') {
		onState?.(e.data.data as Float32Array);
		onState = null;
	} else if (type === 'ready') {
		// Worker initialized
	}
}

export function initWorker(bodies: Float32Array, g: number, softening: number) {
	terminateWorker();
	ring.frames = [];
	ring.head = 0;
	ring.count = 0;
	positions.data = null;

	worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
	worker.onmessage = handleWorkerMessage;
	worker.postMessage({ type: 'init', bodies, g, softening });
}

export function terminateWorker() {
	worker?.terminate();
	worker = null;
}

export function stepWorker(dt: number, steps = 1) {
	worker?.postMessage({ type: 'step', dt, steps });
}

export function setG(value: number) {
	worker?.postMessage({ type: 'set_g', value });
}

export function setSoftening(value: number) {
	worker?.postMessage({ type: 'set_softening', value });
}

export function requestState(): Promise<Float32Array> {
	return new Promise((resolve) => {
		onState = resolve;
		worker?.postMessage({ type: 'get_state' });
	});
}

export function restoreState(bodies: Float32Array) {
	worker?.postMessage({ type: 'set_state', bodies });
	ring.frames = [];
	ring.head = 0;
	ring.count = 0;
}

/** Modify a single body's mass in the running simulation */
export async function setBodyMass(bodyIndex: number, newMass: number) {
	const state = await requestState();
	const off = bodyIndex * 7 + 6; // mass is at offset 6 within each body's 7-float stride
	if (off < state.length) {
		state[off] = newMass;
		worker?.postMessage({ type: 'set_state', bodies: state });
	}
}

/** Scale the Sun's mass in the running simulation */
export async function setSunMass(factor: number) {
	const state = await requestState();
	state[6] = factor; // Sun is body 0, mass at index 6
	worker?.postMessage({ type: 'set_state', bodies: state });
}
