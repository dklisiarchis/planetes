<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { positions } from '$lib/sim/nbody/bridge.svelte';
	import type { BlackHoleConfig } from '$lib/sim/nbody/presets';
	import * as THREE from 'three';

	let { config }: { config: BlackHoleConfig } = $props();

	const { camera } = useThrelte();

	let bhGroups: (THREE.Group | undefined)[] = $state([]);
	let diskGroups: (THREE.Group | undefined)[] = $state([]);

	// ── Vortex shader — animated swirling void in the center ──
	const vortexMaterial = new THREE.ShaderMaterial({
		uniforms: {
			uTime: { value: 0 },
		},
		vertexShader: `
			varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`,
		fragmentShader: `
			uniform float uTime;
			varying vec2 vUv;

			// Simple pseudo-noise
			float hash(vec2 p) {
				return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
			}

			float noise(vec2 p) {
				vec2 i = floor(p);
				vec2 f = fract(p);
				f = f * f * (3.0 - 2.0 * f);
				float a = hash(i);
				float b = hash(i + vec2(1.0, 0.0));
				float c = hash(i + vec2(0.0, 1.0));
				float d = hash(i + vec2(1.0, 1.0));
				return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
			}

			void main() {
				vec2 uv = vUv - 0.5;
				float r = length(uv);
				float angle = atan(uv.y, uv.x);

				// Spiral distortion — swirls faster near center
				float spiral = angle + uTime * 0.8 + 6.0 / (r + 0.15);

				// Layered noise for turbulence
				float n1 = noise(vec2(spiral * 1.5, r * 8.0 - uTime * 0.3));
				float n2 = noise(vec2(spiral * 3.0 + 1.7, r * 12.0 - uTime * 0.5));
				float n3 = noise(vec2(spiral * 0.5 - 0.3, r * 4.0 + uTime * 0.2));
				float n = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

				// Deep blue-purple palette
				vec3 color = vec3(0.0);
				color += vec3(0.05, 0.02, 0.15) * n;                      // deep purple base
				color += vec3(0.0, 0.06, 0.2) * pow(n2, 2.0);             // blue streaks
				color += vec3(0.15, 0.05, 0.25) * pow(n1, 3.0) * 0.6;     // bright purple wisps

				// Bright core flash — occasional bright point near center
				float flash = pow(n1 * n2, 4.0) * smoothstep(0.3, 0.0, r) * 2.0;
				color += vec3(0.2, 0.15, 0.4) * flash;

				// Fade to black at edges (beyond the sphere surface)
				float alpha = smoothstep(0.5, 0.35, r);

				gl_FragColor = vec4(color, alpha);
			}
		`,
		transparent: true,
		depthWrite: false,
		side: THREE.FrontSide,
	});

	// ── Dark shadow sprite ──
	const shadowTexture = $derived.by(() => {
		const size = 512;
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d')!;
		const cx = size / 2;
		const cy = size / 2;

		const shadow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.48);
		shadow.addColorStop(0, 'rgba(0, 0, 0, 1)');
		shadow.addColorStop(0.7, 'rgba(0, 0, 0, 1)');
		shadow.addColorStop(0.85, 'rgba(0, 0, 0, 0.8)');
		shadow.addColorStop(0.95, 'rgba(0, 0, 0, 0.2)');
		shadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
		ctx.fillStyle = shadow;
		ctx.fillRect(0, 0, size, size);

		return new THREE.CanvasTexture(canvas);
	});

	// ── Accretion disk texture ──
	const diskTexture = $derived.by(() => {
		const w = 512;
		const h = 64;
		const canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext('2d')!;

		const gradient = ctx.createLinearGradient(0, 0, w, 0);
		gradient.addColorStop(0, 'rgba(255, 255, 230, 1)');
		gradient.addColorStop(0.08, 'rgba(255, 220, 140, 0.95)');
		gradient.addColorStop(0.2, 'rgba(255, 170, 60, 0.85)');
		gradient.addColorStop(0.4, 'rgba(255, 120, 30, 0.6)');
		gradient.addColorStop(0.65, 'rgba(200, 60, 10, 0.3)');
		gradient.addColorStop(0.85, 'rgba(100, 20, 5, 0.1)');
		gradient.addColorStop(1, 'rgba(30, 5, 0, 0)');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, w, h);

		for (let i = 0; i < 20; i++) {
			const y = Math.random() * h;
			const startX = Math.random() * w * 0.3;
			const endX = startX + Math.random() * w * 0.5;
			const alpha = Math.random() * 0.3;
			ctx.beginPath();
			ctx.moveTo(startX, y);
			ctx.lineTo(endX, y);
			ctx.strokeStyle = `rgba(255, 200, 100, ${alpha})`;
			ctx.lineWidth = Math.random() * 3 + 1;
			ctx.stroke();
		}

		const tex = new THREE.CanvasTexture(canvas);
		tex.wrapS = THREE.RepeatWrapping;
		tex.wrapT = THREE.ClampToEdgeWrapping;
		return tex;
	});

	// ── Ring geometry with radial UVs ──
	const ringGeo = $derived.by(() => {
		const disk = config.accretionDisk;
		if (!disk) return null;
		const geo = new THREE.RingGeometry(disk.innerRadius, disk.outerRadius, 128, 8);
		const pos = geo.attributes.position;
		const uv = geo.attributes.uv;
		const v3 = new THREE.Vector3();
		for (let i = 0; i < pos.count; i++) {
			v3.fromBufferAttribute(pos, i);
			const len = v3.length();
			const radialT = (len - disk.innerRadius) / (disk.outerRadius - disk.innerRadius);
			const angle = Math.atan2(v3.y, v3.x);
			uv.setXY(i, radialT, angle / (Math.PI * 2) + 0.5);
		}
		return geo;
	});

	// ── Event horizon ring geometry — thin glowing torus ──
	const horizonGeo = new THREE.TorusGeometry(0.28, 0.008, 16, 64);

	let time = 0;

	useTask(() => {
		const data = positions.data;
		if (!data) return;

		time += 0.016;
		vortexMaterial.uniforms.uTime.value = time;

		const camPos = camera.current.position;

		for (let bi = 0; bi < config.bodyIndices.length; bi++) {
			const bodyIdx = config.bodyIndices[bi];
			const group = bhGroups[bi];
			if (!group) continue;

			const off = bodyIdx * 3;
			group.position.set(data[off], data[off + 1], data[off + 2]);

			const dist = camPos.distanceTo(group.position);
			const s = Math.max(1.2, dist * 0.06);
			group.scale.setScalar(s);

			const dg = diskGroups[bi];
			if (dg) {
				dg.rotation.z += (config.accretionDisk?.speed ?? 0.5) * 0.005;
			}
		}
	});
