import assert from "node:assert/strict";
import test from "node:test";
import { imageShieldTilt } from "../components/shield/image-motion.mjs";
import * as imageMotion from "../components/shield/image-motion.mjs";
import { gsap } from "gsap";

test("shield motion reduces every decorative axis on compact screens and removes it for reduced motion", () => {
  assert.equal(typeof imageMotion.imageShieldProfile, "function");
  const desktop = imageMotion.imageShieldProfile();
  const mobile = imageMotion.imageShieldProfile({ compact: true });
  for (const axis of [
    "floatX",
    "floatY",
    "pitch",
    "yaw",
    "roll",
    "lightX",
    "lightY",
    "lightRoll",
    "scrollY",
    "scrollYaw",
  ]) {
    assert.ok(Number.isFinite(desktop[axis]) && desktop[axis] > 0);
    assert.ok(mobile[axis] > 0 && mobile[axis] < desktop[axis], axis);
    assert.equal(imageMotion.imageShieldProfile({ reducedMotion: true })[axis], 0);
    assert.equal(imageMotion.imageShieldProfile({ compact: true, reducedMotion: true })[axis], 0);
  }
});

test("shield travels around a closed orbit instead of reversing along a diagonal", () => {
  assert.equal(typeof imageMotion.createImageShieldOrbit, "function");
  const art = { x: 0, y: 0, rotationX: 0, rotationY: 0, rotationZ: 0 };
  const light = { x: 0, y: 0, rotation: 0, opacity: 1 };
  const orbit = imageMotion.createImageShieldOrbit(
    gsap,
    art,
    light,
    imageMotion.imageShieldProfile(),
  );
  const sample = (fraction) => {
    orbit.totalTime(orbit.duration() * fraction, true);
    return { ...art };
  };
  try {
    const start = sample(0),
      quarter = sample(0.25),
      half = sample(0.5),
      end = sample(1);
    assert.ok(start.x < 0 && half.x > 0);
    assert.ok(Math.abs(quarter.x) < 0.001 && quarter.y < -1);
    for (const axis of ["x", "y", "rotationX", "rotationY", "rotationZ"]) {
      assert.ok(Math.abs(start[axis] - end[axis]) < 0.001, `loop seam: ${axis}`);
    }
    // A closed loop must also cross the seam without a sudden direction change.
    const before = sample(0.999),
      after = sample(1.001);
    assert.ok(before.y > 0 && after.y < 0);
    assert.ok(Math.abs(before.y + after.y) < 0.001);
    const positions = [];
    for (let i = 0; i <= 64; i++) {
      const pose = sample(i / 32);
      positions.push(pose);
      assert.ok(Math.abs(pose.x) <= 16 && Math.abs(pose.y) <= 28);
      assert.ok(
        Math.abs(pose.rotationX) <= 1.2 &&
          Math.abs(pose.rotationY) <= 4.2 &&
          Math.abs(pose.rotationZ) <= 1.5,
      );
      assert.ok(light.opacity >= 0.4 && light.opacity <= 1);
    }
    assert.ok(
      Math.max(...positions.map((p) => p.x)) - Math.min(...positions.map((p) => p.x)) >= 30,
      "horizontal travel remains perceptible",
    );
    assert.ok(
      Math.max(...positions.map((p) => p.y)) - Math.min(...positions.map((p) => p.y)) >= 54,
      "vertical travel remains perceptible",
    );
  } finally {
    orbit.kill();
  }
});

test("cursor response moves the shield and reflection within bounded limits", () => {
  assert.equal(typeof imageMotion.imageShieldInteraction, "function");
  assert.ok(
    Object.values(imageMotion.imageShieldInteraction(2000, -2000, 200, 200)).every(
      (value) => value === 0,
    ),
  );
  const center = imageMotion.imageShieldInteraction(100, 100, 200, 200);
  assert.equal(center.x, 0);
  assert.equal(center.y, 0);
  assert.ok(center.reflectionOpacity > 0 && center.reflectionOpacity <= 0.3);
});

test("reflection fades continuously at each edge instead of sticking at maximum outside the shield", () => {
  for (const [x, y] of [
    [-1, 100],
    [201, 100],
    [100, -1],
    [100, 201],
    [0, 100],
    [200, 100],
  ]) {
    assert.ok(
      Object.values(imageMotion.imageShieldInteraction(x, y, 200, 200)).every(
        (value) => value === 0,
      ),
    );
  }
  const edge = imageMotion.imageShieldInteraction(1, 100, 200, 200);
  const inside = imageMotion.imageShieldInteraction(20, 100, 200, 200);
  assert.ok(edge.reflectionOpacity > 0 && edge.reflectionOpacity < inside.reflectionOpacity);
});

test("cursor reflection is absent on touch, reduced motion, paused mode and invalid bounds", () => {
  assert.equal(typeof imageMotion.imageShieldInteraction, "function");
  for (const options of [{ pointerType: "touch" }, { reducedMotion: true }, { enabled: false }]) {
    assert.ok(
      Object.values(imageMotion.imageShieldInteraction(200, 0, 200, 200, options)).every(
        (value) => value === 0,
      ),
    );
  }
  for (const width of [0, -1, NaN, Infinity]) {
    assert.ok(
      Object.values(imageMotion.imageShieldInteraction(200, 0, width, 200)).every(
        (value) => value === 0,
      ),
    );
  }
});

test("image shield stays frontal at the center and limits tilt outside the image", async () => {
  assert.deepEqual(imageShieldTilt(100, 100, 200, 200), { rotationX: 0, rotationY: 0 });
  assert.deepEqual(imageShieldTilt(1000, -1000, 200, 200), { rotationX: 2, rotationY: 3 });
  assert.deepEqual(imageShieldTilt(-1000, 1000, 200, 200), { rotationX: -2, rotationY: -3 });
});

test("image shield does not tilt for touch, reduced motion, paused mode or invalid bounds", () => {
  for (const options of [{ pointerType: "touch" }, { reducedMotion: true }, { enabled: false }]) {
    assert.deepEqual(imageShieldTilt(200, 0, 200, 200, options), { rotationX: 0, rotationY: 0 });
  }
  for (const width of [0, -1, NaN, Infinity]) {
    assert.deepEqual(imageShieldTilt(200, 0, width, 200), { rotationX: 0, rotationY: 0 });
  }
});

test("hiding the image neutralizes active tilt without a background return animation", () => {
  const pose = { rotationX: 2, rotationY: 3 };
  const x = gsap.quickTo(pose, "rotationX", { duration: 0.7 });
  const y = gsap.quickTo(pose, "rotationY", { duration: 0.7 });
  try {
    assert.equal(typeof imageMotion.resetImageShieldTilt, "function");
    imageMotion.resetImageShieldTilt(x, y, true);
    assert.equal(pose.rotationX, 0);
    assert.equal(pose.rotationY, 0);
    assert.equal(x.tween.paused(), true);
    assert.equal(y.tween.paused(), true);
  } finally {
    x.tween.kill();
    y.tween.kill();
  }
});
