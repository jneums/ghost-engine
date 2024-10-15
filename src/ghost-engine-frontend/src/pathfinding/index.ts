export interface Node {
  x: number;
  y: number;
  z: number;
  g: number;
  f: number;
  h: number;
  opened: boolean;
  closed: boolean;
  parent: Node | null;
  neighbors: Node[];
}

export function initializeNeighbors(grid: (Node | null)[][][]): void {
  const directions = [
    [1, 0, 0],
    [-1, 0, 0], // x-axis
    [0, 1, 0],
    [0, -1, 0], // y-axis
    [0, 0, 1],
    [0, 0, -1], // z-axis
    [1, 1, 0],
    [-1, 1, 0],
    [1, -1, 0],
    [-1, -1, 0], // diagonals in x-y plane
    [0, 1, 1],
    [0, 1, -1],
    [0, -1, 1],
    [0, -1, -1], // diagonals in y-z plane
  ];

  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[x].length; y++) {
      for (let z = 0; z < grid[x][y].length; z++) {
        const node = grid[x][y][z];
        if (node) {
          node.neighbors = [];
          for (const [dx, dy, dz] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            const nz = z + dz;
            if (
              nx >= 0 &&
              nx < grid.length &&
              ny >= 0 &&
              ny < grid[nx].length &&
              nz >= 0 &&
              nz < grid[nx][ny].length &&
              grid[nx][ny][nz] !== null
            ) {
              node.neighbors.push(grid[nx][ny][nz] as Node);
            }
          }
        }
      }
    }
  }
}

function findPath(startNode: Node, endNode: Node): number[][] {
  // Initialize open and closed lists
  const openList: Node[] = [];
  const closedList: Set<Node> = new Set();

  // Add the start node to the open list
  openList.push(startNode);

  while (openList.length > 0) {
    // Sort the open list by the f value
    openList.sort((a, b) => a.f - b.f);

    // Get the node with the lowest f value
    const currentNode = openList.shift();
    if (!currentNode) break;

    // Add the current node to the closed list
    closedList.add(currentNode);

    // Check if we reached the end node
    if (currentNode === endNode) {
      return reconstructPath(currentNode);
    }

    // Process each neighbor
    for (const neighbor of currentNode.neighbors) {
      if (closedList.has(neighbor)) continue;

      const tentativeG = currentNode.g + 1; // Assuming uniform cost

      if (!openList.includes(neighbor) || tentativeG < neighbor.g) {
        neighbor.g = tentativeG;
        neighbor.h = heuristic(neighbor, endNode);
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.parent = currentNode;

        if (!openList.includes(neighbor)) {
          openList.push(neighbor);
        }
      }
    }
  }

  return [];
}

function heuristic(node: Node, endNode: Node): number {
  return (
    Math.abs(node.x - endNode.x) +
    Math.abs(node.y - endNode.y) +
    Math.abs(node.z - endNode.z)
  );
}

function reconstructPath(endNode: Node): number[][] {
  const path: number[][] = [];
  let currentNode: Node | null = endNode;

  while (currentNode) {
    path.push([currentNode.x, currentNode.y, currentNode.z]);
    currentNode = currentNode.parent;
  }

  return path.reverse();
}

export { findPath };
