<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { nbody } from '$lib/sim/nbody/state.svelte';
	import {
		initWorker,
		terminateWorker,
		stepWorker,
		scaleState
	} from '$lib/sim/nbody/bridge.svelte';
	import { getSystem, type BodyVisuals, type SystemConfig } from '$lib/sim/nbody/presets';
	import SystemBodies from '$lib/components/nbody/SystemBodies.svelte';
	import Trails from '$lib/components/nbody/Trails.svelte';
	import Starfield from '$lib/components/nbody/Starfield.svelte';
	import Bloom from '$lib/components/nbody/Bloom.svelte';
	import SunGlow from '$lib/components/nbody/SunGlow.svelte';
	import PlanetLabels from '$lib/components/nbody/PlanetLabels.svelte';
	import AsteroidBelt from '$lib/components/nbody/AsteroidBelt.svelte';
	import BodyTracker from '$lib/components/nbody/BodyTracker.svelte';

	let ready = $state(false);
	let visuals = $state<BodyVisuals | null>(null);
	let system = $state<SystemConfig>(getSystem(nbody.systemId));

	// Init/re-init the worker whenever generation or system changes
	$effect(() => {
		const _gen = nbody.generation;
		const sys = getSystem(nbody.systemId);
		system = sys;
		scaleState.value = sys.visualScale;

		const result = sys.generate();
		visuals = result.visuals;
		initWorker(result.bodies, nbody.gConstant, nbody.softening);
		nbody.currentStep = 0;
		ready = true;

		stepWorker(0, 0);

		return () => {
			terminateWorker();
			ready = false;
		};
	});

	// Auto-play on mount
	$effect(() => {
		nbody.isPlaying = true;
		return () => {
			nbody.isPlaying = false;
		};
	});

	// Step the simulation each render frame (accumulator allows sub-frame speeds)
	let frameAccum = 0;
	useTask(() => {
		if (!nbody.isPlaying) return;
		frameAccum += nbody.timeScale;
		const steps = Math.floor(frameAccum);
		if (steps > 0) {
			frameAccum -= steps;
			stepWorker(nbody.dt, steps);
			nbody.currentStep += steps;
		}
	});
</script>

<Starfield />
<Bloom />

{#if ready && visuals}
	<SystemBodies {visuals} renderConfig={system.renderConfig} />
	<SunGlow config={system.starGlow} />
	<PlanetLabels {visuals} />

	{#if system.asteroidBelt}
		<AsteroidBelt
			count={system.asteroidBelt.count}
			inner={system.asteroidBelt.inner}
			outer={system.asteroidBelt.outer}
		/>
	{/if}

	{#if nbody.trailLength > 0}
		<Trails bodyCount={system.bodyCount} trailLength={nbody.trailLength} />
	{/if}

	<BodyTracker />
{/if}
