import * as THREE from 'three';

export class SceneManager {
  public scene: THREE.Scene;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('lightblue');

    this.addLights();
    this.addEnvironment();
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
    const planeGeometry = new THREE.PlaneGeometry(100, 100, 100, 100);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xfefae0,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotateX(Math.PI / 2);
    this.scene.add(plane);
  }
}
