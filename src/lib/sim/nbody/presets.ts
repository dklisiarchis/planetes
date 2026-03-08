/**
 * N-body simulation presets — barrel module.
 * Re-exports shared types/math and registers all systems.
 */

// Re-export everything consumers need from shared
export {
	type BodyVisuals,
	type BodyRenderConfig,
	type StarGlow,
	type WhatIfAction,
	type BlackHoleConfig,
	type SystemConfig,
	G_AU,
	M_EARTH,
	generateFromKeplerian,
} from './systems/shared';

import type { SystemConfig } from './systems/shared';
import { solarSystem } from './systems/solar-system';
import { trappist1 } from './systems/trappist-1';
import { kepler90 } from './systems/kepler-90';
import { proximaCentauri } from './systems/proxima-centauri';
import { sgrAStar } from './systems/sgr-a-star';
import { binaryBlackHoles } from './systems/binary-black-holes';
import { rogueBlackHole } from './systems/rogue-black-hole';

export const SYSTEMS: Record<string, SystemConfig> = {
	'solar-system': solarSystem,
	'trappist-1': trappist1,
	'kepler-90': kepler90,
	'proxima-centauri': proximaCentauri,
	'sgr-a-star': sgrAStar,
	'binary-black-holes': binaryBlackHoles,
	'rogue-black-hole': rogueBlackHole,
};

export type SystemId = keyof typeof SYSTEMS;

export function getSystem(id: string): SystemConfig {
	return SYSTEMS[id] ?? solarSystem;
}
