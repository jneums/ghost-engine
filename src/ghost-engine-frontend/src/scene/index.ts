import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

export class SceneManager {
  public scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private stats: Stats;

  constructor(private map: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('lightblue');

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    this.camera.position.z = 2;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.mouseButtons = {
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.ROTATE,
    };

    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
    this.map.appendChild(this.renderer.domElement);

    this.addLights();
    this.addAxesHelper();

    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }

  private addLights() {
    const color = 0xffffff;
    const intensity = 3;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    this.scene.add(light);
  }

  private addAxesHelper() {
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public update(deltaTime: number) {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.stats.update();
  }
}
