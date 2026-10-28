import * as THREE from 'three';

export class FlightEngine {
  constructor(scene) {
    this.scene = scene;
    this.state = 'PAD'; // 'PAD' | 'FLIGHT' | 'APOGEE_PEAK'

    this.altitude = 0;
    this.horizontalDistance = 0;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.maxAltitude = 0;
    this.maxVelocity = 0;
    this.throttle = 1.0;
    this.timeWarp = 1.0;
    this.pitchAngle = 0; // 0 radians = straight up (vertical), Math.PI/4 = 45 deg gravity turn

    // Autopilot AI Mode: 'MANUAL' | 'AUTOPILOT_SINGLE' | 'AUTOPILOT_LOOP'
    this.autopilotMode = 'MANUAL';

    // Per-stage fuel tracking
    this.activeStages = []; // { type, mass, thrust, isp, fuelCapacity, currentFuel, name }
    this.totalInitialFuel = 0;
    this.targetRocketGroup = null;

    // Scale: 1 Three.js unit = 100 meters
    this.scaleFactor = 100;
  }

  setThrottle(val) {
    this.throttle = Math.max(0, Math.min(1, val));
  }

  setAutopilotMode(mode) {
    this.autopilotMode = mode;
  }

  startLaunch(assembly = [], rocketGroup = null) {
    if (this.state === 'FLIGHT') return;

    // Deep copy assembly for fuel tracking
    this.activeStages = assembly.map(part => ({
      type: part.type,
      name: part.name,
      mass: part.mass || 0,
      thrust: part.thrust || 0,
      isp: part.isp || 0,
      fuelCapacity: part.fuelCapacity || 0,
      currentFuel: part.fuelCapacity || 0,
      fuelConsumption: part.fuelConsumption || 0
    }));

    // Calculate total initial fuel across all fuel-carrying parts (tanks & boosters)
    this.totalInitialFuel = 0;
    this.activeStages.forEach(s => {
      if (s.fuelCapacity > 0) this.totalInitialFuel += s.fuelCapacity;
    });
    if (this.totalInitialFuel <= 0) this.totalInitialFuel = 1;

    this.state = 'FLIGHT';
    this.altitude = 0;
    this.horizontalDistance = 0;
    this.velocity.set(0, 0, 0);
    this.maxAltitude = 0;
    this.maxVelocity = 0;
    this.pitchAngle = 0;

    if (rocketGroup) this.targetRocketGroup = rocketGroup;
  }

  resetToPad(rocketGroup = null) {
    this.state = 'PAD';
    this.altitude = 0;
    this.horizontalDistance = 0;
    this.velocity.set(0, 0, 0);
    this.maxAltitude = 0;
    this.maxVelocity = 0;
    this.pitchAngle = 0;
    this.activeStages = [];

    const grp = rocketGroup || this.targetRocketGroup;
    if (grp) {
      grp.position.set(0, 0, 0);
      grp.rotation.set(0, 0, 0);
    }
  }

