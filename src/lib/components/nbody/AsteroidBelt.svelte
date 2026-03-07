<script lang="ts">
	import { T } from '@threlte/core';
	import * as THREE from 'three';

	const { count = 3000, inner = 2.1, outer = 3.3 }: { count?: number; inner?: number; outer?: number } = $props();

	const positions = new Float32Array(count * 3);
	const colors = new Float32Array(count * 3);
	const color = new THREE.Color();

	for (let i = 0; i < count; i++) {
		const r = inner + Math.random() * (outer - inner);
		const theta = Math.random() * Math.PI * 2;
		const y = (Math.random() - 0.5) * 0.4 * r * 0.05;

		positions[i * 3] = r * Math.cos(theta);
		positions[i * 3 + 1] = y;
		positions[i * 3 + 2] = r * Math.sin(theta);

		const brightness = 0.25 + Math.random() * 0.2;
		color.setHSL(0.08 + Math.random() * 0.05, 0.15, brightness);
		colors[i * 3] = color.r;
		colors[i * 3 + 1] = color.g;
		colors[i * 3 + 2] = color.b;
	}
</script>

<T.Points frustumCulled={false}>
	<T.BufferGeometry>
		<T.BufferAttribute args={[positions, 3]} attach="attributes.position" />
		<T.BufferAttribute args={[colors, 3]} attach="attributes.color" />
	</T.BufferGeometry>
	<T.PointsMaterial
		size={0.03}
		vertexColors
		sizeAttenuation
		transparent
		opacity={0.6}
		depthWrite={false}
	/>
</T.Points>
