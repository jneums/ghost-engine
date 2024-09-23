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

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL;
const IC_URL = import.meta.env.VITE_IC_URL;

export class Game {
  public world: World;
  private authHandler: AuthHandler;
  private scene: SceneManager;
  private lastTick = Date.now();

  constructor() {
    this.authHandler = new AuthHandler();
    this.world = new World();
    this.scene = new SceneManager(document.getElementById('game')!);

    this.initialize();
  }

  private async initialize() {
    await this.authHandler.initialize();
  }

  private gameLoop() {
    setInterval(() => {
      const deltaTime = this.lastTick - Date.now();
      this.lastTick = Date.now();

      // Update the ecs
      this.world.update(deltaTime);

      // Update the scene
      this.scene.update();
    }, 1000 / 60); // 60 FPS
  }

  public async connect() {
    // Login using Internet Identity
    const identity = await this.authHandler.login();
    const principal = this.authHandler.getPrincipal();
    if (!principal) {
      throw new Error('Principal not found');
    }

    // Add the RenderPlayers to the ECS
    this.world.addSystem(new RenderPlayers(this.scene.scene, principal));

    // Connect to the game server over Connection
    const wsConfig = createWsConfig({
      canisterId,
      canisterActor: ghost_engine_backend,
      identity: identity as SignIdentity,
      networkUrl: IC_URL,
    });

    const connection = new Connection(GATEWAY_URL, wsConfig, this.world);
    connection.initialize();

    // Hide the menu and show the game
    document.getElementById('game')!.style.display = 'block';
    document.getElementById('ui')!.style.display = 'none';

    // Start the game loop
    this.gameLoop();
  }
}
