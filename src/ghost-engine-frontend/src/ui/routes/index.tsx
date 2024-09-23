import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Menu from '../pages/Menu';

export default function UIRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="*" element={<h1>404</h1>} />
      </Routes>
    </Router>
  );
}
