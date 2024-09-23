import GameProvider from './context/GameProvider';
import Routes from './routes';

export default function UI() {
  return (
    <GameProvider>
      <Routes />
    </GameProvider>
  );
}
