import { InternetIdentityProvider } from 'ic-use-internet-identity';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Menu from './pages/Menu';
import Game from './pages/Game';
import { CssBaseline, CssVarsProvider } from '@mui/joy';

export default function App() {
  return (
    <CssVarsProvider>
      <CssBaseline />
      <InternetIdentityProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Menu />} />
            <Route path="/game" element={<Game />} />
            <Route path="*" element={<h1>404</h1>} />
          </Routes>
        </Router>
      </InternetIdentityProvider>
    </CssVarsProvider>
  );
}
