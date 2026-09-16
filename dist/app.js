import { MIN_LYRIC_UNITS, splitSong, validateSong } from "./song-validation.js";
import { createYue2Request } from "./audio-request.js";

const stations = [
  { id: "afterglow", name: "Afterglow FM", short: "AF", frequency: "88.3", genre: "Synth pop", mood: "Night drive", location: "SIGNAL 01 · AFTER DARK", color: "#ff4d32", rgb: "255, 77, 50", style: "synth pop, night drive, glassy analog synths, driving bass, crisp drum machine, luminous lead vocal, cinematic chorus" },
  { id: "velvet", name: "Velvet Hour", short: "VH", frequency: "90.7", genre: "Neo soul", mood: "Slow burn", location: "SIGNAL 02 · THE LOUNGE", color: "#d69bff", rgb: "214, 155, 255", style: "neo soul, slow burn groove, warm Rhodes, round bass, pocket drums, intimate expressive vocal, rich harmonies" },
  { id: "metro", name: "Metro Bloom", short: "MB", frequency: "93.1", genre: "City pop", mood: "Sunset", location: "SIGNAL 03 · DOWNTOWN", color: "#4dd9e8", rgb: "77, 217, 232", style: "city pop, sunset boulevard, sparkling electric piano, slap bass, brass accents, polished upbeat vocal, 1980s sheen" },
  { id: "static", name: "Static Country", short: "SC", frequency: "95.9", genre: "Alt country", mood: "Open road", location: "SIGNAL 04 · MILE ZERO", color: "#f0a63a", rgb: "240, 166, 58", style: "alternative country, open road, tremolo guitar, brushed drums, upright piano, weathered heartfelt vocal, roomy live band" },
  { id: "midnight", name: "Midnight Jazz", short: "MJ", frequency: "98.2", genre: "Late-night jazz", mood: "Blue room", location: "SIGNAL 05 · BLUE ROOM", color: "#6687ff", rgb: "102, 135, 255", style: "late-night vocal jazz, smoky club, upright bass, brushed kit, muted trumpet, sparse piano, close-mic vocal" },
  { id: "mare", name: "Maré Alta", short: "MA", frequency: "101.4", genre: "Bossa nova", mood: "Coastal", location: "SIGNAL 06 · COASTLINE", color: "#67d39a", rgb: "103, 211, 154", style: "modern bossa nova, coastal evening, nylon guitar, soft percussion, mellow bass, airy lead vocal, natural room sound" },
  { id: "neon", name: "Neon Seoul", short: "NS", frequency: "103.8", genre: "K-pop", mood: "Electric", location: "SIGNAL 07 · NIGHT MARKET", color: "#ff67b1", rgb: "255, 103, 177", style: "sleek K-pop, electric night, punchy drums, glossy synth bass, layered group vocals, sharp pre-chorus, huge dance hook" },
  { id: "serein", name: "Radio Serein", short: "RS", frequency: "106.6", genre: "Dream pop", mood: "Soft rain", location: "SIGNAL 08 · RIVE GAUCHE", color: "#e7ff77", rgb: "231, 255, 119", style: "French dream pop, soft rain, chorus guitar, hazy pads, understated drums, whispery melodic vocal, bittersweet atmosphere" }
];

const defaultCustomStation = {
  id: "custom", name: "Custom Radio", short: "CR", frequency: "USER", genre: "Not configured", mood: "Your sound",
  location: "CUSTOM SIGNAL · YOUR DESIGN", color: "#ffd166", rgb: "255, 209, 102", style: "", keywords: ""
};

const creativeRolls = {
  themes: ["a secret kept too long", "starting over before sunrise", "a chance encounter that changes the night", "home seen from far away", "choosing hope after a hard season", "a promise made on the road", "the last dance before goodbye", "finding courage in an ordinary moment"],
  perspectives: ["first-person confession", "two voices answering each other", "a vivid third-person story", "a direct address to someone absent", "a memory unfolding in the present tense"],
  images: ["streetlights reflected in rain", "an empty platform at dawn", "summer air through an open window", "snow under a pale moon", "a coastline beyond the city", "old photographs in a kitchen drawer", "headlights crossing a dark highway"],
  motifs: ["an unanswered message", "a familiar melody", "a doorway left open", "a changing skyline", "a small object carrying a big memory"],
  energies: ["restrained verses opening into a wide chorus", "an immediate hook and a quieter bridge", "a slow emotional build with a final lift", "rhythmic verses with a soaring melodic refrain", "intimate vocals growing into layered harmonies"],
  production: ["a brief instrumental response after each chorus", "a stripped-back bridge before the final chorus", "subtle backing vocals that widen only at the end", "one unexpected instrumental color used sparingly", "a dynamic final chorus with a clear melodic variation"]
};

