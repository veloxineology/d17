import * as Tone from "tone"

export interface SoundEngineOptions {
  volume?: number
  baseUrl?: string
}

export class SoundEngine {
  private sampler: Tone.Sampler | null = null
  private volume: Tone.Volume
  private sustainPedal = false
  private sustainedNotes: Set<string> = new Set()
  private isLoaded = false

  constructor(options: SoundEngineOptions = {}) {
    this.volume = new Tone.Volume(Tone.gainToDb(options.volume || 0.7)).toDestination()
    this.initializeSampler(options.baseUrl || "/audio/salamander/")
  }

  private async initializeSampler(baseUrl: string) {
    // Create sample map for your specific Salamander Grand Piano files
    const sampleMap: { [key: string]: string } = {}

    // Define the available samples based on your file list
    // Map Tone.js standard note names to your file names
    const sampleMappings = [
      // A notes
      { toneNote: "A0", fileName: "A0" },
      { toneNote: "A1", fileName: "A1" },
      { toneNote: "A2", fileName: "A2" },
      { toneNote: "A3", fileName: "A3" },
      { toneNote: "A4", fileName: "A4" },
      { toneNote: "A5", fileName: "A5" },
      { toneNote: "A6", fileName: "A6" },
      { toneNote: "A7", fileName: "A7" },

      // C notes
      { toneNote: "C1", fileName: "C1" },
      { toneNote: "C2", fileName: "C2" },
      { toneNote: "C3", fileName: "C3" },
      { toneNote: "C4", fileName: "C4" },
      { toneNote: "C5", fileName: "C5" },
      { toneNote: "C6", fileName: "C6" },
      { toneNote: "C7", fileName: "C7" },
      { toneNote: "C8", fileName: "C8" },

      // D# notes (your files use Ds, but Tone.js expects D#)
      { toneNote: "D#1", fileName: "Ds1" },
      { toneNote: "D#2", fileName: "Ds2" },
      { toneNote: "D#3", fileName: "Ds3" },
      { toneNote: "D#4", fileName: "Ds4" },
      { toneNote: "D#5", fileName: "Ds5" },
      { toneNote: "D#6", fileName: "Ds6" },
      { toneNote: "D#7", fileName: "Ds7" },

      // F# notes (your files use Fs, but Tone.js expects F#)
      { toneNote: "F#1", fileName: "Fs1" },
      { toneNote: "F#2", fileName: "Fs2" },
      { toneNote: "F#3", fileName: "Fs3" },
      { toneNote: "F#4", fileName: "Fs4" },
      { toneNote: "F#5", fileName: "Fs5" },
      { toneNote: "F#6", fileName: "Fs6" },
      { toneNote: "F#7", fileName: "Fs7" },
    ]

    // Create the sample map
    for (const mapping of sampleMappings) {
      // Try .mp3 first
      sampleMap[mapping.toneNote] = `${baseUrl}${mapping.fileName}.mp3`
    }

    console.log("Sample map created with standard note names:", Object.keys(sampleMap))

    try {
      this.sampler = new Tone.Sampler({
        urls: sampleMap,
        baseUrl: "", // Empty since we're providing full paths
        onload: () => {
          this.isLoaded = true
          console.log("Piano samples loaded successfully")
          console.log("Loaded samples:", Object.keys(sampleMap))
        },
        onerror: (error) => {
          console.warn("Some piano samples failed to load, trying .ogg fallback:", error)
          this.tryOggFallback(baseUrl, sampleMappings)
        },
      }).connect(this.volume)

      // Timeout fallback in case samples don't load
      setTimeout(() => {
        if (!this.isLoaded) {
          console.warn("Piano samples taking too long to load, trying .ogg fallback")
          this.tryOggFallback(baseUrl, sampleMappings)
        }
      }, 5000)
    } catch (error) {
      console.error("Failed to initialize sampler:", error)
      this.createFallbackSynth()
    }
  }

  private async tryOggFallback(baseUrl: string, sampleMappings: Array<{ toneNote: string; fileName: string }>) {
    const oggSampleMap: { [key: string]: string } = {}

    // Create .ogg sample map
    for (const mapping of sampleMappings) {
      oggSampleMap[mapping.toneNote] = `${baseUrl}${mapping.fileName}.ogg`
    }

    try {
      if (this.sampler) {
        this.sampler.dispose()
      }

      this.sampler = new Tone.Sampler({
        urls: oggSampleMap,
        baseUrl: "",
        onload: () => {
          this.isLoaded = true
          console.log("Piano samples loaded successfully (.ogg fallback)")
        },
        onerror: (error) => {
          console.warn("OGG samples also failed, using fallback synth:", error)
          this.createFallbackSynth()
        },
      }).connect(this.volume)
    } catch (error) {
      console.error("Failed to load .ogg samples:", error)
      this.createFallbackSynth()
    }
  }

  private createFallbackSynth() {
    // Create a basic polyphonic synthesizer as fallback
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "triangle",
      },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1,
      },
    }).connect(this.volume)

    // Replace sampler with synth
    if (this.sampler) {
      this.sampler.dispose()
    }
    this.sampler = synth as any
    this.isLoaded = true
    console.log("Using fallback synthesizer")
  }

  async waitForLoad(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isLoaded) {
        resolve()
        return
      }

      const checkLoaded = () => {
        if (this.isLoaded) {
          resolve()
        } else {
          setTimeout(checkLoaded, 100)
        }
      }
      checkLoaded()
    })
  }

  // Helper function to convert note format
  private convertNoteFormat(note: string): string {
    // Convert from various formats to standard Tone.js format
    if (note.includes("s")) {
      // Convert Ds4 to D#4, Fs4 to F#4, etc.
      return note.replace("s", "#")
    }
    return note
  }

  pressNote(note: string, velocity = 0.8): void {
    if (!this.sampler || !this.isLoaded) return

    try {
      // Ensure Tone.js context is started
      if (Tone.context.state !== "running") {
        Tone.start()
      }

      // Convert note to standard format
      const standardNote = this.convertNoteFormat(note)

      this.sampler.triggerAttack(standardNote, undefined, velocity)

      if (this.sustainPedal) {
        this.sustainedNotes.add(standardNote)
      }
    } catch (error) {
      console.error("Error playing note:", error, "Original note:", note)
    }
  }

  releaseNote(note: string): void {
    if (!this.sampler || !this.isLoaded) return

    try {
      // Convert note to standard format
      const standardNote = this.convertNoteFormat(note)

      if (!this.sustainPedal || !this.sustainedNotes.has(standardNote)) {
        this.sampler.triggerRelease(standardNote)
      }
    } catch (error) {
      console.error("Error releasing note:", error, "Original note:", note)
    }
  }

  setSustainPedal(enabled: boolean): void {
    this.sustainPedal = enabled

    if (!enabled) {
      // Release all sustained notes
      this.sustainedNotes.forEach((note) => {
        if (this.sampler) {
          this.sampler.triggerRelease(note)
        }
      })
      this.sustainedNotes.clear()
    }
  }

  setVolume(volume: number): void {
    this.volume.volume.value = Tone.gainToDb(Math.max(0.01, volume))
  }

  dispose(): void {
    if (this.sampler) {
      this.sampler.dispose()
    }
    this.volume.dispose()
  }
}

export default SoundEngine
