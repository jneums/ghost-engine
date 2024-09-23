import { useGameContext } from '../context/GameContext';

export default function Menu() {
  const { game } = useGameContext();

  const handleClick = () => {
    game.connect();
  };

  return (
    <div id="btn-container">
      <h1>Ghost Engine</h1>
      <button onClick={handleClick} id="connect">
        Connect
      </button>
    </div>
  );
}
