import { findPath, Node, initializeNeighbors } from '.'; // Adjust the import path as needed

describe('Pathfinding Tests', () => {
  test('finds a path from start to end node', () => {
    // Define the start and end nodes
    const startNode: Node = {
      x: 1,
      y: 101,
      z: 236,
      g: 0,
      f: 0,
      h: 0,
      opened: false,
      closed: false,
      parent: null,
      neighbors: [],
    };

    const endNode: Node = {
      x: 2,
      y: 101,
      z: 236,
      g: 0,
      f: 0,
      h: 0,
      opened: false,
      closed: false,
      parent: null,
      neighbors: [],
    };

    // Create a simple grid with walkable nodes
    const grid: (Node | null)[][][] = [
      [
        [null, startNode, endNode],
        [null, null, null],
        [null, null, null],
      ],
    ];

    // Initialize neighbors
    initializeNeighbors(grid);

    // Call the findPath function
    const path = findPath(startNode, endNode);

    // Verify that the path is correct
    expect(path).toEqual([
      [1, 101, 236],
      [2, 101, 236],
    ]);
  });

  test('finds a path in a simple grid', () => {
    // Create a simple 3x3 grid
    const grid: (Node | null)[][][] = Array.from({ length: 1 }, () =>
      Array.from({ length: 3 }, () =>
        Array.from({ length: 3 }, () => null as Node | null),
      ),
    );

    // Define nodes with positions
    const node00: Node = {
      x: 0,
      y: 0,
      z: 0,
      g: 0,
      f: 0,
      h: 0,
      opened: false,
      closed: false,
      parent: null,
      neighbors: [],
    };
    const node01: Node = {
      x: 0,
      y: 0,
      z: 1,
      g: 0,
      f: 0,
      h: 0,
      opened: false,
      closed: false,
      parent: null,
      neighbors: [],
    };
    const node02: Node = {
      x: 0,
      y: 0,
      z: 2,
      g: 0,
      f: 0,
      h: 0,
      opened: false,
      closed: false,
      parent: null,
      neighbors: [],
    };
    const node10: Node = {
      x: 1,
      y: 0,
      z: 0,
      g: 0,
      f: 0,
      h: 0,
      opened: false,
      closed: false,
      parent: null,
      neighbors: [],
    };
    const node11: Node = {
      x: 1,
      y: 0,
      z: 1,
      g: 0,
      f: 0,
      h: 0,
      opened: false,
      closed: false,
      parent: null,
      neighbors: [],
    };
    const node12: Node = {
      x: 1,
      y: 0,
      z: 2,
      g: 0,
      f: 0,
      h: 0,
      opened: false,
      closed: false,
      parent: null,
      neighbors: [],
    };
    const node20: Node = {
      x: 2,
      y: 0,
      z: 0,
      g: 0,
      f: 0,
      h: 0,
      opened: false,
      closed: false,
      parent: null,
      neighbors: [],
    };
    const node21: Node = {
      x: 2,
      y: 0,
      z: 1,
      g: 0,
      f: 0,
      h: 0,
      opened: false,
      closed: false,
      parent: null,
      neighbors: [],
    };
    const node22: Node = {
      x: 2,
      y: 0,
      z: 2,
      g: 0,
      f: 0,
      h: 0,
      opened: false,
      closed: false,
      parent: null,
      neighbors: [],
    };

    // Place nodes in the grid
    grid[0][0][0] = node00;
    grid[0][0][1] = node01;
    grid[0][0][2] = node02;
    grid[0][1][0] = node10;
    grid[0][1][1] = node11;
    grid[0][1][2] = node12;
    grid[0][2][0] = node20;
    grid[0][2][1] = node21;
    grid[0][2][2] = node22;

    // Initialize neighbors
    initializeNeighbors(grid);

    // Define start and end nodes
    const startNode = node00;
    const endNode = node22;

    // Call the findPath function
    const path = findPath(startNode, endNode);

    const validPaths = [
      [
        [0, 0, 0],
        [1, 0, 1],
        [2, 0, 2],
      ],
    ];

    // Verify that the path is one of the valid paths
    expect(validPaths).toContainEqual(path);
  });

  test('finds a unique path in a 3D grid with obstacles', () => {
    // Create a 3x3x3 grid
    const grid: (Node | null)[][][] = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () =>
        Array.from({ length: 3 }, () => null as Node | null),
      ),
    );

    // Define nodes with positions
    const nodes: Node[][][] = grid.map((layer, x) =>
      layer.map((row, y) =>
        row.map((_, z) => ({
          x,
          y,
          z,
          g: 0,
          f: 0,
          h: 0,
          opened: false,
          closed: false,
          parent: null,
          neighbors: [],
        })),
      ),
    );

    // Place nodes in the grid
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
          grid[x][y][z] = nodes[x][y][z];
        }
      }
    }

    // Add obstacles by setting certain nodes to null
    grid[0][1][0] = null;
    grid[1][1][0] = null;
    grid[1][1][1] = null;
    grid[1][0][1] = null;
    grid[2][1][1] = null;

    // Initialize neighbors
    initializeNeighbors(grid);

    // Define start and end nodes
    const startNode = nodes[0][0][0];
    const endNode = nodes[2][2][2];

    // Call the findPath function
    const path = findPath(startNode, endNode);

    // Define the expected unique path
    const validPaths = [
      [
        [0, 0, 0],
        [0, 1, 1],
        [1, 2, 1],
        [2, 2, 1],
        [2, 2, 2],
      ],
    ];

    console.log(path);
    // Verify that the path is correct
    expect(validPaths).toContainEqual(path);
  });
});