const genreSeeds = {
  afterglow: {
    themes: ["reinventing yourself during a midnight drive", "a digital-age romance slipping out of reach", "escaping the routine before the city wakes", "choosing motion instead of regret", "nostalgia for a future that never arrived"],
    images: ["neon reflected across a windshield", "a dashboard clock glowing after midnight", "taillights dissolving into rain", "an empty overpass beneath violet clouds", "a cassette turning beside the city lights"],
    motifs: ["a half-written message", "radio static between stations", "an exit sign passed twice", "electric blue light", "a pulse matching the road"]
  },
  velvet: {
    themes: ["learning to ask for honest love", "protecting your peace after heartbreak", "a slow reconciliation built on trust", "recognizing your own worth", "wanting closeness without losing yourself"],
    images: ["lamplight across a quiet apartment", "two coffee cups cooling on the table", "a phone resting face-down", "rain tracing the bedroom window", "a record spinning after the conversation ends"],
    motifs: ["unspoken apologies", "Sunday morning", "warm hands", "a familiar perfume", "breathing room"]
  },
  metro: {
    themes: ["a carefree weekend romance in the city", "balancing ambition with the life you miss", "meeting an old love during rush hour", "chasing one perfect summer evening", "finding freedom after the workday ends"],
    images: ["a rooftop washed in sunset", "taxi signs flickering along the avenue", "a seaside train leaving downtown", "shopping bags swinging beneath bright marquees", "an elevator opening onto a night view"],
    motifs: ["a disposable camera", "the last train", "a rooftop breeze", "a ringing payphone", "Friday at five"]
  },
  static: {
    themes: ["leaving a hometown without forgetting it", "repairing a bond between parent and child", "finding dignity after hard work and loss", "a second chance waiting down the road", "keeping a promise across many miles"],
    images: ["a water tower beyond the fields", "a motel vacancy sign beside the highway", "work boots drying on a porch", "dust rising behind an old pickup", "a kitchen light burning before dawn"],
    motifs: ["a folded road map", "a family name", "county lines", "an old truck key", "a porch light"]
  },
  midnight: {
    themes: ["two people whose timing was never right", "solitude that feels almost like freedom", "an old flame returning at closing time", "hiding tenderness behind clever conversation", "accepting that one beautiful night is enough"],
    images: ["a final glass beneath a shaded lamp", "piano keys reflected in a dark window", "an empty corner table after closing", "a cab waiting under an awning", "dawn thinning the blue outside the club"],
    motifs: ["closing time", "a borrowed lighter", "the final train home", "a blue note", "a name left off the check"]
  },
  mare: {
    themes: ["a summer love allowed to remain temporary", "returning to the coast after years away", "finding calm in an unhurried relationship", "gratitude for an ordinary day together", "letting distance soften an old goodbye"],
    images: ["white curtains moving in sea air", "sand cooling beneath bare feet", "small boats rocking beyond the balcony", "sunlight scattered across tiled walls", "a late café beside the water"],
    motifs: ["salt on skin", "a postcard", "afternoon shade", "a bicycle by the seawall", "the tide returning"]
  },
  neon: {
    themes: ["turning a setback into a fearless comeback", "friends choosing each other under pressure", "the electric uncertainty of a new crush", "claiming confidence in front of the whole world", "outgrowing the version of yourself others expected"],
    images: ["camera flashes bursting in a mirrored hallway", "train windows racing past colored signs", "a rooftop dance beneath aircraft lights", "sneakers crossing a rain-bright street", "backstage shadows before the doors open"],
    motifs: ["a countdown", "matching bracelets", "a secret signal", "the bass drop", "a reflected crown"]
  },
  serein: {
    themes: ["a memory becoming gentler with time", "loving someone who feels half dream and half distance", "letting one season end without an answer", "finding beauty inside uncertainty", "returning in imagination to a vanished place"],
    images: ["river lights blurred through soft rain", "pressed flowers inside an unread book", "fog gathering on a train window", "a pale room just before morning", "curtains glowing beneath a quiet moon"],
    motifs: ["a recurring dream", "wet pavement", "a faded photograph", "distant bells", "a name written in steam"]
  }
};

const els = Object.fromEntries([...document.querySelectorAll("[id]")].map((el) => [el.id, el]));
const state = {
  stationIndex: 0,
  tuningMode: "station",
  customStation: { ...defaultCustomStation },
  lastGeneratedStationId: null,
  lastBriefSignature: "",
  generating: false,
  aborter: null,
  playQueue: [],
  history: [],
  currentTrack: null,
  currentTrackArchived: false,
  lyrics: "",
  services: { lm: false, audio: false },
  audioUrl: null,
  continuous: true,
  queueTarget: 2,
  generationMode: null,
  generationRevision: 0,
  prefetchTimer: null,
  settings: {
    lmEndpoint: "http://localhost:1234/v1",
    lmModel: "Auto",
    audioEndpoint: "http://127.0.0.1:8080",
    audioModel: "yue2-radio"
  }
};

const languageCodes = { English: "ENGLISH", Spanish: "ESPAÑOL", French: "FRANÇAIS", Japanese: "日本語", Korean: "한국어", Portuguese: "PORTUGUÊS", Finnish: "SUOMI" };
const isLocalBundle = ["localhost", "127.0.0.1"].includes(location.hostname);

if (isLocalBundle) {
  state.settings.lmEndpoint = `${location.origin}/proxy/lm/v1`;
  state.settings.audioEndpoint = `${location.origin}/proxy/audio`;
}

function loadPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem("radio-settings") || "null");
    if (saved) state.settings = { ...state.settings, ...saved };
    const stationId = localStorage.getItem("radio-station");
    const index = stations.findIndex((station) => station.id === stationId);
    if (index >= 0) state.stationIndex = index;
    const custom = JSON.parse(localStorage.getItem("radio-custom-station") || "null");
    if (custom) state.customStation = { ...defaultCustomStation, ...custom };
    const mode = localStorage.getItem("radio-tuning-mode");
    if (["station", "random", "custom"].includes(mode)) state.tuningMode = mode;
    if (state.tuningMode === "custom" && !isCustomConfigured()) state.tuningMode = "station";
    els.languageSelect.value = localStorage.getItem("radio-language") || "English";
    state.continuous = localStorage.getItem("radio-continuous") !== "off";
    state.queueTarget = Math.min(3, Math.max(1, Number(localStorage.getItem("radio-queue-target")) || 2));
    const history = JSON.parse(localStorage.getItem("radio-history") || "[]");
    if (Array.isArray(history)) state.history = history.slice(0, 25);
  } catch { /* Use safe defaults. */ }
  els.queueTarget.value = String(state.queueTarget);
  syncSettingsInputs();
  syncContinuousToggle();
}

