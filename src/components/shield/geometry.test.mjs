import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { createShieldModel } from "./geometry.ts";
import { referencePoint, contours } from "./reference-contours.mjs";
import { shieldMotion } from "./motion-config.mjs";
import { createStudioEnvironment } from "./materials.ts";
import * as studio from "./materials.ts";

test("reference-based shield has closed extrusions, finite normals and bounded geometry", () => {
  const model = createShieldModel();
  assert.deepEqual(Object.keys(model), ["back", "rim", "face", "crown"]);
  let triangles = 0;
  for (const geometry of Object.values(model)) {
    for (const key of ["position", "normal", "uv", "tangent"])
      assert.ok([...geometry.getAttribute(key).array].every(Number.isFinite), key);
    const n = geometry.getAttribute("normal");
    for (let i = 0; i < n.count; i++)
      assert.ok(Math.abs(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) - 1) < 1e-5);
    assert.deepEqual([...new Set(geometry.groups.map((g) => g.materialIndex))].sort(), [0, 1]);
    assert.ok(geometry.boundingBox.max.z > geometry.boundingBox.min.z + 0.02);
    triangles += geometry.getAttribute("position").count / 3;
    geometry.dispose();
  }
  assert.ok(triangles < 60000, "triangle budget remains bounded");
});

test("front silhouette follows independently measured alpha-edge landmarks from image 2", () => {
  const model = createShieldModel(),
    p = model.rim.getAttribute("position");
  for (const [row, left, right] of [
    [600, 221, 1034],
    [790, 278, 974],
    [883, 326, 923],
    [1000, 411, 833],
    [1100, 500, 737],
  ]) {
    const y = (626 - row) / 320,
      xs = [];
    for (let i = 0; i < p.count; i += 3)
      for (const [a, b] of [
        [i, i + 1],
        [i + 1, i + 2],
        [i + 2, i],
      ]) {
        const ay = p.getY(a),
          by = p.getY(b);
        if ((ay <= y && by > y) || (by <= y && ay > y))
          xs.push((p.getX(a) + ((y - ay) / (by - ay)) * (p.getX(b) - p.getX(a))) * 320 + 628);
      }
    assert.ok(Math.abs(Math.min(...xs) - left) <= 2, `left boundary at row ${row}`);
    assert.ok(Math.abs(Math.max(...xs) - right) <= 2, `right boundary at row ${row}`);
  }
  Object.values(model).forEach((g) => g.dispose());
});

test("the reference Z channels have simple, non-self-intersecting outlines", () => {
  for (const name of ["upperCut", "lowerCut"]) {
    const shape = new THREE.Shape();
    for (const [op, ...p] of contours[name]) {
      if (op === "M") shape.moveTo(p[0], p[1]);
      if (op === "L") shape.lineTo(p[0], p[1]);
      if (op === "C") shape.bezierCurveTo(...p);
      if (op === "Z") shape.closePath();
    }
    const points = shape.getPoints(32),
      cross = (a, b) => a.x * b.y - a.y * b.x;
    for (let i = 0; i < points.length - 1; i++)
      for (let j = i + 2; j < points.length - 1; j++) {
        const a = points[i],
          b = points[j],
          u = points[i + 1].clone().sub(a),
          v = points[j + 1].clone().sub(b),
          d = cross(u, v);
        if (Math.abs(d) < 1e-8) continue;
        const offset = b.clone().sub(a),
          t = cross(offset, v) / d,
          s = cross(offset, u) / d;
        assert.ok(
          !(t > 1e-6 && t < 1 - 1e-6 && s > 1e-6 && s < 1 - 1e-6),
          `${name}: crossing edges ${i}/${j} change the Z cutout`,
        );
      }
  }
});

