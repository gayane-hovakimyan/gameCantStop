import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

const MODELS = {
  male:   '/models/sitting_b.fbx',
  female: '/models/sitting_a.fbx',
};

const SKIN_COLORS = {
  light:  0xf5cfa0,
  medium: 0xd49058,
  dark:   0x8c5530,
};

const TEAM_COLORS = {
  1: 0x3b82f6,
  2: 0xef4444,
};

const fbxCache = {};
function loadFBX(url) {
  if (!fbxCache[url]) {
    fbxCache[url] = new Promise((resolve, reject) => {
      new FBXLoader().load(url, resolve, undefined, reject);
    });
  }
  return fbxCache[url];
}

const activeAvatars = new Map();

function findBone(root, ...patterns) {
  let found = null;
  root.traverse(obj => {
    if (found || !obj.isBone) return;
    const n = obj.name.toLowerCase();
    if (patterns.every(p => n.includes(p))) found = obj;
  });
  return found;
}

function tintMaterials(root, skinColor, teamColor) {
  root.traverse(obj => {
    if (!obj.isMesh && !obj.isSkinnedMesh) return;
    obj.frustumCulled = false; // skinned meshes lie about their bounding sphere
    if (!obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach(m => {
      const name = (m.name || '').toLowerCase();
      if (!m.color) return;
      if (/skin|body|face|head/.test(name)) {
        m.color.setHex(skinColor);
      } else if (/shirt|cloth|top|jacket|torso/.test(name)) {
        m.color.setHex(teamColor);
      } else if (m.color.getHex() === 0xffffff || m.color.getHex() === 0xcccccc) {
        m.color.setHex(teamColor);
      }
      m.needsUpdate = true;
    });
  });
}

export async function mount3DAvatar(container, { gender, team, skin, uid }) {
  // Clear any previous avatar in this container
  if (activeAvatars.has(container)) {
    disposeAvatar(container);
  }

  const w = container.clientWidth  || 140;
  const h = container.clientHeight || 180;

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(28, w / h, 0.1, 1000);

  // On phones / narrow viewports, drop antialias and cap pixel ratio at 1 to
  // keep GPU memory low (Safari OOM-kills the tab otherwise).
  const isPhone = window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: !isPhone, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(isPhone ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;';
  container.appendChild(renderer.domElement);

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x223344, 0.8);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff2dd, 1.1);
  key.position.set(2, 4, 3);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x88bbff, 0.4);
  fill.position.set(-3, 2, 2);
  scene.add(fill);

  const state = {
    renderer, scene, camera,
    mixer: null,
    idleAction: null,
    bones: {},
    gestureStart: 0,
    gestureType: null,
    gestureDuration: 0,
    raf: 0,
    disposed: false,
  };
  activeAvatars.set(container, state);

  // Placeholder while loading: a tinted card
  const loaderGeo = new THREE.BoxGeometry(0.6, 1, 0.2);
  const loaderMat = new THREE.MeshBasicMaterial({ color: TEAM_COLORS[team] || 0x888888, transparent: true, opacity: 0.3 });
  const loaderMesh = new THREE.Mesh(loaderGeo, loaderMat);
  scene.add(loaderMesh);

  try {
    const proto = await loadFBX(MODELS[gender] || MODELS.male);
    if (state.disposed) return;

    scene.remove(loaderMesh);
    loaderGeo.dispose();
    loaderMat.dispose();

    const model = cloneSkeleton(proto);

    // Normalize size — Mixamo FBX often comes in centimeters
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const targetHeight = 1.7;
    const scale = targetHeight / (size.y || 1.7);
    model.scale.setScalar(scale);

    // Recenter
    const recBox = new THREE.Box3().setFromObject(model);
    const center = recBox.getCenter(new THREE.Vector3());
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= recBox.min.y; // feet on ground

    tintMaterials(model, SKIN_COLORS[skin] || SKIN_COLORS.light, TEAM_COLORS[team] || 0x888888);
    scene.add(model);

    // Cache the eyes mesh for wink (squish on Y)
    model.traverse(o => {
      if ((o.isMesh || o.isSkinnedMesh) && /eye/i.test(o.name) && !/lash|brow/i.test(o.name)) {
        if (!state.eyesMesh) {
          state.eyesMesh = o;
          state.eyesRestScale = o.scale.clone();
        }
      }
    });

    // Cache bones we'll animate
    state.bones.head     = findBone(model, 'head') ;
    state.bones.neck     = findBone(model, 'neck');
    state.bones.rArm     = findBone(model, 'right', 'arm') && !findBone(model, 'right', 'forearm')
                            ? findBone(model, 'right', 'arm') : findBone(model, 'rightarm');
    state.bones.rFore    = findBone(model, 'right', 'forearm') || findBone(model, 'rightforearm');
    state.bones.rHand    = findBone(model, 'right', 'hand') || findBone(model, 'righthand');
    state.bones.lArm     = findBone(model, 'leftarm') || findBone(model, 'left', 'arm');
    state.bones.lFore    = findBone(model, 'leftforearm') || findBone(model, 'left', 'forearm');
    state.bones.lHand    = findBone(model, 'lefthand') || findBone(model, 'left', 'hand');

    // Save rest pose for the bones we touch
    for (const k of Object.keys(state.bones)) {
      const b = state.bones[k];
      if (b) b.userData.restRot = b.rotation.clone();
    }

    // Frame camera: focus on upper body (sitting pose — head visible)
    const finalBox = new THREE.Box3().setFromObject(model);
    const finalSize = finalBox.getSize(new THREE.Vector3());
    const finalCenter = finalBox.getCenter(new THREE.Vector3());
    const focusY = finalCenter.y + finalSize.y * 0.18; // bias up toward head
    camera.position.set(0, focusY + 0.05, finalSize.y * 1.9);
    camera.lookAt(0, focusY, 0);

    // Built-in idle animation if FBX has clips
    if (proto.animations && proto.animations.length) {
      state.mixer = new THREE.AnimationMixer(model);
      state.idleAction = state.mixer.clipAction(proto.animations[0]);
      state.idleAction.play();
    }
  } catch (err) {
    console.error('FBX load failed', err);
  }

  const clock = new THREE.Clock();
  function render() {
    if (state.disposed) return;
    const dt = clock.getDelta();
    if (state.mixer) state.mixer.update(dt);
    applyGesture(state, performance.now());
    renderer.render(scene, camera);
    state.raf = requestAnimationFrame(render);
  }
  render();

  // Handle resize
  const ro = new ResizeObserver(() => {
    const cw = container.clientWidth, ch = container.clientHeight;
    if (!cw || !ch) return;
    renderer.setSize(cw, ch);
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
  });
  ro.observe(container);
  state.ro = ro;

  return state;
}

