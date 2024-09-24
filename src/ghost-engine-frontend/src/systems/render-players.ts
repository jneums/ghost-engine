import * as THREE from 'three';
import { System } from '.';
import {
  ClientTransformComponent,
  ConnectionComponent,
  PrincipalComponent,
  TransformComponent,
} from '../components';
import { EntityId, World } from '../ecs';
import { Principal } from '@dfinity/principal';
import { getPrincipal } from '../queries/player';

const ColorMap = {
  me: 0x00ff00,
  others: 0xff0000,
  item: 0x0000ff,
};

export class RenderPlayers implements System {
  public componentsRequired = new Set([
    TransformComponent,
    PrincipalComponent,
    ConnectionComponent,
  ]);
  public ecs: World | null = null;
  private scene: THREE.Scene;
  private principal: Principal;
  private entityMeshes: Map<EntityId, THREE.Mesh> = new Map();

  constructor(scene: THREE.Scene, principal: Principal) {
    this.scene = scene;
    this.principal = principal;
  }

  public update(entities: Set<EntityId>, deltaTime: number) {
    const updatedEntities = new Set<EntityId>();

    for (const entityId of entities) {
      const entity = this.ecs?.getEntity(entityId);
      if (!entity) continue;

      let transform = entity.getComponent(TransformComponent);
      if (!transform) continue;

      const clientTransform = entity.getComponent(ClientTransformComponent);
      if (clientTransform) {
        transform = clientTransform;
      }

      this.updateOrCreateMesh(entityId, transform);
      updatedEntities.add(entityId);
    }

    this.cleanupStaleEntities(updatedEntities);
  }

  private updateOrCreateMesh(
    entityId: EntityId,
    transform: TransformComponent,
  ): THREE.Mesh {
    let mesh = this.scene.getObjectByName(entityId.toString()) as THREE.Mesh;

    if (mesh) {
      this.updateMesh(mesh, transform);
    } else {
      mesh = this.createMesh(entityId, transform);
      this.scene.add(mesh);
      this.entityMeshes.set(entityId, mesh);
    }

    return mesh;
  }

  private updateMesh(mesh: THREE.Mesh, transform: TransformComponent): void {
    mesh.lookAt(transform.position);
    mesh.position.set(
      transform.position.x,
      transform.position.y + 0.5,
      transform.position.z,
    );
    mesh.scale.set(transform.scale.x, transform.scale.y, transform.scale.z);
  }

  private createMesh(
    entityId: EntityId,
    transform: TransformComponent,
  ): THREE.Mesh {
    const myPrincipal = getPrincipal(this.ecs!, entityId);
    const color = this.isMe(myPrincipal) ? ColorMap.me : ColorMap.others;

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color, wireframe: true });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = entityId.toString();
    this.updateMesh(mesh, transform);

    return mesh;
  }

  private isMe(principal?: Principal): boolean {
    return principal?.toText() === this.principal?.toText();
  }

  private cleanupStaleEntities(updatedEntities: Set<EntityId>): void {
    for (const [entityId, mesh] of this.entityMeshes) {
      if (!updatedEntities.has(entityId)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => material.dispose());
        } else {
          mesh.material.dispose();
        }
        this.entityMeshes.delete(entityId);
      }
    }
  }
}
