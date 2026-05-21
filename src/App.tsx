import './App.css';
import { useSyncExternalStore } from 'react';
import { useGameStore } from './application/gameStore';
import { GamePage } from './presentation/pages/GamePage';
import { DevtoolsPage } from './presentation/pages/DevtoolsPage';

type AppRoute = 'game' | 'edit';

const DEMO_STORY_TITLE = 'One Dark Night';

const getRoute = (): AppRoute => {
  const hash = window.location.hash || '#/';
  return hash.startsWith('#/edit') || hash.startsWith('#/devtools') ? 'edit' : 'game';
};

const subscribeRoute = (onStoreChange: () => void): (() => void) => {
  window.addEventListener('hashchange', onStoreChange);
  return () => window.removeEventListener('hashchange', onStoreChange);
};

function App() {
  const route = useSyncExternalStore(subscribeRoute, getRoute, () => 'game');
  const restart = useGameStore((state) => state.restart);
  const isGameMode = route === 'game';

  return (
    <div className="app">
      <header className="mobile-story-header">
        <div className="mobile-story-title-wrap">
          <span className="platform-name">Play My Story</span>
          <h1 className="story-title">{DEMO_STORY_TITLE}</h1>
        </div>
        <div className="mobile-story-actions">
          {isGameMode ? (
            <button
              type="button"
              className="header-icon-btn"
              onClick={restart}
              title="Начать историю заново"
              aria-label="Начать историю заново"
            >
              <i className="fa-solid fa-rotate-right" />
            </button>
          ) : null}
          <a
            className="header-icon-btn"
            href={isGameMode ? '#/edit' : '#/'}
            title={isGameMode ? 'Перейти в режим редактирования' : 'Перейти в игровой режим'}
            aria-label={isGameMode ? 'Перейти в режим редактирования' : 'Перейти в игровой режим'}
          >
            <i className={isGameMode ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-play'} />
          </a>
        </div>
      </header>
      <div className="app-content">
        {route === 'edit' ? <DevtoolsPage /> : <GamePage />}
      </div>
    </div>
  );
}

export default App;
