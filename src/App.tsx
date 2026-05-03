import './App.css';
import { useSyncExternalStore } from 'react';
import { GamePage } from './presentation/pages/GamePage';
import { DevtoolsPage } from './presentation/pages/DevtoolsPage';

type AppRoute = 'game' | 'devtools';

const getRoute = (): AppRoute => {
  const hash = window.location.hash || '#/';
  return hash.startsWith('#/devtools') ? 'devtools' : 'game';
};

const subscribeRoute = (onStoreChange: () => void): (() => void) => {
  window.addEventListener('hashchange', onStoreChange);
  return () => window.removeEventListener('hashchange', onStoreChange);
};

function App() {
  const route = useSyncExternalStore(subscribeRoute, getRoute, () => 'game');

  return (
    <div className="app">
      {route === 'devtools' ? <DevtoolsPage /> : <GamePage />}
    </div>
  );
}

export default App;
