import { useEffect, useState } from 'react';
import { Connection } from '../connection';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { SignIdentity } from '@dfinity/agent';
import { World } from './useWorldState';

export const useConnectionState = (world: World) => {
  const [connection, setConnection] = useState<Connection | null>(null);
  const { identity } = useInternetIdentity();

  useEffect(() => {
    if (identity && !connection) {
      const conn = new Connection();
      conn.initialize(
        identity as SignIdentity,
        world.addComponent,
        world.removeComponent,
      );
      setConnection(conn);
    }
  }, [connection, identity, world]);

  return connection;
};
