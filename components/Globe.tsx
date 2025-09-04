import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const OrbsBackground: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current!;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Create glowing orbs
    const orbs: THREE.Mesh[] = [];
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8,
    });

    for (let i = 0; i < 20; i++) {
      const orb = new THREE.Mesh(geometry, material.clone());
      orb.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );
      scene.add(orb);
      orbs.push(orb);
    }

    function animate() {
      requestAnimationFrame(animate);
      orbs.forEach((orb, i) => {
        orb.position.x += Math.sin(Date.now() * 0.001 + i) * 0.001;
        orb.position.y += Math.cos(Date.now() * 0.001 + i) * 0.001;
      });
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
};

export default OrbsBackground;