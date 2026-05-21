import { useEffect, useMemo, useState } from 'react';
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
  const [isDeleteMode, setDeleteMode] = useState(false);
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(new Set());
  const [dragSceneId, setDragSceneId] = useState<string | null>(null);
  const [codeDraftBySceneId, setCodeDraftBySceneId] = useState<Record<string, string>>({});

  useEffect(() => {
    const nextDrafts: Record<string, string> = {};
    for (const scene of scenes) {
      nextDrafts[scene.id] = JSON.stringify(scene, null, 2);
    }
    setCodeDraftBySceneId(nextDrafts);
    setDeleteMode(false);
    setSelectedSceneIds(new Set());
    setDragSceneId(null);
  }, [activeStory?.id]);

  const patchScene = (sceneId: string, mapper: (scene: Scene) => Scene) => {
    if (!activeStory) return;
    const nextScenes = scenes.map((scene) => (scene.id === sceneId ? mapper(scene) : scene));
    updateStoryScenes(activeStory.id, nextScenes);
    const changedScene = nextScenes.find((scene) => scene.id === sceneId);
    if (changedScene) {
      setCodeDraftBySceneId((state) => ({
        ...state,
        [sceneId]: JSON.stringify(changedScene, null, 2),
      }));
    }
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

  const handleAddScene = () => {
    if (!activeStory) return;
    const id = `scene_${Date.now().toString(36)}`;
    const lastScene = scenes[scenes.length - 1];
    const newScene: Scene = {
      id,
      day: lastScene?.day ?? 1,
      time: lastScene?.time ?? 'morning',
      title: 'Новая сцена',
      location: 'Локация',
      text: ['Текст новой сцены.'],
      choices: [],
    };
    const nextScenes = [...scenes, newScene];
    updateStoryScenes(activeStory.id, nextScenes);
    setCodeDraftBySceneId((state) => ({
      ...state,
      [id]: JSON.stringify(newScene, null, 2),
    }));
  };

  const toggleSceneSelection = (sceneId: string) => {
    setSelectedSceneIds((state) => {
      const next = new Set(state);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
  };

  const handleConfirmDeleteScenes = () => {
    if (!activeStory || selectedSceneIds.size === 0) return;
    const keepScenes = scenes.filter((scene) => !selectedSceneIds.has(scene.id));
    if (keepScenes.length === 0) {
      alert('Нельзя удалить все сцены истории. Оставьте минимум одну сцену.');
      return;
    }
    const fallbackSceneId = keepScenes[0].id;
    const normalized = keepScenes.map((scene) => ({
      ...scene,
      choices: scene.choices.map((choice) => ({
        ...choice,
        nextSceneId: selectedSceneIds.has(choice.nextSceneId) ? fallbackSceneId : choice.nextSceneId,
      })),
    }));
    updateStoryScenes(activeStory.id, normalized);
    setDeleteMode(false);
    setSelectedSceneIds(new Set());
  };

  const moveScene = (sourceId: string, targetId: string) => {
    if (!activeStory || sourceId === targetId) return;
    const fromIndex = scenes.findIndex((scene) => scene.id === sourceId);
    const toIndex = scenes.findIndex((scene) => scene.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const nextScenes = [...scenes];
    const [moved] = nextScenes.splice(fromIndex, 1);
    nextScenes.splice(toIndex, 0, moved);
    updateStoryScenes(activeStory.id, nextScenes);
  };

  const applySceneCode = (sceneId: string) => {
    const source = codeDraftBySceneId[sceneId];
    if (!source) return;
    try {
      const parsed = JSON.parse(source) as Scene;
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.choices) || !Array.isArray(parsed.text) || typeof parsed.id !== 'string') {
        throw new Error('invalid');
      }
      patchScene(sceneId, () => ({ ...parsed, id: sceneId }));
    } catch {
      alert('Ошибка JSON кода сцены. Проверьте синтаксис и обязательные поля.');
    }
  };

  if (!activeStory) return null;

  return (
    <section className="story-structure" aria-label="Редактор структуры истории">
      <div className="story-structure-head">
        <div>
          <h2>Редактор сцен</h2>
          <p>
            Полная структура: <strong>{activeStory.title}</strong> · сцен: {scenes.length}
          </p>
        </div>
        <div className="scene-editor-tools">
          <button type="button" className="story-structure-btn" onClick={handleAddScene}>
            <i className="fa-solid fa-plus" /> Добавить сцену
          </button>
          {isDeleteMode ? (
            <>
              <button
                type="button"
                className="story-structure-btn danger"
                onClick={handleConfirmDeleteScenes}
                disabled={selectedSceneIds.size === 0}
              >
                <i className="fa-solid fa-check" /> Удалить ({selectedSceneIds.size})
              </button>
              <button type="button" className="story-structure-btn" onClick={() => { setDeleteMode(false); setSelectedSceneIds(new Set()); }}>
                <i className="fa-solid fa-xmark" /> Отмена
              </button>
            </>
          ) : (
            <button type="button" className="story-structure-btn danger" onClick={() => setDeleteMode(true)}>
              <i className="fa-solid fa-trash" /> Выбрать сцены для удаления
            </button>
          )}
          <button type="button" className="story-structure-reset" onClick={handleReset}>
            <i className="fa-solid fa-rotate-left" />
            Сбросить правки
          </button>
        </div>
      </div>

      <div className="story-structure-list">
        {scenes.map((scene) => (
          <article
            className={`scene-editor-card${dragSceneId === scene.id ? ' dragging' : ''}${selectedSceneIds.has(scene.id) ? ' marked-delete' : ''}`}
            key={scene.id}
            draggable
            onDragStart={() => setDragSceneId(scene.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (!dragSceneId) return;
              moveScene(dragSceneId, scene.id);
              setDragSceneId(null);
            }}
            onDragEnd={() => setDragSceneId(null)}
          >
            <div className="scene-editor-meta">
              <span className="scene-id">
                <i className="fa-solid fa-grip-vertical" /> {scene.id}
              </span>
              <span className="scene-time">Day {scene.day} · {scene.time}</span>
            </div>

            {isDeleteMode ? (
              <button type="button" className="scene-select-delete-btn" onClick={() => toggleSceneSelection(scene.id)}>
                <i className={`fa-solid ${selectedSceneIds.has(scene.id) ? 'fa-square-check' : 'fa-square'}`} />
                {selectedSceneIds.has(scene.id) ? 'Выбрана для удаления' : 'Выбрать для удаления'}
              </button>
            ) : null}

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

            <div className="scene-code-editor">
              <div className="scene-code-head">
                <span>Код сцены (JSON)</span>
                <button type="button" className="scene-code-apply-btn" onClick={() => applySceneCode(scene.id)}>
                  Применить код
                </button>
              </div>
              <textarea
                value={codeDraftBySceneId[scene.id] ?? JSON.stringify(scene, null, 2)}
                onChange={(event) => {
                  const value = event.target.value;
                  setCodeDraftBySceneId((state) => ({ ...state, [scene.id]: value }));
                }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
