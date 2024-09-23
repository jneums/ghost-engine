import * as React from 'react';
import { Game } from '../../game';

interface GameContextValue {
  game: Game;
}

const defaultValue = {
  game: new Game(),
};

export const GameContext = React.createContext<GameContextValue>(defaultValue);

const Provider = ({ children }: { children: React.ReactElement }) => {
  return (
    <GameContext.Provider value={defaultValue}>{children}</GameContext.Provider>
  );
};

export default Provider;
