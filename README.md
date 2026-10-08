# আগমনী (Agomoni) - আকাশবাণী বাংলা লাইভ সম্প্রচার
### Official Akashvani / AIR Bangla Live Radio Broadcast Front-End

An authentic, nostalgic, and cinematic Bengali live radio front-end for the official **Akashvani (All India Radio) / Prasar Bharati** live broadcast, crafted with HTML5, CSS3 animations, procedural Web Audio API synthesis, HLS streaming, and Canvas simulations.

```
AGOMONI WEBSITE
        ↓
AKASHVANI LIVE
        ↓
AIR BANGLA
        ↓
WHATEVER IS CURRENTLY BROADCASTING
```

On Mahalaya morning, when Akashvani broadcasts the legendary *Mahishasuramardini* (মহিষাসুরমর্দিনী) by Birendra Krishna Bhadra at dawn, this website automatically carries that live broadcast in real time directly from the official Akashvani servers.

> **CRITICAL ARCHITECTURE NOTE**:
> This website does **NOT** download, store, cache, or bundle any recorded Mahalaya MP3 files. It has zero dependency on local files like `mahalaya.mp3`. It acts as a dedicated, beautiful digital radio front-end connected to the official All India Radio / Prasar Bharati live stream.

---

## 📻 Key Architectural Documentation

### 1. Where the Official Stream Configuration Is
The official streaming endpoints, station metadata, and reconnection policies are isolated strictly in:

