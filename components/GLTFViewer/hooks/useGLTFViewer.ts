import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { GLTFViewerProps } from "../types";

export function useGLTFViewer({
  modelPath,
  size = 400,
  rotationSpeed = 0.01,
  cameraDistance = 5,
}: GLTFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let isCancelled = false;
    let rafId: number;

    // Defer init by one frame so Framer Motion finishes its entrance
    // animation before Three.js measures the container dimensions
    rafId = requestAnimationFrame(() => {
      if (isCancelled || !containerRef.current) return;

      // Initialize scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      sceneRef.current = scene;

      // Initialize camera
      const camera = new THREE.PerspectiveCamera(
        75,
        size / size, // aspect ratio 1:1
        0.1,
        1000
      );
      camera.position.set(0, 0, cameraDistance);
      cameraRef.current = camera;

      // Initialize renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(size, size);
      renderer.setPixelRatio(window.devicePixelRatio);
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Add ambient light for general illumination
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      // Add directional light for better definition
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      // Add a second directional light from opposite side for balanced lighting
      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight2.position.set(-5, -5, -5);
      scene.add(directionalLight2);

      // Load GLTF model
      const loader = new GLTFLoader();
      loader.load(
        modelPath,
        (gltf) => {
          // Discard result if this effect cycle was cleaned up
          if (isCancelled) return;

          const model = gltf.scene;

          // Center the model by computing its bounding box
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center);

          // Scale model to fit in view
          const modelSize = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z);
          const scale = 2 / maxDim; // Scale to fit in a 2-unit cube
          model.scale.setScalar(scale);

          scene.add(model);
          modelRef.current = model;
        },
        undefined,
        (error) => {
          console.error("Error loading GLTF model:", error);
        }
      );

      // Animation loop - rotates model horizontally
      const animate = () => {
        if (isCancelled) return;
        animationFrameRef.current = requestAnimationFrame(animate);

        // Rotate model around Y axis (horizontal rotation)
        if (modelRef.current) {
          modelRef.current.rotation.y += rotationSpeed;
        }

        renderer.render(scene, camera);
      };

      animate();
    }); // end requestAnimationFrame

    // Cleanup
    return () => {
      isCancelled = true;
      cancelAnimationFrame(rafId);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (rendererRef.current) {
        const renderer = rendererRef.current;

        // Dispose of geometries and materials
        sceneRef.current?.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });

        // Release WebGL context before disposing so the browser
        // doesn't hold onto the context slot (important for remounts)
        renderer.forceContextLoss();
        renderer.dispose();

        // Remove canvas from DOM
        if (
          containerRef.current &&
          renderer.domElement.parentNode === containerRef.current
        ) {
          containerRef.current.removeChild(renderer.domElement);
        }

        rendererRef.current = null;
      }
    };
  }, [modelPath, size, rotationSpeed, cameraDistance]);

  return { containerRef };
}
