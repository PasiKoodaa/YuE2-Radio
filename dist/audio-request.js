export function createYue2Request({ model, lyrics, style, seed, steps = 8 }) {
  const cleanStyle = String(style || "").trim();
  if (!cleanStyle) throw new Error("Yue2 requires a non-empty style prompt.");
  const cleanLyrics = String(lyrics || "").trim();
  if (!cleanLyrics) throw new Error("Yue2 requires non-empty lyrics.");
  return {
    model,
    request: {
      lyrics: cleanLyrics,
      seed,
      options: {
        style: cleanStyle,
        cot: "off",
        num_inference_steps: steps
      }
    }
  };
}
