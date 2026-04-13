import { create } from 'zustand';
import { TEMPLATES } from '../data/videoEffectTemplates';
import { createTextObject } from '../utils/videoEffectsTextObjects';
import { getTemplateById } from '../utils/templateLibrary';
import { loadFavoriteTemplateIds, saveFavoriteTemplateIds } from '../utils/favoritesStorage';
import { loadPresets, savePresets } from '../utils/presetsStorage';
import { loadTemplateDefaults, saveTemplateDefaults } from '../utils/templateDefaultsStorage';

function buildDefaultValues(template) {
  if (!template) return {};
  return Object.fromEntries(
    template.fields.map(field => [field.id, field.default])
  );
}

function getDefaultTextColor(fieldValues = {}) {
  return fieldValues.textColor || fieldValues.accentColor || '#ffffff';
}

function sanitizeSnapshot(snapshot = {}) {
  return {
    fieldValues: snapshot.fieldValues || {},
    textObjects: Array.isArray(snapshot.textObjects) ? snapshot.textObjects : [],
    durationOverride: snapshot.durationOverride ?? null,
    motionBlurEnabled: snapshot.motionBlurEnabled ?? true,
    uploadedImage: snapshot.uploadedImage || null,
  };
}

function buildStateForTemplate(template, overrides = {}) {
  const baseFieldValues = buildDefaultValues(template);
  const snapshot = sanitizeSnapshot(overrides);

  return {
    fieldValues: { ...baseFieldValues, ...snapshot.fieldValues },
    textObjects: snapshot.textObjects,
    durationOverride: snapshot.durationOverride,
    motionBlurEnabled: snapshot.motionBlurEnabled,
    uploadedImage: snapshot.uploadedImage,
  };
}

const initialTemplate = TEMPLATES[0];

