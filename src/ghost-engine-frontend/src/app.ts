import { createWsConfig } from 'ic-websocket-js';
import { AuthHandler } from './auth/auth-handler';
import { SceneManager } from './scene/scene-manager';
import {
  canisterId,
  ghost_engine_backend,
} from './declarations/ghost-engine-backend';
import { SignIdentity } from '@dfinity/agent';
import { WebSocketHandler } from './websockets/websocket-handler';
import { MenuManager } from './menu/menu-manager';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL;
const IC_URL = import.meta.env.VITE_IC_URL;

export class App {
  private authHandler: AuthHandler;
  private sceneManager: SceneManager | null = null;
  private menuManager: MenuManager;

  constructor() {
    this.authHandler = new AuthHandler();
    this.menuManager = new MenuManager(
      document.getElementById('menu')!,
      document.getElementById('game')!,
    );

    this.initialize();
  }

  private async initialize() {
    await this.authHandler.initialize();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    document
      .getElementById('connect')!
      .addEventListener('click', () => this.connect());
    document.addEventListener('keydown', (event) => this.handleKeyDown(event));
  }

  private async connect() {
    const identity = await this.authHandler.login();

    const wsConfig = createWsConfig({
      canisterId,
      canisterActor: ghost_engine_backend,
      identity: identity as SignIdentity,
      networkUrl: IC_URL,
    });

    const wsHandler = new WebSocketHandler(GATEWAY_URL, wsConfig);
    wsHandler.connect();

    this.sceneManager = new SceneManager(document.getElementById('content')!);
    this.sceneManager.start();

    this.menuManager.hideMenu();
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (this.sceneManager) {
        this.menuManager.toggleMenu();
        if (this.menuManager.isMenuVisible()) {
          this.sceneManager.pause();
        } else {
          this.sceneManager.start();
        }
      }
    }
  }
}
