# ghost-engine

## Description

This is a simple game engine that uses the Internet Computer as a backend. The backend is an authoritative server written in Motoko that runs the game logic and sends updates to the client using the ICWebsocket integration. The client is a web app that renders the game and sends user input to the server, and uses React and Threejs.

## Deployed canister

The canister is deployed at [https://yjprz-siaaa-aaaai-qpkaq-cai.icp0.io](https://yjprz-siaaa-aaaai-qpkaq-cai.icp0.io).

## How to run

### Setting up Websockets server

This project uses the ICWebsocket integration, so you need to have that running first locally. You can find the instructions [here](https://github.com/omnia-network/ic-websocket-gateway).

### Installing canisters

After the websockets server is running, clone this repository and run the following commands:

```sh
npm install
mops install
dfx start

# Installs icrc1 ledger and funds the game canister,
# and then runs `npm run deploy:local` to deploy the game canister
npm run bootstrap
```

The URL of the frontend will be printed in the terminal. Open it in a browser to play the game.

## Development

### Running the frontend

To run the frontend in development mode, run:

```sh
npm run start
```

### Running the backend

To deploy changes to the local canister, run:

```sh
npm run deploy:local
```