test("interpolated normals agree with triangle winding on every shield surface", () => {
  const model = createShieldModel();
  for (const [name, g] of Object.entries(model)) {
    const p = g.getAttribute("position"),
      n = g.getAttribute("normal");
    for (let i = 0; i < p.count; i += 3) {
      const a = new THREE.Vector3().fromBufferAttribute(p, i),
        b = new THREE.Vector3().fromBufferAttribute(p, i + 1),
        c = new THREE.Vector3().fromBufferAttribute(p, i + 2);
      const geometric = b.sub(a).cross(c.sub(a)).normalize();
      const smooth = new THREE.Vector3()
        .fromBufferAttribute(n, i)
        .add(new THREE.Vector3().fromBufferAttribute(n, i + 1))
        .add(new THREE.Vector3().fromBufferAttribute(n, i + 2))
        .normalize();
      assert.ok(
        geometric.dot(smooth) > 0,
        `${name}: inverted lighting normal on triangle ${i / 3}`,
      );
    }
    g.dispose();
  }
});

test("back and front plate sidewalls are not coplanar with the rim", () => {
  const model = createShieldModel(),
    material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const cast = (part, z) =>
    new THREE.Raycaster(new THREE.Vector3(5, 0, z), new THREE.Vector3(-1, 0, 0)).intersectObject(
      new THREE.Mesh(model[part], [material, material]),
    );
  assert.ok(
    Math.abs(cast("back", -0.15)[0].point.x - cast("rim", -0.15)[0].point.x) > 0.005,
    "overlapping outer walls would z-fight at grazing angles",
  );
  const rimInner = cast("rim", 0)
    .filter((h) => h.point.x > 0)
    .at(-1);
  const plateOuter = cast("face", 0)[0];
  assert.ok(
    Math.abs(rimInner.point.x - plateOuter.point.x) > 0.0001,
    "inner rim and plate need a real seam, not coplanar walls",
  );
  Object.values(model).forEach((g) => g.dispose());
  material.dispose();
});

test("the extruded outer side of the rim uses graphite instead of the bright front-band material", () => {
  const model = createShieldModel(),
    material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(model.rim, [material, material]);
  const hit = new THREE.Raycaster(
    new THREE.Vector3(5, 0, -0.1),
    new THREE.Vector3(-1, 0, 0),
  ).intersectObject(mesh)[0];
  assert.ok(hit, "the rim must have physical side depth");
  assert.equal(hit.face.materialIndex, 1, "extruded side must use the graphite material slot");
  Object.values(model).forEach((g) => g.dispose());
  material.dispose();
});

test("the face tangent field follows the diagonal brushed-steel direction", () => {
  const model = createShieldModel(),
    n = model.face.getAttribute("normal"),
    t = model.face.getAttribute("tangent");
  const i = Array.from({ length: n.count }, (_, i) => i).find((i) => n.getZ(i) > 0.995);
  assert.notEqual(i, undefined);
  const direction = new THREE.Vector2(t.getX(i), t.getY(i)).normalize();
  assert.ok(
    direction.dot(new THREE.Vector2(0.8, 0.6)) > 0.99,
    "tangent and scratch UV directions must agree",
  );
  Object.values(model).forEach((g) => g.dispose());
});

test("the studio key illuminates the upper hemisphere, using Three's equirectangular V convention", () => {
  const environment = createStudioEnvironment(),
    { width, height, data } = environment.image;
  // equirectUv: u=atan(z,x)/(2 PI)+.5; v=asin(y)/PI+.5. The key is above the object.
  const sample = (u, v) =>
    data[(Math.round(v * (height - 1)) * width + Math.round(u * (width - 1))) * 4];
  const above = sample(0.81, 0.64),
    below = sample(0.81, 0.36);
  assert.ok(above > below * 3, `key must be above, not below: ${above} vs ${below}`);
  environment.dispose();
});

test("finite studio softboxes are area lights aimed at the shield, not point-light hotspots", () => {
  assert.equal(typeof studio.createStudioLights, "function");
  const rig = studio.createStudioLights();
  assert.equal(rig.children.length, 2);
  for (const light of rig.children) {
    assert.ok(light instanceof THREE.RectAreaLight);
    const towardOrigin = light.position.clone().negate().normalize();
    const emission = new THREE.Vector3(0, 0, -1).applyQuaternion(light.quaternion);
    assert.ok(emission.dot(towardOrigin) > 0.99);
    assert.ok(light.width >= 1 && light.height >= 2);
  }
  assert.ok(
    rig.children[0].position.x < 0 &&
      rig.children[0].position.y > 0 &&
      rig.children[0].position.z > 0,
  );
});

