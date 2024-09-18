import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import Stats from 'three/addons/libs/stats.module.js';

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: MapControls;
  private stats: Stats;
  private animationId: number | null = null;

  constructor(private map: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('lightblue');

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(-100, 200, 100);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.controls = new MapControls(this.camera, this.renderer.domElement);

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

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public start() {
    if (this.animationId === null) {
      this.animationId = requestAnimationFrame(this.animate.bind(this));
    }
  }

  public pause() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate() {
    this.render();
    this.stats.update();
    this.animationId = requestAnimationFrame(this.animate.bind(this));
  }

  private render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
