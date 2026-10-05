# মহিষাসুরমর্দিনী (Mahishasuramardini) - Digital Mahalaya Experience

An immersive, nostalgic, and cinematic Bengali Mahalaya web broadcast powered by HTML5, CSS3 animations, procedural Web Audio API synthesis, and HTML5 Canvas.

---

## 🌟 Key Features

1. **Exact Artwork Preservation with Subtle Animation**:
   - Built on the supplied vintage Mahalaya illustration without altering proportions, face, clothing, radio, microphone, Bengali typography, or sepia color palette.
   - **Narrator Breathing**: Extremely subtle expansion and rise/fall of upper chest and shoulders (6.8s respiratory cycle) behind the stationary foreground radio.
   - **Head Concentration Movement**: Tiny micro-nod / quiet listening motion (12.5s cycle).
   - **Microphone Pendulum Sway**: Hanging studio ribbon microphone gently swings by ~1–2 mm anchored at the ceiling wire mount (7.8s period).
   - **Incense Smoke Simulation**: Realistic translucent smoke wisps rising and curling upward with harmonic air-draft modulation from the vintage brass burner.
   - **Sheuli Flower & Petal Shower**: Continuous autumn shower of authentic Bengali Sheuli blossoms (white star petals with saffron-orange tube centers) with 3D rotation, gentle wind drift, and table landing physics.
   - **Vintage Radio Warmth**: Glowing tube valve backlight and pulsing tuning eye indicator lamp.
   - **Atmospheric Morning God-Rays & Cinematic Breathing**: Soft golden sunbeams and gentle 24s camera parallax.

2. **Full Screen Mode**:
   - The artwork fills 100% of the screen (edge-to-edge 100vw × 100vh) without awkward scrollbars.
   - Dedicated full-screen mode toggle (⛶) in the top header.

3. **Live Radio Broadcast Experience (Strictly No Timeline)**:
   - Floating glass player at the bottom.
   - Thumbnail with golden border, title **মহিষাসুরমর্দিনী**, subtitle **বীরেন্দ্রকৃষ্ণ ভদ্র · মহালয়ার আবহ**, and a pulsing **● LIVE** badge.
   - Analog spectrum meter displaying warm golden radio frequency bars.
   - **Strictly NO progress bar, timeline, seek bar, or elapsed/remaining duration display**, ensuring an authentic radio broadcast feel.

4. **Procedural Bengali Dhak Engine (Web Audio API)**:
   - Infinite, real-time procedural synthesis of the traditional Durga Puja / Mahalaya Dhak rhythm.
   - Features dual-head acoustic modeling: resonant wooden bass boom (*Dha*), crisp cane stick crack (*Tang*), side-stick rim tap (*Kathi*), and sacred bronze gong (*Kashor*).
   - Runs on a zero-drift Web Audio lookahead clock scheduler that never runs out.
   - Dedicated `🥁 ঢাক চলছে` status indicator and quick toggle.

---

## 📂 Project Structure

```
Mahalaya/
│
├── index.html                  # Main application structure & full-screen stage
│
├── assets/                     # Artwork layers & visual assets
│   ├── mahalaya-art.jpg        # Base reference artwork
│   ├── art_base_inpainted.png  # Clean background layer behind swaying mic
│   ├── narrator_torso.png      # Soft-feathered torso layer for breathing
│   ├── narrator_head.png       # Head layer for subtle concentration tilt
│   ├── mic_layer.png           # Transparent isolated hanging ribbon microphone
│   └── foreground_layer.png    # Stationary radio, table, incense pot, and table flowers
│
├── audio/                      # Audio folder
│   ├── README.txt              # Audio setup instructions
│   └── mahalaya.mp3            # [DROP YOUR MAHALAYA RECORDING HERE]
│
├── css/
│   └── style.css               # Fullscreen layout, typography, glassmorphism, keyframes
│
├── js/
│   ├── app.js                  # Orchestrator, countdown timers, modals & settings
│   ├── audio.js                # Radio player controller & analog spectrum visualizer
│   ├── dhak.js                 # Procedural Web Audio API Bengali Dhak synthesizer
│   └── sheuli.js               # Canvas Sheuli flower falling & landing simulation
│   └── smoke.js                # Canvas incense curling smoke simulation
│
└── README.md                   # Complete documentation
```

---

## 📖 Answers to Key Questions

