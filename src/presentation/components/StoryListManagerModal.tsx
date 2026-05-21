import { useMemo, useRef } from 'react';
import {
  useStoryLibraryStore,
  type StoryLibraryImportPayload,
} from '../../application/storyLibraryStore';
import './StoryListManagerModal.css';

interface StoryListManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StoryListManagerModal({ isOpen, onClose }: StoryListManagerModalProps) {
  const stories = useStoryLibraryStore((state) => state.stories);
  const activeStoryId = useStoryLibraryStore((state) => state.activeStoryId);
  const setActiveStoryId = useStoryLibraryStore((state) => state.setActiveStoryId);
  const createStory = useStoryLibraryStore((state) => state.createStory);
  const renameStory = useStoryLibraryStore((state) => state.renameStory);
  const deleteStory = useStoryLibraryStore((state) => state.deleteStory);
  const customScenesByStoryId = useStoryLibraryStore((state) => state.customScenesByStoryId);
  const revisionByStoryId = useStoryLibraryStore((state) => state.revisionByStoryId);
  const worldNotesByStoryId = useStoryLibraryStore((state) => state.worldNotesByStoryId);
  const importLibrary = useStoryLibraryStore((state) => state.importLibrary);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeStory = useMemo(
    () => stories.find((story) => story.id === activeStoryId) ?? stories[0],
    [stories, activeStoryId]
  );

  const handleCreate = () => {
    const title = window.prompt('Название новой истории', 'Моя история');
    if (title === null) return;
    createStory(title, activeStory?.templateId ?? 'one-dark-night');
  };

  const handleRename = () => {
    if (!activeStory || activeStory.isBuiltIn) return;
    const nextTitle = window.prompt('Новое имя истории', activeStory.title);
    if (nextTitle === null) return;
    renameStory(activeStory.id, nextTitle);
  };

  const handleDelete = () => {
    if (!activeStory || activeStory.isBuiltIn) return;
    const confirmed = window.confirm(`Удалить историю "${activeStory.title}"?`);
    if (!confirmed) return;
    deleteStory(activeStory.id);
  };

  const handleExport = () => {
    const payload: StoryLibraryImportPayload = {
      stories,
      activeStoryId,
      customScenesByStoryId,
      revisionByStoryId,
      worldNotesByStoryId,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `play-my-story-library-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as StoryLibraryImportPayload;
      importLibrary(payload);
      alert('Список историй загружен.');
    } catch {
      alert('Не удалось загрузить файл списка историй.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="story-list-modal-backdrop" onClick={onClose}>
      <div className="story-list-modal" onClick={(event) => event.stopPropagation()}>
        <div className="story-list-modal-head">
          <h2>Список историй</h2>
          <button type="button" className="story-list-close" onClick={onClose} aria-label="Закрыть">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <label className="story-list-select-wrap">
          <span>Активная история</span>
          <select value={activeStoryId} onChange={(event) => setActiveStoryId(event.target.value)}>
            {stories.map((story) => (
              <option key={story.id} value={story.id}>
                {story.title}{story.isBuiltIn ? ' (demo)' : ''}
              </option>
            ))}
          </select>
        </label>

        <div className="story-list-actions">
          <button type="button" className="story-list-btn" onClick={handleCreate}>
            <i className="fa-solid fa-plus" /> Добавить
          </button>
          <button
            type="button"
            className="story-list-btn"
            onClick={handleRename}
            disabled={!activeStory || activeStory.isBuiltIn}
          >
            <i className="fa-solid fa-pen" /> Переименовать
          </button>
          <button
            type="button"
            className="story-list-btn danger"
            onClick={handleDelete}
            disabled={!activeStory || activeStory.isBuiltIn}
          >
            <i className="fa-solid fa-trash" /> Удалить
          </button>
        </div>

        <div className="story-list-transfer">
          <button type="button" className="story-list-btn" onClick={handleExport}>
            <i className="fa-solid fa-file-export" /> Выгрузить
          </button>
          <button type="button" className="story-list-btn" onClick={handleImportClick}>
            <i className="fa-solid fa-file-import" /> Загрузить
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleImportFile(file);
              event.currentTarget.value = '';
            }}
          />
        </div>
      </div>
    </div>
  );
}
