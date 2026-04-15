import { useGameStore } from '../../application/gameStore';
import './GameOver.css';

export function Victory() {
  const restart = useGameStore((s) => s.restart);
  return (
    <div className="end-screen victory">
      <div className="end-icon"><i className="fa-solid fa-star" /></div>
      <h1>Вы выжили.</h1>
      <p>Пять ночей позади. Дом принял вас.</p>
      <p className="end-hint">«One Dark Night» — завершено.</p>
      <button className="restart-btn" onClick={restart}><i className="fa-solid fa-rotate-right" /> Играть снова</button>
    </div>
  );
}
