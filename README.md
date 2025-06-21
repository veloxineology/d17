# 🎺 D17 - Interactive Piano & MIDI Player

**"Where Notes Fall in Love"**

A beautiful, feature-rich web-based piano application built with Next.js, featuring realistic piano sounds, MIDI playback with stunning visualizations, and an intuitive user interface that works seamlessly across all devices.

![D17 Piano App](https://img.shields.io/badge/D17-Piano%20App-blue?style=for-the-badge\&logo=music)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge\&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge\&logo=typescript)
![Tone.js](https://img.shields.io/badge/Tone.js-Audio-green?style=for-the-badge)

---

## ✨ Features

### 🎵 Realistic Piano Experience

* **High-Quality Audio Samples**: Uses Salamander Grand Piano samples for authentic sound
* **88-Key Full Piano**: Complete piano range from A0 to C8
* **Velocity Sensitivity**: Dynamic volume based on key press intensity
* **Sustain Pedal**: Toggle or hold space bar for sustained notes
* **Multiple Octaves**: Scrollable piano with 9 full octaves

### 🎼 Advanced MIDI Support

* **MIDI File Upload**: Support for .mid and .midi files
* **Real-Time Visualization**: Beautiful scrolling piano roll with note tracking
* **Playback Controls**: Play, pause, stop with progress tracking
* **Note Highlighting**: Visual feedback showing currently playing notes
* **Multiple Track Support**: Handles complex MIDI files with multiple instruments

### 📱 Cross-Platform Design

* **Responsive UI**: Optimized for desktop, tablet, and mobile
* **Touch-Friendly**: Large buttons and touch targets for mobile users
* **Collapsible Sections**: Space-efficient mobile interface
* **Progressive Web App**: Install on any device for native-like experience

### 🎨 Beautiful Interface

* **Modern Dark Theme**: Sleek slate color scheme with blue accents
* **Smooth Animations**: Fluid transitions and visual feedback
* **Interactive Piano Keys**: Realistic key press animations
* **Real-Time Progress**: Live progress bars and time displays

### 🎯 Smart Features

* **Sample MIDI Library**: Curated collection of classical pieces
* **Keyboard Shortcuts**: QWERTY keyboard mapping for piano keys
* **Audio Engine**: Powered by Tone.js for professional audio processing
* **Error Handling**: Graceful fallbacks and user-friendly error messages

---

## 🚀 Quick Start

### Prerequisites

* Node.js 18+
* npm or yarn
* Modern web browser with Web Audio API support

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/d17-piano-app.git
cd d17-piano-app
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Set up audio samples** (See [Audio Setup](#audio-setup) below)

4. **Run the development server**

```bash
npm run dev
# or
yarn dev
```

5. **Open your browser**
   Navigate to `http://localhost:3000`

---

## 🎵 Audio Setup

### Salamander Grand Piano Samples

The app uses high-quality Salamander Grand Piano samples for realistic sound. You need to provide these samples yourself.

#### 📁 Folder Structure

```
public/
└── audio/
    └── salamander/
        ├── A0.mp3
        ├── A0.ogg
        ├── C1.mp3
        ├── C1.ogg
        ├── ...
        └── Fs7.ogg
```

#### 🎼 Sample Naming Convention

* **Natural Notes**: `A0.mp3`, `C4.mp3`, etc.
* **Sharp Notes**: Use 's' instead of '#' → `Ds4.mp3`, `Fs4.mp3`
* **Dual Format**: Provide both .mp3 and .ogg for compatibility
* **Range**: A0 to C8 (88-key range)

---

## 🎼 MIDI Sample Library

### Setting Up Sample MIDIs

1. **Folder structure**:

```
public/
└── midi-samples/
    ├── manifest.json
    ├── your-song-1.mid
    └── example-piece.midi
```

2. **Create `manifest.json`**

```json
{
  "files": [
    "your-song-1.mid",
    "example-piece.midi"
  ]
}
```

3. **Naming tips**

* Use descriptive names like `moonlight-sonata.mid`
* Avoid spaces, use hyphens or underscores

---

## 🎮 How to Use

### 🎺 Playing the Piano

#### Mouse/Touch Controls

* Click/Tap keys to play
* Hold for sustained notes
* Drag to scroll octaves

#### Keyboard Controls

* White Keys: A–L
* Black Keys: W, E, T, Y, U, O, P
* Sustain Pedal: Space bar
* Octave shift: J, K, L, ;

#### Advanced Controls

* Volume Slider
* Base Octave Selector
* Sustain Toggle
* Test Chord Button

### 🎵 MIDI Playback

#### Loading MIDI Files

* Choose from the sample library
* Or upload your own `.mid`/`.midi` files

#### Controls

* **Play** / **Pause** / **Stop**
* Progress Bar with duration

#### Visualization

* Piano Roll
* Note Highlights
* Time Grid
* Playback Needle

---

## 💪 Tech Stack

### Frontend

* Next.js 14
* TypeScript
* Tailwind CSS
* shadcn/ui
* Lucide Icons

### Audio

* Tone.js
* Tone.Sampler
* @tonejs/midi
* PolySynth fallback

### State Management

* React Hooks
* usePiano custom hook
* setInterval + setTimeout timing

---

## 🔧 File Structure

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── piano-keyboard.tsx
│   ├── midi-player.tsx
│   └── sample-midis.tsx
├── hooks/
│   └── use-piano.ts
├── lib/
│   ├── utils.ts
│   └── sound-engine.ts
└── public/
    ├── audio/salamander/
    └── midi-samples/
```

---

## 🌈 Customization

* **Themes**: Modify `tailwind.config.ts`
* **Audio**: Tweak `lib/sound-engine.ts`
* **Visualization**: Adjust `components/midi-player.tsx`
* **Key Mapping**: Edit `components/piano-keyboard.tsx`

---

## 🚨 Deployment

### Vercel

* Push to GitHub
* Link to Vercel
* Upload audio files to `public/`

### Netlify

* `npm run build` → Deploy `out/`

### Static Export

```bash
npm run build
npm run export
```

---

## 🛠️ Development

```bash
npm install
npm run dev
npm run build
npm run lint
```

---

## 🚫 Troubleshooting

### No Sound

* Check audio files exist
* Ensure browser permissions
* Confirm formats (.mp3/.ogg)

### MIDI Issues

* Validate file format & manifest.json
* Watch for CORS errors or size/timeouts

### Mobile Issues

* Enable proper touch targets
* Reduce animations
* Use latest browser version

---

## 👤 Contributing

1. Fork & branch
2. Make changes
3. Test & PR

Follow TypeScript/React standards and test across browsers.

---

## 📄 License

MIT License — see [LICENSE](LICENSE).

---

## 🙏 Acknowledgments

### Libraries

* [Tone.js](https://tonejs.github.io/)
* [Next.js](https://nextjs.org/)
* [Tailwind CSS](https://tailwindcss.com/)
* [shadcn/ui](https://ui.shadcn.com/)
* [Lucide Icons](https://lucide.dev/)

### Samples

* Salamander Grand Piano
* Freepats
* University of Iowa

### Inspiration

* Piano Marvel
* Flowkey
* Simply Piano
* Virtual Piano

---

## 📱 Support

* GitHub Issues & Discussions
* Email: \[[your-email@example.com](mailto:your-email@example.com)]
* Instagram: [@kaushikieee](https://instagram.com/kaushikieee)

---

**Made with ❤️ by [Kaushik](https://instagram.com/kaushikieee)**
*"Where Notes Fall in Love" - Experience the magic of music through code*
