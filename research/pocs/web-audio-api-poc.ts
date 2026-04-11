// research/pocs/web-audio-api-poc.ts
export class AudioEnhancerPOC {
  private audioContext: AudioContext;
  private source: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode;
  private vocalEQ: BiquadFilterNode;

  constructor(private audioEl: HTMLAudioElement) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Gain (Volume boost)
    this.gainNode = this.audioContext.createGain();

    // Vocal EQ (Peaking filter around 3kHz for speech clarity)
    this.vocalEQ = this.audioContext.createBiquadFilter();
    this.vocalEQ.type = 'peaking';
    this.vocalEQ.frequency.value = 3000;
    this.vocalEQ.Q.value = 1.0;
  }

  public enableEnhancement(gainLevel: number = 2.0, eqBoost: number = 5.0) {
    if (!this.source) {
      this.source = this.audioContext.createMediaElementSource(this.audioEl);
    }

    // Set parameters
    this.gainNode.gain.value = gainLevel;
    this.vocalEQ.gain.value = eqBoost;

    // Connect routing: Source -> EQ -> Gain -> Destination
    this.source.disconnect();
    this.source.connect(this.vocalEQ);
    this.vocalEQ.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
    }
  }

  public disableEnhancement() {
    if (this.source) {
      this.source.disconnect();
      this.vocalEQ.disconnect();
      this.gainNode.disconnect();
      this.source.connect(this.audioContext.destination);
    }
  }
}
