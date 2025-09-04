import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const GoldenPortal: React.FC = () => {
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

    const rings: THREE.Mesh[] = [];
    const material = new THREE.MeshBasicMaterial({
      color: 0xffd700, // golden
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });

    for (let i = 0; i < 8; i++) {
      const geometry = new THREE.TorusGeometry(4 + i * 0.8, 0.05, 16, 100);
      const ring = new THREE.Mesh(geometry, material.clone());
      scene.add(ring);
      rings.push(ring);
    }

    function animate() {
      requestAnimationFrame(animate);
      rings.forEach((ring, i) => {
        ring.rotation.x += 0.001 * (i + 1);
        ring.rotation.y += 0.0015 * (i + 1);
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

export default GoldenPortal;