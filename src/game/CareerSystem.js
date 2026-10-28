export class CareerSystem {
  constructor() {
    this.credits = 150000;
    this.secretBank = 500000; // Secret background compound interest account
    this.unlockedTech = new Set(['kerolox', 'basic_capsule']);
    this.completedMilestones = new Set();
    this.totalLaunches = 0;
    this.maxAltitude = 0;
    this.maxVelocity = 0;

    this.techTree = [
      { id: 'hydrolox', name: 'Cryogenic Hydrolox Tech', cost: 45000, desc: 'Unlocks Raptor Vacuum Engine & Heavy Hydrolox Tank.' },
      { id: 'carbon', name: 'Carbon Fiber Weave Hull', cost: 75000, desc: 'Transforms rocket tanks into woven carbon fiber with silver stringers.' },
      { id: 'hex_heatshield', name: 'Hexagonal Ceramic Shield', cost: 150000, desc: 'Equips command pods with ceramic heat shield tiles for atmospheric re-entry.' },
      { id: 'fusion', name: 'Helion D-He3 Fusion Drive', cost: 350000, desc: 'Unlocks Helion Fusion Engine & Magnetic Containment Coils.' },
      { id: 'quantum_matrix', name: 'Quantum Energy Matrix', cost: 500000, desc: 'Unlocks Quantum Core Tank & cyan energy matrix lattice lines.' },
      { id: 'antimatter_armor', name: 'Dark Matter Armor Plating', cost: 600000, desc: 'Equips hull with dark matter armor & neon violet antimatter coils.' },
      { id: 'singularity_drive', name: 'Dark Energy Singularity Drive', cost: 1000000, desc: 'Unlocks Singularity Engine & Warp Core Payload for interstellar travel.' }
    ];

    this.milestones = [
      { id: 'karman', name: 'Kármán Line (100km)', targetAlt: 100000, reward: 50000 },
      { id: 'orbit', name: 'Earth Orbit (400km)', targetAlt: 400000, reward: 150000 },
      { id: 'moon', name: 'Lunar Flyby (384,000km)', targetAlt: 384000000, reward: 500000 },
      { id: 'mars', name: 'Mars Orbit (225M km)', targetAlt: 225000000000, reward: 2000000 },
      { id: 'jupiter_slingshot', name: 'Jupiter Slingshot (778M km)', targetAlt: 778000000000, reward: 5000000 },
      { id: 'interstellar', name: 'Galactic Escape (Solar System Exit)', targetAlt: 10000000000000, reward: 20000000 }
    ];
  }

  addCredits(amount) {
    this.credits += amount;
  }

  spendCredits(amount) {
    if (this.credits >= amount) {
      this.credits -= amount;
      return true;
    }
    return false;
  }

  hasTech(techId) {
    return this.unlockedTech.has(techId);
  }

  unlockTech(techId) {
    const node = this.techTree.find((t) => t.id === techId);
    if (!node) return false;
    if (this.spendCredits(node.cost)) {
      this.unlockedTech.add(techId);
      return true;
    }
    return false;
  }

  unlockAllTech() {
    this.techTree.forEach(t => this.unlockedTech.add(t.id));
  }

  recordLaunch(peakAltitude, topSpeed) {
    this.totalLaunches++;
    this.maxAltitude = Math.max(this.maxAltitude, peakAltitude);
    this.maxVelocity = Math.max(this.maxVelocity, topSpeed);

    // 1. Altitude Payout with +11.67% bonus increase per launch
    const basePayout = Math.floor(peakAltitude * 0.45 * 1.1167);
    this.addCredits(basePayout);

    // 2. Secret Bank Compound Growth (+11.67% interest + 1.3x unspent credit bonus)
    const unspentBonus = Math.floor(this.credits * 0.1167 * 1.3);
    this.secretBank = Math.floor((this.secretBank + unspentBonus) * 1.1167);
    
    // Silent addition of 1.3 bank bonus on unspent credits upon next launch
    this.credits += unspentBonus;

    // 3. Milestone Rewards
    const newMilestones = [];
    this.milestones.forEach((m) => {
      if (!this.completedMilestones.has(m.id) && peakAltitude >= m.targetAlt) {
        this.completedMilestones.add(m.id);
        this.addCredits(m.reward);
        newMilestones.push(m);
      }
    });

    return { payout: basePayout + unspentBonus, newMilestones };
  }

  triggerAdminBankBonus() {
    // Manually trigger +11.67% bank account bonus
    const creditBonus = Math.floor(this.credits * 0.1167);
    const bankBonus = Math.floor(this.secretBank * 0.1167);
    this.credits += creditBonus;
    this.secretBank += bankBonus;
    return { creditBonus, bankBonus };
  }

  recordGravityAssist(bounty = 0, planetName = '') {
    if (bounty > 0) {
      this.addCredits(bounty);
    }
    return bounty;
  }

  getSecretBankBalance() {
    return this.secretBank;
  }
}
