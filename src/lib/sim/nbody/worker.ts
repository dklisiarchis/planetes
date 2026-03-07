/**
 * N-Body Web Worker — runs WASM physics off the main thread.
 * Communicates via postMessage with Transferable Float32Arrays.
 */

import init, { NBodyWorld } from '../../../../nbody-wasm/pkg/nbody_wasm.js';

let world: NBodyWorld | null = null;

async function handleMessage(msg: MessageEvent) {
	const { type } = msg.data;

	switch (type) {
		case 'init': {
			await init();
			const { bodies, g, softening } = msg.data as {
				bodies: Float32Array;
				g: number;
				softening: number;
			};
			world = new NBodyWorld(bodies, g, softening);
			self.postMessage({ type: 'ready', bodyCount: world.body_count() });
			break;
		}

		case 'step': {
			if (!world) return;
			const { dt, steps } = msg.data as { dt: number; steps: number };
			for (let i = 0; i < steps; i++) {
				world.step(dt);
			}
			const positions = world.get_positions();
			// Transfer the buffer for zero-copy
			const buf = new Float32Array(positions);
			self.postMessage({ type: 'positions', data: buf }, [buf.buffer] as any);
			break;
		}

		case 'set_g': {
			world?.set_g(msg.data.value);
			break;
		}

		case 'set_softening': {
			world?.set_softening(msg.data.value);
			break;
		}

		case 'get_state': {
			if (!world) return;
			const state = world.get_state();
			const buf = new Float32Array(state);
			self.postMessage({ type: 'state', data: buf }, [buf.buffer] as any);
			break;
		}

		case 'set_state': {
			if (!world) return;
			const { bodies } = msg.data as { bodies: Float32Array };
			world.set_state(bodies);
			self.postMessage({ type: 'ready', bodyCount: world.body_count() });
			break;
		}
	}
}

self.onmessage = handleMessage;