function syncSettingsInputs() {
  els.lmEndpoint.value = state.settings.lmEndpoint;
  els.lmModel.value = state.settings.lmModel;
  els.audioEndpoint.value = state.settings.audioEndpoint;
  els.audioModel.value = state.settings.audioModel;
  els.customName.value = state.customStation.name === defaultCustomStation.name ? "" : state.customStation.name;
  els.customGenre.value = state.customStation.genre === defaultCustomStation.genre ? "" : state.customStation.genre;
  els.customMood.value = state.customStation.mood === defaultCustomStation.mood ? "" : state.customStation.mood;
  els.customStyle.value = state.customStation.style;
  els.customKeywords.value = state.customStation.keywords || "";
}

function normalizeBase(url) { return url.trim().replace(/\/+$/, ""); }

function isCustomConfigured(station = state.customStation) {
  return Boolean(station.name?.trim() && station.genre?.trim() && station.style?.trim());
}

function syncContinuousToggle() {
  els.continuousToggle.classList.toggle("active", state.continuous);
  els.continuousToggle.setAttribute("aria-pressed", String(state.continuous));
  els.continuousToggle.title = state.continuous ? "Continuous play is on" : "Continuous play is off";
}

function clearQueuedTracks({ abortBackground = false, invalidate = false } = {}) {
  clearTimeout(state.prefetchTimer);
  state.prefetchTimer = null;
  if (invalidate || state.playQueue.length || state.generationMode === "background") state.generationRevision += 1;
  state.playQueue.forEach((track) => URL.revokeObjectURL(track.audioUrl));
  state.playQueue = [];
  if (abortBackground && state.generationMode === "background") state.aborter?.abort();
  if (invalidate) state.aborter?.abort();
  renderQueue();
}

function renderStations() {
  const randomButton = `
    <button class="station-button${state.tuningMode === "random" ? " active" : ""}" type="button" data-mode="random" style="--station-color:#ffffff" aria-pressed="${state.tuningMode === "random"}">
      <span class="station-icon">↝</span>
      <span class="station-copy"><strong>Random Radio</strong><small>NEW STYLE EACH SONG</small></span>
      <span class="station-frequency">∞</span>
    </button>`;
  const regularButtons = stations.map((station, index) => `
    <button class="station-button${state.tuningMode === "station" && index === state.stationIndex ? " active" : ""}" type="button" data-index="${index}" style="--station-color:${station.color}" aria-pressed="${state.tuningMode === "station" && index === state.stationIndex}">
      <span class="station-icon">${station.short}</span>
      <span class="station-copy"><strong>${station.name}</strong><small>${station.genre} · ${station.mood}</small></span>
      <span class="station-frequency">${station.frequency}</span>
    </button>`).join("");
  const custom = state.customStation;
  const customButton = `
    <button class="station-button${state.tuningMode === "custom" ? " active" : ""}" type="button" data-mode="custom" style="--station-color:${custom.color}" aria-pressed="${state.tuningMode === "custom"}">
      <span class="station-icon">${escapeHtml(custom.short)}</span>
      <span class="station-copy"><strong>${escapeHtml(custom.name)}</strong><small>${escapeHtml(isCustomConfigured() ? `${custom.genre} · ${custom.mood}` : "CLICK TO SET UP")}</small></span>
      <span class="station-frequency">USER</span>
    </button>`;
  els.stationList.innerHTML = randomButton + regularButtons + customButton;
}

function selectStation(index, { announce = true } = {}) {
  const safeIndex = (index + stations.length) % stations.length;
  state.stationIndex = safeIndex;
  state.tuningMode = "station";
  if (announce) clearQueuedTracks({ invalidate: true });
  const station = stations[safeIndex];
  document.documentElement.style.setProperty("--accent", station.color);
  document.documentElement.style.setProperty("--accent-rgb", station.rgb);
  els.frequency.textContent = station.frequency;
  els.stationGenre.textContent = `${station.genre} · ${station.mood}`.toUpperCase();
  els.nowPlayingTitle.textContent = station.name;
  els.stationLocation.textContent = station.location;
  if (!state.generating && !els.audioPlayer.src) els.trackTitle.textContent = "Ready for a new transmission";
  renderStations();
  localStorage.setItem("radio-station", station.id);
  localStorage.setItem("radio-tuning-mode", "station");
  if (announce) showToast(`Tuned to ${station.frequency} · ${station.name}`);
  if (announce && state.continuous && !els.audioPlayer.paused) scheduleQueueFill();
}

function selectRandomMode({ announce = true } = {}) {
  state.tuningMode = "random";
  if (announce) clearQueuedTracks({ invalidate: true });
  document.documentElement.style.setProperty("--accent", "#ffffff");
  document.documentElement.style.setProperty("--accent-rgb", "255, 255, 255");
  els.frequency.textContent = "∞";
  els.stationGenre.textContent = "EVERY GENRE · FRESH ROLL EACH SONG";
  els.nowPlayingTitle.textContent = "Random Radio";
  els.stationLocation.textContent = "AUTO-TUNE · SHUFFLING EACH SONG";
  renderStations();
  localStorage.setItem("radio-tuning-mode", "random");
  if (announce) showToast("Random Radio will change style every song");
  if (announce && state.continuous && !els.audioPlayer.paused) scheduleQueueFill();
}

