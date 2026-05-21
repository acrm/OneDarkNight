import { useMemo } from 'react';
import { useStoryLibraryStore } from '../../application/storyLibraryStore';
import './WorldEditorPanel.css';

export function WorldEditorPanel() {
  const stories = useStoryLibraryStore((state) => state.stories);
  const activeStoryId = useStoryLibraryStore((state) => state.activeStoryId);
  const customScenesByStoryId = useStoryLibraryStore((state) => state.customScenesByStoryId);
  const worldNotesByStoryId = useStoryLibraryStore((state) => state.worldNotesByStoryId);
  const updateWorldNotes = useStoryLibraryStore((state) => state.updateWorldNotes);

  const activeStory = useMemo(
    () => stories.find((story) => story.id === activeStoryId) ?? stories[0],
    [stories, activeStoryId]
  );

  const scenes = activeStory ? (customScenesByStoryId[activeStory.id] ?? []) : [];

  const locations = useMemo(() => {
    const unique = new Set<string>();
    for (const scene of scenes) {
      if (scene.location) unique.add(scene.location);
    }
    return [...unique].sort((a, b) => a.localeCompare(b));
  }, [scenes]);

  if (!activeStory) return null;

  return (
    <section className="world-editor" aria-label="Редактор мира">
      <div className="world-editor-head">
        <h2>Редактор мира</h2>
        <p>
          История: <strong>{activeStory.title}</strong> · уникальных локаций: {locations.length}
        </p>
      </div>

      <div className="world-locations">
        {locations.length > 0 ? (
          locations.map((location) => <span key={location} className="world-location-chip">{location}</span>)
        ) : (
          <span className="world-empty">Локации не найдены в текущей структуре сцен.</span>
        )}
      </div>

      <label className="world-notes">
        <span>Заметки мира</span>
        <textarea
          value={worldNotesByStoryId[activeStory.id] ?? ''}
          onChange={(event) => updateWorldNotes(activeStory.id, event.target.value)}
          placeholder="Правила мира, состояние персонажей, ограничение магии, тон истории..."
        />
      </label>
    </section>
  );
}
