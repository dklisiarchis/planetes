/**
 * Canvas Portal — stores the current scene component so the persistent
 * <Canvas> in +layout.svelte can render route-specific 3D content
 * without remounting (preventing WebGL context loss on navigation).
 */
import type { Component } from 'svelte';

export type PortalMode = 'default' | 'space';

export const portal = $state<{ scene: Component | null; mode: PortalMode }>({
	scene: null,
	mode: 'default'
});

/** Camera follow target — when set, OrbitControls orbits around this point */
export const cameraFollow = $state<{ target: [number, number, number] | null }>({
	target: null
});
