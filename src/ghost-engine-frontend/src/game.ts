import { createWsConfig } from 'ic-websocket-js';
import { AuthHandler } from './auth/auth-handler';
import { SceneManager } from './scene';
import {
  canisterId,
  ghost_engine_backend,
} from './declarations/ghost-engine-backend';
import { SignIdentity } from '@dfinity/agent';
import { Connection } from './connection';
import { World } from './ecs';
import { MovementSystem } from './systems/movement';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL;
const IC_URL = import.meta.env.VITE_IC_URL;

export class Game {
  private authHandler: AuthHandler;
  private ecs: World;
  private scene: SceneManager;
  private lastTick = Date.now();

  constructor() {
    this.authHandler = new AuthHandler();
    this.ecs = new World();
    this.scene = new SceneManager(document.getElementById('game')!);

    this.initialize();
  }

  private async initialize() {
    await this.authHandler.initialize();
    this.ecs.addSystem(new MovementSystem());
    this.setupEventListeners();
  }

  private setupEventListeners() {
    document
      .getElementById('connect')!
      .addEventListener('click', () => this.connect());
  }

  private gameLoop() {
    setInterval(() => {
      const deltaTime = this.lastTick - Date.now();
      this.lastTick = Date.now();

      // Update the ecs
      this.ecs.update(deltaTime);

      // Update the scene
      this.scene.update(deltaTime);
    }, 1000 / 60); // 60 FPS
  }

  private async connect() {
    // Login using Internet Identity
    const identity = await this.authHandler.login();

    // Connect to the game server over Connection
    const wsConfig = createWsConfig({
      canisterId,
      canisterActor: ghost_engine_backend,
      identity: identity as SignIdentity,
      networkUrl: IC_URL,
    });

    const connection = new Connection(GATEWAY_URL, wsConfig, this.ecs);
    connection.initialize();

    // Hide the menu and show the game
    document.getElementById('game')!.style.display = 'block';
    document.getElementById('menu')!.style.display = 'none';

    // Start the game loop
    this.gameLoop();
  }
}
