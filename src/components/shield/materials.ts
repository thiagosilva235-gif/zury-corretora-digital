import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";

/** Real, finite softboxes produce spatially varying reflections, even on the broad front plates. */
export function createStudioLights() {
  if (!("LTC_FLOAT_1" in THREE.UniformsLib)) RectAreaLightUniformsLib.init();
  const rig = new THREE.Group();
  const key = new THREE.RectAreaLight(0xffffff, 8, 1.8, 3.4);
  key.position.set(-1.5, 2.5, 4);
  key.lookAt(0, 0, 0);
  const fill = new THREE.RectAreaLight(0xffffff, 1.6, 1, 4);
  fill.position.set(3.2, 0.5, 1.7);
  fill.lookAt(0, 0, 0);
  rig.add(key, fill);
  return rig;
}

export function createShieldMaterials() {
  const width = 1024,
    height = 1024,
    data = new Uint8Array(width * height * 4);
  let seed = 73019;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let y = 0; y < height; y++) {
    const row = (random() - 0.5) * 40;
    const scratch = random() < 0.13 ? -20 : 0;
    for (let x = 0; x < width; x++) {
      const noise = (random() - 0.5) * 10;
      const value = Math.round(128 + row + scratch + noise);
      const roughness = Math.round(187 + row * 0.55 - scratch * 0.45 + noise * 0.3);
      // Red encodes micro-height; green controls roughness independently on the same GPU texture.
      data.set([value, roughness, value, 255], (y * width + x) * 4);
    }
  }
  const grain = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(1, 1);
  grain.generateMipmaps = true;
  grain.minFilter = THREE.LinearMipmapLinearFilter;
  grain.needsUpdate = true;
  const metal = (color: string, roughness: number) =>
    new THREE.MeshPhysicalMaterial({
      color,
      metalness: 1,
      roughness,
      roughnessMap: grain,
      bumpMap: grain,
      bumpScale: 0.003,
      anisotropy: 0.55,
      anisotropyRotation: 0,
      clearcoat: 0,
      envMapIntensity: 1,
      dithering: true,
    });
  const edge = metal("#999999", 0.26);
  edge.envMapIntensity = 1.8;
  return {
    face: metal("#303131", 0.32),
    crown: metal("#383838", 0.34),
    rim: metal("#8d8d8d", 0.35),
    edge,
    back: new THREE.MeshStandardMaterial({
      color: "#151616",
      metalness: 1,
      roughness: 0.48,
      envMapIntensity: 0.65,
      dithering: true,
    }),
    grain,
  };
}
/** Broad HDR strips inspired only by IMG_3367; never a painted backdrop. */
export function createStudioEnvironment() {
  const width = 768,
    height = 384,
    data = new Float32Array(width * height * 4);
  const panels = [
    { yaw: 0.38, elevation: 0.45, width: 0.28, height: 0.5, intensity: 4.5 },
    { yaw: -0.48, elevation: 0.18, width: 0.45, height: 0.65, intensity: 0.38 },
    { yaw: 1.5, elevation: 0.3, width: 0.18, height: 0.8, intensity: 1.8 },
    { yaw: -1.5, elevation: 0.1, width: 0.18, height: 0.9, intensity: 2.4 },
    { yaw: 0.6, elevation: 1.25, width: 0.7, height: 0.2, intensity: 2.5 },
    { yaw: -0.65, elevation: -0.8, width: 0.5, height: 0.2, intensity: 1 },
    { yaw: 0, elevation: 1.38, width: 2.5, height: 0.24, intensity: 8 },
    { yaw: 0, elevation: -1.38, width: 2.5, height: 0.24, intensity: 8 },
    { yaw: 2.4, elevation: 0.25, width: 0.65, height: 0.8, intensity: 3 },
  ];
  for (let y = 0; y < height; y++) {
    // DataTexture has flipY=false: v=1 is the upper hemisphere in Three's equirectUv().
    const elevation = (y / (height - 1) - 0.5) * Math.PI;
    for (let x = 0; x < width; x++) {
      const yaw = (x / (width - 1) - 0.75) * Math.PI * 2;
      let value = 0.045;
      for (const panel of panels) {
        const delta = Math.atan2(Math.sin(yaw - panel.yaw), Math.cos(yaw - panel.yaw));
        value +=
          panel.intensity *
          Math.exp(-Math.pow(delta / panel.width, 2)) *
          Math.exp(-Math.pow((elevation - panel.elevation) / panel.height, 2));
      }
      data.set([value, value, value, 1], (y * width + x) * 4);
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.LinearSRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