export const useVideoEffectsStore = create((set, get) => ({
  selectedTemplateId: initialTemplate.id,
  fieldValues: buildDefaultValues(initialTemplate),
  textObjects: [],
  motionBlurEnabled: true,
  uploadedImage: null,
  typeFilter: 'all',
  durationOverride: null,
  generatedTemplates: [],
  backgroundMusic: null,

  favoriteTemplateIds: loadFavoriteTemplateIds(),
  presets: loadPresets(),
  templateDefaults: loadTemplateDefaults(),

  setTypeFilter: (typeFilter) => set({ typeFilter }),
  setMotionBlurEnabled: (motionBlurEnabled) => set({ motionBlurEnabled }),
  setUploadedImage: (image) => set({ uploadedImage: image }),
  setDurationOverride: (ms) => set({ durationOverride: ms }),
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setMusicVolume: (volume) =>
    set(state => ({
      backgroundMusic: state.backgroundMusic ? { ...state.backgroundMusic, volume } : null,
    })),
  clearBackgroundMusic: () => set({ backgroundMusic: null }),

  toggleFavoriteTemplate: (templateId) => {
    set(state => {
      const favoriteTemplateIds = state.favoriteTemplateIds.includes(templateId)
        ? state.favoriteTemplateIds.filter(id => id !== templateId)
        : [...state.favoriteTemplateIds, templateId];
      saveFavoriteTemplateIds(favoriteTemplateIds);
      return { favoriteTemplateIds };
    });
  },

  addGeneratedTemplate: (template) => {
    set(state => {
      if (state.generatedTemplates.find(item => item.id === template.id)) return {};
      return { generatedTemplates: [...state.generatedTemplates, template] };
    });
  },

  removeGeneratedTemplate: (id) => {
    set(state => {
      const generatedTemplates = state.generatedTemplates.filter(template => template.id !== id);
      const favoriteTemplateIds = state.favoriteTemplateIds.filter(templateId => templateId !== id);
      const presets = state.presets.filter(preset => preset.templateId !== id);
      const { [id]: _removedDefaults, ...templateDefaults } = state.templateDefaults;

      saveFavoriteTemplateIds(favoriteTemplateIds);
      savePresets(presets);
      saveTemplateDefaults(templateDefaults);

      if (state.selectedTemplateId === id) {
        const fallbackTemplate = TEMPLATES[0];
        const fallbackState = buildStateForTemplate(fallbackTemplate);
        return {
          generatedTemplates,
          favoriteTemplateIds,
          presets,
          templateDefaults,
          selectedTemplateId: fallbackTemplate.id,
          ...fallbackState,
        };
      }

      return {
        generatedTemplates,
        favoriteTemplateIds,
        presets,
        templateDefaults,
      };
    });
  },

  selectTemplate: (id) => {
    const state = get();
    const template = getTemplateById(id, state.generatedTemplates);
    if (!template) return;

    const defaultSnapshot = state.templateDefaults[id] || null;
    const nextState = buildStateForTemplate(template, defaultSnapshot);

    set({
      selectedTemplateId: id,
      ...nextState,
    });
  },

  selectGeneratedTemplate: (id) => {
    get().selectTemplate(id);
  },

  setFieldValue: (fieldId, value) => {
    set(state => ({
      fieldValues: { ...state.fieldValues, [fieldId]: value },
    }));
  },

  addTextObject: () => {
    const { fieldValues, textObjects } = get();
    const nextObject = createTextObject(textObjects.length, getDefaultTextColor(fieldValues));
    set({
      textObjects: [...textObjects, nextObject],
    });
  },

  updateTextObject: (id, key, value) => {
    set(state => ({
      textObjects: state.textObjects.map(item => (
        item.id === id ? { ...item, [key]: value } : item
      )),
    }));
  },

  removeTextObject: (id) => {
    set(state => ({
      textObjects: state.textObjects.filter(item => item.id !== id),
    }));
  },

  saveCurrentAsPreset: (name) => {
    const state = get();
    const trimmedName = name.trim();
    if (!trimmedName) return false;

    const preset = {
      id: `preset-${Date.now()}`,
      name: trimmedName,
      templateId: state.selectedTemplateId,
      fieldValues: state.fieldValues,
      textObjects: state.textObjects,
      durationOverride: state.durationOverride,
      motionBlurEnabled: state.motionBlurEnabled,
      uploadedImage: state.uploadedImage,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set(currentState => {
      const presets = [...currentState.presets, preset];
      savePresets(presets);
      return { presets };
    });

    return true;
  },

  applyPreset: (presetId) => {
    const state = get();
    const preset = state.presets.find(item => item.id === presetId);
    if (!preset) return;

    const template = getTemplateById(preset.templateId, state.generatedTemplates);
    if (!template) return;

    const nextState = buildStateForTemplate(template, preset);
    set({
      selectedTemplateId: template.id,
      ...nextState,
    });
  },

  deletePreset: (presetId) => {
    set(state => {
      const presets = state.presets.filter(preset => preset.id !== presetId);
      savePresets(presets);
      return { presets };
    });
  },

  saveCurrentAsTemplateDefault: () => {
    const state = get();
    const templateDefaults = {
      ...state.templateDefaults,
      [state.selectedTemplateId]: {
        fieldValues: state.fieldValues,
        textObjects: state.textObjects,
        durationOverride: state.durationOverride,
        motionBlurEnabled: state.motionBlurEnabled,
        uploadedImage: state.uploadedImage,
      },
    };
    saveTemplateDefaults(templateDefaults);
    set({ templateDefaults });
  },

  clearTemplateDefault: (templateId) => {
    set(state => {
      const { [templateId]: _removedDefault, ...templateDefaults } = state.templateDefaults;
      saveTemplateDefaults(templateDefaults);
      return { templateDefaults };
    });
  },

  resetFields: () => {
    const state = get();
    const template = getTemplateById(state.selectedTemplateId, state.generatedTemplates);
    if (!template) return;

    const defaultSnapshot = state.templateDefaults[state.selectedTemplateId] || null;
    const nextState = buildStateForTemplate(template, defaultSnapshot);

    set(nextState);
  },

  resetFieldsToOriginal: () => {
    const state = get();
    const template = getTemplateById(state.selectedTemplateId, state.generatedTemplates);
    if (!template) return;

    const nextState = buildStateForTemplate(template);
    set(nextState);
  },
}));
