import * as THREE from 'three';
import {
  PartsCatalog,
  createCommandNoseCap,
  createSideBoostersAddon,
  createGridFinsAddon,
  createPlasmaWingsAddon
} from './PartsCatalog.js';
import { TextureGenerator } from '../graphics/TextureGenerator.js';

// Recursive WebGL disposal helper to prevent GPU VRAM memory leaks
function disposeHierarchy(obj) {
  if (!obj) return;
  obj.traverse(child => {
    if (child.userData?.isExhaust) return; // Retain persistent exhaust shader
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => {
          m.dispose();
        });
      } else {
        child.material.dispose();
      }
    }
  });
}

export class RocketBuilder {
  constructor(scene) {
    this.scene = scene;
    this.rocketGroup = new THREE.Group();
    this.rocketGroup.name = 'rocketAssemblyGroup';
    this.scene.add(this.rocketGroup);

    // Cached procedural texture references
    this._cachedTextures = {};

    // Active Equipped Upgrade Slots
    this.equipped = {
      tank: 'tank_medium',
      engine: 'engine_raptor',
      sideBoosters: false,
      gridFins: false,
      plasmaWings: false
    };

    this.rebuild3DRocket();
  }

  // Set/Replace an upgrade slot directly
  equipUpgrade(partId) {
    const spec = PartsCatalog[partId];
    if (!spec) return false;

    if (spec.slot === 'tank') {
      this.equipped.tank = spec.id;
    } else if (spec.slot === 'engine') {
      this.equipped.engine = spec.id;
    } else if (spec.slot === 'addon') {
      if (spec.addonType === 'sideBoosters') {
        this.equipped.sideBoosters = !this.equipped.sideBoosters;
      } else if (spec.addonType === 'gridFins') {
        this.equipped.gridFins = !this.equipped.gridFins;
      } else if (spec.addonType === 'plasmaWings') {
        this.equipped.plasmaWings = !this.equipped.plasmaWings;
      }
    }

    this.rebuild3DRocket();
    return true;
  }

  // Unequip upgrade slot cleanly (Fixes crash when unequipped from UI/staging list)
  unequipSlot(slotKey) {
    if (slotKey === 'tank') {
      this.equipped.tank = 'tank_small';
    } else if (slotKey === 'engine') {
      this.equipped.engine = 'engine_merlin';
    } else if (slotKey === 'booster') {
      this.equipped.sideBoosters = false;
      this.equipped.gridFins = false;
      this.equipped.plasmaWings = false;
    } else if (slotKey === 'sideBoosters' || slotKey === 'booster_side_srb') {
      this.equipped.sideBoosters = false;
    } else if (slotKey === 'gridFins' || slotKey === 'booster_grid_fins') {
      this.equipped.gridFins = false;
    } else if (slotKey === 'plasmaWings' || slotKey === 'booster_quantum_wings') {
      this.equipped.plasmaWings = false;
    }

    this.rebuild3DRocket();
  }

  isEquipped(partId) {
    const spec = PartsCatalog[partId];
    if (!spec) return false;
    if (spec.slot === 'tank') return this.equipped.tank === spec.id;
    if (spec.slot === 'engine') return this.equipped.engine === spec.id;
    if (spec.slot === 'addon') {
      if (spec.addonType === 'sideBoosters') return this.equipped.sideBoosters;
      if (spec.addonType === 'gridFins') return this.equipped.gridFins;
      if (spec.addonType === 'plasmaWings') return this.equipped.plasmaWings;
    }
    return false;
  }

  getEquippedPart(slotType) {
    if (slotType === 'tank') return PartsCatalog[this.equipped.tank];
    if (slotType === 'engine') return PartsCatalog[this.equipped.engine];
    if (slotType === 'booster') {
      if (this.equipped.sideBoosters) return PartsCatalog.booster_side_srb;
      if (this.equipped.gridFins) return PartsCatalog.booster_grid_fins;
      if (this.equipped.plasmaWings) return PartsCatalog.booster_quantum_wings;
    }
    return null;
  }

