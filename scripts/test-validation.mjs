import assert from "node:assert/strict";
import { MIN_LYRIC_UNITS, countLyricUnits, splitSong, validateSong } from "../dist/song-validation.js";
import { createYue2Request } from "../dist/audio-request.js";

const sections = ["Verse 1", "Pre-Chorus", "Chorus", "Verse 2", "Chorus", "Bridge", "Final Chorus"];
const longLine = "Open windows carry every bright melody across the waking city tonight";
const validRaw = `TITLE: Test Signal\n${sections.map((section) => `[${section}]\n${longLine}\n${longLine}\n${longLine}`).join("\n")}`;
const validSong = splitSong(validRaw);

assert.equal(validSong.title, "Test Signal");
assert.ok(countLyricUnits(validSong.lyrics) >= MIN_LYRIC_UNITS);
assert.equal(validateSong(validSong).valid, true);

const tooShort = splitSong("TITLE: Tiny\n[Verse 1]\nHello\n[Chorus]\nHello");
assert.equal(validateSong(tooShort).valid, false);
assert.ok(validateSong(tooShort).errors.some((error) => error.includes("short")));

const noTitle = splitSong(validRaw.replace("TITLE: Test Signal\n", ""));
assert.equal(validateSong(noTitle).valid, false);
assert.ok(validateSong(noTitle).errors.some((error) => error.includes("TITLE")));

const japanese = "夜の街を歩いて光る星を見上げる風の歌を聞いて明日へ進もう";
assert.ok(countLyricUnits(japanese) > 10);

const request = createYue2Request({ model: "yue2-radio", lyrics: validSong.lyrics, style: "Finnish, synth pop", seed: 42 });
assert.equal(request.request.lyrics, validSong.lyrics);
assert.equal(request.request.options.style, "Finnish, synth pop");
assert.equal(request.request.style, undefined);
assert.throws(() => createYue2Request({ model: "yue2-radio", lyrics: "test", style: "", seed: 1 }), /non-empty style/);

console.log("Song validation tests passed.");
