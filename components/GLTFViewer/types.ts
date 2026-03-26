export type GLTFViewerProps = {
  /** Path to the GLTF/GLB file */
  modelPath: string;
  /** Size of the viewer container in pixels */
  size?: number;
  /** Rotation speed (radians per frame) */
  rotationSpeed?: number;
  /** Camera distance from the model */
  cameraDistance?: number;
};