function selectCustomMode({ announce = true } = {}) {
  if (!isCustomConfigured()) {
    syncSettingsInputs();
    els.settingsDialog.showModal();
    els.customName.focus();
    showToast("Set up your custom station first");
    return;
  }
  state.tuningMode = "custom";
  if (announce) clearQueuedTracks({ invalidate: true });
  const station = state.customStation;
  document.documentElement.style.setProperty("--accent", station.color);
  document.documentElement.style.setProperty("--accent-rgb", station.rgb);
  els.frequency.textContent = station.frequency;
  els.stationGenre.textContent = `${station.genre} · ${station.mood}`.toUpperCase();
  els.nowPlayingTitle.textContent = station.name;
  els.stationLocation.textContent = station.location;
  renderStations();
  localStorage.setItem("radio-tuning-mode", "custom");
  if (announce) showToast(`Tuned to ${station.name}`);
  if (announce && state.continuous && !els.audioPlayer.paused) scheduleQueueFill();
}

function selectChoice(offset) {
  const current = state.tuningMode === "random" ? 0 : state.tuningMode === "custom" ? stations.length + 1 : state.stationIndex + 1;
  const total = stations.length + 2;
  const next = (current + offset + total) % total;
  if (next === 0) selectRandomMode();
  else if (next === total - 1) selectCustomMode();
  else selectStation(next - 1);
}

function resolveStationForSong() {
  if (state.tuningMode === "custom" && isCustomConfigured()) return state.customStation;
  if (state.tuningMode !== "random") return stations[state.stationIndex];
  const choices = [...stations, ...(isCustomConfigured() ? [state.customStation] : [])];
  const alternatives = choices.filter((station) => station.id !== state.lastGeneratedStationId);
  const pool = alternatives.length ? alternatives : choices;
  return pool[Math.floor(Math.random() * pool.length)];
}

function setServiceStatus(service, connected, detail) {
  state.services[service] = connected;
  const element = service === "lm" ? els.lmStatus : els.audioStatus;
  element.classList.toggle("connected", connected);
  element.classList.toggle("error", !connected);
  element.querySelector("small").textContent = detail;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try { detail = (await response.json()).error?.message || detail; } catch { /* Keep HTTP detail. */ }
    throw new Error(detail);
  }
  return response.json();
}

async function testConnections({ quiet = false } = {}) {
  const lmBase = normalizeBase(els.lmEndpoint.value || state.settings.lmEndpoint);
  const audioBase = normalizeBase(els.audioEndpoint.value || state.settings.audioEndpoint);
  if (!quiet) {
    els.connectionResult.className = "connection-result";
    els.connectionResult.textContent = "Checking LM Studio and audio.cpp…";
    els.testConnections.disabled = true;
  }

  const [lm, audio] = await Promise.allSettled([
    fetchJson(`${lmBase}/models`, { signal: AbortSignal.timeout(6000) }),
    fetchJson(`${audioBase}/health`, { signal: AbortSignal.timeout(6000) })
  ]);

  const lmOkay = lm.status === "fulfilled";
  const audioOkay = audio.status === "fulfilled";
  setServiceStatus("lm", lmOkay, lmOkay ? "Connected" : "Offline");
  setServiceStatus("audio", audioOkay, audioOkay ? "Yue2 ready" : "Offline");

  if (!quiet) {
    els.testConnections.disabled = false;
    els.connectionResult.className = `connection-result ${lmOkay && audioOkay ? "success" : "error"}`;
    if (lmOkay && audioOkay) {
      const models = lm.value?.data?.map((model) => model.id).filter(Boolean) || [];
      els.connectionResult.textContent = `Both services answered. ${models.length ? `LM Studio model: ${models[0]}.` : ""}`;
    } else {
      const missing = [!lmOkay && "LM Studio", !audioOkay && "audio.cpp"].filter(Boolean).join(" and ");
      els.connectionResult.textContent = `${missing} did not answer. Check that the service is running and verify its URL. The downloadable local package includes a same-origin proxy, so CORS setup is not normally needed.`;
    }
  }
  return lmOkay && audioOkay;
}

function roll(list) { return list[Math.floor(Math.random() * list.length)]; }

function createCreativeBrief(station, language) {
  let brief;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const customIdeas = String(station.keywords || "").split(",").map((item) => item.trim()).filter(Boolean);
    const seeds = genreSeeds[station.id] || creativeRolls;
    brief = {
      theme: roll(seeds.themes || creativeRolls.themes),
      customIdea: customIdeas.length ? roll(customIdeas) : "",
      perspective: roll(creativeRolls.perspectives),
      image: roll(seeds.images || creativeRolls.images),
      motif: roll(seeds.motifs || creativeRolls.motifs),
      energy: roll(creativeRolls.energies),
      production: roll(creativeRolls.production)
    };
    brief.signature = [station.id, ...Object.values(brief)].join("|");
    if (brief.signature !== state.lastBriefSignature) break;
  }
  state.lastBriefSignature = brief.signature;
  brief.audioStyle = [language, station.style, station.mood, brief.energy, brief.production, brief.customIdea].map((value) => String(value || "").trim()).filter(Boolean).join(", ");
  if (!brief.audioStyle.trim()) throw new Error("The selected station needs a non-empty sound and instrument style.");
  return brief;
}

