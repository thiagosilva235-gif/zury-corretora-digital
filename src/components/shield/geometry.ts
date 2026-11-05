import * as THREE from "three";
import { contours, referencePoint } from "./reference-contours.mjs";
import type { Command } from "./reference-contours.mjs";

function path(commands: Command[]) {
  const shape = new THREE.Shape();
  for (const command of commands) {
    switch (command[0]) {
      case "M":
        shape.moveTo(...referencePoint(command[1], command[2]));
        break;
      case "L":
        shape.lineTo(...referencePoint(command[1], command[2]));
        break;
      case "C":
        shape.bezierCurveTo(
          ...referencePoint(command[1], command[2]),
          ...referencePoint(command[3], command[4]),
          ...referencePoint(command[5], command[6]),
        );
        break;
      case "Z":
        shape.closePath();
        break;
    }
  }
  return shape;
}

/** A small physical crown with analytic normals, without visible radial facets. */
function finish(
  geometry: THREE.BufferGeometry,
  brushAngle = Math.atan2(0.6, 0.8),
  preserveUV = false,
  bend = true,
  frontOnly?: { base: number; depth: number },
) {
  const p = geometry.getAttribute("position"),
    n = geometry.getAttribute("normal"),
    uv = geometry.getAttribute("uv");
  const tangents: number[] = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i);
    // A restrained sheet-metal crown: excess bowing folds the very thin channel fillets.
    const z = p.getZ(i),
      height = 0.04 - 0.012 * x * x - 0.01 * y * y;
    const weight = frontOnly
      ? THREE.MathUtils.clamp((z - frontOnly.base) / frontOnly.depth, 0, 1)
      : 1;
    const dz =
      frontOnly && z > frontOnly.base && z < frontOnly.base + frontOnly.depth
        ? 1 / frontOnly.depth
        : 0;
    const jacobian = bend ? 1 + height * dz : 1,
      dx = bend ? weight * 0.024 * x : 0,
      dy = bend ? weight * 0.02 * y : 0;
    if (bend) p.setZ(i, z + height * weight);
    const normal = new THREE.Vector3(
      n.getX(i) + (n.getZ(i) * dx) / jacobian,
      n.getY(i) + (n.getZ(i) * dy) / jacobian,
      n.getZ(i) / jacobian,
    ).normalize();
    n.setXYZ(i, normal.x, normal.y, normal.z);
    const stored = geometry.getAttribute("tangent");
    const direction =
      preserveUV && stored
        ? new THREE.Vector3().fromBufferAttribute(stored, i)
        : new THREE.Vector3(Math.cos(brushAngle), Math.sin(brushAngle), 0);
    direction.z = direction.z * jacobian - dx * direction.x - dy * direction.y;
    const tangent = direction.addScaledVector(normal, -direction.dot(normal)).normalize();
    tangents.push(tangent.x, tangent.y, tangent.z, 1);
    if (!preserveUV)
      uv.setXY(
        i,
        (Math.cos(brushAngle) * x + Math.sin(brushAngle) * y + 2) / 4,
        (-Math.sin(brushAngle) * x + Math.cos(brushAngle) * y + 2) / 4,
      );
  }
  geometry.setAttribute("tangent", new THREE.Float32BufferAttribute(tangents, 4));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
function solid(
  shape: THREE.Shape,
  z: number,
  depth: number,
  bevel: number,
  brushAngle?: number,
  bend: boolean | "front-only" = true,
) {
  const source = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    curveSegments: 16,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 6,
  }).translate(0, 0, z);
  smoothMachinedNormals(source);
  const geometry = subdivide(source);
  source.dispose();
  return finish(
    geometry,
    brushAngle,
    false,
    !!bend,
    bend === "front-only" ? { base: z, depth } : undefined,
  );
}

/** Smooth small fillets, retaining the actual architectural creases. Quantization is subpixel. */
function smoothMachinedNormals(g: THREE.BufferGeometry, materials = [1]) {
  const p = g.getAttribute("position"),
    n = g.getAttribute("normal"),
    byPosition = new Map<string, THREE.Vector3[]>();
  const key = (i: number) =>
    [p.getX(i), p.getY(i), p.getZ(i)].map((v) => Math.round(v * 1e6)).join(",");
  for (let i = 0; i < p.count; i++) {
    const list = byPosition.get(key(i)) ?? [];
    list.push(new THREE.Vector3().fromBufferAttribute(n, i));
    byPosition.set(key(i), list);
  }
  for (const group of g.groups.filter((group) => materials.includes(group.materialIndex ?? 0)))
    for (let i = group.start; i < group.start + group.count; i++) {
      const original = new THREE.Vector3().fromBufferAttribute(n, i),
        sum = new THREE.Vector3();
      for (const adjacent of byPosition.get(key(i))!)
        if (original.dot(adjacent) > Math.cos(Math.PI / 6)) sum.add(adjacent);
      sum.normalize();
      n.setXYZ(i, sum.x, sum.y, sum.z);
    }
}

/** Split every long edge on BOTH adjoining triangles, including across material groups.
 * Longest-edge-only/cap-only tessellation leaves T-junctions that open when curved. */
