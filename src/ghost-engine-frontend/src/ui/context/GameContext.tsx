import React from 'react';
import { GameContext } from './GameProvider';

export const useGameContext = () => React.useContext(GameContext);
