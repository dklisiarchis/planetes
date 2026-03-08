<script lang="ts">
	import { SYSTEMS } from '$lib/sim/nbody/presets';
	import { onMount } from 'svelte';

	const allSystems = Object.values(SYSTEMS);
	const realSystems = allSystems.filter(s => !s.experimental);
	const experimentalSystems = allSystems.filter(s => s.experimental);

	// Generate star positions for background
	const stars = Array.from({ length: 200 }, () => ({
		x: Math.random() * 100,
		y: Math.random() * 100,
		size: Math.random() * 2 + 0.5,
		opacity: Math.random() * 0.7 + 0.1,
		delay: Math.random() * 4,
		duration: Math.random() * 3 + 2,
	}));

	let mounted = $state(false);
	onMount(() => {
		setTimeout(() => (mounted = true), 100);
	});
</script>

<div class="inset-0 bg-[#060612]">
	<!-- Star field background -->
	{#each stars as star}
		<div
			class="absolute rounded-full bg-white twinkle"
			style="
				left: {star.x}%;
				top: {star.y}%;
				width: {star.size}px;
				height: {star.size}px;
				opacity: {star.opacity};
				animation-delay: {star.delay}s;
				animation-duration: {star.duration}s;
			"
		></div>
	{/each}

	<!-- Ambient nebula glow -->
	<div class="absolute top-1/4 left-1/3 h-[500px] w-[500px] rounded-full bg-indigo-900/8 blur-[150px]"></div>
	<div class="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-900/6 blur-[120px]"></div>

	<!-- Content -->
	<div
		class="relative z-10 flex min-h-screen flex-col items-center px-6 py-20 transition-all duration-1000"
		class:opacity-0={!mounted}
		class:translate-y-4={!mounted}
		class:opacity-100={mounted}
		class:translate-y-0={mounted}
	>
		<!-- Heading -->
		<div class="mb-4 mt-8 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-1.5 text-xs font-medium tracking-wide text-white/40 uppercase">
			<span class="h-1 w-1 rounded-full bg-indigo-400 animate-pulse"></span>
			Gravitational Dynamics
		</div>

		<h1 class="text-center text-5xl font-bold tracking-tight text-white/90 sm:text-6xl mb-3">
			Choose Your Universe
		</h1>

		<p class="text-center text-lg text-white/30 max-w-lg mb-16">
			Explore real planetary systems with accurate physics, orbital mechanics, and interactive experiments
		</p>

		<!-- Real systems section -->
		<div class="w-full max-w-3xl mb-20">
			<div class="flex items-center gap-3 mb-6">
				<span class="h-1.5 w-1.5 rounded-full bg-emerald-500/80"></span>
				<h2 class="text-sm font-medium tracking-wide text-white/40 uppercase">Real Systems</h2>
				<div class="flex-1 h-px bg-white/[0.06]"></div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				{#each realSystems as system, i}
					<a
						href="/sim/{system.id}"
						class="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.04] hover:scale-[1.02] hover:shadow-2xl"
						style="transition-delay: {150 + i * 100}ms"
						class:opacity-0={!mounted}
						class:translate-y-6={!mounted}
						class:opacity-100={mounted}
						class:translate-y-0={mounted}
					>
						<div class="absolute inset-0 bg-gradient-to-br {system.cardGradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
						<div class="relative">
							<div class="flex items-start justify-between mb-4">
								<h2 class="text-2xl font-bold text-white/90 group-hover:text-white transition-colors">
									{system.name}
								</h2>
								<div class="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/40">
									{system.bodyCount} bodies
								</div>
							</div>
							<p class="text-sm leading-relaxed text-white/30 group-hover:text-white/45 transition-colors mb-6">
								{system.description}
							</p>
							<div class="flex items-center gap-4 text-xs text-white/20">
								<span class="flex items-center gap-1.5">
									<span class="h-1.5 w-1.5 rounded-full bg-emerald-500/60"></span>
									Real data
								</span>
								<span class="flex items-center gap-1.5">
									<span class="h-1.5 w-1.5 rounded-full bg-blue-500/60"></span>
									Interactive
								</span>
								<span class="ml-auto text-white/15 group-hover:text-white/40 transition-colors">
									Explore →
								</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		</div>

		<!-- Experimental systems section -->
		<div class="w-full max-w-3xl mb-20">
			<div class="flex items-center gap-3 mb-3">
				<span class="h-1.5 w-1.5 rounded-full bg-purple-500/80"></span>
				<h2 class="text-sm font-medium tracking-wide text-white/40 uppercase">Experimental</h2>
				<div class="flex-1 h-px bg-white/[0.06]"></div>
			</div>
			<p class="text-xs text-white/20 mb-6 ml-5">
				Real physics, fictional scenarios — black holes, cosmic collisions, and extreme gravity
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				{#each experimentalSystems as system, i}
					{@const delay = 150 + (realSystems.length + i) * 100}
					<a
						href="/sim/{system.id}"
						class="group relative overflow-hidden rounded-2xl border border-purple-500/[0.08] bg-white/[0.02] p-8 transition-all duration-500 hover:border-purple-400/[0.2] hover:bg-white/[0.04] hover:scale-[1.02] hover:shadow-2xl"
						style="transition-delay: {delay}ms"
						class:opacity-0={!mounted}
						class:translate-y-6={!mounted}
						class:opacity-100={mounted}
						class:translate-y-0={mounted}
					>
						<div class="absolute inset-0 bg-gradient-to-br {system.cardGradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
						<div class="relative">
							<div class="flex items-start justify-between mb-4">
								<h2 class="text-2xl font-bold text-white/90 group-hover:text-white transition-colors">
									{system.name}
								</h2>
								<div class="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/40">
									{system.bodyCount} bodies
								</div>
							</div>
							<p class="text-sm leading-relaxed text-white/30 group-hover:text-white/45 transition-colors mb-6">
								{system.description}
							</p>
							<div class="flex items-center gap-4 text-xs text-white/20">
								<span class="flex items-center gap-1.5">
									<span class="h-1.5 w-1.5 rounded-full bg-purple-500/60"></span>
									Real physics
								</span>
								<span class="flex items-center gap-1.5">
									<span class="h-1.5 w-1.5 rounded-full bg-rose-500/60"></span>
									Fictional setup
								</span>
								<span class="ml-auto text-white/15 group-hover:text-white/40 transition-colors">
									Explore →
								</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		</div>

		<!-- Footer hint -->
		<p class="mt-4 mb-8 text-xs text-white/15">
			Built with Rust WASM · Three.js · Svelte
		</p>
	</div>
</div>

<style>
	.twinkle {
		animation: twinkle ease-in-out infinite alternate;
	}

	@keyframes twinkle {
		from { opacity: 0.1; }
		to { opacity: 0.8; }
	}
</style>
