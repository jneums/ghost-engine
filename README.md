# ghost-engine

## Description

This is a simple game engine that uses the Internet Computer as a backend. The backend is an authoritative server that runs the game logic and sends updates to the client. The client is a web app that renders the game and sends user input to the server, and uses React and Threejs.

## How to run

Clone the repository and run the following commands:

```sh
npm install
mops install
dfx start
npm run deploy:local
```

The URL of the frontend will be printed in the terminal. Open it in a browser to play the game.
