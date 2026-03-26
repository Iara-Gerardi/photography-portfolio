import { useEffect, useRef, MutableRefObject, RefObject } from "react";
import * as THREE from "three";
import { EffectComposer, EffectPass, RenderPass } from "postprocessing";
import { DitherEffect } from "../DitherEffect";
import { generateBlueNoiseTexture } from "@/lib/generateBlueNoise";
import { SphereImage } from "../types";

interface UsePhotoSphereOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  /** Stable ref — animation loop calls this to open a photo window */
  openWindowRef: MutableRefObject<(url: string) => void>;
  /** Stable ref — animation loop calls this to close all open windows on scroll */
  closeWindowsRef: MutableRefObject<() => void>;
  images: SphereImage[];
  lineColor: string;
  lineOpacity: number;
  imageSize: number;
  flatness: number;
  radius: number;
  autoRotateSpeed: number;
  enableMouseControl: boolean;
  cameraDistance: number;
  mobileCameraDistance: number;
  height: number;
  width?: number;
  mobileWidth?: number;
  scrollProgressRef?: MutableRefObject<number>;
  onScrollStart?: () => void;
  onLoadComplete?: () => void;
  interactionDisabledRef?: MutableRefObject<boolean>;
  ditherInitialPixelSize?: number;
  ditherFinalPixelSize: number;
  ditherPaletteSize: number;
  ditherStrength: number;
}

/** Returns Fibonacci-distributed point on a unit sphere */
function fibPosition(index: number, total: number) {
  const phi = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (index / (total - 1)) * 2;
  const radiusAtY = Math.sqrt(1 - y * y);
  const theta = phi * index;
  return { x: Math.cos(theta) * radiusAtY, y, z: Math.sin(theta) * radiusAtY };
}

