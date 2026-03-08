<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { positions, setBodyMass, requestState } from '$lib/sim/nbody/bridge.svelte';
	import { consumedBodies, consumeBody, pushEvent } from '$lib/sim/nbody/state.svelte';
	import type { BodyVisuals } from '$lib/sim/nbody/presets';
	import * as THREE from 'three';

	let { visuals, bodyCount, blackHoleIndices }: {
		visuals: BodyVisuals;
		bodyCount: number;
		blackHoleIndices?: number[];
	} = $props();

	const { camera } = useThrelte();
	const bhIndices = blackHoleIndices ?? [];

	// ── Collision detection config ──
	const COLLISION_FACTOR = 0.4;
	// Stars (index 0) and BHs are excluded from planet-planet collision checks
	const skipIndices = new Set([0, ...bhIndices]);

	// BH consumption: very small radius in scaled visual coordinates.
	// With proper softening, only bodies that genuinely fall in will reach this distance.
	const BH_CONSUME_DIST = 0.08;

	// Escape detection: body has left the system if beyond this visual-unit distance from origin
	const ESCAPE_DIST = 100;
	const escapedBodies = new Set<number>();

	const names = $derived(visuals.names ?? []);

	// ── Active explosion effects ──
	interface Explosion {
		position: THREE.Vector3;
		age: number;       // 0..1 normalized lifetime
		maxScale: number;  // based on combined radii
		color: THREE.Color;
	}

	const MAX_EXPLOSIONS = 20;
	const EXPLOSION_DURATION = 2.0; // seconds
	let explosions: Explosion[] = $state([]);

	// Track groups for explosion rendering
	let explosionGroups: (THREE.Group | undefined)[] = $state([]);

	// ── Explosion flash texture ──
	const flashTexture = (() => {
		const size = 256;
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d')!;
		const cx = size / 2;

		// Bright core with expanding ring
		const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
		g.addColorStop(0, 'rgba(255, 255, 255, 1)');
		g.addColorStop(0.1, 'rgba(255, 240, 180, 0.9)');
		g.addColorStop(0.25, 'rgba(255, 180, 60, 0.6)');
		g.addColorStop(0.5, 'rgba(255, 100, 20, 0.25)');
		g.addColorStop(0.75, 'rgba(200, 40, 5, 0.08)');
		g.addColorStop(1, 'rgba(0, 0, 0, 0)');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, size, size);

		return new THREE.CanvasTexture(canvas);
	})();

	// ── Debris ring texture ──
	const debrisTexture = (() => {
		const size = 256;
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d')!;
		const cx = size / 2;

		// Thin expanding ring
		const g = ctx.createRadialGradient(cx, cx, size * 0.3, cx, cx, size * 0.5);
		g.addColorStop(0, 'rgba(255, 150, 50, 0)');
		g.addColorStop(0.3, 'rgba(255, 180, 80, 0.5)');
		g.addColorStop(0.5, 'rgba(255, 200, 100, 0.7)');
		g.addColorStop(0.7, 'rgba(255, 150, 50, 0.4)');
		g.addColorStop(1, 'rgba(200, 80, 20, 0)');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, size, size);

		// Scatter some bright debris dots
		for (let i = 0; i < 40; i++) {
			const angle = Math.random() * Math.PI * 2;
			const r = size * (0.3 + Math.random() * 0.2);
			const x = cx + Math.cos(angle) * r;
			const y = cx + Math.sin(angle) * r;
			const dotSize = Math.random() * 3 + 1;
			ctx.fillStyle = `rgba(255, ${200 + Math.random() * 55}, ${100 + Math.random() * 100}, ${0.5 + Math.random() * 0.5})`;
			ctx.beginPath();
			ctx.arc(x, y, dotSize, 0, Math.PI * 2);
			ctx.fill();
		}

		return new THREE.CanvasTexture(canvas);
	})();

	function spawnExplosion(x: number, y: number, z: number, r1: number, r2: number, c1: Float32Array, i1: number, c2: Float32Array, i2: number) {
		if (explosions.length >= MAX_EXPLOSIONS) {
			// Remove oldest
			explosions = explosions.slice(1);
		}

		// Blend colors of the two colliding bodies
		const color = new THREE.Color(
			(c1[i1 * 3] + c2[i2 * 3]) / 2,
			(c1[i1 * 3 + 1] + c2[i2 * 3 + 1]) / 2,
			(c1[i1 * 3 + 2] + c2[i2 * 3 + 2]) / 2
		);

		explosions = [...explosions, {
			position: new THREE.Vector3(x, y, z),
			age: 0,
			maxScale: (r1 + r2) * 15,
			color,
		}];
	}

	async function mergeBody(keepIdx: number, removeIdx: number) {
		// Add removed body's mass to the surviving one
		const state = await requestState();
		const keepMass = state[keepIdx * 7 + 6];
		const removeMass = state[removeIdx * 7 + 6];
		consumeBody(removeIdx);
		await setBodyMass(removeIdx, 0);
		await setBodyMass(keepIdx, keepMass + removeMass);
	}

	useTask(() => {
		const data = positions.data;
		if (!data) return;

		const radii = visuals.radii;
		const colors = visuals.colors;

		// ── Black hole consumption: destroy bodies that fall into a BH ──
		for (const bhIdx of bhIndices) {
			const bx = data[bhIdx * 3], by = data[bhIdx * 3 + 1], bz = data[bhIdx * 3 + 2];

			for (let i = 0; i < bodyCount; i++) {
				if (i === bhIdx || consumedBodies.set.has(i) || skipIndices.has(i)) continue;

				const ix = data[i * 3], iy = data[i * 3 + 1], iz = data[i * 3 + 2];
				const dx = ix - bx, dy = iy - by, dz = iz - bz;
				const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

				if (dist < BH_CONSUME_DIST) {
					const bodyName = names[i] ?? `Body ${i}`;
					const bhName = names[bhIdx] ?? 'Black Hole';
					pushEvent('consumed', `${bodyName} consumed by ${bhName}`);
					spawnExplosion(bx, by, bz, radii[i] ?? 0.1, 0.05, colors, i, colors, i);
					consumeBody(i);
					setBodyMass(i, 0);
				}
			}
		}

		// ── Planet-planet collisions (non-BH systems only) ──
		if (bhIndices.length === 0) {
			for (let i = 0; i < bodyCount; i++) {
				if (consumedBodies.set.has(i) || skipIndices.has(i)) continue;

				const ix = data[i * 3], iy = data[i * 3 + 1], iz = data[i * 3 + 2];
				const ri = radii[i] ?? 0.1;

				for (let j = i + 1; j < bodyCount; j++) {
					if (consumedBodies.set.has(j) || skipIndices.has(j)) continue;

					const jx = data[j * 3], jy = data[j * 3 + 1], jz = data[j * 3 + 2];
					const rj = radii[j] ?? 0.1;

					const dx = ix - jx, dy = iy - jy, dz = iz - jz;
					const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
					const collisionDist = (ri + rj) * COLLISION_FACTOR;

					if (dist < collisionDist) {
						const midX = (ix + jx) / 2;
						const midY = (iy + jy) / 2;
						const midZ = (iz + jz) / 2;

						const nameI = names[i] ?? `Body ${i}`;
						const nameJ = names[j] ?? `Body ${j}`;
						pushEvent('collision', `${nameI} collided with ${nameJ}`);
						spawnExplosion(midX, midY, midZ, ri, rj, colors, i, colors, j);

						if (ri >= rj) {
							mergeBody(i, j);
						} else {
							mergeBody(j, i);
						}
					}
				}
			}
		}

		// ── Escape detection: bodies that fly far from the origin ──
		for (let i = 0; i < bodyCount; i++) {
			if (consumedBodies.set.has(i) || skipIndices.has(i) || escapedBodies.has(i)) continue;

			const ix = data[i * 3], iy = data[i * 3 + 1], iz = data[i * 3 + 2];
			const dist = Math.sqrt(ix * ix + iy * iy + iz * iz);

			if (dist > ESCAPE_DIST) {
				escapedBodies.add(i);
				const bodyName = names[i] ?? `Body ${i}`;
				pushEvent('escaped', `${bodyName} escaped into the void`);
			}
		}

		// Age and clean up explosions
		const dt = 0.016;
		explosions = explosions
			.map(e => ({ ...e, age: e.age + dt / EXPLOSION_DURATION }))
			.filter(e => e.age < 1);

		// Update explosion visuals
		const camPos = camera.current.position;
		for (let i = 0; i < explosions.length; i++) {
			const g = explosionGroups[i];
			const e = explosions[i];
			if (!g || !e) continue;

			g.position.copy(e.position);

			// Scale up over lifetime with easing
			const t = e.age;
			const camDist = camPos.distanceTo(e.position);
			const distScale = Math.max(1, camDist * 0.04);
			const expandScale = e.maxScale * (0.3 + 0.7 * Math.sqrt(t)) * distScale;
			g.scale.setScalar(expandScale);
		}
	});
</script>

{#each explosions as explosion, i (i)}
	<T.Group bind:ref={explosionGroups[i]}>
		<!-- Bright flash (fades fast) -->
		{@const flashOpacity = Math.max(0, 1 - explosion.age * 2.5)}
		<T.Sprite>
			<T.SpriteMaterial
				map={flashTexture}
				blending={THREE.AdditiveBlending}
				transparent
				depthWrite={false}
				opacity={flashOpacity}
			/>
		</T.Sprite>

		<!-- Expanding debris ring (fades slower) -->
		{@const ringOpacity = Math.max(0, (1 - explosion.age) * 0.7)}
		<T.Sprite scale={[1.8, 1.8, 1]}>
			<T.SpriteMaterial
				map={debrisTexture}
				blending={THREE.AdditiveBlending}
				transparent
				depthWrite={false}
				opacity={ringOpacity}
			/>
		</T.Sprite>
	</T.Group>
{/each}