function subdivide(source: THREE.BufferGeometry) {
  type Vertex = { p: THREE.Vector3; n: THREE.Vector3 };
  type Triangle = [Vertex, Vertex, Vertex];
  const position = source.getAttribute("position"),
    normal = source.getAttribute("normal");
  const vertex = (i: number): Vertex => ({
    p: new THREE.Vector3().fromBufferAttribute(position, i),
    n: new THREE.Vector3().fromBufferAttribute(normal, i),
  });
  const midpoint = (a: Vertex, b: Vertex): Vertex => ({
    p: a.p.clone().add(b.p).multiplyScalar(0.5),
    n: a.n.clone().add(b.n).normalize(),
  });
  const positions: number[] = [],
    normals: number[] = [],
    geometry = new THREE.BufferGeometry();
  for (const group of source.groups) {
    let triangles: Triangle[] = [];
    for (let i = group.start; i < group.start + group.count; i += 3)
      triangles.push([vertex(i), vertex(i + 1), vertex(i + 2)]);
    for (let pass = 0; pass < 7; pass++) {
      const next: Triangle[] = [];
      let changed = false;
      for (const [a, b, c] of triangles) {
        const mask =
          (a.p.distanceToSquared(b.p) > 0.18 ** 2 ? 1 : 0) |
          (b.p.distanceToSquared(c.p) > 0.18 ** 2 ? 2 : 0) |
          (c.p.distanceToSquared(a.p) > 0.18 ** 2 ? 4 : 0);
        if (!mask) {
          next.push([a, b, c]);
          continue;
        }
        changed = true;
        const ab = midpoint(a, b),
          bc = midpoint(b, c),
          ca = midpoint(c, a);
        if (mask === 1) next.push([a, ab, c], [ab, b, c]);
        if (mask === 2) next.push([a, b, bc], [a, bc, c]);
        if (mask === 4) next.push([a, b, ca], [ca, b, c]);
        if (mask === 3) next.push([ab, b, bc], [a, ab, c], [ab, bc, c]);
        if (mask === 5) next.push([a, ab, ca], [ab, b, c], [ca, ab, c]);
        if (mask === 6) next.push([bc, c, ca], [a, b, ca], [b, bc, ca]);
        if (mask === 7) next.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]);
      }
      triangles = next;
      if (!changed) break;
    }
    const start = positions.length / 3;
    for (const triangle of triangles)
      for (const v of triangle) {
        positions.push(v.p.x, v.p.y, v.p.z);
        normals.push(v.n.x, v.n.y, v.n.z);
      }
    geometry.addGroup(start, positions.length / 3 - start, group.materialIndex);
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(new Float32Array((positions.length / 3) * 2), 2),
  );
  return geometry;
}

/** Closed, rolled rim. The visible band slopes inward instead of being a flat silver extrusion cap. */
function rolledRim() {
  const outer = path(contours.outline).getSpacedPoints(384),
    inner = path(contours.inner).getSpacedPoints(384);
  const profile: [number, number][] = [
    [0, -0.21],
    [0, 0.035],
    [0.08, 0.1],
    [0.16, 0.115],
    [0.86, 0.085],
    [0.91, 0.08],
    [0.97, 0.015],
    [0.98, 0.015],
    [0.98, -0.21],
  ];
  const positions: number[] = [],
    indices: number[] = [],
    uvs: number[] = [],
    tangents: number[] = [];
  for (const [blend, z] of profile)
    for (let i = 0; i < outer.length; i++) {
      // Both contours have the same fixed sample count; indices below wrap within that count.
      const point = outer[i]!.clone().lerp(inner[i]!, blend);
      positions.push(point.x, point.y, z);
      uvs.push((i / (outer.length - 1)) * 4, blend);
      const before = (i - 1 + outer.length - 1) % (outer.length - 1),
        after = (i + 1) % (outer.length - 1);
      const tangent = outer[after]!.clone()
        .lerp(inner[after]!, blend)
        .sub(outer[before]!.clone().lerp(inner[before]!, blend))
        .normalize();
      tangents.push(tangent.x, tangent.y, 0, 1);
    }
  for (let j = 0; j < profile.length; j++)
    for (let i = 0; i < outer.length - 1; i++) {
      const a = j * outer.length + i,
        b = a + 1,
        c = ((j + 1) % profile.length) * outer.length + i,
        d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("tangent", new THREE.Float32BufferAttribute(tangents, 4));
  geometry.setIndex(indices);
  for (let j = 0; j < profile.length; j++) {
    const count = (outer.length - 1) * 6,
      material = j >= 1 && j <= 4 ? 0 : 1,
      last = geometry.groups.at(-1);
    if (last?.materialIndex === material) last.count += count;
    else geometry.addGroup(j * count, count, material);
  }
  const result = geometry.toNonIndexed();
  geometry.dispose();
  result.computeVertexNormals();
  smoothMachinedNormals(result, [0, 1]);
  return finish(result, 0, true);
}
export function createShieldModel() {
  const face = path(contours.inner);
  // ExtrudeGeometry expects holes opposite to the clockwise outer contour.
  face.holes.push(
    ...[contours.upperCut, contours.lowerCut].map(
      (commands) => new THREE.Path(path(commands).getPoints(48).reverse()),
    ),
  );
  return {
    // Hidden backing stays plain: bending very thin cap ears creates inverted sliver faces.
    back: solid(path(contours.outline), -0.23, 0.13, 0.006, 0, false).scale(0.992, 0.992, 1),
    rim: rolledRim(),
    // A flat machined back transitions continuously to the curved front, without folding thin rear fillets.
    face: solid(face, -0.07, 0.14, 0.008, undefined, "front-only"),
    crown: solid(path(contours.crown), 0.074, 0.045, 0.006, 0),
  };
}
