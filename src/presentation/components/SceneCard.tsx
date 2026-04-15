import type { Choice, Scene } from '../../domain/types';
import { useGameStore } from '../../application/gameStore';
import './SceneCard.css';

const TIME_LABELS: Record<string, string> = {
  morning: 'Утро', afternoon: 'День', evening: 'Вечер', night: 'Ночь', latenight: 'Глубокая ночь',
};

export function SceneCard({ scene }: { scene: Scene }) {
  const { makeChoice, inventory, flags } = useGameStore();
  const available = scene.choices.filter((c: Choice) => {
    if (c.requireItem && !inventory.includes(c.requireItem)) return false;
    if (c.requireFlag && !flags[c.requireFlag]) return false;
    if (c.requireNotFlag && flags[c.requireNotFlag]) return false;
    return true;
  });
  return (
    <div className="scene-card">
      <div className="scene-header">
        {scene.icon && <span className="scene-icon"><i className={`fa-solid ${scene.icon}`} /></span>}
        <div className="scene-meta">
          {scene.title && <h2 className="scene-title">{scene.title}</h2>}
          <div className="scene-info">
            {scene.location && <span className="scene-location"><i className="fa-solid fa-location-dot" /> {scene.location}</span>}
            <span className="scene-time"><i className="fa-solid fa-clock" /> {TIME_LABELS[scene.time]}</span>
          </div>
        </div>
      </div>
      <div className="scene-text">
        {scene.text.map((p, i) => <p key={i}>{p || '\u00A0'}</p>)}
      </div>
      {available.length > 0 && (
        <div className="scene-choices">
          {available.map((c) => (
            <button key={c.id} className="choice-btn" onClick={() => makeChoice(c.id)}>
              <i className="fa-solid fa-chevron-right" />{c.text}
            </button>
          ))}
        </div>
      )}
      {inventory.length > 0 && (
        <div className="inventory">
          <span className="inventory-label"><i className="fa-solid fa-bag-shopping" /> Инвентарь:</span>
          {inventory.map((item) => <span key={item} className="inventory-item">{item}</span>)}
        </div>
      )}
    </div>
  );
}