</script>

{#each config.bodyIndices as bodyIdx, bi (bodyIdx)}
	<T.Group bind:ref={bhGroups[bi]}>
		<!-- Dark shadow (always faces camera) -->
		<T.Sprite scale={[3.5, 3.5, 1]}>
			<T.SpriteMaterial
				map={shadowTexture}
				transparent
				depthWrite={false}
				opacity={1}
			/>
		</T.Sprite>

		<!-- Animated vortex sphere — swirling void center -->
		<T.Mesh>
			<T.SphereGeometry args={[0.26, 48, 48]} />
			<T is={vortexMaterial} />
		</T.Mesh>

		<!-- Event horizon ring — thin bright torus -->
		<T.Mesh rotation.x={Math.PI / 2}>
			<T is={horizonGeo} />
			<T.MeshBasicMaterial
				color="#ff9944"
				transparent
				opacity={0.7}
			/>
		</T.Mesh>
		<!-- Second horizon ring, perpendicular for visibility from any angle -->
		<T.Mesh>
			<T is={horizonGeo} />
			<T.MeshBasicMaterial
				color="#ff8833"
				transparent
				opacity={0.4}
			/>
		</T.Mesh>

		<!-- 3D accretion disk -->
		{#if ringGeo && config.accretionDisk}
			<T.Group bind:ref={diskGroups[bi]} rotation.x={1.2}>
				<T.Mesh>
					<T is={ringGeo} />
					<T.MeshBasicMaterial
						map={diskTexture}
						side={THREE.DoubleSide}
						transparent
						opacity={0.85}
						blending={THREE.AdditiveBlending}
						depthWrite={false}
					/>
				</T.Mesh>
				<T.Mesh rotation.x={0.15} rotation.y={0.3}>
					<T is={ringGeo} />
					<T.MeshBasicMaterial
						map={diskTexture}
						side={THREE.DoubleSide}
						transparent
						opacity={0.35}
						blending={THREE.AdditiveBlending}
						depthWrite={false}
					/>
				</T.Mesh>
			</T.Group>
		{/if}

		<!-- Point light from accretion glow -->
		<T.PointLight
			color={config.accretionDisk?.color ?? '#ff8844'}
			intensity={1.2}
			distance={50}
			decay={0.6}
		/>
	</T.Group>
{/each}
