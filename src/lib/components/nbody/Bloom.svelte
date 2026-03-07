<script lang="ts">
	import { useThrelte, useTask } from '@threlte/core';
	import {
		EffectComposer,
		RenderPass,
		EffectPass,
		BloomEffect
	} from 'postprocessing';

	const { scene, renderer, camera, size, autoRender, renderStage } = useThrelte();

	// Disable Threlte's built-in rendering — we take over via the composer
	autoRender.set(false);

	const composer = new EffectComposer(renderer);
	const renderPass = new RenderPass(scene, camera.current);
	const bloom = new BloomEffect({
		intensity: 1.5,
		luminanceThreshold: 0.55,
		luminanceSmoothing: 0.4,
		mipmapBlur: true
	});
	const effectPass = new EffectPass(camera.current, bloom);

	composer.addPass(renderPass);
	composer.addPass(effectPass);

	// React to size changes
	$effect(() => {
		const s = size.current;
		composer.setSize(s.width, s.height);
	});

	// React to camera changes
	$effect(() => {
		const cam = camera.current;
		renderPass.mainCamera = cam;
		effectPass.mainCamera = cam;
	});

	// Replace Threlte's render loop
	useTask(
		(delta) => {
			composer.render(delta);
		},
		{ stage: renderStage, autoInvalidate: false }
	);
</script>
