import { useGameStore } from '../../application/gameStore';
import { sceneMap } from '../../domain/scenes';
import { ROOM_LABELS } from '../../domain/house';
import { SceneCard } from '../components/SceneCard';
import { GameOver } from '../components/GameOver';
import { Victory } from '../components/Victory';
import './GamePage.css';

export function GamePage() {
  const { currentSceneId, currentRoomId, alive, won } = useGameStore();
  if (!alive) return <GameOver />;
  if (won) return <Victory />;
  const scene = sceneMap.get(currentSceneId);
  if (!scene) return <div className="scene-error">Сцена не найдена: {currentSceneId}</div>;
  return (
    <div className="game-page">
      <header className="game-header">
        <span className="game-logo"><i className="fa-solid fa-moon" /> One Dark Night</span>
        <div className="header-badges">
          <span className="day-badge">День {scene.day}</span>
          <span className="room-badge"><i className="fa-solid fa-compass" /> {ROOM_LABELS[currentRoomId]}</span>
        </div>
      </header>
      <main><SceneCard scene={scene} /></main>
    </div>
  );
}
