import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface StampViewerProps {
  model: THREE.Group | null;
}

export default function StampViewer({ model }: StampViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1ede6);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(30, 40, 50);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 1.2));
    // Angled low so a shallow relief still throws a visible self-shadow, not a
    // near-overhead light that would wash the height differences out.
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(40, 35, 25);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.bias = -0.0005;
    const shadowCam = keyLight.shadow.camera;
    shadowCam.left = -100;
    shadowCam.right = 100;
    shadowCam.top = 100;
    shadowCam.bottom = -100;
    shadowCam.near = 1;
    shadowCam.far = 200;
    scene.add(keyLight);

    scene.add(new THREE.GridHelper(100, 20, 0xcccccc, 0xe2e2e2));

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !model) return;

    scene.add(model);
    return () => {
      scene.remove(model);
      // Regenerated on every knob change, so old GPU buffers must be freed explicitly.
      model.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const material = obj.material as THREE.Material;
          material.dispose();
        }
      });
    };
  }, [model]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
