# 🌀 Singularity Loop | Quantum Trajectory Correction

![Singularity Loop](https://img.shields.io/badge/Engine-Verlet_Integration-00F0FF?style=for-the-badge&logo=physics)
![React](https://img.shields.io/badge/FrontEnd-React_18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript)

A sophisticated, physics-driven orbital mechanics puzzle game exploring **Wave-Particle Duality** across 40 levels of cosmic evolution.

---

## 🔬 Field Theory & Mechanics

`Singularity Loop` is built on a custom physics core designed to simulate gravitational pull and quantum state transitions in real-time.

### 1. The Physics Core: Verlet Integration
Unlike simple Euler integration, the game uses **Verlet Integration** to maintain numerical stability. This ensures orbits are consistent and the trajectory prediction perfectly matches the resulting flight path.
```typescript
// Position = current + (current - previous) + acceleration * dt^2
const nextX = currentX + (currentX - prevX) + accX * dt * dt;
```

### 2. Dual-State Wave/Particle Logic
The probe exists in a superposition of two states, toggled by the player:
- **🔵 Particle Mode**: Subject to all collisions. Interacts with Newtonian matter (Asteroids). Low thermal signature.
- **🟣 Wave Mode**: Non-local state. Phases through Asteroid matrices and ignores Observer Sensors. High entropy (heat) accumulation.

### 3. Progressive Entropy (Thermal Epoch)
Starting at level 31, the environment becomes thermally unstable. Excessive Wave-shifting generates heat. Players must utilize **Cold Sinks** (cooling zones) to regulate the probe's internal state.

---

## 🛰️ Level Generation & Logic

### Deterministic Proceduralism
Levels are generated using a custom **Linear Congruential Generator (LCG)**. This ensures that every level (1–40) is repeatable and identical for all players based on the level seed.

### Passability Guarantee (The Solver)
Every level is passed through an internal **AI Trajectory Solver** during generation.
1. The generator seeds a sector with up to 5 obstacles.
2. The solver brute-forces a 72-angle sweep with varying launch velocities.
3. If no "Golden Path" is found, the sector is discarded and regenerated.
**Result: 0% unsolvable levels.**

---

## 🛠️ Developer Interface

Access the **Temporal Bridge** for rapid debugging and level analysis.

- **Level Jump**: Instant access to any epoch via the top-left dev input.
- **Golden Path Visualization**: (Dev Mode only) A subtle red dashed line shows the solver's calculated solution.
- **Physics Console**: Detailed trajectory prediction with gravity-weighting.

---

## 🌑 Cosmological Catalog

| Object | Phenomenon | Interaction |
| :--- | :--- | :--- |
| **Gravity Well** | Spacetime Curvature | Force scales inversely with distance squared $(1/d^2)$. |
| **Quantum Sensor** | Observed Decoherence | Destroys Particles on sight. Does not observe Waves. |
| **Tunnels** | Non-Local Coupling | Instantly transports state across the coordinate grid. |
| **Asteroids** | Matter Matrix | Impermeable to Particles. Phased by Waves. |
| **Cold Sinks** | Entropy Drain | Rapidly dissipates heat within its radius. |

---

## 🚀 Technical Setup

```bash
# Install quantum dependencies
npm install

# Initialize local simulation
npm run dev

# Compile for production deployment
npm run build
```

---

> *"The observer influences the observed. Toggling your state is the only path to the Singularity."* 
