<script lang="ts">
	import { useTask, useThrelte } from '@threlte/core';
	import { positions, scaleState } from '$lib/sim/nbody/bridge.svelte';
	import { bodySelection } from '$lib/sim/nbody/state.svelte';
	import { cameraFollow } from '$lib/sim/portal.svelte';
	import { nbody } from '$lib/sim/nbody/state.svelte';
	import * as THREE from 'three';

	const { camera } = useThrelte();
	const AU_TO_KMS = 4.74047; // 1 AU/yr ≈ 4.74 km/s

	let prevData: Float32Array | null = null;
	let prevStep = 0;

	// Track camera offset from follow target for smooth following
	let followOffset = new THREE.Vector3();
	let wasFollowing = false;

	useTask(() => {
		const data = positions.data;
		const idx = bodySelection.index;
		if (!data || idx < 0) {
			// Not following anything — reset target
			if (wasFollowing) {
				cameraFollow.target = null;
				wasFollowing = false;
			}
			prevData = null;
			return;
		}

		const scale = scaleState.value;
		const off = idx * 3;

		// Display-space position of selected body
		const dx = data[off], dy = data[off + 1], dz = data[off + 2];

		// Real-unit position (AU)
		bodySelection.x = dx / scale;
		bodySelection.y = dy / scale;
		bodySelection.z = dz / scale;

		// Distance from star (body 0) in real AU
		const sx = data[0], sy = data[1], sz = data[2];
		const ddx = dx - sx, ddy = dy - sy, ddz = dz - sz;
		bodySelection.distFromStar = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz) / scale;

		// Speed estimate from position delta between frames
		if (prevData && prevData.length > off + 2) {
			const stepDelta = nbody.currentStep - prevStep;
			if (stepDelta > 0) {
				const pdx = dx - prevData[off];
				const pdy = dy - prevData[off + 1];
				const pdz = dz - prevData[off + 2];
				const dist = Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz) / scale; // AU
				const time = stepDelta * nbody.dt; // years
				const speedAuYr = time > 0 ? dist / time : 0;
				bodySelection.speed = speedAuYr * AU_TO_KMS;
			}
		}

		// Store current frame for next delta
		prevData = new Float32Array(data);
		prevStep = nbody.currentStep;

		// Camera follow
		if (bodySelection.following) {
			if (!wasFollowing) {
				// Just started following — capture current camera-to-target offset
				const cam = camera.current;
				followOffset.set(
					cam.position.x - dx,
					cam.position.y - dy,
					cam.position.z - dz
				);
				wasFollowing = true;
			}

			// Move camera to maintain offset from body
			const cam = camera.current;
			cam.position.set(
				dx + followOffset.x,
				dy + followOffset.y,
				dz + followOffset.z
			);
			cameraFollow.target = [dx, dy, dz];
		} else if (wasFollowing) {
			cameraFollow.target = null;
			wasFollowing = false;
		}
	});
</script>
