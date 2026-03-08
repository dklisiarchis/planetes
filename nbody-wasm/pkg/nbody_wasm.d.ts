/* tslint:disable */
/* eslint-disable */

export class NBodyWorld {
    free(): void;
    [Symbol.dispose](): void;
    body_count(): number;
    /**
     * Flat position array: [x0,y0,z0, x1,y1,z1, ...]
     */
    get_positions(): Float32Array;
    /**
     * Full state for snapshots
     */
    get_state(): Float32Array;
    /**
     * Create from flat Float32Array: [x,y,z,vx,vy,vz,mass] × N
     */
    constructor(data: Float32Array, g: number, softening: number);
    set_g(g: number): void;
    set_softening(s: number): void;
    /**
     * Restore from snapshot
     */
    set_state(data: Float32Array): void;
    /**
     * RK4 integration step
     */
    step(dt: number): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_nbodyworld_free: (a: number, b: number) => void;
    readonly nbodyworld_body_count: (a: number) => number;
    readonly nbodyworld_get_positions: (a: number) => [number, number];
    readonly nbodyworld_get_state: (a: number) => [number, number];
    readonly nbodyworld_new: (a: number, b: number, c: number, d: number) => number;
    readonly nbodyworld_set_g: (a: number, b: number) => void;
    readonly nbodyworld_set_softening: (a: number, b: number) => void;
    readonly nbodyworld_set_state: (a: number, b: number, c: number) => void;
    readonly nbodyworld_step: (a: number, b: number) => void;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
