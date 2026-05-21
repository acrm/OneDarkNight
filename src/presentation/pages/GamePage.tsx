import { useGameStore } from '../../application/gameStore';
import { sceneMap } from '../../domain/scenes';
import { SceneCard } from '../components/SceneCard';
import { GameOver } from '../components/GameOver';
import { Victory } from '../components/Victory';
import './GamePage.css';

export function GamePage() {
  const { currentSceneId, alive, won } = useGameStore();
  if (!alive) return <GameOver />;
  if (won) return <Victory />;
  const scene = sceneMap.get(currentSceneId);
  if (!scene) return <div className="scene-error">Сцена не найдена: {currentSceneId}</div>;
  return (
    <div className="game-page">
      <main><SceneCard scene={scene} /></main>
    </div>
  );
}
