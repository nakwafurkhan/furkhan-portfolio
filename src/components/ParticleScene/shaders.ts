// Each particle carries three target positions (face, globe, India) and blends
// between them. uMorph1/uMorph2 come from scroll; aSeed staggers particles so
// the morph sweeps through the cloud instead of every point moving at once.

export const vertexShader = /* glsl */ `
  attribute vec3 aFace;
  attribute vec3 aGlobe;
  attribute vec3 aIndia;
  attribute float aLuma;
  attribute float aPin;
  attribute float aSeed;

  uniform float uTime;
  uniform float uIntro;
  uniform float uMorph1;
  uniform float uMorph2;
  uniform float uSpin;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uFade;

  varying float vAlpha;
  varying float vWarm;

  vec3 rotateY(vec3 p, float a) {
    float c = cos(a), s = sin(a);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  }

  // Stagger 0..1 progress by seed: early particles lead, late ones follow.
  float stagger(float t, float seed) {
    return smoothstep(0.0, 1.0, clamp(t * 1.6 - seed * 0.6, 0.0, 1.0));
  }

  void main() {
    float m1 = stagger(uMorph1, aSeed);
    float m2 = stagger(uMorph2, aSeed);
    float intro = stagger(uIntro, aSeed);

    vec3 globe = rotateY(aGlobe, uSpin * (1.0 - m2));
    vec3 pos = mix(mix(aFace, globe, m1), aIndia, m2);

    // Mid-morph swirl: strongest halfway through each transition, zero at rest.
    float midway = m1 * (1.0 - m1) + m2 * (1.0 - m2);
    vec3 swirl = vec3(
      sin(aSeed * 40.0 + uTime * 0.7),
      cos(aSeed * 31.0 + uTime * 0.6),
      sin(aSeed * 17.0 + uTime * 0.5)
    );
    pos += swirl * midway * 0.9;

    // Idle breathing so the cloud never looks frozen.
    pos += swirl * 0.006;

    // Formation intro: particles fly in from a wide scattered shell.
    vec3 scattered = normalize(swirl + 0.001) * (3.5 + aSeed * 2.0);
    pos = mix(scattered, pos, intro);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // Globe: fade the far hemisphere so continents read instead of a solid ball.
    float front = smoothstep(-0.4, 0.5, globe.z / 0.85);
    float globeAlpha = mix(0.06, 0.85, front);
    // India is flat and dense; additive blending saturates it, so it runs dimmer.
    float shapeAlpha = mix(mix(1.0, globeAlpha, m1), 0.42, m2);

    float faceLight = mix(aLuma, 0.7, m1);
    float pinGlow = aPin * m2 * (0.75 + 0.25 * sin(uTime * 3.0 + aSeed * 6.0));
    gl_PointSize = uSize * uPixelRatio * (0.55 + faceLight * 0.6 + pinGlow * 0.7) / -mv.z;

    vAlpha = ((0.25 + faceLight * 0.75) * shapeAlpha + pinGlow * 0.35) * intro * uFade;
    vWarm = clamp(aLuma * (1.0 - m1) * 0.6 + pinGlow, 0.0, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uGlow;

  varying float vAlpha;
  varying float vWarm;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    vec3 color = mix(uColor, uGlow, vWarm);
    gl_FragColor = vec4(color, pow(core, 1.6) * vAlpha);
  }
`;
