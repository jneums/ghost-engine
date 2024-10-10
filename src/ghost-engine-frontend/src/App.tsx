import { InternetIdentityProvider } from 'ic-use-internet-identity';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Menu from './pages/Menu';
import Game from './pages/Game';
import { CssBaseline, CssVarsProvider } from '@mui/joy';
import { WorldProvider } from './context/WorldProvider';
import { DialogProvider } from './context/DialogProvider';
import { ErrorMessageProvider } from './context/ErrorProvider';
import { ConnectionProvider } from './context/ConnectionProvider';

export default function App() {
  return (
    <CssVarsProvider>
      <CssBaseline />
      <InternetIdentityProvider
        loginOptions={{
          maxTimeToLive: 1_000_000_000n * 60n * 60n * 24n * 7n * 30n,
        }}>
        <ConnectionProvider>
          <WorldProvider>
            <DialogProvider>
              <ErrorMessageProvider>
                <Router>
                  <Routes>
                    <Route path="/" element={<Menu />} />
                    <Route path="/game" element={<Game />} />
                    <Route path="*" element={<h1>404</h1>} />
                  </Routes>
                </Router>
              </ErrorMessageProvider>
            </DialogProvider>
          </WorldProvider>
        </ConnectionProvider>
      </InternetIdentityProvider>
    </CssVarsProvider>
  );
}
