"use client";

import { useEffect, useRef } from "react";
import { clamp01, enterProgress, lerp, onFrame, prefersReducedMotion } from "@/lib/loop";
import { parseParticles } from "@/lib/particles";
import { fragmentShader, vertexShader } from "./shaders";
import styles from "./ParticleScene.module.scss";

// Fired as `particles.bin` downloads so the preloader can count real bytes.
export const PARTICLES_PROGRESS = "particles:progress";
export const PARTICLES_READY = "particles:ready";

async function fetchWithProgress(url: string, signal: AbortSignal) {
  const res = await fetch(url, { signal });
  if (!res.ok || !res.body) throw new Error(`${url}: ${res.status}`);
  const total = Number(res.headers.get("content-length")) || 0;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total) window.dispatchEvent(new CustomEvent(PARTICLES_PROGRESS, { detail: received / total }));
  }
  const out = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out.buffer;
}

export default function ParticleScene() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const abort = new AbortController();
    let dispose = () => {};

    (async () => {
      const THREE = await import("three");
      const buffer = await fetchWithProgress("/particles.bin", abort.signal);
      if (abort.signal.aborted) return;

      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const reduced = prefersReducedMotion();
      const data = parseParticles(buffer, coarse ? 2 : 1);

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
      } catch (err) {
        console.error("WebGL unavailable, skipping particles:", err);
        window.dispatchEvent(new Event(PARTICLES_READY));
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
      camera.position.z = 4;

      const seeds = new Float32Array(data.count);
      for (let i = 0; i < data.count; i++) seeds[i] = Math.random();

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(data.face, 3));
      geometry.setAttribute("aFace", new THREE.BufferAttribute(data.face, 3));
      geometry.setAttribute("aGlobe", new THREE.BufferAttribute(data.globe, 3));
      geometry.setAttribute("aIndia", new THREE.BufferAttribute(data.india, 3));
      geometry.setAttribute("aLuma", new THREE.BufferAttribute(data.luma, 1));
      geometry.setAttribute("aPin", new THREE.BufferAttribute(data.pin, 1));
      geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
      // Morphs move points far outside the face's bounds; never cull the cloud.
      geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);

      const uniforms = {
        uTime: { value: 0 },
        uIntro: { value: reduced ? 1 : 0 },
        uMorph1: { value: 0 },
        uMorph2: { value: 0 },
        uSpin: { value: 0 },
        uFade: { value: 1 },
        uSize: { value: coarse ? 26 : 20 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uColor: { value: new THREE.Color("#ECE8E1") },
        uGlow: { value: new THREE.Color("#F4D9B0") },
      };
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      let portrait = false;
      const resize = () => {
        const w = window.innerWidth, h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        portrait = w < h;
      };
      resize();
      window.addEventListener("resize", resize);

      const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
      const onPointer = (e: PointerEvent) => {
        mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      const stage = (id: string) => document.getElementById(id);
      const sections = {
        statement: stage("statement"),
        world: stage("world"),
        india: stage("india"),
        learning: stage("learning"),
        work: stage("work"),
      };

      let introStart = -1;
      const startIntro = () => (introStart = performance.now());
      // In dev, StrictMode remounts this scene; the preloader may already be gone.
      if (document.body.dataset.preloading === "true") {
        window.addEventListener("preloader:done", startIntro, { once: true });
      } else {
        startIntro();
      }
      window.dispatchEvent(new Event(PARTICLES_READY));

      const smooth = { m1: 0, m2: 0, x: 0, slide: 0 };
      const stop = onFrame((time, dt) => {
        uniforms.uTime.value = time / 1000;

        if (!reduced && introStart >= 0) {
          uniforms.uIntro.value = clamp01((performance.now() - introStart) / 2800);
        }

        const pStatement = enterProgress(sections.statement);
        const m1 = enterProgress(sections.world);
        const m2 = enterProgress(sections.india);
        const pLearning = enterProgress(sections.learning);
        const slide = enterProgress(sections.work);

        // Ease toward the scroll targets so wheel steps never jolt the cloud.
        const k = reduced ? 1 : 1 - Math.pow(0.0015, dt);
        smooth.m1 = lerp(smooth.m1, m1, k);
        smooth.m2 = lerp(smooth.m2, m2, k);
        smooth.slide = lerp(smooth.slide, slide, k);
        uniforms.uMorph1.value = smooth.m1;
        uniforms.uMorph2.value = smooth.m2;
        // Desktop slides the cloud aside; portrait has no room, so it fades out fully.
        uniforms.uFade.value = 1 - smooth.slide * (portrait ? 1 : 0.85);
        if (!reduced) uniforms.uSpin.value += dt * 0.25 * smooth.m1;

        // Where the cloud sits at each stage (text is always on the other side):
        // face centred → right of the statement → right of the world/India captions
        // → right of "learning" → off to the left for the work list.
        let targetX = 0;
        if (!portrait) {
          targetX = lerp(targetX, 0.85, pStatement);
          targetX = lerp(targetX, 0.55, m1);
          targetX = lerp(targetX, 0.85, pLearning);
          targetX = lerp(targetX, -3.2, slide);
        }
        smooth.x = lerp(smooth.x, targetX, k);
        points.position.x = smooth.x;
        // Lift the face clear of the hero name; settle for the later shapes.
        const liftY = portrait ? 0.35 : 0.14;
        points.position.y = liftY * (1 - smooth.m1 * 0.6);
        points.scale.setScalar(portrait ? 0.72 : 1);

        mouse.x = lerp(mouse.x, mouse.tx, reduced ? 0 : 1 - Math.pow(0.02, dt));
        mouse.y = lerp(mouse.y, mouse.ty, reduced ? 0 : 1 - Math.pow(0.02, dt));
        points.rotation.y = mouse.x * 0.28;
        points.rotation.x = mouse.y * 0.14;

        renderer.render(scene, camera);
      });

      dispose = () => {
        stop();
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("preloader:done", startIntro);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })().catch((err) => {
      if (!abort.signal.aborted) {
        console.error("Particle scene failed:", err);
        window.dispatchEvent(new Event(PARTICLES_READY));
      }
    });

    return () => {
      abort.abort();
      dispose();
    };
  }, []);

  return <div ref={host} className={styles.scene} aria-hidden="true" />;
}
