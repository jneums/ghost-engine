# ghost-engine

## Description

This is a simple game engine that uses the Internet Computer as a backend. The backend is an authoritative server written in Motoko that runs the game logic and serves updates to clients. The client is a web app that renders the game and sends user input to the server, and uses React and Threejs.

## Deployed canister

The canister is deployed at [https://yjprz-siaaa-aaaai-qpkaq-cai.icp0.io](https://yjprz-siaaa-aaaai-qpkaq-cai.icp0.io).

## How to run

### Installing canisters

Run the following commands to install the canisters:

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
