<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { ring } from '$lib/sim/nbody/bridge.svelte';
	import * as THREE from 'three';

	let { bodyCount, trailLength }: { bodyCount: number; trailLength: number } = $props();

	// Track a subset of bodies for trails (all if ≤ 32, else every Nth body)
	const MAX_TRAIL_BODIES = 32;
	let trackedIndices = $derived.by(() => {
		if (bodyCount <= MAX_TRAIL_BODIES) {
			return Array.from({ length: bodyCount }, (_, i) => i);
		}
		const step = Math.max(1, Math.floor(bodyCount / MAX_TRAIL_BODIES));
		const out: number[] = [];
		for (let i = 0; i < bodyCount && out.length < MAX_TRAIL_BODIES; i += step) {
			out.push(i);
		}
		return out;
	});

	let lineRef: THREE.LineSegments | undefined = $state();
	const posAttr = new THREE.BufferAttribute(new Float32Array(0), 3);

	// Rebuild trail geometry each frame from the ring buffer
	useTask(() => {
		if (!lineRef || ring.count < 2) return;

		const nTrails = trackedIndices.length;
		const len = Math.min(ring.count, trailLength);
		// Each trail segment = (len - 1) line segments = (len - 1) * 2 vertices
		const segsPerTrail = len - 1;
		const totalVerts = nTrails * segsPerTrail * 2;
		if (totalVerts <= 0) return;

		const arr = new Float32Array(totalVerts * 3);
		let vi = 0;

		for (const bodyIdx of trackedIndices) {
			for (let f = 0; f < segsPerTrail; f++) {
				const frameA = ring.count - len + f;
				const frameB = frameA + 1;

				const a = getPos(frameA, bodyIdx);
				const b = getPos(frameB, bodyIdx);
				if (!a || !b) continue;

				arr[vi++] = a[0]; arr[vi++] = a[1]; arr[vi++] = a[2];
				arr[vi++] = b[0]; arr[vi++] = b[1]; arr[vi++] = b[2];
			}
		}

		const geom = lineRef.geometry as THREE.BufferGeometry;
		if (geom.attributes.position?.count !== totalVerts) {
			geom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
		} else {
			(geom.attributes.position as THREE.BufferAttribute).set(arr);
			geom.attributes.position.needsUpdate = true;
		}
		geom.setDrawRange(0, vi / 3);
	});

	function getPos(frameIndex: number, bodyIndex: number): [number, number, number] | null {
		if (frameIndex < 0 || frameIndex >= ring.count) return null;
		const total = ring.frames.length;
		const oldest = ring.count < 500 ? 0 : ring.head;
		const i = (oldest + frameIndex) % total;
		const frame = ring.frames[i];
		if (!frame) return null;
		const off = bodyIndex * 3;
		if (off + 2 >= frame.length) return null;
		return [frame[off], frame[off + 1], frame[off + 2]];
	}
</script>

<T.LineSegments bind:ref={lineRef} frustumCulled={false}>
	<T.BufferGeometry />
	<T.LineBasicMaterial color="#4466ff" transparent opacity={0.25} />
</T.LineSegments>