  clear() {
    this.equipped = {
      tank: 'tank_small',
      engine: 'engine_merlin',
      sideBoosters: false,
      gridFins: false,
      plasmaWings: false
    };
    this.rebuild3DRocket();
  }

  loadAssembly(partsArray) {
    this.equipped = {
      tank: 'tank_medium',
      engine: 'engine_raptor',
      sideBoosters: false,
      gridFins: false,
      plasmaWings: false
    };

    partsArray.forEach(pId => {
      const spec = PartsCatalog[pId];
      if (spec) {
        if (spec.slot === 'tank') this.equipped.tank = spec.id;
        if (spec.slot === 'engine') this.equipped.engine = spec.id;
        if (spec.slot === 'addon') {
          if (spec.addonType === 'sideBoosters') this.equipped.sideBoosters = true;
          if (spec.addonType === 'gridFins') this.equipped.gridFins = true;
          if (spec.addonType === 'plasmaWings') this.equipped.plasmaWings = true;
        }
      }
    });

    this.rebuild3DRocket();
  }

  // Get active array for physics flight engine
  getAssembly() {
    const list = [];
    const tankSpec = PartsCatalog[this.equipped.tank] || PartsCatalog.tank_small;
    const engineSpec = PartsCatalog[this.equipped.engine] || PartsCatalog.engine_merlin;

    list.push(tankSpec);
    list.push(engineSpec);

    if (this.equipped.sideBoosters) {
      list.push(PartsCatalog.booster_side_srb);
    }
    if (this.equipped.gridFins) {
      list.push(PartsCatalog.booster_grid_fins);
    }
    if (this.equipped.plasmaWings) {
      list.push(PartsCatalog.booster_quantum_wings);
    }

    return list;
  }

  getStats() {
    let totalMass = 0;
    let totalThrust = 0;
    let totalFuel = 0;
    let maxIsp = 0;

    const tankSpec = PartsCatalog[this.equipped.tank] || PartsCatalog.tank_small;
    const engineSpec = PartsCatalog[this.equipped.engine] || PartsCatalog.engine_merlin;

    totalMass += tankSpec.mass || 0;
    totalFuel += tankSpec.fuelCapacity || 0;

    totalMass += engineSpec.mass || 0;
    totalThrust += engineSpec.thrust || 0;
    maxIsp = engineSpec.isp || 300;

    if (this.equipped.sideBoosters) {
      const srb = PartsCatalog.booster_side_srb;
      totalMass += srb.mass || 6;
      totalThrust += srb.thrust || 2200;
      totalFuel += srb.fuelCapacity || 80;
    }

    if (this.equipped.gridFins) {
      totalMass += 0.8;
    }

    if (this.equipped.plasmaWings) {
      totalMass += 1.5;
      totalThrust += 800;
    }

    totalMass += totalFuel;

    const g0 = 9.81;
    const twr = totalMass > 0 ? totalThrust / (totalMass * g0) : 0;
    const dryMass = Math.max(1, totalMass - totalFuel);
    const deltaV = maxIsp > 0 ? maxIsp * g0 * Math.log(totalMass / dryMass) : 0;

    return {
      mass: totalMass.toFixed(1),
      thrust: totalThrust.toFixed(0),
      fuel: totalFuel.toFixed(0),
      twr: twr.toFixed(2),
      deltaV: deltaV.toFixed(0)
    };
  }