export function disposeAvatar(container) {
  const state = activeAvatars.get(container);
  if (!state) return;
  state.disposed = true;
  cancelAnimationFrame(state.raf);
  state.ro?.disconnect();
  state.renderer.dispose();
  if (state.renderer.domElement.parentNode === container) {
    container.removeChild(state.renderer.domElement);
  }
  activeAvatars.delete(container);
}

// ── Gesture targets ─────────────────────────────────────────────────────────
// Each gesture defines target offsets (radians) applied additively to rest pose
// on the right-arm chain (and brow/head where relevant).
// Mixamo skeleton: bone local Y points down the bone, so to "raise" the arm
// forward/up we mainly rotate Z (and a bit of X). Forearm Y-rotation bends elbow.
const GESTURES = {
  'touch-head': {
    duration: 1400,
    targets: {
      rArm:  { x: 0.4,  y: 0.0,  z: -1.9 }, // raise arm up
      rFore: { x: 0.0,  y: -2.0, z: 0.0 }, // bend elbow sharply
      rHand: { x: -0.4, y: 0.0,  z: 0.0 },
      head:  { x: 0.2,  y: 0.0,  z: 0.1 }, // tilt down a touch
    },
  },
  'raise-eyebrow': {
    duration: 1200,
    targets: {
      // no arm — just a head tilt back to "raise eyebrows"
      head:  { x: -0.35, y: 0.0,  z: 0.0 },
      neck:  { x: -0.15, y: 0.0,  z: 0.0 },
    },
  },
  'touch-nose': {
    duration: 1300,
    targets: {
      rArm:  { x: 0.2,  y: 0.0,  z: -1.7 },
      rFore: { x: 0.0,  y: -2.3, z: 0.0 },
      rHand: { x: -0.5, y: 0.0,  z: 0.0 },
      head:  { x: 0.1,  y: 0.0,  z: 0.0 },
    },
  },
  'wink': {
    // No eyelid bones on Mixamo rigs — convey the wink with a sideways head
    // tilt + a quick "eye-close" squish on the Eyes mesh (handled separately).
    duration: 900,
    targets: {
      head:  { x: 0.05, y: 0.15, z: 0.35 },
      neck:  { x: 0.0,  y: 0.05, z: 0.15 },
    },
  },
};

function ease(t) {
  // ease in-out cubic
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function applyGesture(state, now) {
  if (!state.gestureType) {
    // Slide bones back toward rest pose if we just finished
    for (const k of Object.keys(state.bones)) {
      const b = state.bones[k];
      if (b && b.userData.restRot && b.userData.gestureActive) {
        b.rotation.copy(b.userData.restRot);
        b.userData.gestureActive = false;
      }
    }
    if (state.eyesMesh && state.eyesSquished) {
      state.eyesMesh.scale.copy(state.eyesRestScale);
      state.eyesSquished = false;
    }
    return;
  }
  const elapsed = now - state.gestureStart;
  const dur = state.gestureDuration;
  let raw = elapsed / dur;
  if (raw >= 1) {
    state.gestureType = null;
    return;
  }
  // hold near peak between 0.3..0.7
  let amp;
  if (raw < 0.3)      amp = ease(raw / 0.3);
  else if (raw < 0.7) amp = 1;
  else                amp = ease((1 - raw) / 0.3);

  const spec = GESTURES[state.gestureType];
  if (!spec) return;
  for (const key of Object.keys(spec.targets)) {
    const b = state.bones[key];
    if (!b || !b.userData.restRot) continue;
    const t = spec.targets[key];
    b.rotation.x = b.userData.restRot.x + t.x * amp;
    b.rotation.y = b.userData.restRot.y + t.y * amp;
    b.rotation.z = b.userData.restRot.z + t.z * amp;
    b.userData.gestureActive = true;
  }

  if (state.gestureType === 'wink' && state.eyesMesh) {
    const sy = 1 - 0.9 * amp;
    state.eyesMesh.scale.set(
      state.eyesRestScale.x,
      state.eyesRestScale.y * sy,
      state.eyesRestScale.z
    );
    state.eyesSquished = true;
  }
}

export function playGesture3D(container, gestureType) {
  const state = activeAvatars.get(container);
  if (!state) return;
  const spec = GESTURES[gestureType];
  if (!spec) return;
  state.gestureType = gestureType;
  state.gestureStart = performance.now();
  state.gestureDuration = spec.duration;
}

// Expose on window so the non-module game.js can call into us
window.mount3DAvatar = mount3DAvatar;
window.disposeAvatar3D = disposeAvatar;
window.playGesture3D = playGesture3D;
window.dispatchEvent(new Event('avatar3d:ready'));
