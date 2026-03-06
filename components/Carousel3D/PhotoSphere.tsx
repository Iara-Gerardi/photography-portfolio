"use client";

import React, {
  useRef,
  useEffect,
  useState,
  MutableRefObject,
} from "react";
import * as THREE from "three";
import { EffectComposer, EffectPass, RenderPass } from "postprocessing";
import DecorativeContainer from "../DecorativeContainer/DecorativeContainer";
import { motion, AnimatePresence } from "framer-motion";
import { DitherEffect } from "./DitherEffect";
import { generateBlueNoiseTexture } from "@/lib/generateBlueNoise";

interface SphereImage {
  /** Image URL */
  src: string;
  /** Collection name — images sharing the same collection are connected by a line */
  collection?: string;
}

interface PhotoWindow {
  id: string;
  imageUrl: string;
  x: number;
  y: number;
  zIndex: number;
  width: number;
  height: number;
}

interface PhotoSphereProps {
  /** Array of images to place on the sphere */
  images: SphereImage[];
  /** Color of the collection connection lines */
  lineColor?: string;
  /** Opacity of the collection connection lines */
  lineOpacity?: number;
  /** Base size of images on the sphere */
  imageSize?: number;
  /** How flat/parallel to screen the images are (0 = fully wrapped around sphere, 1 = parallel to screen) */
  flatness?: number;
  /** Sphere radius */
  radius?: number;
  /** Auto-rotation speed */
  autoRotateSpeed?: number;
  /** Enable mouse control */
  enableMouseControl?: boolean;
  /** Camera distance */
  cameraDistance?: number;
  /** Camera distance on mobile devices */
  mobileCameraDistance?: number;
  /** Canvas height */
  height?: number;
  /** Canvas width */
  width?: number;
  /** Canvas width on mobile devices */
  mobileWidth?: number;
  /** Window positioning style: 'random' or 'diagonal' */
  windowPositioning?: "random" | "diagonal";
  /** Additional CSS class */
  className?: string;
  /** Ref for scroll progress (0-1) - updated externally, read in animation loop to avoid re-renders */
  scrollProgressRef?: MutableRefObject<number>;
  /** Callback when scroll starts (to notify parent to close windows) */
  onScrollStart?: () => void;
  /** Callback when all images have finished loading */
  onLoadComplete?: () => void;
  /** Ref that disables sphere touch/mouse interaction when true (mobile scroll lock) */
  interactionDisabledRef?: MutableRefObject<boolean>;
  /** Initial pixel size for dithering at scroll=0 (1 = full res). Omit to disable dithering. */
  ditherInitialPixelSize?: number;
  /** Final pixel size for dithering at scroll=1 (higher = more pixelated) */
  ditherFinalPixelSize?: number;
  /** Color quantization levels per channel (default: 4, higher = more colors) */
  ditherPaletteSize?: number;
  /** Dither noise strength 0-1 (default: 1.0, controls blue-noise offset amount) */
  ditherStrength?: number;
}

