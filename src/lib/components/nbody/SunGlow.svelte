<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { positions } from '$lib/sim/nbody/bridge.svelte';
	import type { StarGlow } from '$lib/sim/nbody/presets';
	import * as THREE from 'three';

	let { config }: { config: StarGlow } = $props();

	const { camera } = useThrelte();
	let group: THREE.Group | undefined = $state();
	let sprite: THREE.Sprite | undefined = $state();

	// Create a radial gradient texture for the glow
	const texture = $derived.by(() => {
		const canvas = document.createElement('canvas');
		canvas.width = 128;
		canvas.height = 128;
		const ctx = canvas.getContext('2d')!;
		const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
		gradient.addColorStop(0, config.gradientStops[0]);
		gradient.addColorStop(0.2, config.gradientStops[1]);
		gradient.addColorStop(0.5, config.gradientStops[2]);
		gradient.addColorStop(1, config.gradientStops[3]);
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, 128, 128);
		return new THREE.CanvasTexture(canvas);
	});

	useTask(() => {
		const data = positions.data;
		if (!group || !data) return;
		group.position.set(data[0], data[1], data[2]);

		if (sprite) {
			const dist = camera.current.position.distanceTo(group.position);
			const s = Math.max(1.2, dist * 0.04);
			sprite.scale.set(s, s, 1);
		}
	});
</script>

<T.Group bind:ref={group}>
	<T.Sprite bind:ref={sprite} scale={[1.2, 1.2, 1]}>
		<T.SpriteMaterial
			map={texture}
			blending={THREE.AdditiveBlending}
			transparent
			depthWrite={false}
			opacity={0.9}
		/>
	</T.Sprite>

	<T.PointLight
		color={config.lightColor}
		intensity={config.lightIntensity}
		distance={config.lightDistance}
		decay={0.5}
	/>
</T.Group>