function lyricPrompt(station, language, brief, retryFeedback = "") {
  return `Write an original song for a radio station.\nLanguage: ${language}\nGenre and production: ${station.style}\nMood: ${station.mood}\nFresh genre-aware creative roll for this song:\n- Theme: ${brief.theme}\n- Point of view: ${brief.perspective}\n- Central image: ${brief.image}\n- Recurring motif: ${brief.motif}\n- Energy curve: ${brief.energy}\n- Arrangement variation: ${brief.production}${brief.customIdea ? `\n- Station keyword: ${brief.customIdea}` : ""}\nUse these section labels exactly, each on its own line, in this exact order:\n[Verse 1]\n[Pre-Chorus]\n[Chorus]\n[Verse 2]\n[Chorus]\n[Bridge]\n[Final Chorus]\nKeep it singable and vivid. Avoid named artists, existing song titles, clichés about AI, markdown fences, and commentary. Return only a short original title on the first line as \"TITLE: ...\", then the lyrics. Write 220–320 words for space-delimited languages, or a comparably substantial length for Japanese and Korean. The validator requires at least ${MIN_LYRIC_UNITS} normalized lyric units.${retryFeedback ? `\nYour last draft was rejected because: ${retryFeedback}. Create a completely corrected draft.` : ""}`;
}

function waitForRetry(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Generation cancelled", "AbortError"));
    }, { once: true });
  });
}

async function generateLyrics(station, language, brief, signal, onAttempt = () => {}) {
  const base = normalizeBase(state.settings.lmEndpoint);
  let model = state.settings.lmModel.trim();
  if (!model || model.toLowerCase() === "auto") {
    const list = await fetchJson(`${base}/models`, { signal });
    model = list?.data?.[0]?.id;
    if (!model) throw new Error("LM Studio has no loaded model.");
  }

  let feedback = "";
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    onAttempt(attempt, 3, feedback);
    try {
      const data = await fetchJson(`${base}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          model,
          temperature: attempt === 1 ? 0.9 : 0.72,
          max_tokens: 1200,
          messages: [
            { role: "system", content: "You are a skilled multilingual songwriter. Obey the output format exactly and write fully original lyrics." },
            { role: "user", content: lyricPrompt(station, language, brief, feedback) }
          ]
        })
      });
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error("LM Studio returned no lyrics.");
      const song = splitSong(content);
      const validation = validateSong(song);
      if (validation.valid) return song;
      feedback = validation.errors.join("; ");
      lastError = new Error(`Lyrics failed validation: ${feedback}`);
    } catch (error) {
      if (error.name === "AbortError") throw error;
      lastError = error;
      feedback = error.message || "the request failed";
    }
    if (attempt < 3) await waitForRetry(650 * attempt, signal);
  }
  throw lastError || new Error("Could not produce valid lyrics after 3 attempts.");
}

function findAudioString(value, key = "") {
  if (typeof value === "string") {
    if (value.startsWith("data:audio/")) return value;
    if (/audio|wav|base64|data/i.test(key) && value.length > 1000 && /^[A-Za-z0-9+/=\s]+$/.test(value.slice(0, 1000))) return value.replace(/\s/g, "");
    return null;
  }
  if (!value || typeof value !== "object") return null;
  for (const [childKey, childValue] of Object.entries(value)) {
    const found = findAudioString(childValue, childKey);
    if (found) return found;
  }
  return null;
}

async function requestAudio(brief, lyrics, signal) {
  const response = await fetch(`${normalizeBase(state.settings.audioEndpoint)}/v1/tasks/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, audio/wav" },
    signal,
    body: JSON.stringify(createYue2Request({
      model: state.settings.audioModel,
      lyrics,
      style: brief.audioStyle,
      seed: Math.floor(Math.random() * 2147483647)
    }))
  });
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try { detail = (await response.json()).error?.message || detail; } catch { /* Keep HTTP detail. */ }
    throw new Error(detail);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.startsWith("audio/")) return URL.createObjectURL(await response.blob());
  const data = await response.json();
  const audio = findAudioString(data);
  if (!audio) throw new Error("audio.cpp completed, but its response did not include browser-playable WAV data.");
  const source = audio.startsWith("data:") ? audio : `data:audio/wav;base64,${audio}`;
  const blob = await (await fetch(source)).blob();
  return URL.createObjectURL(blob);
}

async function generateAudio(brief, lyrics, signal, onAttempt = () => {}) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    onAttempt(attempt, 3);
    try {
      return await requestAudio(brief, lyrics, signal);
    } catch (error) {
      if (error.name === "AbortError") throw error;
      lastError = error;
      if (attempt < 3) await waitForRetry(1000 * attempt, signal);
    }
  }
  throw new Error(`Yue2 failed after 3 attempts: ${lastError?.message || "unknown error"}`);
}

function renderLyrics(lyrics) {
  const fragment = document.createDocumentFragment();
  String(lyrics).split(/\n{2,}/).forEach((block) => {
    const paragraph = document.createElement("p");
    if (/^\s*\[[^\]]+\]/.test(block)) {
      const [heading, ...body] = block.split("\n");
      const label = document.createElement("span");
      label.className = "verse-label";
      label.textContent = heading;
      paragraph.append(label, document.createElement("br"), document.createTextNode(body.join("\n")));
    } else paragraph.textContent = block;
    fragment.append(paragraph);
  });
  els.lyricsContent.replaceChildren(fragment);
}

function setGenerationStage(stage, detail) {
  els.generationStage.textContent = stage;
  els.generationDetail.textContent = detail;
}

function archiveCurrentTrack() {
  if (!state.currentTrack || state.currentTrackArchived) return;
  state.history.unshift({
    title: state.currentTrack.title,
    station: state.currentTrack.station.name,
    language: state.currentTrack.language,
    playedAt: new Date().toISOString()
  });
  state.history = state.history.slice(0, 25);
  state.currentTrackArchived = true;
  localStorage.setItem("radio-history", JSON.stringify(state.history));
  renderHistory();
}

