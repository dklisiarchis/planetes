<script lang="ts">
	import { eventLog, type SimEvent } from '$lib/sim/nbody/state.svelte';

	let scrollContainer: HTMLDivElement | undefined = $state();
	let expanded = $state(true);

	const icons: Record<SimEvent['type'], string> = {
		collision: '\u{1F4A5}',
		consumed: '\u{1F573}\u{FE0F}',
		escaped: '\u{1F30C}',
	};

	const colors: Record<SimEvent['type'], string> = {
		collision: 'text-orange-400',
		consumed: 'text-red-400',
		escaped: 'text-blue-400',
	};

	// Auto-scroll to bottom on new events
	$effect(() => {
		const _len = eventLog.events.length;
		if (scrollContainer) {
			requestAnimationFrame(() => {
				scrollContainer!.scrollTop = scrollContainer!.scrollHeight;
			});
		}
	});
</script>

{#if eventLog.events.length > 0}
	<div class="pointer-events-auto flex flex-col" style="width: 320px;">
		<!-- Header -->
		<button
			class="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm border border-white/[0.06] rounded-t-lg text-[11px] text-white/40 hover:text-white/60 transition-colors"
			class:rounded-b-lg={!expanded}
			onclick={() => (expanded = !expanded)}
		>
			<span class="font-mono tracking-wider uppercase">Event Log</span>
			<span class="ml-auto tabular-nums text-white/20">{eventLog.events.length}</span>
			<span class="text-[9px] transition-transform" class:rotate-180={!expanded}>&#9660;</span>
		</button>

		<!-- Log entries -->
		{#if expanded}
			<div
				bind:this={scrollContainer}
				class="overflow-y-auto bg-black/50 backdrop-blur-sm border border-t-0 border-white/[0.06] rounded-b-lg"
				style="max-height: 200px;"
			>
				{#each eventLog.events as event, i (i)}
					<div
						class="flex gap-2 px-3 py-1 text-[11px] border-b border-white/[0.03] last:border-b-0"
						class:animate-flash={i === eventLog.events.length - 1}
					>
						<span class="shrink-0 w-4 text-center">{icons[event.type]}</span>
						<span class="shrink-0 font-mono text-white/20 tabular-nums">{event.time}</span>
						<span class={colors[event.type]}>{event.message}</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.animate-flash {
		animation: flash-in 0.6s ease-out;
	}

	@keyframes flash-in {
		0% {
			background-color: rgba(255, 255, 255, 0.08);
		}
		100% {
			background-color: transparent;
		}
	}
</style>
