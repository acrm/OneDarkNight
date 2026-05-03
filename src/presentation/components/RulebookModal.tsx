import { RULEBOOK_PAGES } from '../../domain/rules';
import './RulebookModal.css';

interface RulebookModalProps {
  isOpen: boolean;
  pageIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function RulebookModal({
  isOpen,
  pageIndex,
  onClose,
  onPrev,
  onNext,
}: RulebookModalProps) {
  if (!isOpen) return null;

  const page = RULEBOOK_PAGES[pageIndex];
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < RULEBOOK_PAGES.length - 1;

  return (
    <div className="rulebook-backdrop" onClick={onClose}>
      <div
        className="rulebook-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Тетрадь с правилами"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="rulebook-close" onClick={onClose} aria-label="Закрыть тетрадь">
          <i className="fa-solid fa-xmark" />
        </button>

        <div className="rulebook-header">
          <span className="rulebook-kicker">
            <i className="fa-solid fa-book-open" /> Тетрадь с правилами
          </span>
          <h3>{page.title}</h3>
        </div>

        <div className="rulebook-body">
          {page.lines.map((line, index) => (
            <p key={`${page.id}-${index}`}>{line || '\u00A0'}</p>
          ))}
        </div>

        <div className="rulebook-footer">
          <button className="rulebook-nav-btn" onClick={onPrev} disabled={!canPrev}>
            <i className="fa-solid fa-chevron-left" /> Назад
          </button>
          <span className="rulebook-page-indicator">
            {pageIndex + 1} / {RULEBOOK_PAGES.length}
          </span>
          <button className="rulebook-nav-btn" onClick={onNext} disabled={!canNext}>
            Вперед <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
      </div>
    </div>
  );
}
