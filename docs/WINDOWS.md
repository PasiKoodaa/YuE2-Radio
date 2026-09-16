# Windows 10 setup and troubleshooting

## Recommended hardware

- Windows 10 64-bit.
- NVIDIA GPU with 8 GB or more VRAM for the best-supported fast path.
- A Vulkan-capable AMD, Intel, or NVIDIA GPU as an alternative.
- 16 GB system RAM and 5 GB free disk space for Q4, or 7 GB for Q8.

Q4 is the smaller default. Q8 uses a larger, higher-precision main model. The Yue2 model card reports about 7.8 GB peak VRAM for Q4 and 8.9 GB for Q8 on its reference long-form run; leave headroom for Windows and other applications. CPU mode may work but full-song generation can be extremely slow.

## Guided setup

1. Install the current Node.js LTS release.
2. Install LM Studio.
3. Run `SETUP-RADIO-WINDOWS.bat` once. The script:
   - detects your GPU;
   - asks you to choose CUDA, Vulkan, or CPU;
   - asks you to choose Q4_0 or Q8_0;
   - downloads the latest matching audio.cpp release from GitHub;
   - downloads the selected Yue2 model, the F16 VAE, and required sidecar files from Hugging Face;
   - writes `runtime/server.json` with an absolute model-root directory and relative GGUF filenames.
4. In LM Studio, download and load an instruction model. Open Developer and switch Start server on.
5. Run `START-RADIO-WINDOWS.bat`.

The setup is resumable. Existing downloads are reused. If a partial download exists, `curl.exe` attempts to continue it.

## Choosing a backend

| Backend | Choose it when | Notes |
| --- | --- | --- |
| CUDA | You have an NVIDIA GPU | Recommended fast path. Keep NVIDIA drivers current. |
| Vulkan | You have AMD/Intel graphics, or CUDA is unavailable | Model/backend coverage and speed can vary. |
| CPU | No compatible GPU path works | Compatibility fallback; expect long waits. |

To switch backend later, run the setup script again and choose a different option.

To switch between Q4 and Q8, run setup again. Existing completed downloads are reused, so changing the server configuration does not re-download files you already have.

## LM Studio

Radio expects LM Studio at `http://127.0.0.1:1234`. In LM Studio:

1. Load an instruct/chat model.
2. Open the Developer tab.
3. Set the port to `1234` if you changed it previously.
4. Enable Start server.

If you intentionally use another port, edit `radio.config.json` and change `lmStudioBaseUrl`.

## Common problems

### “Node.js was not found”

Install Node.js LTS, close the old Command Prompt window, then run the launcher again.

### “The latest audio.cpp release has no Windows package”

The selected backend is not present in the current release. Try Vulkan or CPU, or download another build from the audio.cpp releases page and extract it under `runtime/audio.cpp`.

### LM Studio shows offline

Load a text model and enable its local server. The Radio launcher will continue running, so return to the browser, open the gear menu, and test again.

### audio.cpp shows offline

Check the launcher window for an audio.cpp error. Re-run setup if `runtime/server.json` or `audiocpp_server.exe` is missing. A driver/runtime mismatch usually means selecting another backend.

### “yue2_model_gguf must be relative to the Yue2 model root”

This was caused by an older Radio configuration that put absolute file paths in the Yue2 session options. Run `SETUP-RADIO-WINDOWS.bat` again. The fixed configuration uses the model folder for `path`, then `yue2-3b-q4_0.gguf` or `yue2-3b-q8_0.gguf` and `yue2-vae-f16.gguf` as relative filenames.

### Generation stops after several minutes

The default timeout is 20 minutes. Lower-memory systems may run out of memory while loading or rendering Yue2. Close other GPU-heavy applications and try again.

### Cancel does not appear to stop immediately

Radio closes the active request and pauses continuous queue filling. The local proxy forwards that disconnect to LM Studio or audio.cpp. A backend may take a short moment to release an in-progress GPU operation, but Radio will not start another queued generation until Continuous is enabled again.

### Continuous playback has a gap

Set **Songs ahead** to 2 or 3 so Radio starts preparing more music while the current song plays. The first song still has to finish generating before playback can begin, and very slow hardware can take longer to render a song than the current track lasts.

### “Yue2 requires non-empty style”

Update to Radio v0.4.0 or newer. Older versions sent the style as a normal request field, but audio.cpp requires it inside the request `options` object. The updated app also uses Yue2's native `lyrics` field.

### Windows Defender warning

The scripts are plain text and the downloads come from the official audio.cpp GitHub release and Yue2 Hugging Face repository. Windows may still warn about newly downloaded executables. Review the script and release checksums before allowing it if you prefer.

## Manual audio.cpp setup

Copy `audio-cpp-server.example.json` to a new file, replace the single `path` value with the absolute path to the Yue2 model directory, choose the correct backend, and start. Do not make the two `session_options` filenames absolute.

```powershell
audiocpp_server.exe --config C:\path\to\server.json --no-ui
```

The local Radio server proxies browser requests, so audio.cpp does not need public network access or permissive CORS. Keep it bound to `127.0.0.1`.
