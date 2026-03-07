<script lang="ts">
	import { T } from '@threlte/core';
	import { portal, cameraFollow } from '$lib/sim/portal.svelte';

	let SceneComponent = $derived(portal.scene);
	let mode = $derived(portal.mode ?? 'default');
	let isSpace = $derived(mode === 'space');
	let orbitTarget: [number, number, number] = $derived(cameraFollow.target ?? [0, 0, 0]);
</script>

<!-- Lighting -->
<T.AmbientLight intensity={isSpace ? 0.15 : 0.35} color={isSpace ? '#334' : '#b0b0ff'} />
{#if !isSpace}
	<T.DirectionalLight
		position={[10, 20, 10]}
		intensity={1.4}
		castShadow
		shadow.mapSize.width={2048}
		shadow.mapSize.height={2048}
		shadow.camera.left={-20}
		shadow.camera.right={20}
		shadow.camera.top={20}
		shadow.camera.bottom={-20}
		shadow.camera.near={0.5}
		shadow.camera.far={50}
		shadow.bias={-0.0001}
	/>
	<T.DirectionalLight position={[-8, 12, -8]} intensity={0.3} color="#8080ff" />
{/if}

<!-- Fog (disabled for space scenes) -->
{#if !isSpace}
	<T.FogExp2 args={['#0a0a1a', 0.018]} attach="fog" />
{/if}

<!-- Camera -->
<T.PerspectiveCamera
	makeDefault
	position={isSpace ? [0, 40, 40] : [14, 10, 14]}
	fov={50}
	far={isSpace ? 500 : 200}
>
	{#await import('@threlte/extras') then { OrbitControls }}
		<OrbitControls
			enableDamping
			dampingFactor={0.08}
			target={orbitTarget}
			minDistance={isSpace ? 2 : 5}
			maxDistance={isSpace ? 200 : 40}
			maxPolarAngle={isSpace ? Math.PI : Math.PI / 2 - 0.05}
		/>
	{/await}
</T.PerspectiveCamera>

<!-- Route-injected scene -->
{#if SceneComponent}
	<SceneComponent />
{/if}
