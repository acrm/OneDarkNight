import { useState } from 'react';
import type { Choice, Scene } from '../../domain/types';
import { ROOM_LABELS } from '../../domain/house';
import { useGameStore } from '../../application/gameStore';
import { RULEBOOK_PAGES } from '../../domain/rules';
import { RulebookModal } from './RulebookModal';
import './SceneCard.css';

const TIME_LABELS: Record<string, string> = {
  morning: 'Утро', afternoon: 'День', evening: 'Вечер', night: 'Ночь', latenight: 'Глубокая ночь',
};

export function SceneCard({ scene }: { scene: Scene }) {
  const { makeChoice, inventory, flags, threatStage, threatLevel, consequenceLog } = useGameStore();
  const [isRulebookOpen, setRulebookOpen] = useState(false);
  const [rulebookPageIndex, setRulebookPageIndex] = useState(0);

  const hasRulebook = inventory.includes('тетрадь с правилами');

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
            <span className={`scene-threat scene-threat-${threatStage}`}><i className="fa-solid fa-triangle-exclamation" /> Угроза: {threatLevel}/3</span>
          </div>
        </div>
      </div>
      {scene.tvEvent && (
        <div className={`tv-panel tv-panel-${scene.tvEvent.mode}`}>
          <span className="tv-label"><i className="fa-solid fa-tv" /> Телевизор</span>
          <p>{scene.tvEvent.message}</p>
        </div>
      )}
      {scene.nearbyRooms && scene.nearbyRooms.length > 0 && (
        <div className="room-nav">
          <span className="room-nav-label"><i className="fa-solid fa-map" /> Рядом:</span>
          {scene.nearbyRooms.map((roomId) => (
            <span key={roomId} className="room-chip">{ROOM_LABELS[roomId]}</span>
          ))}
        </div>
      )}
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
          <div className="inventory-items">
            {inventory.map((item) => (
              <span key={item} className="inventory-item">
                <span>{item}</span>
                {item === 'тетрадь с правилами' && (
                  <button
                    className="rulebook-open-btn"
                    onClick={() => setRulebookOpen(true)}
                    type="button"
                  >
                    Открыть
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
      {hasRulebook && (
        <RulebookModal
          isOpen={isRulebookOpen}
          pageIndex={rulebookPageIndex}
          onClose={() => setRulebookOpen(false)}
          onPrev={() => setRulebookPageIndex((prev) => Math.max(prev - 1, 0))}
          onNext={() => setRulebookPageIndex((prev) => Math.min(prev + 1, RULEBOOK_PAGES.length - 1))}
        />
      )}
      {consequenceLog.length > 0 && (
        <div className="consequence-log">
          <span className="consequence-label"><i className="fa-solid fa-book-skull" /> Последствия:</span>
          <ul>
            {consequenceLog.slice(-3).map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