test("large face caps keep analytic surface normals instead of inheriting bevel shading fans", () => {
  const model = createShieldModel(),
    g = model.face,
    p = g.getAttribute("position"),
    n = g.getAttribute("normal");
  for (const group of g.groups.filter((group) => group.materialIndex === 0))
    for (let i = group.start; i < group.start + group.count; i++) {
      const sign = Math.sign(n.getZ(i)),
        expected =
          sign > 0
            ? new THREE.Vector3(0.024 * p.getX(i), 0.02 * p.getY(i), 1).normalize()
            : new THREE.Vector3(0, 0, -1);
      assert.ok(
        expected.distanceTo(new THREE.Vector3().fromBufferAttribute(n, i)) < 1e-4,
        "bevel normals must not leak into broad metal caps",
      );
    }
  Object.values(model).forEach((g) => g.dispose());
});

test("the two Z recesses are actual openings in the metal face, not painted details", () => {
  const model = createShieldModel(),
    material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
    mesh = new THREE.Mesh(model.face, material);
  const cast = (x, y) => {
    const [u, v] = referencePoint(x, y);
    return new THREE.Raycaster(
      new THREE.Vector3(u, v, 5),
      new THREE.Vector3(0, 0, -1),
    ).intersectObject(mesh);
  };
  assert.equal(cast(600, 380).length, 0, "upper channel is cut through the face");
  assert.equal(cast(650, 808).length, 0, "lower channel is cut through the face");
  assert.ok(cast(600, 600).length > 0, "the diagonal Z stroke remains physical metal");
  for (const g of Object.values(model)) g.dispose();
  material.dispose();
});

test("a front-facing machined chamfer remains visible immediately above the upper Z channel", () => {
  const model = createShieldModel(),
    material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(model.face, [material, material]),
    [x, y] = referencePoint(600, 362);
  const hit = new THREE.Raycaster(
    new THREE.Vector3(x, y, 5),
    new THREE.Vector3(0, 0, -1),
  ).intersectObject(mesh)[0];
  assert.ok(hit, "the metal lip must remain physical");
  assert.equal(
    hit.face.materialIndex,
    1,
    "the chamfer must be exposed, not hidden below an overhanging cap",
  );
  assert.ok(
    hit.normal.z > 0 && hit.normal.z < 0.99,
    "the chamfer normal must face the camera at an angle",
  );
  Object.values(model).forEach((g) => g.dispose());
  material.dispose();
});

test("curving each solid preserves a watertight two-manifold surface without T-junction cracks", () => {
  const model = createShieldModel();
  for (const [name, g] of Object.entries(model)) {
    const p = g.getAttribute("position"),
      edges = new Map();
    const key = (i) => [p.getX(i), p.getY(i), p.getZ(i)].map((v) => Math.round(v * 1e5)).join(",");
    for (let i = 0; i < p.count; i += 3)
      for (const [a, b] of [
        [i, i + 1],
        [i + 1, i + 2],
        [i + 2, i],
      ]) {
        const edge = [key(a), key(b)].sort().join("|");
        edges.set(edge, (edges.get(edge) || 0) + 1);
      }
    assert.equal(
      [...edges.values()].filter((count) => count !== 2).length,
      0,
      `${name}: each welded edge must have exactly two adjacent triangles`,
    );
    g.dispose();
  }
});

test("motion configuration keeps entrance cinematic and interaction restrained", () => {
  assert.ok(shieldMotion.entrance.duration >= 2.5 && shieldMotion.entrance.duration <= 4);
  assert.ok(shieldMotion.float.amplitude <= 0.015);
  assert.ok(shieldMotion.tilt.yaw <= 0.11 && shieldMotion.tilt.pitch <= 0.07);
  assert.ok(shieldMotion.tilt.touchFactor < 1);
  assert.ok(shieldMotion.scroll.yaw <= 0.1);
});
