import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private stats: Stats;

  constructor(private map: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('lightblue');

    this.camera = new THREE.OrthographicCamera();
    this.camera.position.set(0, 100, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0); // view direction perpendicular to XY-plane
    this.controls.enableRotate = false;
    this.controls.enableZoom = true; // optional

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
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public update(deltaTime: number) {
    this.render();
    this.stats.update();
  }
}