async function playTrack(track, { autoplay = true } = {}) {
  if (state.currentTrack && state.currentTrack !== track) archiveCurrentTrack();
  if (state.audioUrl && state.audioUrl !== track.audioUrl) URL.revokeObjectURL(state.audioUrl);
  state.audioUrl = track.audioUrl;
  state.currentTrack = track;
  state.currentTrackArchived = false;
  state.lyrics = track.lyrics;
  els.trackTitle.textContent = track.title;
  els.lyricsLanguage.textContent = languageCodes[track.language] || track.language.toUpperCase();
  renderLyrics(track.lyrics);
  showLyricsTab();
  els.audioPlayer.src = track.audioUrl;
  els.audioPlayer.volume = Number(els.volumeControl.value);
  els.saveSong.disabled = false;
  renderQueue();
  if (autoplay) await els.audioPlayer.play();
}

function scheduleQueueFill(delay = 150) {
  clearTimeout(state.prefetchTimer);
  state.prefetchTimer = null;
  if (!state.continuous || state.playQueue.length >= state.queueTarget || state.generating || els.audioPlayer.paused || els.audioPlayer.ended) return;
  state.prefetchTimer = setTimeout(() => {
    state.prefetchTimer = null;
    makeSong({ autoplay: true, background: true });
  }, delay);
}

async function continuePlayback() {
  if (!state.continuous) return;
  if (state.playQueue.length) {
    const track = state.playQueue.shift();
    renderQueue();
    await playTrack(track, { autoplay: true });
    showToast("Next transmission playing");
    scheduleQueueFill();
  } else if (!state.generating) {
    await makeSong({ autoplay: true, background: true });
  } else {
    setGenerationStage("PREPARING NEXT SONG", "The current song ended; playback will continue as soon as Yue2 finishes…");
  }
}

async function makeSong({ autoplay = true, background = false } = {}) {
  if (state.generating) {
    if (!background) showToast("A song is already being prepared");
    return null;
  }
  if (!state.services.lm || !state.services.audio) {
    const ready = await testConnections({ quiet: true });
    if (!ready) {
      els.connectionResult.className = "connection-result error";
      els.connectionResult.textContent = "Start both local services, then test the connection.";
      if (!background) els.settingsDialog.showModal();
      return null;
    }
  }

  state.generating = true;
  state.generationMode = background ? "background" : "manual";
  state.aborter = new AbortController();
  const controller = state.aborter;
  const revision = state.generationRevision;
  renderQueue();
  els.playButton.classList.add("loading");
  els.generationStatus.hidden = false;
  const station = resolveStationForSong();
  const language = els.languageSelect.value;
  try {
    const brief = createCreativeBrief(station, language);
    state.lastGeneratedStationId = station.id;
    const prefix = background ? "NEXT SONG · " : "";
    const song = await generateLyrics(station, language, brief, controller.signal, (attempt, total, feedback) => {
      const stationNote = state.tuningMode === "random" ? ` Random Radio picked ${station.name}.` : "";
      setGenerationStage(`${prefix}WRITING LYRICS · ${attempt}/${total}`, feedback ? "The previous draft failed validation; LM Studio is correcting it…" : `LM Studio is writing in ${language}.${stationNote}`);
    });
    const audioUrl = await generateAudio(brief, song.lyrics, controller.signal, (attempt, total) => {
      setGenerationStage(`${prefix}COMPOSING AUDIO · ${attempt}/${total}`, "Yue2 is arranging and rendering the song. This can take several minutes…");
    });
    if (revision !== state.generationRevision || !state.continuous && background) {
      URL.revokeObjectURL(audioUrl);
      return null;
    }

    const track = { ...song, audioUrl, station, language, brief };
    if (els.audioPlayer.src && !els.audioPlayer.paused && !els.audioPlayer.ended) {
      state.playQueue.push(track);
      renderQueue();
      showToast(`Song queued · ${state.playQueue.length} ready`);
    } else {
      await playTrack(track, { autoplay });
      showToast("New transmission ready");
    }
    return track;
  } catch (error) {
    if (error.name === "AbortError") {
      if (!background) showToast("Generation cancelled");
    }
    else {
      showToast(error.message || "Could not make the song");
      els.connectionResult.className = "connection-result error";
      els.connectionResult.textContent = error.message || "Generation failed.";
    }
    return null;
  } finally {
    if (state.aborter === controller) {
      state.generating = false;
      state.generationMode = null;
      state.aborter = null;
      els.playButton.classList.remove("loading");
      els.generationStatus.hidden = true;
      renderQueue();
      if (state.continuous && !els.audioPlayer.paused && !els.audioPlayer.ended) scheduleQueueFill();
    }
  }
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "—:—";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function updateProgress() {
  const { currentTime, duration } = els.audioPlayer;
  const percent = duration ? (currentTime / duration) * 100 : 0;
  els.progressFill.style.width = `${percent}%`;
  els.progressTrack.setAttribute("aria-valuenow", String(Math.round(percent)));
  els.elapsedTime.textContent = formatTime(currentTime);
  els.durationTime.textContent = formatTime(duration);
}

function setProgress(clientX) {
  if (!Number.isFinite(els.audioPlayer.duration)) return;
  const rect = els.progressTrack.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  els.audioPlayer.currentTime = ratio * els.audioPlayer.duration;
}

function renderQueue() {
  els.queueCount.textContent = String(state.playQueue.length);
  const building = state.generating && state.generationMode === "background";
  els.emptyQueue.hidden = state.playQueue.length > 0 || building;
  const songs = state.playQueue.map((item, index) => `
    <li class="queue-item">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${index === 0 ? "NEXT" : `+${index + 1}`} · ${escapeHtml(item.station.name)} · ${escapeHtml(item.language)}</span>
      <button type="button" data-queue-save="${index}" aria-label="Save ${escapeHtml(item.title)} as WAV">SAVE WAV</button>
    </li>
  `).join("");
  const pending = building ? `<li class="queue-item building"><strong>Preparing another song…</strong><span>LM Studio + Yue2</span></li>` : "";
  els.queueList.innerHTML = songs + pending;
}

function renderHistory() {
  els.historyCount.textContent = String(state.history.length);
  els.emptyHistory.hidden = state.history.length > 0;
  els.historyList.innerHTML = state.history.map((item) => {
    const date = new Date(item.playedAt);
    const playedAt = Number.isNaN(date.getTime()) ? "PREVIOUS" : date.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
    return `<li class="queue-item"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.station)} · ${escapeHtml(item.language)}</span><time>${escapeHtml(playedAt)}</time></li>`;
  }).join("");
}

function safeFileName(value) {
  return String(value || "radio-song").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/[. ]+$/g, "").trim() || "radio-song";
}

