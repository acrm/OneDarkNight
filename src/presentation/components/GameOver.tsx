import { useGameStore } from '../../application/gameStore';
import './GameOver.css';

export function GameOver() {
  const restart = useGameStore((s) => s.restart);
  return (
    <div className="end-screen game-over">
      <div className="end-icon"><i className="fa-solid fa-skull" /></div>
      <h1>Конец.</h1>
      <p>Ты нарушил правила. Или не успел их применить.</p>
      <p className="end-hint">Дом не прощает ошибок.</p>
      <button className="restart-btn" onClick={restart}><i className="fa-solid fa-rotate-right" /> Начать заново</button>
    </div>
  );
}
