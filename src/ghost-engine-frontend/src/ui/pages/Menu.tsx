import { useNavigate } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';

export default function Menu() {
  const { game } = useGameContext();
  const navigate = useNavigate();

  const handleClick = async () => {
    await game.connect();
    navigate('/game');
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
