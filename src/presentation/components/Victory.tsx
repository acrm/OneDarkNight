import { useGameStore } from '../../application/gameStore';
import { useStoryLibraryStore } from '../../application/storyLibraryStore';
import './GameOver.css';

export function Victory() {
  const restart = useGameStore((s) => s.restart);
  const title = useStoryLibraryStore((state) => {
    const active = state.stories.find((story) => story.id === state.activeStoryId);
    return active?.title ?? 'История';
  });
  return (
    <div className="end-screen victory">
      <div className="end-icon"><i className="fa-solid fa-star" /></div>
      <h1>Вы выжили.</h1>
      <p>Пять ночей позади. Дом принял вас.</p>
      <p className="end-hint">«{title}» — завершено.</p>
      <button className="restart-btn" onClick={restart}><i className="fa-solid fa-rotate-right" /> Играть снова</button>
    </div>
  );
}
