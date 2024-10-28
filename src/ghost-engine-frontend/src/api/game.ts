import { HttpAgent, Identity } from '@dfinity/agent';
import { canisterId, createActor } from '../declarations/ghost-engine-backend';

const createServer = (identity: Identity) => {
  if (!identity) {
    throw new Error('Identity not found');
  }

  const host =
    process.env.DFX_NETWORK === 'local'
      ? 'http://127.0.0.1:4943'
      : 'https://icp-api.io';

  const agent = HttpAgent.createSync({
    identity,
    host,
    verifyQuerySignatures: false,
  });

  return createActor(canisterId, { agent });
};

export const getTokenRegistry = async (identity: Identity) => {
  const server = createServer(identity);
  return await server.getTokenRegistry();
};
