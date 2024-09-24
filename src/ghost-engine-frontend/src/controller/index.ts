import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PrincipalComponent, TransformComponent } from '../components';
import { World } from '../ecs';
import { MoveAction } from '../actions/move-action';
import { Connection } from '../connection';
import { findPlayersEntityId } from '../queries/player';
import { AuthHandler } from '../auth';

export class Controller {
  private controls: OrbitControls;
  private isDragging = false;
  private mouseDownPosition = { x: 0, y: 0 };

  constructor(
    private container: HTMLElement,
    private scene: THREE.Scene,
    private world: World,
    private camera: THREE.PerspectiveCamera,
    private connection: Connection,
    private authClient: AuthHandler,
  ) {
    this.controls = new OrbitControls(camera, container);
    this.controls.target.set(0, 0, 0);
    this.controls.mouseButtons = {
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.ROTATE,
    };

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
    // Reset the dragging state
    this.isDragging = false;
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
    // The mouse did not drag beyond the threshold, so treat this as a click
    if (!this.isDragging) {
      this.clickHandler(event);
    }
    // Reset isDragging for the next mouse down event
    this.isDragging = false;
  }

  private invokeAction(button: number, target: THREE.Intersection) {
    const buttons: Record<number, string> = {
      0: 'left',
      1: 'middle',
      2: 'right',
    };
    // Convert clicks into actions
    const object = target.object;
    const point = target.point;

    const entityId = parseInt(object.name);

    // If right click is on empty space, move the player
    if (!entityId && buttons[button] === 'right') {
      const playerPrincipal = this.authClient.getPrincipal();
      if (!playerPrincipal) {
        console.log('Players principal not found');
        return;
      }

      const playerEntityId = findPlayersEntityId(this.world, playerPrincipal);

      if (!playerEntityId) {
        console.log('Players entityId not found');
        return;
      }

      const moveAction = new MoveAction(this.world, this.connection);
      moveAction.handle({
        entityId: playerEntityId,
        position: point,
      });
      return;
    }

    // For each archetype, define an action
    const entity = this.world.getEntity(entityId);
    const archetype = entity.getArchetype();

    // Define a map of archetypes to actions
    const archetypeActions = new Map<string, () => void>([
      [
        JSON.stringify([PrincipalComponent, TransformComponent]),
        () => console.log('Player clicked'),
      ],
      // Add more archetypes and their corresponding actions here
    ]);

    const archetypeKey = JSON.stringify(archetype);
    const action = archetypeActions.get(archetypeKey);

    if (action) {
      action();
    } else {
      console.log('Unknown archetype');
    }
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

    // Convert clicks into actions
    if (intersects[0]) {
      if (event.target === this.container) {
        this.invokeAction(event.button, intersects[0]);
      }
    }
  }

  public update() {
    this.controls.update();
  }
}