### 1. How the user interacts with the website
- When the website is opened, the visual experience starts **immediately and silently** without needing any click: the Sheuli flowers gently drift down, the incense smoke curls upward, the narrator breathes, the microphone sways, and the golden morning light breathes.
- The header displays the title **মহিষাসুরমর্দিনী**, a live countdown to Mahalaya and Durga Puja, and buttons for Full Screen (⛶), Sound (🔊), Notifications (🔔), Settings (⚙️), and Share (🔗).
- Above the player, the user can click:
  - **PLAYLISTS**: Opens a modal showing the historic chapters of *Mahishasuramardini* recorded at 1 Garstin Place, Kolkata.
  - **SCHEDULE**: Opens the auspicious calendar (Mahalaya dawn broadcast at 4:00 AM, Tarpan timings, Shasthi to Dashami).
  - **DHAK ON / OFF**: Instantly toggles the procedural Dhak drums on or off.

### 2. What happens when Play is pressed
1. If `audio/mahalaya.mp3` is present, it begins streaming immediately.
2. The procedural Bengali Dhak starts automatically in sync to accompany the narration.
3. The Play button smoothly changes to the Pause icon with a warm golden ring pulse.
4. The vintage radio's warm valve glow intensifies and the tuning indicator lamp turns vibrant green.
5. The analog radio spectrum meter starts dancing to the audio frequencies and Dhak rhythm.
6. The badge changes to show active broadcasting mode.
7. If `mahalaya.mp3` has not been added yet, the player displays a polite golden notice without crashing, while the procedural Dhak and all animations continue playing! The user can also choose any local audio file using the "Choose Local Audio" button.

### 3. What happens with Dhak
- The Dhak sound is **100% procedurally synthesized in real time** via the browser's native Web Audio API (`js/dhak.js`) using custom oscillator pitch envelopes, resonant bandpass noise filters, and a studio reverb impulse.
- It plays the iconic 16-step Bengali Agomoni rhythm (*"Dha... Tang... Dha-ka Tang... Dha-Dha Tang-ka Dha-tang... Tin Tin..."*).
- It never loops an audio file—it continuously schedules notes using high-precision Web Audio clock time (`AudioContext.currentTime`), so it **never stutters, never ends, and never goes out of sync**.
- Its volume is mixed warmly beneath the narration so it feels like authentic morning ambience.
- It can be toggled on/off independently at any time using the `🥁 ঢাক` button.

### 4. Where to put your Mahalaya audio
Place your MP3 file directly into the `audio/` folder and name it:
```
audio/mahalaya.mp3
```
No code edits are needed. The player will automatically pick it up.

### 5. How the animations work
- **Breathing**: The narrator's chest and shoulders (`assets/narrator_torso.png`) gently scale (`1.006` to `1.014`) and lift by `1.8px` using a CSS `@keyframes narratorBreathing` animation with a natural 6.8s breathing curve. Because the wooden radio sits in front on `foreground_layer.png`, the narrator breathes *behind* the radio realistically.
- **Concentration**: The head layer (`assets/narrator_head.png`) performs a micro-nod of `0.42deg` on a 12.5s cycle.
- **Microphone**: The isolated microphone (`assets/mic_layer.png`) is anchored to the ceiling at `transform-origin: 41.02% 0%` and gently sways by `±0.55deg` and `±1px` using `micPendulumSway`. The background behind it was seamlessly inpainted so there is zero ghosting.
- **Incense Smoke**: Rendered on `<canvas id="smokeCanvas">` via `SmokeEngine`. Particles are emitted from the incense stick tips at `x: 8.6%, y: 63.9%`, curling in compound sine waves with rightward room-draft drift and soft radial diffusion.
- **Sheuli Flowers**: Rendered on `<canvas id="sheuliCanvas">` via `SheuliEngine`. Spawns white 6-petaled blossoms with saffron-coral centers and loose petals with 3D rotation (`rotX`, `rotY`, `rotZ`), variable fall speeds (22–46 px/s), autumn wind sway, and landing physics on the table.
- **Atmospheric Lighting**: CSS God-rays overlay with soft breathing opacity and full-stage 24s camera parallax.

### 6. How to run the website locally
Any local static server will run the website:
- **Python**:
  ```bash
  python -m http.server 3000
  ```
  Then open `http://localhost:3000` in your browser.
- **Node.js**:
  ```bash
  npx serve .
  ```
- **VS Code**:
  Install the "Live Server" extension and click "Go Live".

### 7. How to deploy as a static website
Because this is a pure HTML/CSS/JavaScript project with no backend or database required:
- **Vercel**: Run `npx vercel` or link your GitHub repository.
- **GitHub Pages**: Push the repository to GitHub, go to **Settings > Pages**, choose the `main` branch, and click Save.
- **Netlify**: Drag and drop the project folder directly into the Netlify dashboard.
- **Cloudflare Pages**: Connect your Git repo and set output directory to `/`.

---
*শুভ মহালয়া! দেবীপক্ষের পুণ্য প্রভাতে মায়ের আবাহন।*