const PhotoSphere = ({
  images,
  lineColor = "#ffffff",
  lineOpacity = 0.4,
  imageSize = 1.2,
  flatness = 0,
  radius = 5,
  autoRotateSpeed = 0.001,
  enableMouseControl = true,
  cameraDistance = 8,
  mobileCameraDistance = 12,
  height = 600,
  width,
  mobileWidth,
  windowPositioning = "diagonal",
  className = "",
  scrollProgressRef,
  onScrollStart,
  onLoadComplete,
  interactionDisabledRef,
  ditherInitialPixelSize,
  ditherFinalPixelSize = 20,
  ditherPaletteSize = 4,
  ditherStrength = 1.0,
}: PhotoSphereProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sphereGroupRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const rotationVelocityRef = useRef({ x: 0, y: 0 });
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const meshToImageMapRef = useRef(new Map<THREE.Mesh, string>());
  const baseCameraDistanceRef = useRef(cameraDistance);
  const materialsRef = useRef<THREE.MeshBasicMaterial[]>([]);
  const lineMaterialsRef = useRef<THREE.LineBasicMaterial[]>([]);
  const composerRef = useRef<EffectComposer | null>(null);
  const ditherEffectRef = useRef<DitherEffect | null>(null);
  const hasTriggeredScrollStartRef = useRef(false);
  const closeWindowsFnRef = useRef<(() => void) | null>(null);
  // Store the external scroll progress ref so animation loop can access it
  const externalScrollProgressRef = useRef(scrollProgressRef);
  // Keep the ref reference up to date
  externalScrollProgressRef.current = scrollProgressRef;
  // Track loaded images count
  const loadedImagesCountRef = useRef(0);
  // Timestamp of the last window opened via touch, used to suppress the
  // synthetic 'click' event the browser fires ~300ms after touchend
  const lastTouchOpenRef = useRef(0);

  const [windows, setWindows] = useState<PhotoWindow[]>([]);
  const nextZIndexRef = useRef(1000);
  const diagonalOffsetRef = useRef({ x: 0, y: 0 });

  // Store close function in ref so animation loop can call it
  closeWindowsFnRef.current = () => {
    if (windows.length > 0) {
      setWindows([]);
    }
  };

  // Fibonacci position helper
  const fibPosition = (index: number, total: number) => {
    const phi = Math.PI * (3 - Math.sqrt(5));
    const y = 1 - (index / (total - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * index;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    return { x, y, z };
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Clear material refs from previous render
    materialsRef.current = [];
    lineMaterialsRef.current = [];
    // Reset loaded images counter
    loadedImagesCountRef.current = 0;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    // Detect mobile device
    const isMobile = window.innerWidth < 768;
    const canvasWidth = isMobile && mobileWidth ? mobileWidth : (width || container.clientWidth);
    const effectiveCameraDistance = isMobile
      ? mobileCameraDistance
      : cameraDistance;

    // Store base camera distance for scroll animation
    baseCameraDistanceRef.current = effectiveCameraDistance;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      canvasWidth / height,
      0.1,
      1000,
    );
    camera.position.z = effectiveCameraDistance;
    cameraRef.current = camera;

    // Renderer with performance optimizations
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(canvasWidth, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // Setup post-processing if dithering is enabled
    let composer: EffectComposer | null = null;
    let ditherEffect: DitherEffect | null = null;

    const isDithering = ditherInitialPixelSize !== undefined;

    if (isDithering) {
      // Generate blue-noise texture
      const blueNoiseCanvas = generateBlueNoiseTexture(64);
      const blueNoiseTexture = new THREE.CanvasTexture(blueNoiseCanvas);

      // Create dither effect
      ditherEffect = new DitherEffect({
        blueNoise: blueNoiseTexture,
        pixelSize: ditherInitialPixelSize,
        paletteSize: ditherPaletteSize,
        ditherStrength: ditherStrength,
      });
      ditherEffectRef.current = ditherEffect;

      // Setup EffectComposer
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new EffectPass(camera, ditherEffect));
      composerRef.current = composer;
    }

    // Sphere group
    const sphereGroup = new THREE.Group();
    sphereGroupRef.current = sphereGroup;
    scene.add(sphereGroup);

    // Lighting (ambient only for performance - MeshBasicMaterial doesn't need complex lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    // Calculate positions for images on sphere
    const count = images.length;
    const textureLoader = new THREE.TextureLoader();

    images.forEach((img, index) => {
      const { x, y, z } = fibPosition(index, count);

      // Load texture
      textureLoader.load(
        img.src,
        (texture) => {
          // Ensure correct color space for accurate colors
          texture.colorSpace = THREE.SRGBColorSpace;

          // Calculate aspect ratio
          const aspect = texture.image.width / texture.image.height;
          let planeWidth: number;
          let planeHeight: number;

          if (aspect > 1) {
            planeWidth = imageSize;
            planeHeight = imageSize / aspect;
          } else {
            planeHeight = imageSize;
            planeWidth = imageSize * aspect;
          }

          const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

          // Use MeshBasicMaterial for all images (dithering happens in post-processing)
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
          });
          materialsRef.current.push(material);
          const mesh = new THREE.Mesh(geometry, material);

          // Position on sphere surface
          mesh.position.set(x * radius, y * radius, z * radius);

          // Calculate rotation: interpolate between wrapped (facing outward) and flat (facing camera)
          // flatness = 0: fully wrapped around sphere (lookAt center, rotateY PI)
          // flatness = 1: parallel to screen (no rotation, facing +Z)
          const wrappedQuaternion = new THREE.Quaternion();
          mesh.lookAt(0, 0, 0);
          mesh.rotateY(Math.PI);
          wrappedQuaternion.copy(mesh.quaternion);

          const flatQuaternion = new THREE.Quaternion(); // identity = facing +Z (parallel to screen)

          // Interpolate between wrapped and flat based on flatness prop
          mesh.quaternion.slerpQuaternions(
            wrappedQuaternion,
            flatQuaternion,
            flatness,
          );

          // Map mesh to image URL for click detection
          meshToImageMapRef.current.set(mesh, img.src);

          sphereGroup.add(mesh);

          // Track loaded images
          loadedImagesCountRef.current++;
          if (loadedImagesCountRef.current === count && onLoadComplete) {
            onLoadComplete();
          }
        },
        undefined,
        (error) => {
          console.error("Error loading texture:", error);
          // Count failed loads as well to prevent hanging
          loadedImagesCountRef.current++;
          if (loadedImagesCountRef.current === count && onLoadComplete) {
            onLoadComplete();
          }
        },
      );
    });

    // Draw lines connecting images in the same collection
    const collectionMap = new Map<string, THREE.Vector3[]>();
    images.forEach((img, i) => {
      if (img.collection) {
        const { x, y, z } = fibPosition(i, count);
        const pos = new THREE.Vector3(x * radius, y * radius, z * radius);
        if (!collectionMap.has(img.collection)) {
          collectionMap.set(img.collection, []);
        }
        collectionMap.get(img.collection)!.push(pos);
      }
    });

    collectionMap.forEach((positions) => {
      if (positions.length < 2) return;
      // Connect all images in the collection to each other
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            positions[i],
            positions[j],
          ]);
          const lineMaterial = new THREE.LineBasicMaterial({
            color: lineColor,
            transparent: true,
            opacity: lineOpacity,
          });
          // Store line material for scroll animation
          lineMaterialsRef.current.push(lineMaterial);
          const line = new THREE.Line(lineGeometry, lineMaterial);
          sphereGroup.add(line);
        }
      }
    });

    // Mouse controls
    const handleMouseDown = (e: MouseEvent) => {
      if (!enableMouseControl) return;
      isDraggingRef.current = true;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!enableMouseControl || !isDraggingRef.current) return;

      const deltaX = e.clientX - previousMouseRef.current.x;
      const deltaY = e.clientY - previousMouseRef.current.y;

      rotationVelocityRef.current.y = deltaX * 0.005;
      rotationVelocityRef.current.x = deltaY * 0.005;

      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleClick = (e: MouseEvent) => {
      // Suppress synthetic click fired by the browser after a touch tap
      if (Date.now() - lastTouchOpenRef.current < 600) return;

      // Don't open window if scroll animation is active
      if (scrollProgressRef && scrollProgressRef.current > 0) {
        return;
      }

      // Don't open window if we were dragging
      if (
        Math.abs(rotationVelocityRef.current.x) > 0.01 ||
        Math.abs(rotationVelocityRef.current.y) > 0.01
      ) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(
        sphereGroup.children,
      );

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object as THREE.Mesh;
        const imageUrl = meshToImageMapRef.current.get(clickedMesh);

        if (imageUrl) {
          openWindow(imageUrl);
        }
      }
    };

    // Touch controls
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

      const deltaX = e.touches[0].clientX - previousMouseRef.current.x;
      const deltaY = e.touches[0].clientY - previousMouseRef.current.y;

      rotationVelocityRef.current.y = deltaX * 0.005;
      rotationVelocityRef.current.x = deltaY * 0.005;

      previousMouseRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };

      // Track if the touch moved significantly (not a tap)
      const dx = e.touches[0].clientX - touchStartPos.x;
      const dy = e.touches[0].clientY - touchStartPos.y;
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        touchMoved = true;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      isDraggingRef.current = false;

      // Detect tap: short duration + minimal movement
      const elapsed = Date.now() - touchStartTime;
      if (!touchMoved && elapsed < 300) {
        // Don't open window if scroll animation is active
        if (scrollProgressRef && scrollProgressRef.current > 0) return;

        const rect = canvas.getBoundingClientRect();
        mouseRef.current.x =
          ((touchStartPos.x - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y =
          -((touchStartPos.y - rect.top) / rect.height) * 2 + 1;

        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const intersects = raycasterRef.current.intersectObjects(
          sphereGroup.children,
        );

        if (intersects.length > 0) {
          const tappedMesh = intersects[0].object as THREE.Mesh;
          const imageUrl = meshToImageMapRef.current.get(tappedMesh);
          if (imageUrl) {
            lastTouchOpenRef.current = Date.now();
            openWindow(imageUrl);
          }
        }
      }
    };

    // Animation loop
    const animate = () => {
      // Handle scroll-based animations (read from ref to avoid re-renders)
      const scrollProgress = externalScrollProgressRef.current?.current ?? 0;

      // Detect scroll start and trigger window close + callback
      if (scrollProgress > 0.02 && !hasTriggeredScrollStartRef.current) {
        hasTriggeredScrollStartRef.current = true;
        closeWindowsFnRef.current?.(); // Close any open windows
        onScrollStart?.();
      } else if (scrollProgress < 0.02) {
        hasTriggeredScrollStartRef.current = false;
      }

      // Apply scroll-based camera zoom (distance decreases as progress increases)
      // Camera zooms from base distance (13) to very close (0.5) for dramatic effect
      const minDistance = 0.5;
      const baseDistance = baseCameraDistanceRef.current;
      const newCameraZ =
        baseDistance - (baseDistance - minDistance) * scrollProgress;
      camera.position.z = newCameraZ;

      // Apply scroll-based sphere scale (shrinks as progress increases)
      const scale = 1 - scrollProgress * 0.9; // Shrinks to 10% at full scroll
      sphereGroup.scale.setScalar(Math.max(0.01, scale));

      // Apply scroll-based opacity
      const opacity = Math.max(0, 1 - scrollProgress * 1.2); // Reaches 0 at ~83% scroll

      // Update dither effect pixel size based on scroll progress
      if (ditherEffectRef.current && ditherInitialPixelSize !== undefined) {
        const currentPixelSize = ditherInitialPixelSize + 
          (ditherFinalPixelSize - ditherInitialPixelSize) * scrollProgress;
        ditherEffectRef.current.setPixelSize(currentPixelSize);
      }

      materialsRef.current.forEach((mat) => {
        mat.opacity = opacity;
      });

      lineMaterialsRef.current.forEach((mat) => {
        mat.opacity = lineOpacity * opacity;
      });

      if (sphereGroup) {
        // Apply auto-rotation (reduced when scrolling)
        const effectiveAutoRotate =
          autoRotateSpeed * (1 - scrollProgress * 0.8);
        if (!isDraggingRef.current) {
          sphereGroup.rotation.y += effectiveAutoRotate;

          // Dampen velocity
          rotationVelocityRef.current.x *= 0.95;
          rotationVelocityRef.current.y *= 0.95;
        }

        // Apply drag rotation
        sphereGroup.rotation.y += rotationVelocityRef.current.y;
        sphereGroup.rotation.x += rotationVelocityRef.current.x;

        // Clamp X rotation to prevent flipping
        sphereGroup.rotation.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, sphereGroup.rotation.x),
        );
      }

      // Render with composer or renderer
      if (composerRef.current) {
        composerRef.current.render();
      } else {
        renderer.render(scene, camera);
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Event listeners
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("click", handleClick);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchmove", handleTouchMove);
    canvas.addEventListener("touchend", handleTouchEnd);

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = width || containerRef.current.clientWidth;

      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height);
      
      if (composerRef.current) {
        composerRef.current.setSize(newWidth, height);
      }
      if (ditherEffectRef.current) {
        ditherEffectRef.current.updateResolution(newWidth, height);
      }
    };

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
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      // Clear material refs
      materialsRef.current = [];
      lineMaterialsRef.current = [];
      
      // Dispose post-processing
      if (ditherEffectRef.current) {
        ditherEffectRef.current.dispose();
        ditherEffectRef.current = null;
      }
      if (composerRef.current) {
        composerRef.current.dispose();
        composerRef.current = null;
      }
      
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

  const openWindow = (imageUrl: string) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    // Load image to get dimensions
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const aspectRatio = img.width / img.height;

      // Target area approximately 200,000px² (similar to 400x500)
      const targetArea = 200000;

      // Calculate dimensions maintaining aspect ratio
      let windowWidth: number;
      let windowHeight: number;

      if (aspectRatio > 1) {
        // Landscape
        windowHeight = Math.sqrt(targetArea / aspectRatio);
        windowWidth = windowHeight * aspectRatio;
      } else {
        // Portrait or square
        windowWidth = Math.sqrt(targetArea * aspectRatio);
        windowHeight = windowWidth / aspectRatio;
      }

      // Round to whole numbers
      windowWidth = Math.round(windowWidth);
      windowHeight = Math.round(windowHeight);

      // Scale down on mobile for better fit
      const isMobileDevice = window.innerWidth < 768;
      if (isMobileDevice) {
        windowWidth = Math.round(windowWidth * 0.6);
        windowHeight = Math.round(windowHeight * 0.6);
      }

      let x: number;
      let y: number;

      if (windowPositioning === "diagonal") {
        // Diagonal cascading pattern
        x = diagonalOffsetRef.current.x;
        y = diagonalOffsetRef.current.y;

        // Update offset for next window
        diagonalOffsetRef.current.x += 30;
        diagonalOffsetRef.current.y += 30;

        // Reset if going off screen
        if (
          diagonalOffsetRef.current.x + windowWidth > containerRect.width ||
          diagonalOffsetRef.current.y + windowHeight > containerRect.height
        ) {
          diagonalOffsetRef.current = { x: 0, y: 0 };
        }
      } else {
        // Random positioning
        x = Math.random() * Math.max(0, containerRect.width - windowWidth);
        y = Math.random() * Math.max(0, containerRect.height - windowHeight);
      }

      const zIndex = nextZIndexRef.current++;

      const newWindow: PhotoWindow = {
        id: `window-${Date.now()}-${Math.random()}`,
        imageUrl,
        x,
        y,
        zIndex,
        width: windowWidth,
        height: windowHeight,
      };

      setWindows((prev) => [...prev, newWindow]);
    };
  };

  const closeWindow = (id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  };

  const bringToFront = (id: string) => {
    const zIndex = nextZIndexRef.current++;
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, zIndex } : w)),
    );
  };

  const moveWindow = (id: string, newX: number, newY: number) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, x: newX, y: newY } : w)),
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${className}`}
      style={{ height, width, perspective: "800px" }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Photo Windows */}
      <AnimatePresence>
        {windows.map((photoWindow) => {
          const handleMouseDown = (e: React.MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest(".draggable-header")) return;

            bringToFront(photoWindow.id);
            const startX = e.clientX;
            const startY = e.clientY;
            const startWindowX = photoWindow.x;
            const startWindowY = photoWindow.y;

            const handleMouseMove = (moveEvent: MouseEvent) => {
              const deltaX = moveEvent.clientX - startX;
              const deltaY = moveEvent.clientY - startY;
              moveWindow(
                photoWindow.id,
                startWindowX + deltaX,
                startWindowY + deltaY,
              );
            };

            const handleMouseUp = () => {
              window.removeEventListener("mousemove", handleMouseMove);
              window.removeEventListener("mouseup", handleMouseUp);
            };

            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
          };

          // Touch-based window dragging (mobile)
          const handleTouchStartDrag = (e: React.TouchEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest(".draggable-header")) return;

            bringToFront(photoWindow.id);
            const touch = e.touches[0];
            const startX = touch.clientX;
            const startY = touch.clientY;
            const startWindowX = photoWindow.x;
            const startWindowY = photoWindow.y;

            const handleTouchMoveDrag = (moveEvent: TouchEvent) => {
              moveEvent.preventDefault();
              const moveTouch = moveEvent.touches[0];
              const deltaX = moveTouch.clientX - startX;
              const deltaY = moveTouch.clientY - startY;
              moveWindow(
                photoWindow.id,
                startWindowX + deltaX,
                startWindowY + deltaY,
              );
            };

            const handleTouchEndDrag = () => {
              window.removeEventListener("touchmove", handleTouchMoveDrag);
              window.removeEventListener("touchend", handleTouchEndDrag);
            };

            window.addEventListener("touchmove", handleTouchMoveDrag, { passive: false });
            window.addEventListener("touchend", handleTouchEndDrag);
          };

          return (
            <motion.div
              key={photoWindow.id}
              data-photo-window
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute"
              style={{
                left: photoWindow.x,
                top: photoWindow.y,
                zIndex: photoWindow.zIndex,
              }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStartDrag}
            >
              <DecorativeContainer
                mode="modal"
                title="Image Viewer"
                width={photoWindow.width}
                height={photoWindow.height}
                showActions={true}
                onClose={() => closeWindow(photoWindow.id)}
                onCancel={() => {}}
                onOk={() => {}}
              >
                {ditherInitialPixelSize && ditherInitialPixelSize > 1 ? (
                  // CSS nearest-neighbour pixelation matching the sphere's dither pixel size
                  <div
                    style={{
                      width: photoWindow.width,
                      height: photoWindow.height,
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={photoWindow.imageUrl}
                      alt="Opened"
                      draggable={false}
                      style={{
                        display: "block",
                        imageRendering: "pixelated",
                        width: `${Math.round(photoWindow.width / ditherInitialPixelSize)}px`,
                        height: `${Math.round(photoWindow.height / ditherInitialPixelSize)}px`,
                        transform: `scale(${ditherInitialPixelSize})`,
                        transformOrigin: "0 0",
                      }}
                    />
                  </div>
                ) : (
                  <img
                    src={photoWindow.imageUrl}
                    alt="Opened"
                    className="w-full h-auto object-contain"
                    draggable={false}
                  />
                )}
              </DecorativeContainer>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default PhotoSphere;
