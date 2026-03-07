<script lang="ts">
	import { T } from '@threlte/core';
	import * as THREE from 'three';

	const COUNT = 6000;
	const RADIUS = 200;

	const positions = new Float32Array(COUNT * 3);
	const colors = new Float32Array(COUNT * 3);
	const sizes = new Float32Array(COUNT);
	const color = new THREE.Color();

	for (let i = 0; i < COUNT; i++) {
		// Distribute on a sphere
		const theta = Math.acos(2 * Math.random() - 1);
		const phi = Math.random() * Math.PI * 2;
		positions[i * 3] = RADIUS * Math.sin(theta) * Math.cos(phi);
		positions[i * 3 + 1] = RADIUS * Math.sin(theta) * Math.sin(phi);
		positions[i * 3 + 2] = RADIUS * Math.cos(theta);

		// Star color variation: white, blue-white, warm yellow
		const temp = Math.random();
		if (temp < 0.6) color.setHSL(0.6, 0.1, 0.7 + Math.random() * 0.3);      // white-blue
		else if (temp < 0.85) color.setHSL(0.15, 0.3, 0.6 + Math.random() * 0.3); // warm
		else color.setHSL(0.6, 0.5, 0.8 + Math.random() * 0.2);                   // blue
		colors[i * 3] = color.r;
		colors[i * 3 + 1] = color.g;
		colors[i * 3 + 2] = color.b;

		// Size variation — a few bright stars, most are dim
		sizes[i] = Math.random() < 0.03 ? 1.5 + Math.random() * 1.5 : 0.3 + Math.random() * 0.6;
	}
</script>

<T.Points frustumCulled={false}>
	<T.BufferGeometry>
		<T.BufferAttribute args={[positions, 3]} attach="attributes.position" />
		<T.BufferAttribute args={[colors, 3]} attach="attributes.color" />
		<T.BufferAttribute args={[sizes, 1]} attach="attributes.size" />
	</T.BufferGeometry>
	<T.PointsMaterial
		size={0.8}
		vertexColors
		sizeAttenuation={false}
		transparent
		opacity={0.85}
		depthWrite={false}
	/>
</T.Points>