[js/akashiVani.js](file:///c:/Users/nilad/OneDrive/Documents/Mahalaya/js/akashiVani.js)

```javascript
const AKASHVANI_CONFIG = {
  stationName: 'আকাশবাণী বাংলা',
  stationSubtitle: 'LIVE BROADCAST',
  stationFrequency: 'AIR Kolkata · Prasar Bharati',

  // Official Akashvani / Prasar Bharati HLS streaming endpoints:
  streamUrl: 'https://airhlspush.pc.cdn.bitgravity.com/httppush/hlspbaudio137/hlspbaudio137_Auto.m3u8',
  alternateStreamUrl: 'https://airhlspush.pc.cdn.bitgravity.com/httppush/hlspbaudio055/hlspbaudio055_Auto.m3u8',

  officialPortalUrl: 'https://newsonair.gov.in/',
  ...
};
```

Keeping this configuration strictly isolated ensures maintainability: if Akashvani updates its streaming endpoints in the future, **only this file needs to be modified**.

---

### 2. How the Stream is Connected
Akashvani (Prasar Bharati) broadcasts its digital radio services using HTTP Live Streaming (HLS / `.m3u8` manifests with AAC chunks) hosted over BitGravity / Tata Communications CDNs with standard CORS headers (`access-control-allow-origin: *`).

The browser connection is established through an adaptive dual-layer engine:
1. **Desktop & Android (Chrome, Edge, Firefox, Brave, Opera)**:
   Uses [hls.js](file:///c:/Users/nilad/OneDrive/Documents/Mahalaya/js/hls.min.js) (included locally in `js/hls.min.js` for reliability) which transmuxes the incoming AAC HLS segments into ISO BMFF format in memory via Web Workers, feeding them into the browser's `HTMLMediaElement` through the Media Source Extensions (MSE) API.
2. **Apple Ecosystem (iOS Safari, iPadOS, macOS Safari)**:
   Safari natively decodes HLS audio directly via native HTML5 Audio (`application/vnd.apple.mpegurl`).
3. **CORS / Network Fallback**:
   If the browser or network environment blocks cross-origin media requests, the website does not inject unauthorized third-party feeds. Instead, it displays a polite fallback notification:
   > *"Akashvani live stream cannot be connected directly from this browser."*
   and provides a direct link:
   > *"Listen on official Akashvani"* (`https://newsonair.gov.in/`).

---

### 3. How Play Works
- **No Autoplay on Load**: Due to modern browser autoplay policies and audio context restrictions, the live stream is **never autoplays silently or forcefully** when the page loads. The user must explicitly press **PLAY**.
- When the user presses the central golden **PLAY** button:
  1. The player transitions to the `CONNECTING` state (`⏳ CONNECTING` badge, spinning indicator).
  2. `window.akashvaniService` attaches the official AIR Bangla HLS manifest to the audio engine.
  3. The stream starts streaming live whatever is currently on air at Akashvani Kolkata.
  4. The button changes smoothly to the **Pause** icon with an amber pulse animation.
  5. The badge switches to **🔴 ON AIR** with a pulsing red beacon.
  6. The vintage radio's vacuum tube valve glow intensifies and the indicator light switches to luminous green.
  7. The Mahalaya visual animations (breathing, incense smoke, falling Sheuli flowers, swaying microphone) continue seamlessly without interruption.

---

### 4. How Reconnect Works
Live internet radio broadcasts can occasionally suffer from momentary network drops, cell tower handoffs, or CDN hiccups.

Agomoni features an intelligent, resilient reconnection state machine:
- **Automatic Exponential Backoff**:
  When a disconnect or network interruption is detected, the engine attempts automatic reconnection using exponential backoff:
  $$\text{Delay} = \min(\text{InitialDelay} \times 2^{(\text{attempt}-1)}, \text{MaxDelay})$$
  - Initial delay: **1.5s**
  - Successive delays: **3s**, **6s**, **12s**, up to a maximum cap of **20s**
  - Maximum attempts: **6 attempts** (prevents infinite server hammering)
- **Manual Reconnection**:
  If the network drops or maximum attempts are reached, the player card displays:
  > **"Akashvani connection lost"** with a bright orange **[ RECONNECT ]** button.
  Additionally, a dedicated **RECONNECT** dial button is always available right next to the Play button on the radio dock. Clicking it resets the backoff counter and immediately triggers a fresh connection attempt.

---

### 5. How Dhak Works
- **Completely Independent of Akashvani**: The traditional festive Dhak drum is **NOT** mixed into the Akashvani live stream by default.
- **Initial State**: Starts as `🥁 DHAK OFF`.
- **User Control**: The user explicitly decides when to turn it on by clicking the `🥁 DHAK OFF` glass pill button in the floating hero action bar. When clicked, it activates and displays `🥁 DHAK ON`.
- **Authentic Recorded Dhak (`audio/dhak.mp3`)**: When enabled, it plays the authentic, traditional recorded Bengali Durga Puja Dhak with Kashor (`audio/dhak.mp3`) via [js/dhak.js](file:///c:/Users/nilad/OneDrive/Documents/Mahalaya/js/dhak.js).
- **Runs Indefinitely**: It loops seamlessly and continuously without ending or going out of sync.
- **Independent Volume Control**: The user can adjust Dhak volume independently via the Dhak Volume slider in the Settings modal (`⚙️`), leaving Akashvani's live broadcast volume unaffected.

---

### 6. How the Mahalaya Animation Works
The visual atmosphere autoplays silently and immediately upon page load at a steady 60 FPS across layered stages:
1. **Narrator Breathing** (`.layer-torso`): Subtle respiratory expansion and rise/fall (6.8s cycle) anchored behind the table.
2. **Quiet Concentration Micro-Nod** (`.layer-head`): Organic tilt and head motion (12.5s cycle).
3. **Studio Ribbon Microphone** (`.layer-mic`): Hanging vintage microphone gently sways like a pendulum anchored at the ceiling mount (7.8s period).
4. **Incense Smoke Simulation** (`smokeCanvas`, [js/smoke.js](file:///c:/Users/nilad/OneDrive/Documents/Mahalaya/js/smoke.js)): Physics-based particle simulation where translucent smoke wisps curl and rise upward from the brass burner.
5. **Continuous Sheuli Flower Shower** (`sheuliCanvas`, [js/sheuli.js](file:///c:/Users/nilad/OneDrive/Documents/Mahalaya/js/sheuli.js)):
   - Delicate Bengali Sheuli blossoms (white star petals + saffron-orange tubes) and single petals continuously fall from the **TOP of the screen to the BOTTOM**.
   - Flowers fall slowly and peacefully at different randomized speeds, sizes, and 3D tumbling rotation trajectories ($x, y, z$).
   - Subset of flowers softly settle onto the wooden table with gentle fading.
   - Positioned in canvas layer behind the floating header and controls dock, ensuring it **never covers or obscures the Bengali typography**.
6. **Atmospheric Lighting**: Golden morning god-rays breathe slowly in the background, accompanied by glowing vacuum tube radio valves and an analog audio frequency visualizer.

---

### 7. Why There Is No Timeline
This is a **RADIO**, not a YouTube, Spotify, or on-demand podcast player.
- **Live Broadcast Nature**: Akashvani / AIR Bangla is an uninterrupted, live linear radio broadcast. There is no predetermined track duration, seek position, elapsed time, or rewind/forward buffer.
- **Authentic Radio Aesthetics**: Just like a physical Philips, Murphy, or Bush valve radio from 1931, the controls are strictly:
  - **Play / Pause**
  - **Reconnect**
  - **Mute**
  - **Volume Slider**
- The UI contains **strictly NO**:
  - Progress bar
  - Timeline
  - Elapsed time / Remaining time
  - Duration display
  - Seek bar / Scrubber

---

### 8. What Happens If Akashvani Changes Its Stream Endpoint
Prasar Bharati / All India Radio occasionally migrates its CDNs or updates stream token paths.

Thanks to the isolated architecture:
1. Open [js/akashiVani.js](file:///c:/Users/nilad/OneDrive/Documents/Mahalaya/js/akashiVani.js).
2. Locate `AKASHVANI_CONFIG.streamUrl`.
3. Paste the new official Akashvani HLS stream URL (e.g. `https://.../playlist.m3u8`).
4. Save the file.
5. That is all. The entire website, players, fallback logic, reconnect loops, and visualizers will immediately connect to the new endpoint without touching any other code.

---

## 📱 Mobile Responsiveness (Android & iOS)
- Fully optimized for all modern mobile viewport widths (360px to 430px) without any horizontal scrolling (`overflow-x: hidden`).
- Minimum 40px–48px touch targets for effortless thumb operation.
- Volume controls, Dhak toggle, and reconnection banners neatly adapt to compact screens.

---

## 🗂️ File Inventory

```
Mahalaya/
├── index.html              # Fullscreen stage, header, and radio dock player
├── README.md               # Architecture and operations documentation
├── assets/                 # High-resolution visual artwork layers
│   ├── art_base_inpainted.png
│   ├── narrator_torso.png
│   ├── narrator_head.png
│   ├── mic_layer.png
│   └── foreground_layer.png
├── audio/
│   └── dhak.mp3            # Reference dhak audio
├── css/
│   └── style.css           # Radio aesthetic, animations, and responsive styles
└── js/
    ├── akashiVani.js       # ISOLATED official Akashvani configuration & stream engine
    ├── hls.min.js          # Hls.js library for universal browser HLS decoding
    ├── audio.js            # Radio dock controller & spectrum visualizer
    ├── dhak.js             # Procedural Web Audio API Dhak generator
    ├── sheuli.js           # Falling Sheuli flower particle canvas simulation
    ├── smoke.js            # Rising incense smoke particle canvas simulation
    └── app.js              # Orchestrator, countdown timer, and modal dialogs
```

---

*শুভ মহালয়া! দেবীপক্ষের পুণ্য প্রভাতে মায়ের আবাহন।*
