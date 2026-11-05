import assert from "node:assert/strict";
import test from "node:test";
import { gsap } from "gsap";
import * as motion from "./site-motion.mjs";

test("shared entrance starts hidden and reaches the settled pose on the shield's clock", () => {
  assert.equal(typeof motion.createSiteEntrance, "function");
  const poses = Array.from({ length: 4 }, () => ({ opacity: 1, x: 0, y: 0, scale: 1 }));
  const tweens = poses.map((pose) => motion.createSiteEntrance(gsap, pose, { paused: true }));
  try {
    for (const tween of tweens) {
      assert.equal(tween.duration(), 1.2);
      assert.equal(tween.delay(), 0.08);
      tween.progress(0.5);
    }
    const snapshot = (pose) => [pose.opacity, pose.x, pose.y, pose.scale];
    poses.slice(1).forEach((pose) => assert.deepEqual(snapshot(pose), snapshot(poses[0])));
    assert.ok(poses[0].opacity > 0.8 && poses[0].opacity < 1);
    tweens.forEach((tween) => tween.progress(1));
    poses.forEach((pose) => assert.deepEqual(snapshot(pose), [1, 0, 0, 1]));
  } finally {
    tweens.forEach((tween) => tween.kill());
  }
});
