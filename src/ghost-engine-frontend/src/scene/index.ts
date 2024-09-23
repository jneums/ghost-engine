import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

export class SceneManager {
  public scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private stats: Stats;
  private isDragging = false;
  private mouseDownPosition = { x: 0, y: 0 };

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
    this.addEnvironment();

    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    window.addEventListener('mousedown', this.onMouseDown.bind(this), false);
    window.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    window.addEventListener('mouseup', this.onMouseUp.bind(this), false);
  }

  private onMouseDown(event: MouseEvent) {
    // Store the starting position of the mouse
    this.mouseDownPosition = {
      x: event.clientX,
      y: event.clientY,
    };
    this.isDragging = false; // Reset the dragging state
  }

  private onMouseMove(event: MouseEvent) {
    // Calculate the distance the mouse has moved since mouse down
    const dx = event.clientX - this.mouseDownPosition.x;
    const dy = event.clientY - this.mouseDownPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If the distance is greater than the threshold, set dragging to true
    const threshold = 5;
    if (distance > threshold) {
      this.isDragging = true;
    }
  }

  private onMouseUp(event: MouseEvent) {
    if (!this.isDragging) {
      // The mouse did not drag beyond the threshold, so treat this as a click

      this.clickHandler(event); // We'll define this soon
    }
    // Reset isDragging for the next mouse down event
    this.isDragging = false;
  }

  private clickHandler(event: MouseEvent) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // adjust this to control the number of point candidates
    raycaster.params.Points.threshold = 0.1;

    raycaster.setFromCamera(mouse, this.camera);
    const intersects = raycaster.intersectObjects(this.scene.children, true);
    console.log(intersects.map((i) => i.point));
    // clicked grid is last element in intersects
    const last = intersects[intersects.length - 1];
    if (last) {
      const object = last.object;
      const roundedTarget = new THREE.Vector3(
        last.point.x,
        last.point.y,
        last.point.z,
      );
      console.log(object);
      console.log(roundedTarget);
    }
  }

  private addLights() {
    const color = 0xffffff;
    const intensity = 3;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    this.scene.add(light);
  }

  private addEnvironment() {
    // Add grid of cubes
    const planeGeometry = new THREE.PlaneGeometry(10, 10, 10, 10);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0x283618,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotateX(Math.PI / 2);
    this.scene.add(plane);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public update() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.stats.update();
  }
}
