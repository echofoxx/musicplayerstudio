# Echo — Music Player

A browser-based music player for local files, with stubbed panels for
YouTube Music and Spotify. Built with React, TypeScript, Tailwind CSS, and
the Web Audio API.

## Features

- **Local playback** — import audio files from your computer (drag & drop
  or file picker). Files never leave the browser; ID3/metadata tags and
  embedded artwork are read client-side with `music-metadata`.
- **Dual-deck crossfade** — an adjustable 0–12s crossfade between tracks
  using equal-power gain curves, both on manual skip and automatic
  track-end.
- **Shuffle & repeat** — off / all / one, plus a "restart if >3s in"
  previous-track behavior.
- **5-band EQ** — lowshelf/peaking/highshelf `BiquadFilterNode` chain
  (60Hz–12kHz) with presets (Flat, Bass Boost, Vocal, Treble, Vintage
  Warmth) and an on/off toggle.
- **Visualizer** — canvas renderer with Bars, Waveform, and a radial
  "Vinyl" mode, driven by an `AnalyserNode`; toggle it off entirely.
- **Themes** — Modern Dark, Modern Light, and a warm Vintage theme
  (serif type, sepia palette), persisted to `localStorage`.
- **Streaming source panels (stubbed)** — YouTube Music and Spotify tabs
  share the same `MusicSource` adapter interface as the local library.
  They currently return placeholder search results because real
  integration needs credentials this project doesn't have configured:
  - YouTube: a YouTube Data API v3 key (see `src/sources/youtubeSource.ts`)
  - Spotify: an OAuth Client ID + Premium account + Web Playback SDK
    (see `src/sources/spotifySource.ts`)

  Swap the adapter internals for real API calls once those credentials
  are available — the rest of the app (queue, EQ, crossfade, UI) already
  treats all three sources uniformly.

## Development

```bash
npm install
npm run dev      # start dev server
npm run build     # typecheck + production build
npm run preview   # preview the production build
```

## Running with Docker

No backend or database is required — this is a static site once built, so
the image is just a multi-stage build (Node to build, NGINX to serve):

```bash
docker compose up --build
```

Then open http://localhost:8080. To use plain `docker` instead:

```bash
docker build -t musicplayerstudio .
docker run -p 8080:80 musicplayerstudio
```