  // Memory-Safe 3D Rocket Rebuild (Properly disposes VRAM geometries/materials)
  rebuild3DRocket() {
    const exhaust = this.rocketGroup.children.find(c => c.userData?.isExhaust);

    // Recursively dispose old GPU geometry/material/texture memory
    while (this.rocketGroup.children.length > 0) {
      const child = this.rocketGroup.children[0];
      this.rocketGroup.remove(child);
      if (!child.userData?.isExhaust) {
        disposeHierarchy(child);
      }
    }

    const tankSpec = PartsCatalog[this.equipped.tank] || PartsCatalog.tank_small;
    const engineSpec = PartsCatalog[this.equipped.engine] || PartsCatalog.engine_merlin;

    const tankRadius = tankSpec.radius || 1.2;
    const tankHeight = tankSpec.height || 5.5;

    const engineHeight = engineSpec.height || 2.6;

    // 1. Engine at bottom (Y = 0 to engineHeight)
    const engineMeshGroup = engineSpec.createMesh();
    engineMeshGroup.position.y = engineHeight / 2;
    this.rocketGroup.add(engineMeshGroup);

    // 2. Core Tank above engine (Y = engineHeight to engineHeight + tankHeight)
    const tankMeshGroup = tankSpec.createMesh();
    tankMeshGroup.position.y = engineHeight + tankHeight / 2;
    this.rocketGroup.add(tankMeshGroup);

    // 3. Command Nose Cap on top of tank
    const noseHeight = Math.max(2.2, tankRadius * 2.2);
    const noseCap = createCommandNoseCap(tankRadius, noseHeight);
    noseCap.position.y = engineHeight + tankHeight;
    this.rocketGroup.add(noseCap);

    // 4. Attach Side Boosters if equipped
    if (this.equipped.sideBoosters) {
      const sideBoosters = createSideBoostersAddon(tankRadius, tankHeight);
      sideBoosters.position.y = engineHeight + tankHeight / 2;
      this.rocketGroup.add(sideBoosters);
    }

    // 5. Attach Titanium Grid Fins if equipped
    if (this.equipped.gridFins) {
      const gridFins = createGridFinsAddon(tankRadius, engineHeight + tankHeight * 0.85);
      this.rocketGroup.add(gridFins);
    }

    // 6. Attach Plasma Shield Wings if equipped
    if (this.equipped.plasmaWings) {
      const plasmaWings = createPlasmaWingsAddon(tankRadius, engineHeight + tankHeight * 0.5);
      this.rocketGroup.add(plasmaWings);
    }

    // Re-attach exhaust at rocket base (Y = 0)
    if (exhaust) {
      this.rocketGroup.add(exhaust);
    }

    this.rocketGroup.position.set(0, 0, 0);
  }

  // Apply visual upgrade state transitions cleanly with texture caching
  applyVisualUpgrades(career) {
    if (!career) return;

    const hasCarbon = career.hasTech('carbon');
    const hasHexShield = career.hasTech('hex_heatshield') || career.hasTech('hyper_shield');
    const hasQuantum = career.hasTech('quantum') || career.hasTech('quantum_matrix');
    const hasAntimatter = career.hasTech('antimatter') || career.hasTech('antimatter_armor');

    if (hasCarbon && !this._cachedTextures.carbon) {
      this._cachedTextures.carbon = TextureGenerator.createCarbonFiberTexture();
    }
    if (hasHexShield && !this._cachedTextures.hexShield) {
      this._cachedTextures.hexShield = TextureGenerator.createHexHeatShieldTexture();
    }

    this.rocketGroup.traverse(child => {
      if (child.isMesh) {
        if (hasCarbon && child.name === 'tankBody') {
          child.material.map = this._cachedTextures.carbon;
          child.material.color.setHex(0x1a1d24);
          child.material.needsUpdate = true;
        }

        if (hasHexShield && child.name === 'heatShield') {
          child.material.map = this._cachedTextures.hexShield;
          child.material.color.setHex(0x222733);
          child.material.needsUpdate = true;
        }
      }

      if (hasQuantum && child.name === 'quantumLattice') {
        child.visible = true;
      }

      if (hasAntimatter && child.name === 'antimatterRing') {
        child.material.emissiveIntensity = 3.0;
        child.material.needsUpdate = true;
      }
    });
  }
}
