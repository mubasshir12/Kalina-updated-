import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const globeCss = `
.globe-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
}
.globe-canvas {
    display: block;
    width: 100%;
    height: 100%;
}
`;

const CustomGlobe: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, controls: OrbitControls;
        let animationFrameId: number;
        const satellites: THREE.Mesh[] = [];

        function init() {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
            camera.position.z = 15;

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.domElement.className = 'globe-canvas';
            currentMount.appendChild(renderer.domElement);
            
            // Soft, even lighting to prevent dark spots
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
            scene.add(ambientLight);
            const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xcccccc, 1);
            scene.add(hemisphereLight);

            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.enablePan = false;
            controls.enableZoom = false;
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.5;
            controls.minDistance = 12;
            controls.maxDistance = 20;

            const clock = new THREE.Clock();

            // Stylized Globe
            const globeGeometry = new THREE.IcosahedronGeometry(10, 3);
            const globeMaterial = new THREE.MeshStandardMaterial({
                color: 0xe0e0ff,
                flatShading: true,
            });
            const globe = new THREE.Mesh(globeGeometry, globeMaterial);
            scene.add(globe);
            const forcedGlobeColor = new THREE.Color(0xe0e0ff);
            
            // Wireframe Overlay
            const wireframeMaterial = new THREE.MeshBasicMaterial({
                color: 0xd97706, // Amber-600 to match theme
                wireframe: true,
                transparent: true,
                opacity: 0.15,
            });
            const wireframe = new THREE.Mesh(globeGeometry, wireframeMaterial);
            wireframe.scale.set(1.001, 1.001, 1.001); // Slightly larger to avoid z-fighting
            scene.add(wireframe);

            // Orbiting Satellites
            for (let i = 0; i < 3; i++) {
                const satGeometry = new THREE.SphereGeometry(0.15, 8, 8);
                const satMaterial = new THREE.MeshBasicMaterial({ color: 0x818cf8 }); // Lighter Indigo
                const satellite = new THREE.Mesh(satGeometry, satMaterial);
                
                const pivot = new THREE.Object3D();
                pivot.add(satellite);
                scene.add(pivot);

                const distance = 11 + i * 0.5;
                satellite.position.set(distance, 0, 0);

                // Randomize orbit plane
                pivot.rotation.x = Math.random() * Math.PI;
                pivot.rotation.y = Math.random() * Math.PI;
                
                satellites.push(pivot as unknown as THREE.Mesh);
            }
            
            // Background Stars
            const starVertices = [];
            for (let i = 0; i < 2000; i++) {
                const x = (Math.random() - 0.5) * 2000;
                const y = (Math.random() - 0.5) * 2000;
                const z = (Math.random() - 0.5) * 2000;
                const dist = Math.sqrt(x*x + y*y + z*z);
                if (dist > 100) { // Only add stars far enough away
                    starVertices.push(x, y, z);
                }
            }
            const starGeometry = new THREE.BufferGeometry();
            starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
            const starMaterial = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.3 });
            const stars = new THREE.Points(starGeometry, starMaterial);
            scene.add(stars);


            window.addEventListener('resize', onWindowResize);

            animate();

            function animate() {
                animationFrameId = requestAnimationFrame(animate);
                // 🔒 Force globe color override every frame
                globeMaterial.color.copy(forcedGlobeColor);
                
                const elapsedTime = clock.getElapsedTime();
                
                // Animate satellites
                satellites.forEach((sat, i) => {
                    sat.rotation.y += 0.005 * (i + 1);
                });
                
                controls.update();
                renderer.render(scene, camera);
            }
        }

        function onWindowResize() {
            if (!renderer || !camera) return;
            camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        }

        init();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', onWindowResize);
            // FIX: The type definitions for OrbitControls might be missing the dispose method. Casting to 'any' to call it.
            (controls as any)?.dispose();
            scene.traverse(object => {
                if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
                    object.geometry.dispose();
                    const material = object.material as THREE.Material | THREE.Material[];
                    if(Array.isArray(material)) {
                        material.forEach(mat => mat.dispose());
                    } else {
                        material.dispose();
                    }
                }
            });
            renderer?.dispose();
            if (currentMount && renderer?.domElement) {
                currentMount.removeChild(renderer.domElement);
            }
        };

    }, []);

    return (
        <>
            <style>{globeCss}</style>
            <div ref={mountRef} className="globe-container" />
        </>
    );
};

export default CustomGlobe;
