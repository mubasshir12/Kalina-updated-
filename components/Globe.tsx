import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const RingsBackground: React.FC = () => {
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
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const rings: THREE.Mesh[] = [];
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });

    for (let i = 0; i < 6; i++) {
      const geometry = new THREE.TorusGeometry(3 + i, 0.04, 16, 100);
      const ring = new THREE.Mesh(geometry, material.clone());
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      scene.add(ring);
      rings.push(ring);
    }

    function animate() {
      requestAnimationFrame(animate);
      rings.forEach((ring, i) => {
        ring.rotation.x += 0.0005 * (i + 1);
        ring.rotation.y += 0.001 * (i + 1);
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

export default RingsBackground;