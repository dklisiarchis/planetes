<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { positions } from '$lib/sim/nbody/bridge.svelte';
	import type { BodyVisuals, BodyRenderConfig } from '$lib/sim/nbody/presets';
	import * as THREE from 'three';

	const { camera } = useThrelte();

	let { visuals, renderConfig }: { visuals: BodyVisuals; renderConfig: BodyRenderConfig[] } =
		$props();

	const radii = $derived(visuals.radii);
	const names = $derived(visuals.names ?? []);

	// Texture loader with cache
	const loader = new THREE.TextureLoader();
	const textures: Map<string, THREE.Texture> = new Map();

	function getTexture(path: string): THREE.Texture {
		if (!textures.has(path)) {
			const tex = loader.load(path);
			tex.colorSpace = THREE.SRGBColorSpace;
			textures.set(path, tex);
		}
		return textures.get(path)!;
	}

	// Saturn-style ring geometry (created lazily)
	let ringGeo: THREE.RingGeometry | undefined;
	const RING_INNER = 1.3;
	const RING_OUTER = 2.5;

	function getRingGeo(): THREE.RingGeometry {
		if (!ringGeo) {
			ringGeo = new THREE.RingGeometry(RING_INNER, RING_OUTER, 64);
			const pos = ringGeo.attributes.position;
			const uv = ringGeo.attributes.uv;
			const v3 = new THREE.Vector3();
			for (let i = 0; i < pos.count; i++) {
				v3.fromBufferAttribute(pos, i);
				const len = v3.length();
				uv.setXY(i, (len - RING_INNER) / (RING_OUTER - RING_INNER), 0.5);
			}
		}
		return ringGeo;
	}

	// Track mesh refs for position updates
	let meshRefs: (THREE.Group | undefined)[] = $state([]);

	// Minimum apparent size in world units at distance=1
	const MIN_APPARENT = 0.012;
	const camPos = new THREE.Vector3();

	useTask(() => {
		const data = positions.data;
		if (!data) return;

		camPos.copy(camera.current.position);

		for (let i = 0; i < renderConfig.length; i++) {
			const g = meshRefs[i];
			if (!g) continue;
			const off = i * 3;
			g.position.set(data[off], data[off + 1], data[off + 2]);

			// Adaptive scale: ensure minimum screen-space size
			const baseR = radii[i] ?? 0.15;
			const dist = camPos.distanceTo(g.position);
			const minR = MIN_APPARENT * dist;
			const effectiveR = Math.max(baseR, minR);

			const s = effectiveR / baseR;
			g.scale.setScalar(s);

			// Rotate the planet mesh (first child)
			const planet = g.children[0];
			if (planet) {
				planet.rotation.y += renderConfig[i].rotationSpeed;
			}
		}
	});
</script>

{#each renderConfig as config, i}
	{@const r = radii[i] ?? 0.15}
	<T.Group bind:ref={meshRefs[i]}>
		{#if config.isStar}
			<T.Mesh scale={[r, r, r]}>
				<T.SphereGeometry args={[1, 32, 32]} />
				<T.MeshBasicMaterial
					map={getTexture(config.texture)}
					color={config.materialColor ?? '#ffffff'}
				/>
			</T.Mesh>
		{:else}
			<T.Mesh scale={[r, r, r]}>
				<T.SphereGeometry args={[1, 32, 32]} />
				<T.MeshStandardMaterial
					map={getTexture(config.texture)}
					color={config.materialColor ?? '#ffffff'}
					roughness={0.8}
					metalness={0.1}
				/>
			</T.Mesh>

			{#if config.hasAtmosphere && config.cloudsTexture}
				<T.Mesh scale={[r * 1.01, r * 1.01, r * 1.01]}>
					<T.SphereGeometry args={[1, 32, 32]} />
					<T.MeshStandardMaterial
						map={getTexture(config.cloudsTexture)}
						transparent
						opacity={0.35}
						depthWrite={false}
					/>
				</T.Mesh>
			{/if}

			{#if config.hasRings && config.ringTexture}
				<T.Mesh rotation.x={Math.PI / 2 + 0.47} scale={[r, r, r]}>
					<T is={getRingGeo()} />
					<T.MeshBasicMaterial
						map={getTexture(config.ringTexture)}
						side={THREE.DoubleSide}
						transparent
						opacity={0.8}
						depthWrite={false}
					/>
				</T.Mesh>
			{/if}
		{/if}
	</T.Group>
{/each}
