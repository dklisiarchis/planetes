use wasm_bindgen::prelude::*;

/// Flat layout per body: [x, y, z, vx, vy, vz, mass] = 7 floats
const STRIDE: usize = 7;

#[wasm_bindgen]
pub struct NBodyWorld {
    bodies: Vec<f32>,
    n: usize,
    g: f32,
    softening: f32,
    // RK4 scratch buffers (6 derivatives per body: dx,dy,dz,dvx,dvy,dvz)
    k1: Vec<f32>,
    k2: Vec<f32>,
    k3: Vec<f32>,
    k4: Vec<f32>,
    tmp: Vec<f32>,
}

// ── Free functions to avoid borrow-checker issues with &mut self ──

fn compute_derivatives(state: &[f32], n: usize, g: f32, eps2: f32, out: &mut [f32]) {
    for i in 0..n {
        let bi = i * STRIDE;
        let di = i * 6;

        // dx/dt = v
        out[di]     = state[bi + 3];
        out[di + 1] = state[bi + 4];
        out[di + 2] = state[bi + 5];

        // dv/dt = gravitational acceleration
        let mut ax: f32 = 0.0;
        let mut ay: f32 = 0.0;
        let mut az: f32 = 0.0;

        let xi = state[bi];
        let yi = state[bi + 1];
        let zi = state[bi + 2];

        for j in 0..n {
            if i == j { continue; }
            let bj = j * STRIDE;
            let dx = state[bj]     - xi;
            let dy = state[bj + 1] - yi;
            let dz = state[bj + 2] - zi;
            let mj = state[bj + 6];

            let r2 = dx * dx + dy * dy + dz * dz + eps2;
            let inv_r3 = 1.0 / (r2 * r2.sqrt());

            ax += g * mj * dx * inv_r3;
            ay += g * mj * dy * inv_r3;
            az += g * mj * dz * inv_r3;
        }

        out[di + 3] = ax;
        out[di + 4] = ay;
        out[di + 5] = az;
    }
}

fn apply_derivative(state: &[f32], deriv: &[f32], scale: f32, n: usize, out: &mut [f32]) {
    for i in 0..n {
        let bi = i * STRIDE;
        let di = i * 6;
        out[bi]     = state[bi]     + scale * deriv[di];
        out[bi + 1] = state[bi + 1] + scale * deriv[di + 1];
        out[bi + 2] = state[bi + 2] + scale * deriv[di + 2];
        out[bi + 3] = state[bi + 3] + scale * deriv[di + 3];
        out[bi + 4] = state[bi + 4] + scale * deriv[di + 4];
        out[bi + 5] = state[bi + 5] + scale * deriv[di + 5];
        out[bi + 6] = state[bi + 6]; // mass unchanged
    }
}

#[wasm_bindgen]
impl NBodyWorld {
    /// Create from flat Float32Array: [x,y,z,vx,vy,vz,mass] × N
    #[wasm_bindgen(constructor)]
    pub fn new(data: &[f32], g: f32, softening: f32) -> NBodyWorld {
        let n = data.len() / STRIDE;
        let d = n * 6;
        NBodyWorld {
            bodies: data.to_vec(),
            n,
            g,
            softening,
            k1: vec![0.0; d],
            k2: vec![0.0; d],
            k3: vec![0.0; d],
            k4: vec![0.0; d],
            tmp: vec![0.0; data.len()],
        }
    }

    #[wasm_bindgen]
    pub fn set_g(&mut self, g: f32) { self.g = g; }

    #[wasm_bindgen]
    pub fn set_softening(&mut self, s: f32) { self.softening = s; }

    #[wasm_bindgen]
    pub fn body_count(&self) -> usize { self.n }

    /// RK4 integration step
    #[wasm_bindgen]
    pub fn step(&mut self, dt: f32) {
        let n = self.n;
        let g = self.g;
        let eps2 = self.softening * self.softening;

        // k1 = f(bodies)
        compute_derivatives(&self.bodies, n, g, eps2, &mut self.k1);

        // tmp = bodies + 0.5*dt*k1 → k2 = f(tmp)
        apply_derivative(&self.bodies, &self.k1, 0.5 * dt, n, &mut self.tmp);
        compute_derivatives(&self.tmp, n, g, eps2, &mut self.k2);

        // tmp = bodies + 0.5*dt*k2 → k3 = f(tmp)
        apply_derivative(&self.bodies, &self.k2, 0.5 * dt, n, &mut self.tmp);
        compute_derivatives(&self.tmp, n, g, eps2, &mut self.k3);

        // tmp = bodies + dt*k3 → k4 = f(tmp)
        apply_derivative(&self.bodies, &self.k3, dt, n, &mut self.tmp);
        compute_derivatives(&self.tmp, n, g, eps2, &mut self.k4);

        // Combine: bodies += (dt/6)(k1 + 2k2 + 2k3 + k4)
        let dt6 = dt / 6.0;
        for i in 0..n {
            let bi = i * STRIDE;
            let di = i * 6;
            for off in 0..6 {
                self.bodies[bi + off] += dt6 * (
                    self.k1[di + off]
                    + 2.0 * self.k2[di + off]
                    + 2.0 * self.k3[di + off]
                    + self.k4[di + off]
                );
            }
        }
    }

    /// Flat position array: [x0,y0,z0, x1,y1,z1, ...]
    #[wasm_bindgen]
    pub fn get_positions(&self) -> Vec<f32> {
        let mut out = Vec::with_capacity(self.n * 3);
        for i in 0..self.n {
            let bi = i * STRIDE;
            out.push(self.bodies[bi]);
            out.push(self.bodies[bi + 1]);
            out.push(self.bodies[bi + 2]);
        }
        out
    }

    /// Full state for snapshots
    #[wasm_bindgen]
    pub fn get_state(&self) -> Vec<f32> {
        self.bodies.clone()
    }

    /// Restore from snapshot
    #[wasm_bindgen]
    pub fn set_state(&mut self, data: &[f32]) {
        let new_n = data.len() / STRIDE;
        self.n = new_n;
        self.bodies = data.to_vec();
        let d = new_n * 6;
        self.k1.resize(d, 0.0);
        self.k2.resize(d, 0.0);
        self.k3.resize(d, 0.0);
        self.k4.resize(d, 0.0);
        self.tmp.resize(data.len(), 0.0);
    }
}
