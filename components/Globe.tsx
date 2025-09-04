import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const GOLD = 0xffd700;

const GoldenFlux: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current!;
    if (!mount) return;

    // --- renderer / scene / camera ---
    const scene = new THREE.Scene();
    const width = Math.max(1, mount.clientWidth || window.innerWidth);
    const height = Math.max(1, mount.clientHeight || window.innerHeight);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 60);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    // --- group & particles ---
    const root = new THREE.Group();
    scene.add(root);

    const particlesCount = Math.min(5000, Math.floor((width * height) / 8000) ); // adaptive
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);
    const sizes = new Float32Array(particlesCount);

    // golden gradient from deep to bright
    const colorA = new THREE.Color(0x8b6f00); // deep warm gold
    const colorB = new THREE.Color(0xffe78a); // bright gold

    for (let i = 0; i < particlesCount; i++) {
      // arrange in a spiral/galaxy form with height variance
      const t = i / particlesCount;
      const angle = t * Math.PI * 8 + (Math.random() - 0.5) * 0.6;
      const radius = Math.pow(t, 0.5) * (20 + Math.random() * 30);
      const x = Math.cos(angle) * radius;
      const y = (Math.random() - 0.5) * 6 + Math.sin(angle * 0.5) * 2;
      const z = Math.sin(angle) * radius;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const c = colorA.clone().lerp(colorB, Math.random() * 0.9);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = 2.0 + Math.random() * 3.0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Points material — additive, soft
    const material = new THREE.PointsMaterial({
      size: 6,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    root.add(points);

    // subtle back-layer halo: a large faint sphere to anchor composition
    const haloGeom = new THREE.SphereGeometry(45, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: GOLD,
      transparent: true,
      opacity: 0.02,
      depthWrite: false,
    });
    const halo = new THREE.Mesh(haloGeom, haloMat);
    scene.add(halo);

    // --- interaction state (drag + pinch) ---
    let isPointerDown = false;
    let lastX = 0;
    let lastY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;
    let pointers: { [id: number]: PointerEvent } = {};
    let basePinchDist = 0;
    let targetScale = 1;
    let currentScale = 1;

    function getDistance(p1: PointerEvent, p2: PointerEvent) {
      const dx = p1.clientX - p2.clientX;
      const dy = p1.clientY - p2.clientY;
      return Math.hypot(dx, dy);
    }

    function onPointerDown(e: PointerEvent) {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      pointers[e.pointerId] = e;
      if (Object.keys(pointers).length === 1) {
        isPointerDown = true;
        lastX = e.clientX;
        lastY = e.clientY;
      } else if (Object.keys(pointers).length === 2) {
        // pinch start
        const keys = Object.keys(pointers).map(k => Number(k));
        basePinchDist = getDistance(pointers[keys[0]], pointers[keys[1]]);
      }
    }
    function onPointerMove(e: PointerEvent) {
      if (!pointers[e.pointerId]) return;
      pointers[e.pointerId] = e;

      const count = Object.keys(pointers).length;
      if (count === 1 && isPointerDown) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        // convert pixel delta to small rotation target
        targetRotY += dx * 0.0025; // horizontal drag rotates around Y
        targetRotX += dy * 0.0025; // vertical drag rotates around X
        lastX = e.clientX;
        lastY = e.clientY;
      } else if (count === 2) {
        const keys = Object.keys(pointers).map(k => Number(k));
        const distNow = getDistance(pointers[keys[0]], pointers[keys[1]]);
        if (basePinchDist > 0) {
          const factor = distNow / basePinchDist;
          targetScale = THREE.MathUtils.clamp(currentScale * factor, 0.6, 1.6);
        }
      } else {
        // hover / subtle parallax when not dragging
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = (e.clientY / window.innerHeight) * 2 - 1;
        targetRotY = nx * 0.15;
        targetRotX = ny * 0.08;
      }
    }
    function onPointerUp(e: PointerEvent) {
      delete pointers[e.pointerId];
      (e.target as Element).releasePointerCapture?.(e.pointerId);
      isPointerDown = false;
      // finalize scale
      currentScale = targetScale;
      basePinchDist = 0;
    }

    renderer.domElement.style.touchAction = "none";
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    // subtle auto-rotation when idle
    let idleTime = 0;

    // --- animation loop ---
    const clock = new THREE.Clock();
    let raf = 0;
    function animate() {
      raf = requestAnimationFrame(animate);
      const dt = clock.getDelta();

      // idle rotate slowly if no interaction
      idleTime += dt;
      if (!isPointerDown && Object.keys(pointers).length === 0) {
        targetRotY += 0.0002; // tiny automatic rotation
      } else {
        idleTime = 0;
      }

      // interpolate rotations & scale for smoothness
      currentRotX = THREE.MathUtils.lerp(currentRotX, targetRotX, 0.08);
      currentRotY = THREE.MathUtils.lerp(currentRotY, targetRotY, 0.08);
      currentScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.06);

      root.rotation.x = currentRotX;
      root.rotation.y = currentRotY;
      root.scale.setScalar(currentScale);

      // slight bobbing for life
      root.position.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.7;

      renderer.render(scene, camera);
    }
    animate();

    // --- resize handling ---
    function onResize() {
      const w = Math.max(1, mount.clientWidth || window.innerWidth);
      const h = Math.max(1, mount.clientHeight || window.innerHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize, { passive: true });

    // --- cleanup ---
    return () => {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("resize", onResize);

      // dispose geometry/material/textures
      geometry.dispose();
      material.dispose();
      haloGeomCleanup();

      // remove canvas
      try {
        mount.removeChild(renderer.domElement);
      } catch {}
      renderer.dispose();

      function haloGeomCleanup() {
        halo.geometry.dispose();
        haloMat.dispose();
      }
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0, zIndex: 0 }} />;
};

export default GoldenFlux;