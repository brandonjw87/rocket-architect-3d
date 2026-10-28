export class SoundSynth {
  constructor() {
    this.ctx = null;
    this.engineGain = null;
    this.engineOsc = null;
    this.isMuted = false;
    this.isAudioStarted = false;
  }

  init() {
    if (this.isAudioStarted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.isAudioStarted = true;

      // Engine Rumble Noise Synth
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);
      whiteNoise.start();
    } catch (e) {
      console.warn('Web Audio init failed:', e);
    }
  }

  initAudio() {
    this.init();
  }

  playLaunchBeep() {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  }

  playLaunchSound() {
    this.playLaunchBeep();
  }

  playAssistSound() {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.50, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {}
  }

  setEngineThrottle(throttle, isFiring = true) {
    if (!this.engineGain || this.isMuted) return;
    const targetGain = isFiring ? Math.max(0.05, throttle * 0.4) : 0;
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
  }

  updateEngineSound(throttle, alt = 0) {
    this.setEngineThrottle(throttle, throttle > 0.01);
  }

  stopEngineSound() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}
