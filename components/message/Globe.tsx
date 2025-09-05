import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const GOLD_HEX = 0xffd700;

const GoldenLens: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current!;
    if (!mount) return;

    const scene = new THREE.Scene();
    const width = Math.max(1, mount.clientWidth || window.innerWidth);
    const height = Math.max(1, mount.clientHeight || window.innerHeight);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 26);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // create rings (tori) with slightly different radii and rotations
    const ringCount = 7;
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < ringCount; i++) {
      const radius = 5 + i * 0.8;
      const tube = 0.06 + (i % 2) * 0.02;
      const geo = new THREE.TorusGeometry(radius, tube, 16, 200);
      const mat = new THREE.MeshStandardMaterial({
        color: GOLD_HEX,
        emissive: GOLD_HEX,
        emissiveIntensity: 0.9 - i * 0.08,
        metalness: 0.5,
        roughness: 0.2,
        transparent: true,
        opacity: 0.95,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2 * (0.9 + (i * 0.02));
      mesh.rotation.y = Math.random() * Math.PI;
      group.add(mesh);
      rings.push(mesh);
    }

    // subtle interior radial plane with gradient to give depth
    const planeGeo = new THREE.CircleGeometry(4.2, 64);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });
    const innerPlane = new THREE.Mesh(planeGeo, planeMat);
    innerPlane.rotation.x = -Math.PI / 2;
    innerPlane.position.z = 0;
    group.add(innerPlane);

    // glow sprites generator (soft golden blob)
    function makeGlowTexture() {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const grd = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 1.6);
      grd.addColorStop(0, "rgba(255, 235, 150, 0.95)");
      grd.addColorStop(0.3, "rgba(255, 215, 0, 0.7)");
      grd.addColorStop(1, "rgba(255, 215, 0, 0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, size, size);
      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      return tex;
    }
    const glowTex = makeGlowTexture();

    // place some glow sprites along rings and near front
    const sprites: THREE.Sprite[] = [];
    for (let i = 0; i < 16; i++) {
      const mat = new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xffffff,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity: 0.95,
      });
      const sp = new THREE.Sprite(mat);
      const r = 4 + Math.random() * 6;
      const ang = Math.random() * Math.PI * 2;
      sp.position.set(Math.cos(ang) * r, (Math.random() - 0.5) * 1.2, Math.sin(ang) * r);
      const s = 1.5 + Math.random() * 2.5;
      sp.scale.set(s, s, 1);
      group.add(sp);
      sprites.push(sp);
    }

    // lights to make emissive materials pop
    const amb = new THREE.AmbientLight(0xffffff, 0.35);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(10, 10, 10);
    scene.add(amb, dir);

    // interaction: pointer tilt + drag rotate
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    function onPointerDown(e: PointerEvent) {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    }
    function onPointerMove(e: PointerEvent) {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      // subtle tilt toward pointer
      targetX = ny * 0.25;
      targetY = nx * 0.4;

      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        group.rotation.y += dx * 0.002;
        group.rotation.x += dy * 0.0012;
        lastX = e.clientX;
        lastY = e.clientY;
      }
    }
    function onPointerUp() {
      dragging = false;
    }

    renderer.domElement.style.touchAction = "none";
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    // animate - rings rotate, sprites shimmer, group eases to pointer tilt
    let raf = 0;
    const clock = new THREE.Clock();
    function animate() {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      rings.forEach((r, i) => {
        r.rotation.y += 0.0008 + i * 0.0002;
        r.rotation.x += Math.sin(t * 0.2 + i) * 0.00005;
      });

      // shimmer sprites subtle scale oscillation
      sprites.forEach((s, i) => {
        const sScale = 1 + Math.sin(t * 1.2 + i) * 0.15;
        s.scale.setScalar(sScale * (1 + (i % 3) * 0.2));
      });

      // smooth tilt interpolation
      currentX = THREE.MathUtils.lerp(currentX, targetX, 0.08);
      currentY = THREE.MathUtils.lerp(currentY, targetY, 0.08);
      group.rotation.x += (currentX - group.rotation.x) * 0.12;
      group.rotation.y += (currentY - group.rotation.y) * 0.12;

      // subtle breathing zoom
      const pulse = 1 + Math.sin(t * 0.4) * 0.01;
      group.scale.set(pulse, pulse, pulse);

      renderer.render(scene, camera);
    }
    animate();

    // resize
    function onResize() {
      const w = Math.max(1, mount.clientWidth || window.innerWidth);
      const h = Math.max(1, mount.clientHeight || window.innerHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize, { passive: true });

    // cleanup
    return () => {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("resize", onResize);

      // dispose geometries/materials/textures properly
      rings.forEach(r => {
        r.geometry.dispose();
        (r.material as THREE.Material).dispose();
      });
      innerPlane.geometry.dispose();
      planeMat.dispose();
      glowTex.dispose();
      sprites.forEach(s => {
        (s.material as THREE.Material).dispose();
      });

      try {
        mount.removeChild(renderer.domElement);
      } catch {}
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0, zIndex: 0 }} />;
};

export default GoldenLens;