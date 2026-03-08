<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { Text } from '@threlte/extras';
	import { positions } from '$lib/sim/nbody/bridge.svelte';
	import { consumedBodies } from '$lib/sim/nbody/state.svelte';
	import type { BodyVisuals } from '$lib/sim/nbody/presets';
	import * as THREE from 'three';

	let { visuals }: { visuals: BodyVisuals } = $props();

	const names = $derived(visuals.names ?? []);
	const radii = $derived(visuals.radii);
	const colors = $derived(visuals.colors);

	const { camera } = useThrelte();

	let refs: (THREE.Group | undefined)[] = $state([]);

	function getColor(i: number): string {
		const r = Math.round(Math.min(1, colors[i * 3] + 0.2) * 255);
		const g = Math.round(Math.min(1, colors[i * 3 + 1] + 0.2) * 255);
		const b = Math.round(Math.min(1, colors[i * 3 + 2] + 0.2) * 255);
		return `rgb(${r},${g},${b})`;
	}

	const MIN_LABEL_SCALE = 0.008; // minimum apparent size factor
	const camPos = new THREE.Vector3();

	useTask(() => {
		const data = positions.data;
		const cam = camera.current;
		if (!data) return;

		camPos.copy(cam.position);

		for (let i = 0; i < names.length; i++) {
			const g = refs[i];
			if (!g) continue;
			if (consumedBodies.set.has(i)) {
				g.visible = false;
				continue;
			}
			g.visible = true;
			const off = i * 3;

			// Adaptive offset and scale based on camera distance
			const px = data[off], py = data[off + 1], pz = data[off + 2];
			const dist = camPos.distanceTo(new THREE.Vector3(px, py, pz));
			const s = Math.max(1, MIN_LABEL_SCALE * dist / 0.12);

			const offset = ((radii[i] ?? 0.15) + 0.12) * s;
			g.position.set(px, py + offset, pz);
			g.scale.setScalar(s);
			// Billboard: face camera
			g.quaternion.copy(cam.quaternion);
		}
	});
</script>

{#each names as name, i}
	<T.Group bind:ref={refs[i]}>
		<Text
			text={name}
			fontSize={i === 0 ? 0.18 : 0.12}
			color={getColor(i)}
			anchorX="center"
			anchorY="bottom"
			outlineWidth={0.025}
			outlineColor="#000000"
			depthOffset={-1}
		/>
	</T.Group>
{/each}