export function usePhotoSphere({
  canvasRef,
  containerRef,
  openWindowRef,
  closeWindowsRef,
  images,
  lineColor,
  lineOpacity,
  imageSize,
  flatness,
  radius,
  autoRotateSpeed,
  enableMouseControl,
  cameraDistance,
  mobileCameraDistance,
  height,
  width,
  mobileWidth,
  scrollProgressRef,
  onScrollStart,
  onLoadComplete,
  interactionDisabledRef,
  ditherInitialPixelSize,
  ditherFinalPixelSize,
  ditherPaletteSize,
  ditherStrength,
}: UsePhotoSphereOptions) {
  // Internal THREE.js refs
  const composerRef = useRef<EffectComposer | null>(null);
  const ditherEffectRef = useRef<DitherEffect | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const sphereGroupRef = useRef<THREE.Group | null>(null);
  const materialsRef = useRef<THREE.MeshBasicMaterial[]>([]);
  const lineMaterialsRef = useRef<THREE.LineBasicMaterial[]>([]);
  const baseCameraDistanceRef = useRef(cameraDistance);

  // Interaction state refs
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const rotationVelocityRef = useRef({ x: 0, y: 0 });
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const meshToImageMapRef = useRef(new Map<THREE.Mesh, string>());
  const hasTriggeredScrollStartRef = useRef(false);
  const lastTouchOpenRef = useRef(0);
  // Keep external scroll progress ref accessible in animation loop
  const externalScrollProgressRef = useRef(scrollProgressRef);
  externalScrollProgressRef.current = scrollProgressRef;

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    materialsRef.current = [];
    lineMaterialsRef.current = [];

    const canvas = canvasRef.current;
    const container = containerRef.current;

    // Detect mobile
    const isMobile = window.innerWidth < 768;
    const canvasWidth = isMobile && mobileWidth ? mobileWidth : (width || container.clientWidth);
    const effectiveCameraDistance = isMobile ? mobileCameraDistance : cameraDistance;
    baseCameraDistanceRef.current = effectiveCameraDistance;

    // ----- Scene -----
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(60, canvasWidth / height, 0.1, 1000);
    camera.position.z = effectiveCameraDistance;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(canvasWidth, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ----- Post-processing (dithering) -----
    const isDithering = ditherInitialPixelSize !== undefined;
    if (isDithering) {
      const blueNoiseCanvas = generateBlueNoiseTexture(64);
      const blueNoiseTexture = new THREE.CanvasTexture(blueNoiseCanvas);

      ditherEffectRef.current = new DitherEffect({
        blueNoise: blueNoiseTexture,
        pixelSize: ditherInitialPixelSize,
        paletteSize: ditherPaletteSize,
        ditherStrength,
      });

      composerRef.current = new EffectComposer(renderer);
      composerRef.current.addPass(new RenderPass(scene, camera));
      composerRef.current.addPass(new EffectPass(camera, ditherEffectRef.current));
    }

    // ----- Sphere group -----
    const sphereGroup = new THREE.Group();
    sphereGroupRef.current = sphereGroup;
    scene.add(sphereGroup);
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));

    // ----- Image meshes -----
    const count = images.length;
    let loadedCount = 0;
    const textureLoader = new THREE.TextureLoader();

    images.forEach((img, index) => {
      const { x, y, z } = fibPosition(index, count);

      textureLoader.load(
        img.src,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          const aspect = texture.image.width / texture.image.height;
          const planeWidth = aspect > 1 ? imageSize : imageSize * aspect;
          const planeHeight = aspect > 1 ? imageSize / aspect : imageSize;

          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
          });
          materialsRef.current.push(material);

          const mesh = new THREE.Mesh(new THREE.PlaneGeometry(planeWidth, planeHeight), material);
          mesh.position.set(x * radius, y * radius, z * radius);

          // Orientation: interpolate between wrapped (facing outward) and flat (facing camera)
          const wrappedQ = new THREE.Quaternion();
          mesh.lookAt(0, 0, 0);
          mesh.rotateY(Math.PI);
          wrappedQ.copy(mesh.quaternion);
          mesh.quaternion.slerpQuaternions(wrappedQ, new THREE.Quaternion(), flatness);

          meshToImageMapRef.current.set(mesh, img.src);
          sphereGroup.add(mesh);

          loadedCount++;
          if (loadedCount === count) onLoadComplete?.();
        },
        undefined,
        (error) => {
          console.error("Error loading texture:", error);
          loadedCount++;
          if (loadedCount === count) onLoadComplete?.();
        },
      );
    });

    // ----- Collection lines -----
    const collectionMap = new Map<string, THREE.Vector3[]>();
    images.forEach((img, i) => {
      if (!img.collection) return;
      const { x, y, z } = fibPosition(i, count);
      const pos = new THREE.Vector3(x * radius, y * radius, z * radius);
      if (!collectionMap.has(img.collection)) collectionMap.set(img.collection, []);
      collectionMap.get(img.collection)!.push(pos);
    });

    collectionMap.forEach((positions) => {
      if (positions.length < 2) return;
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const lineMaterial = new THREE.LineBasicMaterial({
            color: lineColor,
            transparent: true,
            opacity: lineOpacity,
          });
          lineMaterialsRef.current.push(lineMaterial);
          sphereGroup.add(
            new THREE.Line(
              new THREE.BufferGeometry().setFromPoints([positions[i], positions[j]]),
              lineMaterial,
            ),
          );
        }
      }
    });

    // ----- Raycasting helper -----
    const pickMesh = (clientX: number, clientY: number): string | null => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const hits = raycasterRef.current.intersectObjects(sphereGroup.children);
      if (hits.length === 0) return null;
      return meshToImageMapRef.current.get(hits[0].object as THREE.Mesh) ?? null;
    };

    // ----- Mouse handlers -----
    const handleMouseDown = (e: MouseEvent) => {
      if (!enableMouseControl) return;
      isDraggingRef.current = true;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!enableMouseControl || !isDraggingRef.current) return;
      rotationVelocityRef.current.y = (e.clientX - previousMouseRef.current.x) * 0.005;
      rotationVelocityRef.current.x = (e.clientY - previousMouseRef.current.y) * 0.005;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => { isDraggingRef.current = false; };

    const handleClick = (e: MouseEvent) => {
      if (Date.now() - lastTouchOpenRef.current < 600) return;
      if (scrollProgressRef && scrollProgressRef.current > 0) return;
      if (
        Math.abs(rotationVelocityRef.current.x) > 0.01 ||
        Math.abs(rotationVelocityRef.current.y) > 0.01
      ) return;

      const imageUrl = pickMesh(e.clientX, e.clientY);
      if (imageUrl) openWindowRef.current(imageUrl);
    };

    // ----- Touch handlers -----
    let touchStartPos = { x: 0, y: 0 };
    let touchStartTime = 0;
    let touchMoved = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (!enableMouseControl || interactionDisabledRef?.current) return;
      isDraggingRef.current = true;
      const touch = e.touches[0];
      previousMouseRef.current = { x: touch.clientX, y: touch.clientY };
      touchStartPos = { x: touch.clientX, y: touch.clientY };
      touchStartTime = Date.now();
      touchMoved = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!enableMouseControl || !isDraggingRef.current || interactionDisabledRef?.current) return;
      const touch = e.touches[0];
      rotationVelocityRef.current.y = (touch.clientX - previousMouseRef.current.x) * 0.005;
      rotationVelocityRef.current.x = (touch.clientY - previousMouseRef.current.y) * 0.005;
      previousMouseRef.current = { x: touch.clientX, y: touch.clientY };

      const dx = touch.clientX - touchStartPos.x;
      const dy = touch.clientY - touchStartPos.y;
      if (Math.sqrt(dx * dx + dy * dy) > 10) touchMoved = true;
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      const elapsed = Date.now() - touchStartTime;
      if (touchMoved || elapsed >= 300) return;
      if (scrollProgressRef && scrollProgressRef.current > 0) return;

      const imageUrl = pickMesh(touchStartPos.x, touchStartPos.y);
      if (imageUrl) {
        lastTouchOpenRef.current = Date.now();
        openWindowRef.current(imageUrl);
      }
    };

    // ----- Animation loop -----
    const animate = () => {
      const scrollProgress = externalScrollProgressRef.current?.current ?? 0;

      // Scroll-start detection
      if (scrollProgress > 0.02 && !hasTriggeredScrollStartRef.current) {
        hasTriggeredScrollStartRef.current = true;
        closeWindowsRef.current();
        onScrollStart?.();
      } else if (scrollProgress < 0.02) {
        hasTriggeredScrollStartRef.current = false;
      }

      // Camera zoom
      const base = baseCameraDistanceRef.current;
      camera.position.z = base - (base - 0.5) * scrollProgress;

      // Scale + opacity
      const scale = Math.max(0.01, 1 - scrollProgress * 0.9);
      sphereGroup.scale.setScalar(scale);
      const opacity = Math.max(0, 1 - scrollProgress * 1.2);

      // Dither pixel size
      if (ditherEffectRef.current && ditherInitialPixelSize !== undefined) {
        ditherEffectRef.current.setPixelSize(
          ditherInitialPixelSize + (ditherFinalPixelSize - ditherInitialPixelSize) * scrollProgress,
        );
      }

      materialsRef.current.forEach((m) => { m.opacity = opacity; });
      lineMaterialsRef.current.forEach((m) => { m.opacity = lineOpacity * opacity; });

      // Rotation
      const effectiveAutoRotate = autoRotateSpeed * (1 - scrollProgress * 0.8);
      if (!isDraggingRef.current) {
        sphereGroup.rotation.y += effectiveAutoRotate;
        rotationVelocityRef.current.x *= 0.95;
        rotationVelocityRef.current.y *= 0.95;
      }
      sphereGroup.rotation.y += rotationVelocityRef.current.y;
      sphereGroup.rotation.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, sphereGroup.rotation.x + rotationVelocityRef.current.x),
      );

      composerRef.current ? composerRef.current.render() : renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    // ----- Resize handler -----
    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = width || containerRef.current.clientWidth;
      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height);
      composerRef.current?.setSize(newWidth, height);
      ditherEffectRef.current?.updateResolution(newWidth, height);
    };

    // ----- Event registration -----
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("click", handleClick);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchmove", handleTouchMove);
    canvas.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("resize", handleResize);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("click", handleClick);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("resize", handleResize);

      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);

      materialsRef.current = [];
      lineMaterialsRef.current = [];

      ditherEffectRef.current?.dispose();
      ditherEffectRef.current = null;
      composerRef.current?.dispose();
      composerRef.current = null;

      renderer.dispose();
    };
  }, [
    images,
    imageSize,
    flatness,
    radius,
    autoRotateSpeed,
    enableMouseControl,
    cameraDistance,
    mobileCameraDistance,
    height,
    width,
    mobileWidth,
    lineColor,
    lineOpacity,
    onScrollStart,
    ditherInitialPixelSize,
    ditherFinalPixelSize,
    ditherPaletteSize,
    ditherStrength,
  ]);
}
