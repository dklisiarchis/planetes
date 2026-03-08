<script lang="ts">
	import { nbody, resetNBody, simTimeLabel, simSpeedLabel, applySystemDefaults, bodySelection, selectBody, deselectBody } from '$lib/sim/nbody/state.svelte';
	import {
		setG,
		setSoftening,
		setBodyMass,
		setSunMass,
		ring,
		scaleState
	} from '$lib/sim/nbody/bridge.svelte';
	import {
		Pane,
		Slider,
		Button,
		Separator,
		Folder,
		Checkbox,
		Monitor,
	} from 'svelte-tweakpane-ui';
	import { getSystem } from '$lib/sim/nbody/presets';

	// Sync param changes to the worker
	$effect(() => { setG(nbody.gConstant); });
	$effect(() => { setSoftening(nbody.softening); });

	let timeLabel = $derived(simTimeLabel());
	let speedLabel = $derived(simSpeedLabel());

	let system = $derived(getSystem(nbody.systemId));

	// G as a multiplier for the UI (1× = real value)
	let gMultiplier = $state(1.0);
	$effect(() => {
		nbody.gConstant = system.defaults.g * gMultiplier;
	});

	function executeWhatIf(action: { type: string; bodyIndex?: number; value: number }) {
		switch (action.type) {
			case 'star_mass':
				setSunMass(action.value);
				break;
			case 'body_mass':
				if (action.bodyIndex != null) setBodyMass(action.bodyIndex, action.value);
				break;
			case 'g_mult':
				gMultiplier = action.value;
				break;
		}
	}

	function resetAll() {
		gMultiplier = 1.0;
		applySystemDefaults(nbody.systemId);
		resetNBody();
	}

	let bodyNames = $derived(system.bodyNames);

	// Formatted stats for selected body
	let distLabel = $derived(
		bodySelection.index >= 0 ? `${bodySelection.distFromStar.toFixed(4)} AU` : '—'
	);
	let speedLabel2 = $derived(
		bodySelection.index >= 0 ? `${bodySelection.speed.toFixed(1)} km/s` : '—'
	);
	let posLabel = $derived(
		bodySelection.index >= 0
			? `(${bodySelection.x.toFixed(3)}, ${bodySelection.y.toFixed(3)}, ${bodySelection.z.toFixed(3)})`
			: '—'
	);
</script>

<div class="pointer-events-auto">
	<Pane title={system.name} position="fixed">
		<Folder title="Time" expanded={false}>
			<Slider
				bind:value={nbody.timeScale}
				min={0.1} max={100} step={0.1}
				label="Speed"
				format={() => speedLabel}
			/>
			<Monitor value={timeLabel} label="Elapsed" />
			<Monitor value={speedLabel} label="Rate" />
		</Folder>

		<Separator />

		<Folder title="Bodies" expanded={false}>
			{#each bodyNames as name, i}
				<Button
					title={bodySelection.index === i ? `● ${name}` : `  ${name}`}
					on:click={() => {
						if (bodySelection.index === i) {
							deselectBody();
						} else {
							selectBody(i, name);
						}
					}}
				/>
			{/each}

			{#if bodySelection.index >= 0}
				<Separator />
				<Monitor value={bodySelection.name} label="Selected" />
				<Monitor value={distLabel} label="Distance" />
				<Monitor value={speedLabel2} label="Speed" />
				<Monitor value={posLabel} label="Position (AU)" />
				<Checkbox bind:value={bodySelection.following} label="Follow Camera" />
			{/if}
		</Folder>

		<Separator />

		<Folder title="Gravity" expanded={false}>
			<Slider
				bind:value={gMultiplier}
				min={0.01} max={5} step={0.01}
				label="G Multiplier"
				format={(v) => `${v.toFixed(2)}×`}
			/>
			<Slider
				bind:value={nbody.softening}
				min={0} max={0.1} step={0.001}
				label="Softening"
				format={(v) => `${v.toFixed(3)} AU`}
			/>
		</Folder>

		<Separator />

		<Folder title="What If?" expanded={false}>
			{#each system.whatIf as action}
				<Button title={action.label} on:click={() => executeWhatIf(action)} />
			{/each}
		</Folder>

		<Separator />

		<Folder title="Rendering" expanded={false}>
			<Slider bind:value={nbody.trailLength} min={0} max={500} step={10} label="Trail Length" />
		</Folder>

		<Separator />

		<Folder title="Playback" expanded={false}>
			<Checkbox bind:value={nbody.isPlaying} label="Playing" />
			<Button title="Reset & Restart" on:click={resetAll} />
		</Folder>
	</Pane>
</div>
