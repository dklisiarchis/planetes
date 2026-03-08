<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { portal } from '$lib/sim/portal.svelte';
	import { positions } from '$lib/sim/nbody/bridge.svelte';
	import { getSystem, SYSTEMS } from '$lib/sim/nbody/presets';
	import { applySystemDefaults } from '$lib/sim/nbody/state.svelte';
	import { onMount } from 'svelte';

	import NBody from '$lib/scenes/NBody.svelte';
	import NBodyDashboard from '$lib/components/nbody/NBodyDashboard.svelte';
	import EventLog from '$lib/components/nbody/EventLog.svelte';

	let slug = $derived(page.params.slug ?? '');

	// Simple FPS counter
	let fps = $state(0);
	let frameCount = 0;
	let lastTime = 0;
	function updateFps(now: number) {
		frameCount++;
		if (now - lastTime >= 1000) {
			fps = frameCount;
			frameCount = 0;
			lastTime = now;
		}
		requestAnimationFrame(updateFps);
	}
	onMount(() => {
		lastTime = performance.now();
		requestAnimationFrame(updateFps);
	});
	let system = $derived(SYSTEMS[slug] ? getSystem(slug) : null);

	// Loading state
	let loading = $state(true);
	let minTimeElapsed = $state(false);
	let simReady = $derived(positions.data !== null);
	let showLoader = $derived(loading && (!simReady || !minTimeElapsed));

	// Rotating loading messages
	const loadingMessages = [
		'Initializing gravitational field...',
		'Computing orbital trajectories...',
		'Calibrating star luminosity...',
		'Resolving planetary resonances...',
		'Mapping celestial coordinates...',
		'Aligning reference frames...',
	];
	let msgIndex = $state(0);
	let msgInterval: ReturnType<typeof setInterval>;

	onMount(() => {
		// Minimum loader display time for polish
		setTimeout(() => (minTimeElapsed = true), 2500);

		// Rotate messages
		msgInterval = setInterval(() => {
			msgIndex = (msgIndex + 1) % loadingMessages.length;
		}, 1100);

		return () => clearInterval(msgInterval);
	});

	// When loader should hide, trigger fade-out
	$effect(() => {
		if (simReady && minTimeElapsed) {
			setTimeout(() => (loading = false), 600);
		}
	});

	// Set up scene
	$effect(() => {
		if (!system) {
			goto('/');
			return;
		}

		applySystemDefaults(slug);
		portal.scene = NBody;
		portal.mode = 'space';

		return () => {
			portal.scene = null;
			portal.mode = 'default';
		};
	});
</script>

<!-- Loading overlay -->
{#if loading}
	<div
		class="pointer-events-auto absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#060612] transition-opacity duration-700"
		class:opacity-0={simReady && minTimeElapsed}
	>
		<!-- Orbital animation -->
		<div class="orbit-container mb-10">
			<div class="orbit-ring orbit-ring-1">
				<div class="orbit-dot"></div>
			</div>
			<div class="orbit-ring orbit-ring-2">
				<div class="orbit-dot"></div>
			</div>
			<div class="orbit-ring orbit-ring-3">
				<div class="orbit-dot"></div>
			</div>
			<div class="orbit-center"></div>
		</div>

		<!-- System name -->
		{#if system}
			<h2 class="text-3xl font-bold text-white/80 mb-3 tracking-tight">
				{system.name}
			</h2>
			<p class="text-sm text-white/25 mb-8 max-w-sm text-center">
				{system.bodyCount} celestial bodies · Real gravitational physics
			</p>
		{/if}

		<!-- Rotating message -->
		{#key msgIndex}
			<p class="text-sm text-white/30 h-5 loading-msg">
				{loadingMessages[msgIndex]}
			</p>
		{/key}
	</div>
{/if}

<!-- FPS counter + Dashboard overlay (visible after loading) -->
{#if !loading && system}
	<div class="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-10">
		<span class="font-mono text-xs text-white/25">{fps} FPS</span>
	</div>
	<div class="pointer-events-auto absolute top-4 right-4">
		<NBodyDashboard />
	</div>
	<div class="pointer-events-none absolute bottom-4 left-4 z-10">
		<EventLog />
	</div>
{/if}

<style>
	.orbit-container {
		position: relative;
		width: 120px;
		height: 120px;
	}

	.orbit-center {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 10px;
		height: 10px;
		margin: -5px 0 0 -5px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(255, 200, 100, 0.9), rgba(255, 140, 50, 0.3));
		box-shadow: 0 0 20px rgba(255, 180, 80, 0.4);
	}

	.orbit-ring {
		position: absolute;
		top: 50%;
		left: 50%;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.orbit-ring-1 {
		width: 50px;
		height: 50px;
		margin: -25px 0 0 -25px;
		animation: spin 2s linear infinite;
	}

	.orbit-ring-2 {
		width: 80px;
		height: 80px;
		margin: -40px 0 0 -40px;
		animation: spin 3.5s linear infinite reverse;
	}

	.orbit-ring-3 {
		width: 110px;
		height: 110px;
		margin: -55px 0 0 -55px;
		animation: spin 5.5s linear infinite;
	}

	.orbit-dot {
		position: absolute;
		top: -2.5px;
		left: 50%;
		width: 5px;
		height: 5px;
		margin-left: -2.5px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.7);
		box-shadow: 0 0 8px rgba(150, 180, 255, 0.5);
	}

	.orbit-ring-2 .orbit-dot {
		width: 4px;
		height: 4px;
		margin-left: -2px;
		top: -2px;
		background: rgba(180, 200, 255, 0.6);
	}

	.orbit-ring-3 .orbit-dot {
		width: 3px;
		height: 3px;
		margin-left: -1.5px;
		top: -1.5px;
		background: rgba(150, 170, 255, 0.4);
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.loading-msg {
		animation: fadeIn 0.4s ease-in;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(4px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
