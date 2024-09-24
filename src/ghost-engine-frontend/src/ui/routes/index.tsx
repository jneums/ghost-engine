import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Menu from '../pages/Menu';
import GameOverlay from '../pages/GameOverlay';

export default function UIRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/game" element={<GameOverlay />} />
        <Route path="*" element={<h1>404</h1>} />
      </Routes>
    </Router>
  );
}
