import { useMemo } from 'react';
import { useStoryLibraryStore } from '../../application/storyLibraryStore';

import './StoryEditorPanel.css';

export function StoryEditorPanel() {
  const stories = useStoryLibraryStore((state) => state.stories);
  const activeStoryId = useStoryLibraryStore((state) => state.activeStoryId);
  const setActiveStoryId = useStoryLibraryStore((state) => state.setActiveStoryId);
  const createStory = useStoryLibraryStore((state) => state.createStory);
  const renameStory = useStoryLibraryStore((state) => state.renameStory);
  const deleteStory = useStoryLibraryStore((state) => state.deleteStory);

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
    const title = window.prompt('Переименовать историю', activeStory.title);
    if (title === null) return;
    renameStory(activeStory.id, title);
  };

  const handleDelete = () => {
    if (!activeStory || activeStory.isBuiltIn) return;
    const confirmDelete = window.confirm(`Удалить историю "${activeStory.title}"?`);
    if (!confirmDelete) return;
    deleteStory(activeStory.id);
  };

  return (
    <section className="story-editor-panel" aria-label="Управление историями">
      <label className="story-select-wrap">
        <span>История</span>
        <select value={activeStoryId} onChange={(event) => setActiveStoryId(event.target.value)}>
          {stories.map((story) => (
            <option key={story.id} value={story.id}>
              {story.title}{story.isBuiltIn ? ' (demo)' : ''}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="story-panel-btn" onClick={handleCreate}>
        <i className="fa-solid fa-plus" />
        Новая
      </button>
      <button
        type="button"
        className="story-panel-btn"
        onClick={handleRename}
        disabled={!activeStory || activeStory.isBuiltIn}
      >
        <i className="fa-solid fa-pen" />
        Переименовать
      </button>
      <button
        type="button"
        className="story-panel-btn danger"
        onClick={handleDelete}
        disabled={!activeStory || activeStory.isBuiltIn}
      >
        <i className="fa-solid fa-trash" />
        Удалить
      </button>
    </section>
  );
}
