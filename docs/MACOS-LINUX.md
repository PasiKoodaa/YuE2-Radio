# macOS and Linux

The Radio interface and proxy are cross-platform and require only Node.js 18 or newer. LM Studio and audio.cpp must be installed separately for your operating system and hardware backend.

## 1. Start LM Studio

Load an instruction-capable text model, open Developer, and start the local server on port `1234`.

## 2. Install audio.cpp and Yue2

Download a current audio.cpp release for your platform from its GitHub releases. Download these files from `audio-cpp/Yue2-3B-GGUF`:

- `yue2-3b-q4_0.gguf` (smaller), or `yue2-3b-q8_0.gguf` (higher precision)
- `yue2-vae-f16.gguf`
- everything under `sidecars/`

Copy `audio-cpp-server.example.json` to `server.json`. Set `path` to the absolute Yue2 model directory, but leave `yue2.model_gguf` and `yue2.vae_gguf` as filenames relative to that directory. Change the main filename to `yue2-3b-q8_0.gguf` if you downloaded Q8. Set the backend to `metal`, `cuda`, `vulkan`, or `cpu` as supported by your build.

Start audio.cpp:

```bash
./audiocpp_server --config /absolute/path/to/server.json --no-ui
```

## 3. Start Radio

```bash
sh start-radio.sh
```

The app opens at `http://127.0.0.1:4173`. If your services use other ports, edit `radio.config.json` before starting Radio.

## Model storage

Do not commit GGUF files or audio.cpp binaries to your GitHub repository. Keep them under the ignored `runtime/` directory or outside the repository.
