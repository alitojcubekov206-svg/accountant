"use client";

import { useEffect, useRef, useState } from "react";
import type * as Three from "three";

interface FinanceSceneProps { paused: boolean; resetKey: number }

export function FinanceScene({ paused, resetKey }: FinanceSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const redrawRef = useRef<(() => void) | null>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => { pausedRef.current = paused; redrawRef.current?.(); }, [paused]);
  useEffect(() => { resetRef.current?.(); }, [resetKey]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    async function createScene() {
      const [THREE, { RoundedBoxGeometry }] = await Promise.all([
        import("three"), import("three/addons/geometries/RoundedBoxGeometry.js"),
      ]);
      if (disposed || !host) return;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
      renderer.setClearColor(0x000000, 0);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
      renderer.domElement.setAttribute("aria-hidden", "true");
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.set(0, 1.5, 11.7);
      camera.lookAt(0, 0, 0);
      scene.add(new THREE.AmbientLight(0xffffff, 2.7));
      const key = new THREE.DirectionalLight(0xffffff, 5);
      key.position.set(-3, 7, 6);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = -5;
      key.shadow.camera.right = 5;
      key.shadow.camera.top = 5;
      key.shadow.camera.bottom = -5;
      key.shadow.normalBias = 0.035;
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x9bf7bd, 4);
      rim.position.set(4, 2, -3);
      scene.add(rim);
      const fill = new THREE.DirectionalLight(0xc9d6ff, 2.5);
      fill.position.set(-4, -1, 3);
      scene.add(fill);

      const geometries: Three.BufferGeometry[] = [];
      const materials: Three.Material[] = [];
      const textures: Three.Texture[] = [];
      function material(color: number, metalness = 0, roughness = 0.35) {
        const result = new THREE.MeshStandardMaterial({ color, metalness, roughness });
        materials.push(result);
        return result;
      }
      const ivory = material(0xf5f5ed, 0.35, 0.28);
      const dark = material(0x142a24, 0.3, 0.3);
      const mint = material(0x9bedab, 0.3, 0.23);
      const silver = material(0xbecbc4, 0.8, 0.23);
      const core = new THREE.Group();
      scene.add(core);
      function box(width: number, height: number, depth: number, radius: number, surface: Three.Material) {
        const geometry = new RoundedBoxGeometry(width, height, depth, 3, radius);
        geometries.push(geometry);
        const mesh = new THREE.Mesh(geometry, surface);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
      }
      const body = box(2.55, 2.6, 1.35, 0.18, ivory);
      body.rotation.z = -0.05;
      core.add(body);
      const display = box(2.16, 2.12, 0.075, 0.1, dark);
      display.position.set(0, 0.03, 0.72);
      display.rotation.z = -0.05;
      core.add(display);
      const chart = new THREE.Group();
      chart.position.set(0, -0.58, 0.81);
      chart.rotation.z = -0.05;
      [0.36, 0.6, 0.51, 0.92, 1.23].forEach((height, index) => {
        const bar = box(0.21, height, 0.17, 0.07, index === 4 ? ivory : mint);
        bar.position.set(-0.7 + index * 0.35, height / 2, 0);
        chart.add(bar);
      });
      core.add(chart);
      const topLine = box(0.7, 0.065, 0.04, 0.018, mint);
      topLine.position.set(-0.49, 0.8, 0.83);
      topLine.rotation.z = -0.05;
      core.add(topLine);
      const topDot = box(0.14, 0.14, 0.05, 0.04, ivory);
      topDot.position.set(0.77, 0.76, 0.83);
      core.add(topDot);
      core.rotation.set(-0.12, -0.5, 0.07);

      const ringGeometry = new THREE.TorusGeometry(2.18, 0.028, 12, 120);
      geometries.push(ringGeometry);
      const ring = new THREE.Mesh(ringGeometry, silver);
      ring.rotation.set(1.08, 0.16, 0.25);
      ring.position.y = -0.2;
      scene.add(ring);
      const orbit = new THREE.Group();
      scene.add(orbit);
      const smallCube = box(0.55, 0.55, 0.55, 0.08, mint);
      smallCube.position.set(-2.25, -0.62, 1.1);
      smallCube.rotation.set(0.5, 0.65, 0.2);
      orbit.add(smallCube);
      const secondCube = box(0.31, 0.31, 0.31, 0.045, dark);
      secondCube.position.set(2.2, 1.27, 0.3);
      secondCube.rotation.set(0.3, -0.3, 0.4);
      orbit.add(secondCube);

      const labelCanvas = document.createElement("canvas");
      labelCanvas.width = 256;
      labelCanvas.height = 256;
      const context = labelCanvas.getContext("2d");
      if (context) {
        context.fillStyle = "#c4f3a2";
        context.fillRect(0, 0, 256, 256);
        context.strokeStyle = "#31513e";
        context.lineWidth = 5;
        context.beginPath(); context.arc(128, 128, 110, 0, Math.PI * 2); context.stroke();
        context.fillStyle = "#21382b";
        context.font = "bold 150px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("a", 128, 119);
      }
      const texture = new THREE.CanvasTexture(labelCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      textures.push(texture);
      const coinFace = new THREE.MeshStandardMaterial({ map: texture, metalness: 0.25, roughness: 0.3 });
      materials.push(coinFace);
      const coinGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.13, 64);
      geometries.push(coinGeometry);
      const coins = [new THREE.Mesh(coinGeometry, [mint, coinFace, coinFace]), new THREE.Mesh(coinGeometry, [mint, coinFace, coinFace])];
      coins[0]?.position.set(-1.95, 1.55, 0.6);
      coins[1]?.position.set(1.85, -0.98, 1.25);
      coins.forEach((coin, index) => { coin.rotation.set(Math.PI / 2 + 0.13, index ? -0.4 : 0.3, index ? -0.2 : 0.2); coin.castShadow = true; orbit.add(coin); });
      const shadowGeometry = new THREE.PlaneGeometry(16, 16);
      geometries.push(shadowGeometry);
      const shadowMaterial = new THREE.ShadowMaterial({ color: 0x1a3326, opacity: 0.09 });
      materials.push(shadowMaterial);
      const floor = new THREE.Mesh(shadowGeometry, shadowMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -2.05;
      floor.receiveShadow = true;
      scene.add(floor);

      let frame = 0;
      let lastTime = performance.now();
      let elapsed = 0;
      let inView = true;
      let pointerX = 0;
      let pointerY = 0;
      let dragOffset = 0;
      let dragStart: number | null = null;
      function render(time: number) {
        frame = 0;
        if (disposed) return;
        const active = !pausedRef.current && inView && document.visibilityState === "visible";
        if (active) elapsed += Math.min(time - lastTime, 40) / 1000;
        lastTime = time;
        core.position.y = Math.sin(elapsed * 0.8) * 0.1;
        core.rotation.y = -0.5 + Math.sin(elapsed * 0.33) * 0.15 + pointerX * 0.23 + dragOffset;
        core.rotation.x = -0.12 + pointerY * 0.12;
        orbit.position.y = Math.sin(elapsed * 0.75 + 1) * 0.11;
        renderer.render(scene, camera);
        if (active) frame = requestAnimationFrame(render);
      }
      function requestRender() { if (!disposed && !frame) frame = requestAnimationFrame(render); }
      function resize() {
        if (!host) return;
        const { width, height } = host.getBoundingClientRect();
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.position.z = width < 420 ? 13.2 : 11.7;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        requestRender();
      }
      function pointerMove(event: PointerEvent) {
        if (!host) return;
        const bounds = host.getBoundingClientRect();
        pointerX = (event.clientX - bounds.left) / bounds.width - 0.5;
        pointerY = (event.clientY - bounds.top) / bounds.height - 0.5;
        if (dragStart !== null) { dragOffset += (event.clientX - dragStart) * 0.007; dragStart = event.clientX; }
        requestRender();
      }
      function pointerDown(event: PointerEvent) { dragStart = event.clientX; host?.setPointerCapture(event.pointerId); }
      function pointerUp() { dragStart = null; }
      function pointerLeave() { pointerX = 0; pointerY = 0; requestRender(); }
      resetRef.current = () => { pointerX = 0; pointerY = 0; dragOffset = 0; elapsed = 0; requestRender(); };
      redrawRef.current = requestRender;
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      const intersectionObserver = new IntersectionObserver(([entry]) => { inView = entry?.isIntersecting ?? false; requestRender(); });
      intersectionObserver.observe(host);
      host.addEventListener("pointermove", pointerMove);
      host.addEventListener("pointerdown", pointerDown);
      host.addEventListener("pointerup", pointerUp);
      host.addEventListener("pointercancel", pointerUp);
      host.addEventListener("pointerleave", pointerLeave);
      document.addEventListener("visibilitychange", requestRender);
      cleanup = () => {
        cancelAnimationFrame(frame);
        resizeObserver.disconnect(); intersectionObserver.disconnect();
        host.removeEventListener("pointermove", pointerMove); host.removeEventListener("pointerdown", pointerDown);
        host.removeEventListener("pointerup", pointerUp); host.removeEventListener("pointercancel", pointerUp); host.removeEventListener("pointerleave", pointerLeave);
        document.removeEventListener("visibilitychange", requestRender);
        geometries.forEach((geometry) => geometry.dispose()); materials.forEach((surface) => surface.dispose()); textures.forEach((item) => item.dispose());
        renderer.dispose(); renderer.domElement.remove(); redrawRef.current = null; resetRef.current = null;
      };
      resize();
      setStatus("ready");
    }
    void createScene().catch(() => { if (!disposed) setStatus("fallback"); });
    return () => { disposed = true; cleanup?.(); };
  }, []);

  return <div className="scene-wrap" data-scene-state={status}>
    <div className="scene-orbit scene-orbit-one" /><div className="scene-orbit scene-orbit-two" />
    <div className="scene-fallback" aria-hidden="true"><div className="fallback-cube"><span>a</span><i /><i /><i /></div><div className="fallback-coin">a</div></div>
    <div ref={hostRef} className="scene-canvas" role="img" aria-label="Интерактивная 3D-композиция: объёмная финансовая панель и монеты. Модель можно вращать перетаскиванием." />
    {status === "fallback" && <p className="scene-fallback-note">Показана статичная композиция — 3D недоступно в этом браузере.</p>}
  </div>;
}
