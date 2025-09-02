import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const particleCss = `
.particle-universe-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    background: #000;
}
.particle-canvas {
    display: block;
    width: 100%;
    height: 100%;
}
`;

const ParticleUniverse: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
        let particles: THREE.Points;
        let animationFrameId: number;
        let mouseX = 0;
        let mouseY = 0;
        let windowHalfX = window.innerWidth / 2;
        let windowHalfY = window.innerHeight / 2;


        function init() {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
            camera.position.z = 5;

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.domElement.className = 'particle-canvas';
            currentMount.appendChild(renderer.domElement);
            
            const particleCount = 5000;
            const positions = new Float32Array(particleCount * 3);
            
            for (let i = 0; i < particleCount * 3; i++) {
                positions[i] = (Math.random() - 0.5) * 20;
            }

            const particlesGeometry = new THREE.BufferGeometry();
            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const particlesMaterial = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 0.02,
                sizeAttenuation: true,
                transparent: true,
                opacity: 0.8,
            });

            particles = new THREE.Points(particlesGeometry, particlesMaterial);
            scene.add(particles);

            window.addEventListener('resize', onWindowResize);
            document.addEventListener('mousemove', onDocumentMouseMove);

            animate();

            function animate() {
                animationFrameId = requestAnimationFrame(animate);

                const elapsedTime = Date.now() * 0.0001;
                particles.rotation.y = elapsedTime * 0.2;
                particles.rotation.x = elapsedTime * 0.1;

                camera.position.x += (mouseX - camera.position.x) * 0.05;
                camera.position.y += (-mouseY - camera.position.y) * 0.05;
                camera.lookAt(scene.position);
                
                renderer.render(scene, camera);
            }
        }

        function onWindowResize() {
            if (!renderer || !camera) return;
            windowHalfX = window.innerWidth / 2;
            windowHalfY = window.innerHeight / 2;
            camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        }

        function onDocumentMouseMove(event: MouseEvent) {
            mouseX = (event.clientX - windowHalfX) / 100;
            mouseY = (event.clientY - windowHalfY) / 100;
        }

        init();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', onWindowResize);
            document.removeEventListener('mousemove', onDocumentMouseMove);
            
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
            <style>{particleCss}</style>
            <div ref={mountRef} className="particle-universe-container" />
        </>
    );
};

export default ParticleUniverse;