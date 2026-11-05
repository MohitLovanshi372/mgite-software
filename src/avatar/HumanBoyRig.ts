import * as THREE from 'three';
import { SpeechAnimationFrame } from './speechAnimation.ts';

/** Locally generated stylized human bust with independently articulated lips and eyes. */
export class HumanBoyRig {
  readonly group = new THREE.Group();
  private head = new THREE.Group();
  private eyes: THREE.Group[] = [];
  private mouth: THREE.Mesh;
  private upperLip: THREE.Mesh;
  private lowerLip: THREE.Mesh;
  private teeth: THREE.Mesh;
  private opening = 0;
  private width = 1;

  constructor() {
    const skin = new THREE.MeshStandardMaterial({ color: '#c88d68', roughness: .68 });
    const innerEar = new THREE.MeshStandardMaterial({ color: '#a66a54', roughness: .8 });
    const hair = new THREE.MeshStandardMaterial({ color: '#241c19', roughness: .78 });
    const jacket = new THREE.MeshStandardMaterial({ color: '#182534', roughness: .8 });
    const collar = new THREE.MeshStandardMaterial({ color: '#24384b', roughness: .65 });
    const lip = new THREE.MeshStandardMaterial({ color: '#aa6658', roughness: .65 });
    const dark = new THREE.MeshStandardMaterial({ color: '#281c20', roughness: 1 });
    const white = new THREE.MeshStandardMaterial({ color: '#eee5d8', roughness: .4 });
    const iris = new THREE.MeshStandardMaterial({ color: '#4b3a27', roughness: .4 });
    const pupil = new THREE.MeshStandardMaterial({ color: '#100e12', roughness: .2 });
    const gold = new THREE.MeshStandardMaterial({ color: '#e2bd75', metalness: .6, roughness: .3 });
    const orb = (parent: THREE.Object3D, material: THREE.Material, position: number[], scale: number[]) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 32), material);
      mesh.position.set(position[0], position[1], position[2]);
      mesh.scale.set(scale[0], scale[1], scale[2]);
      parent.add(mesh);
      return mesh;
    };
    this.group.add(this.head);
    // Soft shoulders, high collar and a small gold JARVIS insignia.
    orb(this.group, jacket, [0, -.91, -.08], [.93, .7, .4]);
    orb(this.group, skin, [0, -.12, 0], [.215, .4, .23]);
    orb(this.group, dark, [0, -.49, .22], [.29, .3, .12]);
    const leftCollar = orb(this.group, collar, [-.24, -.47, .27], [.14, .31, .09]);
    leftCollar.rotation.z = .4;
    const rightCollar = orb(this.group, collar, [.24, -.47, .27], [.14, .31, .09]);
    rightCollar.rotation.z = -.4;
    const seam = new THREE.Mesh(new THREE.CylinderGeometry(.009, .009, .7, 8), gold);
    seam.position.set(0, -.97, .32); this.group.add(seam);
    const emblem = new THREE.Mesh(new THREE.TorusGeometry(.055, .008, 8, 32), gold);
    emblem.position.set(.4, -.82, .31); this.group.add(emblem);
    // Youthful oval silhouette, warm skin, ears and sculpted nose.
    orb(this.head, skin, [0, .64, 0], [.51, .72, .44]);
    // The lower face follows the main silhouette rather than a separate chin mesh.
    for (const side of [-1, 1]) {
      orb(this.head, skin, [side * .505, .65, -.015], [.09, .16, .08]);
      orb(this.head, innerEar, [side * .534, .65, .04], [.035, .085, .025]);
    }
    orb(this.head, skin, [0, .70, .402], [.065, .16, .07]);
    orb(this.head, skin, [0, .60, .465], [.09, .064, .073]);
    for (const side of [-1, 1]) orb(this.head, innerEar, [side * .045, .573, .485], [.021, .012, .018]);
    // Short dark hair with swept volumes; open front leaves the whole face visible.
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32, 0, Math.PI * 2, 0, 1.23), hair);
    cap.position.set(0, .66, -.025); cap.scale.set(.535, .78, .47); this.head.add(cap);
    for (const side of [-1, 1]) {
      orb(this.head, hair, [side * .463, .88, -.075], [.064, .25, .30]);
    }
    for (let i = 0; i < 3; i++) {
      const lock = orb(this.head, hair, [-.28 + i * .23, 1.20 + Math.sin(i / 3 * Math.PI) * .07, .17], [.25, .17, .27]);
      lock.rotation.z = -.45;
    }
    // Eyes use dark limbal rings, warm irises and tiny catchlights.
    for (const side of [-1, 1]) {
      const eye = new THREE.Group(); eye.position.set(side * .205, .83, .38); this.head.add(eye); this.eyes.push(eye);
      orb(eye, innerEar, [0, 0, -.01], [.142, .078, .052]);
      orb(eye, white, [0, 0, .007], [.127, .059, .044]);
      orb(eye, dark, [0, 0, .044], [.052, .053, .012]);
      orb(eye, iris, [0, 0, .052], [.043, .046, .012]);
      orb(eye, pupil, [0, 0, .062], [.024, .030, .008]);
      orb(eye, white, [-.012, .016, .069], [.009, .009, .004]);
      const brow = orb(this.head, hair, [side * .205, .966, .375], [.139, .025, .03]);
      brow.rotation.z = side * -.08;
    }
    this.mouth = orb(this.head, dark, [0, .342, .431], [.143, .008, .026]);
    this.upperLip = orb(this.head, lip, [0, .355, .446], [.147, .019, .023]);
    this.lowerLip = orb(this.head, lip, [0, .326, .447], [.139, .022, .026]);
    this.teeth = orb(this.head, white, [0, .352, .451], [.108, .015, .008]);
    this.teeth.visible = false;
  }

  update(delta: number, time: number, speech: SpeechAnimationFrame, gaze: { x: number; y: number }, reducedMotion: boolean) {
    const blend = 1 - Math.exp(-delta * 22);
    this.opening += ((speech.speaking ? speech.mouthOpen : 0) - this.opening) * blend;
    this.width += (speech.mouthWidth - this.width) * blend;
    this.mouth.scale.y = .008 + this.opening * .075;
    this.mouth.scale.x = .143 * this.width;
    this.mouth.position.y = .342 - this.opening * .025;
    this.lowerLip.position.y = .326 - this.opening * .10;
    this.upperLip.position.y = .355 + this.opening * .015;
    this.lowerLip.scale.x = .139 * this.width;
    this.upperLip.scale.x = .147 * this.width;
    this.teeth.visible = this.opening > .18;
    const blinkTime = time % 4.7;
    const blink = reducedMotion ? 0 : blinkTime > 4.48 ? Math.sin((blinkTime - 4.48) / .22 * Math.PI) : 0;
    this.eyes.forEach(eye => { eye.scale.y = Math.max(.08, 1 - blink); });
    this.head.rotation.y = THREE.MathUtils.damp(this.head.rotation.y, reducedMotion ? 0 : gaze.x * .13 + Math.sin(time * .6) * .025, 4, delta);
    this.head.rotation.x = THREE.MathUtils.damp(this.head.rotation.x, reducedMotion ? 0 : -gaze.y * .06, 4, delta);
    this.group.position.y = reducedMotion ? 0 : Math.sin(time * 1.5) * .008;
    return this.opening;
  }

  dispose() {
    const materials = new Set<THREE.Material>();
    this.group.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
      }
    });
    materials.forEach(material => material.dispose());
  }
}
