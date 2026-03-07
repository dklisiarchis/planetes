<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { WebGLRenderer } from 'three';
	import SceneRoot from '$lib/components/SceneRoot.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Defer Canvas mount so the loading overlay paints first (no stutter)
	let canvasReady = $state(false);
	onMount(() => {
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				canvasReady = true;
			});
		});
	});

	function createRenderer(canvas: HTMLCanvasElement) {
		return new WebGLRenderer({
			canvas,
			antialias: true,
			logarithmicDepthBuffer: true,
			powerPreference: 'high-performance'
		});
	}
</script>

<div class="relative h-screen overflow-hidden bg-[#060612]">
	<!-- Persistent WebGL Canvas (deferred to avoid stutter on navigation) -->
	{#if canvasReady}
		<div class="absolute inset-0">
			<Canvas shadows {createRenderer}>
				<SceneRoot />
			</Canvas>
		</div>
	{/if}

	<!-- UI overlay -->
	<div class="pointer-events-none absolute inset-0 z-10">
		<!-- Back button -->
		<a
			href="/"
			class="pointer-events-auto absolute top-5 left-5 z-20 flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-sm text-white/40 backdrop-blur-sm transition-all hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white/70"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
			Back
		</a>

		{@render children()}
	</div>
</div>
