import * as THREE from 'three';
import { SignIdentity } from '@dfinity/agent';
import { createWsConfig } from 'ic-websocket-js';
import { AuthHandler } from '../auth';
import { SceneManager } from '../scene';
import {
  canisterId,
  ghost_engine_backend,
} from '../declarations/ghost-engine-backend';
import { Connection } from '../connection';
import { World } from '../ecs';
import { RenderPlayers } from '../systems/render-players';
import { Controller } from '../controller';
import Stats from 'three/addons/libs/stats.module.js';
import { MovementSystem } from '../systems/movement';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL;
const IC_URL = import.meta.env.VITE_IC_URL;

export class Game {
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private connection: Connection;
  private authHandler: AuthHandler;
  private sceneManager: SceneManager;
  private controller: Controller;
  private lastTick: number;
  private stats: Stats;
  public world: World;
  public domElement: HTMLElement;

  constructor() {
    this.lastTick = Date.now();
    this.domElement = document.getElementById('game')!;
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.authHandler = new AuthHandler();
    this.world = new World();
    this.sceneManager = new SceneManager();

    this.connection = new Connection(GATEWAY_URL, this.world);
    this.controller = new Controller(
      this.domElement,
      this.sceneManager.scene,
      this.world,
      this.camera,
      this.connection,
      this.authHandler,
    );
    this.stats = new Stats();

    this.initialize();
  }

  private async initialize() {
    this.camera.position.y = 24;
    this.camera.position.z = 24;

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.domElement.appendChild(this.renderer.domElement);
    this.domElement.appendChild(this.stats.dom);

    window.addEventListener('resize', this.onWindowResize.bind(this), false);

    await this.authHandler.initialize();
  }

  public toggleVisibility() {
    if (this.domElement.style.display === 'block') {
      this.domElement.style.display = 'none';
    } else {
      this.domElement.style.display = 'block';
    }
  }

  public async connect() {
    // Login using Internet Identity
    const identity = await this.authHandler.login();
    const principal = this.authHandler.getPrincipal();
    if (!principal) {
      throw new Error('Principal not found');
    }

    // Add the RenderPlayers to the ECS
    this.world.addSystem(new MovementSystem());
    this.world.addSystem(new RenderPlayers(this.sceneManager.scene, principal));

    // Connect to the game server over Connection
    const wsConfig = createWsConfig({
      canisterId,
      canisterActor: ghost_engine_backend,
      identity: identity as SignIdentity,
      networkUrl: IC_URL,
    });
    this.connection.initialize(wsConfig);

    // Hide the menu and show the game
    this.toggleVisibility();

    // Start the game loop
    this.gameLoop(0);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private gameLoop(time: number): void {
    window.requestAnimationFrame((t) => this.gameLoop(t));

    // Calculate the time delta
    const deltaTime = time - this.lastTick;
    this.lastTick = time;

    // Update the ecs
    this.world.update(deltaTime);

    // Update the stats
    this.stats.update();

    // Update the controller
    this.controller.update();

    // Render the scene
    this.renderer.render(this.sceneManager.scene, this.camera);
  }
}