  update(delta, rocketGroup = null) {
    const grp = rocketGroup || this.targetRocketGroup;
    const totalDt = delta * this.timeWarp;

    if (this.state !== 'FLIGHT') {
      return {
        state: this.state,
        altitude: this.altitude,
        velocity: 0,
        fuelPercent: 100,
        airDensity: 1.225,
        throttle: this.throttle,
        isPeakReached: false,
        pitchAngle: 0,
        currentStage: 0,
        totalStages: 0
      };
    }

    // === AUTOPILOT AI GUIDANCE SYSTEM ===
    if (this.autopilotMode !== 'MANUAL') {
      // 1. Dynamic Throttle AI (Full thrust on liftoff, optimal TWR adjustment during dense atmosphere)
      if (this.altitude < 2000) {
        this.throttle = 1.0;
      } else if (this.altitude < 12000) {
        // Maintain optimal TWR to limit max drag loss
        this.throttle = 0.95;
      } else {
        // Full 100% vacuum thrust
        this.throttle = 1.0;
      }

      // 2. Gravity Turn Pitch Guidance AI
      // Starts vertical (0°), smoothly tilts up to 45° (0.785 rad) between 5km and 45km altitude
      if (this.altitude > 5000) {
        const turnProgress = Math.min(1.0, (this.altitude - 5000) / 40000);
        this.pitchAngle = turnProgress * 0.785; // up to 45 deg tilt
      } else {
        this.pitchAngle = 0;
      }
    }

    // === Physics Integration Sub-stepping for 60 FPS accuracy at high Time Warp (up to 42x) ===
    const maxSubStep = 0.02; // max 20ms physics step for bulletproof stability
    let remainingDt = totalDt;
    let currentTotalFuel = 0;
    let airDensity = 1.225;

    while (remainingDt > 0) {
      const dt = Math.min(remainingDt, maxSubStep);
      remainingDt -= dt;

      // Calculate totals from active stages
      let totalMass = 0;
      let totalThrust = 0;
      currentTotalFuel = 0;
      let hasFuel = false;

      for (let i = 0; i < this.activeStages.length; i++) {
        const stage = this.activeStages[i];
        totalMass += stage.mass || 0;
        if (stage.fuelCapacity > 0) {
          totalMass += stage.currentFuel;
          currentTotalFuel += stage.currentFuel;
          if (stage.currentFuel > 0) hasFuel = true;
        }
      }

      for (let i = 0; i < this.activeStages.length; i++) {
        const stage = this.activeStages[i];
        if (stage.thrust > 0 && hasFuel) {
          totalThrust += stage.thrust;
        }
      }

      if (totalMass <= 0) totalMass = 1;

      // === Burn fuel & Auto-Staging ===
      if (this.throttle > 0 && hasFuel) {
        let bottomFuelStage = null;
        for (let i = this.activeStages.length - 1; i >= 0; i--) {
          if (this.activeStages[i].fuelCapacity > 0 && this.activeStages[i].currentFuel > 0) {
            bottomFuelStage = this.activeStages[i];
            break;
          }
        }

        if (bottomFuelStage) {
          const burnRate = (totalThrust / 400) * this.throttle;
          bottomFuelStage.currentFuel -= burnRate * dt;

          if (bottomFuelStage.currentFuel <= 0) {
            bottomFuelStage.currentFuel = 0;

            // AUTO-STAGING: Decouple bottom stage
            const stageIndex = this.activeStages.indexOf(bottomFuelStage);
            if (stageIndex !== -1) {
              this.activeStages.splice(stageIndex, 1);
            }
          }
        }
      }

      // Recalculate fuel after burn
      currentTotalFuel = 0;
      for (let i = 0; i < this.activeStages.length; i++) {
        const s = this.activeStages[i];
        if (s.fuelCapacity > 0) currentTotalFuel += s.currentFuel;
      }

      // === Physics Integration ===
      const earthRadius = 6371000;
      const gravity = 9.81 * Math.pow(earthRadius / (earthRadius + this.altitude), 2);
      airDensity = 1.225 * Math.exp(-this.altitude / 8500);

      const thrustForce = currentTotalFuel > 0 ? totalThrust * this.throttle : 0;
      const thrustAccel = thrustForce / totalMass;

      const dragCoeff = 0.28;
      const crossSection = 8.0;
      const dragForce = 0.5 * dragCoeff * crossSection * airDensity * this.velocity.y * Math.abs(this.velocity.y);
      const dragAccel = dragForce / (totalMass * 1000);

      // Vertical vs Horizontal vector components based on gravity turn pitch angle
      const cosPitch = Math.cos(this.pitchAngle);
      const sinPitch = Math.sin(this.pitchAngle);
      const verticalThrustAccel = thrustAccel * cosPitch;
      const horizontalThrustAccel = thrustAccel * sinPitch;

      const netAccelY = verticalThrustAccel - gravity - (this.velocity.y > 0 ? dragAccel : -dragAccel);

      this.velocity.y += netAccelY * dt;
      this.velocity.x += horizontalThrustAccel * dt;

      this.altitude += this.velocity.y * dt;
      this.horizontalDistance += this.velocity.x * dt;

      if (this.altitude < 0) {
        this.altitude = 0;
        if (this.velocity.y < 0) this.velocity.y = 0;
      }

      this.maxAltitude = Math.max(this.maxAltitude, this.altitude);
      this.maxVelocity = Math.max(this.maxVelocity, Math.sqrt(this.velocity.y * this.velocity.y + this.velocity.x * this.velocity.x));
    }

    // Update 3D position & Pitch Rotation (1 unit = 100m)
    if (grp) {
      grp.position.y = this.altitude / this.scaleFactor;
      grp.position.x = this.horizontalDistance / (this.scaleFactor * 10);
      grp.rotation.z = -this.pitchAngle; // Gravity turn tilt
    }

    const fuelPercent = (currentTotalFuel / this.totalInitialFuel) * 100;

    // === Apogee Peak Detection ===
    let isPeakReached = false;
    if (currentTotalFuel <= 0 && this.maxAltitude > 50) {
      if (this.velocity.y <= 2 || this.altitude < this.maxAltitude - 2) {
        this.state = 'APOGEE_PEAK';
        isPeakReached = true;
      }
    }

    let activeFuelContainers = 0;
    for (let i = 0; i < this.activeStages.length; i++) {
      if (this.activeStages[i].fuelCapacity > 0) activeFuelContainers++;
    }

    const currentSpeed = Math.sqrt(this.velocity.y * this.velocity.y + this.velocity.x * this.velocity.x);

    return {
      state: this.state,
      altitude: this.altitude,
      velocity: currentSpeed,
      fuelPercent: Math.max(0, fuelPercent),
      airDensity: airDensity,
      throttle: this.throttle,
      pitchAngle: this.pitchAngle,
      isPeakReached: isPeakReached,
      currentStage: activeFuelContainers,
      totalStages: this.activeStages.length
    };
  }
}
