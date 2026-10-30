// Parses public/particles.bin. Layout is documented in scripts/build-particles.mjs.

export type ParticleData = {
  count: number;
  face: Float32Array;
  globe: Float32Array;
  india: Float32Array;
  luma: Float32Array;
  pin: Float32Array;
};

// `keepEvery` thins the cloud on touch devices (2 = half the points).
export function parseParticles(buffer: ArrayBuffer, keepEvery = 1): ParticleData {
  const view = new DataView(buffer);
  const magic = String.fromCharCode(...new Uint8Array(buffer, 0, 4));
  if (magic !== "PTCL") throw new Error("particles.bin: bad header");
  const total = view.getUint32(4, true);
  const scale = view.getFloat32(8, true);
  const count = Math.ceil(total / keepEvery);

  const face = new Float32Array(count * 3);
  const globe = new Float32Array(count * 3);
  const india = new Float32Array(count * 3);
  const luma = new Float32Array(count);
  const pin = new Float32Array(count);

  for (let n = 0; n < count; n++) {
    const o = 12 + n * keepEvery * 20;
    for (let k = 0; k < 3; k++) {
      face[n * 3 + k] = view.getInt16(o + k * 2, true) * scale;
      globe[n * 3 + k] = view.getInt16(o + 6 + k * 2, true) * scale;
      india[n * 3 + k] = view.getInt16(o + 12 + k * 2, true) * scale;
    }
    luma[n] = view.getUint8(o + 18) / 255;
    pin[n] = view.getUint8(o + 19) / 255;
  }
  return { count, face, globe, india, luma, pin };
}