function saveTrack(track) {
  if (!track?.audioUrl) return showToast("No song file is ready yet");
  const link = document.createElement("a");
  link.href = track.audioUrl;
  link.download = `${safeFileName(track.title)}.wav`;
  document.body.append(link);
  link.click();
  link.remove();
  showToast("WAV download started");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

function showLyricsTab() {
  els.lyricsTab.classList.add("active");
  els.queueTab.classList.remove("active");
  els.historyTab.classList.remove("active");
  els.lyricsTab.setAttribute("aria-selected", "true");
  els.queueTab.setAttribute("aria-selected", "false");
  els.historyTab.setAttribute("aria-selected", "false");
  els.lyricsPanel.hidden = false;
  els.queuePanel.hidden = true;
  els.historyPanel.hidden = true;
}

function showQueueTab() {
  els.queueTab.classList.add("active");
  els.lyricsTab.classList.remove("active");
  els.historyTab.classList.remove("active");
  els.queueTab.setAttribute("aria-selected", "true");
  els.lyricsTab.setAttribute("aria-selected", "false");
  els.historyTab.setAttribute("aria-selected", "false");
  els.queuePanel.hidden = false;
  els.lyricsPanel.hidden = true;
  els.historyPanel.hidden = true;
}

function showHistoryTab() {
  els.historyTab.classList.add("active");
  els.lyricsTab.classList.remove("active");
  els.queueTab.classList.remove("active");
  els.historyTab.setAttribute("aria-selected", "true");
  els.lyricsTab.setAttribute("aria-selected", "false");
  els.queueTab.setAttribute("aria-selected", "false");
  els.historyPanel.hidden = false;
  els.lyricsPanel.hidden = true;
  els.queuePanel.hidden = true;
}

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2600);
}

function saveSettings() {
  state.settings = {
    lmEndpoint: normalizeBase(els.lmEndpoint.value),
    lmModel: els.lmModel.value.trim() || "Auto",
    audioEndpoint: normalizeBase(els.audioEndpoint.value),
    audioModel: els.audioModel.value.trim() || "yue2-radio"
  };
  const proposedCustom = {
    ...defaultCustomStation,
    name: els.customName.value.trim() || defaultCustomStation.name,
    genre: els.customGenre.value.trim() || defaultCustomStation.genre,
    mood: els.customMood.value.trim() || defaultCustomStation.mood,
    style: els.customStyle.value.trim(),
    keywords: els.customKeywords.value.trim()
  };
  const customChanged = JSON.stringify(proposedCustom) !== JSON.stringify(state.customStation);
  state.customStation = proposedCustom;
  localStorage.setItem("radio-settings", JSON.stringify(state.settings));
  localStorage.setItem("radio-custom-station", JSON.stringify(state.customStation));
  if (customChanged) clearQueuedTracks({ invalidate: true });
  renderStations();
  if (state.tuningMode === "custom" && !isCustomConfigured()) {
    state.tuningMode = "station";
    selectStation(state.stationIndex, { announce: false });
  } else if (state.tuningMode === "custom") selectCustomMode({ announce: false });
  showToast(isCustomConfigured() ? "Settings and custom station saved" : "Settings saved");
  setTimeout(() => testConnections({ quiet: true }), 0);
}

function registerWebMcp() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const stationIds = ["random", ...stations.map((station) => station.id), "custom"];
  const languageNames = Object.keys(languageCodes);

  const tools = [
    {
      name: "tune_radio_station",
      title: "Tune radio station",
      description: "Select a visible Radio station by its stable station ID without generating a song.",
      inputSchema: { type: "object", properties: { stationId: { type: "string", enum: stationIds } }, required: ["stationId"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (input?.stationId === "random") {
          selectRandomMode({ announce: false });
          return { stationId: "random", station: "Random Radio", frequency: "shuffle" };
        }
        if (input?.stationId === "custom") {
          if (!isCustomConfigured()) throw new Error("Custom Radio has not been configured in settings.");
          selectCustomMode({ announce: false });
          return { stationId: "custom", station: state.customStation.name, frequency: state.customStation.frequency };
        }
        const index = stations.findIndex((station) => station.id === input?.stationId);
        if (index < 0) throw new Error("Unknown station ID.");
        selectStation(index, { announce: false });
        return { stationId: stations[index].id, station: stations[index].name, frequency: stations[index].frequency };
      }
    },
    {
      name: "set_radio_language",
      title: "Set vocal language",
      description: "Set the language used for the next locally generated song.",
      inputSchema: { type: "object", properties: { language: { type: "string", enum: languageNames } }, required: ["language"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!languageNames.includes(input?.language)) throw new Error("Unsupported language.");
        els.languageSelect.value = input.language;
        els.languageSelect.dispatchEvent(new Event("change"));
        return { language: input.language };
      }
    },
    {
      name: "start_song_generation",
      title: "Generate radio song",
      description: "Start the visible LM Studio lyrics and Yue2 audio workflow for the currently tuned station. Local services must be configured.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      async execute() {
        if (state.generating) throw new Error("A song is already generating.");
        const track = await makeSong({ autoplay: false });
        if (!track) throw new Error("Song generation did not complete.");
        return { station: track.station.name, language: track.language, title: track.title, status: state.playQueue.includes(track) ? "queued" : "ready" };
      }
    }
  ];
  for (const tool of tools) Promise.resolve(context.registerTool(tool)).catch(() => {});
}

