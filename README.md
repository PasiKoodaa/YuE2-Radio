# Radio — local AI music stations

Radio is a local-first web app that continuously creates original songs on your computer. Pick a genre station and vocal language, then let Radio write lyrics through **LM Studio** and render complete music with **Yue2-3B** through **audio.cpp**.

No cloud API key is required. The language model, music model, generated lyrics, and audio stay on the endpoints you configure—normally your own PC.

> **Recommended English lyric model:** [OpenBMB MiniCPM5-2B-GGUF](https://huggingface.co/openbmb/MiniCPM5-2B-GGUF) in LM Studio. `Q4_K_M` is a good compact starting point. MiniCPM writes the lyrics; it does not replace the separate Yue2 music model.

## Features

- Eight built-in genre stations with genre-specific themes, imagery, and lyrical motifs.
- Random Radio chooses a new station style for every song.
- Custom Radio supports your own name, genre, mood, sound description, and rotating keywords.
- English, Spanish, French, Japanese, Korean, Portuguese, and Finnish vocals.
- Lyrics are checked for required section syntax and minimum length, with up to three generation attempts.
- Yue2 audio generation is retried up to three times after recoverable failures.
- Continuous mode prepares a configurable queue of 1–3 finished songs while the current song plays.
- Separate Queue and History tabs; History remembers the last 25 previous songs locally.
- Save the current song or any queued song as a WAV file.
- Cancel stops the active request and pauses automatic queue filling.
- Fixed, scrollable lyrics panel that does not stretch the page.
- Guided Windows 10 setup with Q4 and Q8 Yue2 download options.
- Dependency-free Node.js app server for Windows, macOS, and Linux.

## How it works

```text
Browser interface
      │
      ├── Radio local server ── LM Studio ── lyric model ── validated lyrics
      │
      └── Radio local server ── audio.cpp ── Yue2-3B ── WAV song
```

Radio uses LM Studio's OpenAI-compatible `/v1/chat/completions` endpoint for lyrics and audio.cpp's `/v1/tasks/run` endpoint for Yue2. The included local server proxies both services so the browser does not need permissive CORS settings.

## Requirements

- Windows 10 64-bit, macOS, or Linux.
- [Node.js 18 or newer](https://nodejs.org/en/download).
- [LM Studio](https://lmstudio.ai/download) and a compatible instruction model.
- audio.cpp and the [Yue2-3B GGUF model](https://huggingface.co/audio-cpp/Yue2-3B-GGUF).
- Approximately **5 GB free disk space** for Yue2 Q4 or **7 GB** for Yue2 Q8 and supporting files.

For Windows, an NVIDIA GPU with at least 8 GB VRAM is the most straightforward fast path. Vulkan builds are available for many AMD, Intel, and NVIDIA GPUs. CPU mode is provided as a compatibility fallback, but full-song generation can be very slow.

## Windows 10 quick start

### 1. Download and extract Radio

Download the ZIP from the repository's [Releases page](../../releases/latest), then extract it to a normal writable folder such as:

```text
C:\Radio
```

Do not run the app from inside the ZIP.

### 2. Install the music backend

Double-click:

```text
SETUP-RADIO-WINDOWS.bat
```

The setup asks you to choose:

| Choice | Recommended when |
| --- | --- |
| CUDA | You have an NVIDIA GPU |
| Vulkan | You have a compatible AMD, Intel, or NVIDIA GPU |
| CPU | No GPU backend works; expect slow generation |

It also asks which Yue2 model to download:

| Yue2 model | Tradeoff |
| --- | --- |
| Q4_0 | Smaller and faster to load; recommended first |
| Q8_0 | Larger and higher precision; needs more memory and disk space |

The setup downloads audio.cpp, the selected Yue2 model, the F16 VAE, and the required sidecar files. Existing completed downloads are reused if you run setup again.

### 3. Set up LM Studio for English lyrics

1. Install and open LM Studio.
2. Open **Discover**.
3. Search for `openbmb/MiniCPM5-2B-GGUF` or paste its [Hugging Face URL](https://huggingface.co/openbmb/MiniCPM5-2B-GGUF).
4. Download `Q4_K_M` as a practical default. A higher quantization can be used if you have enough memory.
5. Load the model.
6. Open **Developer** and start the local server on port `1234`.

MiniCPM5-2B-GGUF is the recommended option here for English lyric creation. You can use another instruction/chat GGUF model, especially when testing other languages.

### 4. Start Radio

Double-click:

```text
START-RADIO-WINDOWS.bat
```

The launcher starts audio.cpp, attempts to start LM Studio through `lms` when available, starts Radio at `http://127.0.0.1:4173`, and opens your browser.

If LM Studio is shown as offline, leave the launcher window open, start the server from LM Studio's Developer screen, then open Radio's gear menu and select **Test connections**.

## Using the radio

1. Select a station or choose Random Radio.
2. Select the vocal language.
3. Press **Make next song** or the main play button.
4. Keep **Continuous** enabled for uninterrupted radio playback.
5. Set **Songs ahead** to 1, 2, or 3.

While a song plays, Radio generates songs one at a time until the requested queue depth is ready. When playback ends, the first queued song starts and the app refills the queue.

The **Queue** tab shows upcoming songs. The **History** tab stores lightweight information about the latest 25 completed or replaced songs. Previous WAV data is not retained in History because full audio files can consume significant memory; save a song while it is current or queued.

Selecting **Cancel** aborts the active browser request through the local proxy and switches Continuous off so another generation does not immediately begin. A backend may take a moment to release an operation already running on the GPU.

## Radio stations

| Station | Genre | Typical lyrical territory |
| --- | --- | --- |
| Afterglow FM | Synth pop | Night drives, digital longing, escape, reinvention |
| Velvet Hour | Neo soul | Honest love, trust, self-worth, reconciliation |
| Metro Bloom | City pop | Urban romance, ambition, weekends, summer nostalgia |
| Static Country | Alt country | Roots, roads, family, work, second chances |
| Midnight Jazz | Late-night jazz | Missed timing, solitude, old flames, closing time |
| Maré Alta | Bossa nova | Coastal life, fleeting summers, calm love, return |
| Neon Seoul | K-pop | Confidence, friendship, comebacks, new attraction |
| Radio Serein | Dream pop | Memory, dreams, distance, seasons, letting go |

Each song rolls a new topic, central image, recurring motif, viewpoint, energy curve, and arrangement variation. Random Radio first chooses a station and then uses that station's genre-specific pools.

## Custom Radio

Open the gear menu and enter:

- Station name
- Genre
- Mood
- Sound and instrument description
- Optional comma-separated rotating keywords

Custom Radio combines its sound description with a general creative pool and one of your keywords for each song. Settings are stored only in that browser.

## macOS and Linux

Install Node.js 18+, LM Studio, audio.cpp, and the Yue2 GGUF files. Copy `audio-cpp-server.example.json` and configure it so:

- `path` is the absolute Yue2 model directory.
- `yue2.model_gguf` is a relative GGUF filename.
- `yue2.vae_gguf` is a relative VAE filename.

Start LM Studio and audio.cpp, then run:

```bash
sh start-radio.sh
```

See [docs/MACOS-LINUX.md](docs/MACOS-LINUX.md) for additional notes.

## Configuration

`radio.config.json` configures the local bridge:

```json
{
  "port": 4173,
  "lmStudioBaseUrl": "http://127.0.0.1:1234",
  "audioCppBaseUrl": "http://127.0.0.1:8080",
  "proxyTimeoutMs": 1200000
}
```

The same values can be changed from Radio's gear menu. The default proxy timeout is 20 minutes because music generation can take several minutes on consumer hardware.

## Troubleshooting

### `yue2_model_gguf must be relative to the Yue2 model root`

Run `SETUP-RADIO-WINDOWS.bat` again. The current setup uses the model directory as `path` and writes the Yue2 and VAE settings as relative filenames.

### `Yue2 requires non-empty style`

Use Radio v0.4.0 or newer. Current versions send the non-empty station style inside Yue2's request `options` object.

### LM Studio is offline

Load a model, open LM Studio's Developer screen, confirm that the server is running on port `1234`, and then use **Test connections** in Radio.

### audio.cpp is offline

Check the Radio launcher window for an audio.cpp error. Run setup again if `runtime/server.json` or the audio.cpp executable is missing. If the selected backend cannot start, try another backend.

### Continuous playback has a gap

Set **Songs ahead** to 2 or 3. If the hardware takes longer to render a new song than the current song lasts, a gap can still occur.

More Windows-specific help is available in [docs/WINDOWS.md](docs/WINDOWS.md).

## Development

Radio has no runtime npm dependencies and no build step. The browser application is in `dist/`.

```bash
npm start          # Start the local app server
npm run check      # Validate distributable files and configuration
npm test           # Test lyric parsing and Yue2 request generation
npm run smoke      # Start the server and test its local routes
npm run package    # Create a release ZIP
```

Useful contribution areas include station presets, translations, accessibility, platform setup, and response adapters for future audio.cpp releases. See [docs/GITHUB.md](docs/GITHUB.md) before publishing or contributing.

## Privacy and safety

- Radio binds its local server to `127.0.0.1` by default.
- Lyrics and audio are sent only to the configured LM Studio and audio.cpp endpoints.
- No cloud API key is required.
- Do not expose the local model services directly to the public internet.
- Review generated lyrics and audio before publishing; generative models can produce unexpected similarities or unsuitable content.

## Licenses

The Radio application code is released under the [MIT License](LICENSE).

Model weights and external applications are separate projects with their own terms:

- Yue2-3B GGUF: review the model's **CC BY-NC 4.0** terms before commercial use or redistribution.
- MiniCPM5-2B-GGUF: **Apache 2.0** at the time of writing; verify the current model card.
- audio.cpp and LM Studio: governed by their respective licenses and terms.

Model files and third-party binaries are not committed to this repository. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for details.
