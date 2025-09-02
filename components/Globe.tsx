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

const vertexShader = `
    varying vec3 vNormal;
    void main() {
        vNormal = normalize( normalMatrix * normal );
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
`;
const fragmentShader = `
    varying vec3 vNormal;
    void main() {
        float intensity = pow( 0.6 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) ), 2.0 );
        gl_FragColor = vec4( 0.3, 0.6, 1.0, 1.0 ) * intensity;
    }
`;


const Globe: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, stars: THREE.Mesh, controls: OrbitControls;
        let animationFrameId: number;

        function init() {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
            camera.position.z = 12; // Adjusted camera position to be closer

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.domElement.className = 'globe-canvas';
            currentMount.appendChild(renderer.domElement);
            
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
            directionalLight.position.set(5, 3, 5);
            scene.add(directionalLight);

            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.minDistance = 11;
            controls.maxDistance = 20;
            controls.enablePan = false;
            controls.enableZoom = false; // Disable zoom to maintain the background effect
            controls.autoRotate = true; // Add a gentle auto-rotation
            controls.autoRotateSpeed = 0.3;

            const clock = new THREE.Clock();

            const textureLoader = new THREE.TextureLoader();

            const starGeometry = new THREE.SphereGeometry(500, 64, 64);
            const starMaterial = new THREE.MeshBasicMaterial({ map: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/starry-night-sky.jpg'), side: THREE.BackSide });
            stars = new THREE.Mesh(starGeometry, starMaterial);
            scene.add(stars);

            const globeGeometry = new THREE.SphereGeometry(10, 64, 64);
            const globeMaterial = new THREE.MeshPhongMaterial({
                map: textureLoader.load('https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg'),
                bumpMap: textureLoader.load('https://raw.githubusercontent.com/turban/webgl-earth/master/images/elev_bump_4k.jpg'),
                bumpScale: 0.05,
                specularMap: textureLoader.load('https://raw.githubusercontent.com/turban/webgl-earth/master/images/water_4k.png'),
                specular: new THREE.Color('grey')
            });
            const globe = new THREE.Mesh(globeGeometry, globeMaterial);
            scene.add(globe);

            const atmosphereGeometry = new THREE.SphereGeometry(10, 64, 64);
            const atmosphereMaterial = new THREE.ShaderMaterial({ vertexShader, fragmentShader, blending: THREE.AdditiveBlending, side: THREE.BackSide });
            const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            atmosphere.scale.set(1.1, 1.1, 1.1);
            scene.add(atmosphere);

            window.addEventListener('resize', onWindowResize);

            animate();

            function animate() {
                animationFrameId = requestAnimationFrame(animate);
                
                const elapsedTime = clock.getElapsedTime();
                // Increased speed for more noticeable sun movement
                directionalLight.position.x = Math.sin(elapsedTime * 0.2) * 10;
                directionalLight.position.z = Math.cos(elapsedTime * 0.2) * 10;
                directionalLight.position.y = 3 + Math.sin(elapsedTime * 0.1) * 2;
                
                controls.update();
                stars.rotation.y += 0.0001;
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
            controls?.dispose();
            scene.traverse(object => {
                if (object instanceof THREE.Mesh) {
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

export default Globe;