els.stationList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-index], [data-mode]");
  if (!button) return;
  if (button.dataset.mode === "random") selectRandomMode();
  else if (button.dataset.mode === "custom") selectCustomMode();
  else selectStation(Number(button.dataset.index));
});
els.previousStation.addEventListener("click", () => selectChoice(-1));
els.nextStation.addEventListener("click", () => selectChoice(1));
els.openSettings.addEventListener("click", () => { syncSettingsInputs(); els.settingsDialog.showModal(); });
els.lmStatus.addEventListener("click", () => els.settingsDialog.showModal());
els.audioStatus.addEventListener("click", () => els.settingsDialog.showModal());
els.testConnections.addEventListener("click", () => testConnections());
els.settingsForm.addEventListener("submit", (event) => { if (event.submitter?.value !== "cancel") saveSettings(); });
els.generateButton.addEventListener("click", () => makeSong({ autoplay: true }));
els.playButton.addEventListener("click", async () => {
  if (state.generating) return;
  if (!els.audioPlayer.src) return makeSong({ autoplay: true });
  if (els.audioPlayer.paused) await els.audioPlayer.play(); else els.audioPlayer.pause();
});
els.cancelGeneration.addEventListener("click", () => {
  clearTimeout(state.prefetchTimer);
  state.prefetchTimer = null;
  state.continuous = false;
  localStorage.setItem("radio-continuous", "off");
  syncContinuousToggle();
  state.aborter?.abort();
  showToast("Generation cancelled · continuous fill paused");
});
els.continuousToggle.addEventListener("click", () => {
  state.continuous = !state.continuous;
  localStorage.setItem("radio-continuous", state.continuous ? "on" : "off");
  syncContinuousToggle();
  if (state.continuous) {
    showToast("Continuous play on");
    scheduleQueueFill();
  } else {
    clearTimeout(state.prefetchTimer);
    state.prefetchTimer = null;
    if (state.generationMode === "background") state.aborter?.abort();
    showToast("Continuous play off");
  }
});
els.queueTarget.addEventListener("change", () => {
  state.queueTarget = Math.min(3, Math.max(1, Number(els.queueTarget.value) || 2));
  els.queueTarget.value = String(state.queueTarget);
  localStorage.setItem("radio-queue-target", String(state.queueTarget));
  renderQueue();
  scheduleQueueFill(50);
});
els.volumeControl.addEventListener("input", () => { els.audioPlayer.volume = Number(els.volumeControl.value); });
els.languageSelect.addEventListener("change", () => {
  clearQueuedTracks({ invalidate: true });
  localStorage.setItem("radio-language", els.languageSelect.value);
  els.lyricsLanguage.textContent = languageCodes[els.languageSelect.value] || els.languageSelect.value.toUpperCase();
  showToast(`Vocals set to ${els.languageSelect.options[els.languageSelect.selectedIndex].text}`);
  if (state.continuous && !els.audioPlayer.paused) scheduleQueueFill();
});
els.audioPlayer.addEventListener("play", () => {
  els.playButton.classList.add("playing");
  els.waveform.classList.add("active");
  scheduleQueueFill();
});
els.audioPlayer.addEventListener("pause", () => { els.playButton.classList.remove("playing"); els.waveform.classList.remove("active"); });
els.audioPlayer.addEventListener("ended", () => {
  els.playButton.classList.remove("playing");
  els.waveform.classList.remove("active");
  archiveCurrentTrack();
  continuePlayback();
});
els.audioPlayer.addEventListener("timeupdate", updateProgress);
els.audioPlayer.addEventListener("durationchange", updateProgress);
els.progressTrack.addEventListener("click", (event) => setProgress(event.clientX));
els.progressTrack.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight"].includes(event.key) || !Number.isFinite(els.audioPlayer.duration)) return;
  event.preventDefault();
  els.audioPlayer.currentTime = Math.min(els.audioPlayer.duration, Math.max(0, els.audioPlayer.currentTime + (event.key === "ArrowRight" ? 5 : -5)));
});
els.lyricsTab.addEventListener("click", showLyricsTab);
els.queueTab.addEventListener("click", showQueueTab);
els.historyTab.addEventListener("click", showHistoryTab);
els.copyLyrics.addEventListener("click", async () => {
  if (!state.lyrics) return showToast("Generate lyrics first");
  await navigator.clipboard.writeText(state.lyrics);
  showToast("Lyrics copied");
});
els.saveSong.addEventListener("click", () => saveTrack(state.currentTrack));
els.queueList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-queue-save]");
  if (!button) return;
  saveTrack(state.playQueue[Number(button.dataset.queueSave)]);
});
window.addEventListener("beforeunload", () => {
  if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
  state.playQueue.forEach((track) => URL.revokeObjectURL(track.audioUrl));
});

[...els.waveform.children].forEach((bar, index) => bar.style.setProperty("--i", index + 1));
loadPreferences();
if (state.tuningMode === "random") selectRandomMode({ announce: false });
else if (state.tuningMode === "custom") selectCustomMode({ announce: false });
else selectStation(state.stationIndex, { announce: false });
renderQueue();
renderHistory();
registerWebMcp();
setTimeout(() => testConnections({ quiet: true }), 500);
