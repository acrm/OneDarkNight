import { useMemo } from 'react';
import { useStoryLibraryStore } from '../../application/storyLibraryStore';
import { cloneScenes, getStoryTemplate } from '../../domain/storyTemplates';
import type { Choice, Scene } from '../../domain/types';
import './StoryStructureEditor.css';

const toLines = (text: string[]): string => text.join('\n');

const toSceneText = (value: string): string[] => {
  const normalized = value.replace(/\r\n/g, '\n').split('\n').map((line) => line.trimEnd());
  const nonEmpty = normalized.filter((line) => line.length > 0);
  return nonEmpty.length > 0 ? nonEmpty : [''];
};

const createChoiceId = (scene: Scene): string => {
  const nextIndex = scene.choices.length + 1;
  return `c${nextIndex}_${Date.now().toString(36).slice(-4)}`;
};

export function StoryStructureEditor() {
  const stories = useStoryLibraryStore((state) => state.stories);
  const activeStoryId = useStoryLibraryStore((state) => state.activeStoryId);
  const customScenesByStoryId = useStoryLibraryStore((state) => state.customScenesByStoryId);
  const updateStoryScenes = useStoryLibraryStore((state) => state.updateStoryScenes);
  const resetStoryScenes = useStoryLibraryStore((state) => state.resetStoryScenes);

  const activeStory = useMemo(
    () => stories.find((story) => story.id === activeStoryId) ?? stories[0],
    [stories, activeStoryId]
  );

  const scenes = useMemo(() => {
    if (!activeStory) return [];
    return customScenesByStoryId[activeStory.id] ?? cloneScenes(getStoryTemplate(activeStory.templateId).scenes);
  }, [activeStory, customScenesByStoryId]);

  const sceneIds = useMemo(() => scenes.map((scene) => scene.id), [scenes]);

  const patchScene = (sceneId: string, mapper: (scene: Scene) => Scene) => {
    if (!activeStory) return;
    const nextScenes = scenes.map((scene) => (scene.id === sceneId ? mapper(scene) : scene));
    updateStoryScenes(activeStory.id, nextScenes);
  };

  const patchChoice = (sceneId: string, choiceId: string, mapper: (choice: Choice) => Choice) => {
    patchScene(sceneId, (scene) => ({
      ...scene,
      choices: scene.choices.map((choice) => (choice.id === choiceId ? mapper(choice) : choice)),
    }));
  };

  const addChoice = (sceneId: string) => {
    patchScene(sceneId, (scene) => ({
      ...scene,
      choices: [
        ...scene.choices,
        {
          id: createChoiceId(scene),
          text: 'Новый выбор',
          nextSceneId: sceneIds[0] ?? scene.id,
        },
      ],
    }));
  };

  const deleteChoice = (sceneId: string, choiceId: string) => {
    patchScene(sceneId, (scene) => ({
      ...scene,
      choices: scene.choices.filter((choice) => choice.id !== choiceId),
    }));
  };

  const handleReset = () => {
    if (!activeStory) return;
    const ok = window.confirm('Сбросить все изменения структуры этой истории?');
    if (!ok) return;
    resetStoryScenes(activeStory.id);
  };

  if (!activeStory) return null;

  return (
    <section className="story-structure" aria-label="Редактор структуры истории">
      <div className="story-structure-head">
        <div>
          <h2>Редактор истории</h2>
          <p>
            Полная структура: <strong>{activeStory.title}</strong> · сцен: {scenes.length}
          </p>
        </div>
        <button type="button" className="story-structure-reset" onClick={handleReset}>
          <i className="fa-solid fa-rotate-left" />
          Сбросить правки
        </button>
      </div>

      <div className="story-structure-list">
        {scenes.map((scene) => (
          <article className="scene-editor-card" key={scene.id}>
            <div className="scene-editor-meta">
              <span className="scene-id">{scene.id}</span>
              <span className="scene-time">Day {scene.day} · {scene.time}</span>
            </div>

            <label className="scene-field">
              <span>Название сцены</span>
              <input
                value={scene.title ?? ''}
                onChange={(event) => patchScene(scene.id, (current) => ({ ...current, title: event.target.value }))}
              />
            </label>

            <label className="scene-field">
              <span>Локация</span>
              <input
                value={scene.location ?? ''}
                onChange={(event) => patchScene(scene.id, (current) => ({ ...current, location: event.target.value }))}
              />
            </label>

            <label className="scene-field">
              <span>Текст (каждая строка станет абзацем)</span>
              <textarea
                value={toLines(scene.text)}
                onChange={(event) => patchScene(scene.id, (current) => ({ ...current, text: toSceneText(event.target.value) }))}
              />
            </label>

            <div className="choice-editor">
              <div className="choice-editor-head">
                <span>Переходы и выборы</span>
                <button type="button" className="choice-add-btn" onClick={() => addChoice(scene.id)}>
                  <i className="fa-solid fa-plus" /> Добавить выбор
                </button>
              </div>

              {scene.choices.length === 0 ? (
                <p className="choice-empty">У этой сцены нет выборов (финал).</p>
              ) : (
                scene.choices.map((choice) => (
                  <div className="choice-row" key={choice.id}>
                    <label>
                      <span>Текст</span>
                      <input
                        value={choice.text}
                        onChange={(event) => patchChoice(scene.id, choice.id, (current) => ({ ...current, text: event.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Следующая сцена</span>
                      <select
                        value={choice.nextSceneId}
                        onChange={(event) => patchChoice(scene.id, choice.id, (current) => ({ ...current, nextSceneId: event.target.value }))}
                      >
                        {sceneIds.map((targetId) => (
                          <option key={targetId} value={targetId}>{targetId}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="choice-delete-btn"
                      onClick={() => deleteChoice(scene.id, choice.id)}
                      title="Удалить выбор"
                      aria-label="Удалить выбор"
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
