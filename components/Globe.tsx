import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const wireGlobeCss = `
.wire-globe-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
}
.wire-globe-canvas {
    display: block;
    width: 100%;
    height: 100%;
}
`;

const CustomWireGlobe: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 20;

    let renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.className = "wire-globe-canvas";
    currentMount.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Neon Wireframe Globe
    const globeGeometry = new THREE.SphereGeometry(8, 64, 64);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff, // neon cyan
      wireframe: true
    });
    const globe = new THREE.Mesh(globeGeometry, wireframeMaterial);
    scene.add(globe);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;

    // Animate
    function animate() {
      requestAnimationFrame(animate);
      globe.rotation.y += 0.002; // slow rotation
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    function onResize() {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    }
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      currentMount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <>
      <style>{wireGlobeCss}</style>
      <div ref={mountRef} className="wire-globe-container" />
    </>
  );
};

export default CustomWireGlobe;