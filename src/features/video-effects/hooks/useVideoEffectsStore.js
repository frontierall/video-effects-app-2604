import { create } from 'zustand';
import { TEMPLATES } from '../data/videoEffectTemplates';
import { createTextObject } from '../utils/videoEffectsTextObjects';

function buildDefaultValues(template) {
  if (!template) return {};
  return Object.fromEntries(
    template.fields.map(f => [f.id, f.default])
  );
}

function getDefaultTextColor(fieldValues = {}) {
  return fieldValues.textColor || fieldValues.accentColor || '#ffffff';
}

export const useVideoEffectsStore = create((set, get) => ({
  selectedTemplateId: TEMPLATES[0].id,
  fieldValues: buildDefaultValues(TEMPLATES[0]),
  textObjects: [],
  motionBlurEnabled: true,
  uploadedImage: null,
  typeFilter: 'all', // 'all' | 'intro' | 'outro' | 'lower-third'
  durationOverride: null, // ms, null이면 템플릿 기본값 사용
  generatedTemplates: [],

  setTypeFilter: (typeFilter) => set({ typeFilter }),
  setMotionBlurEnabled: (motionBlurEnabled) => set({ motionBlurEnabled }),
  setUploadedImage: (image) => set({ uploadedImage: image }),
  setDurationOverride: (ms) => set({ durationOverride: ms }),

  addGeneratedTemplate: (template) => {
    set(state => {
      if (state.generatedTemplates.find(t => t.id === template.id)) return {};
      return { generatedTemplates: [...state.generatedTemplates, template] };
    });
  },

  removeGeneratedTemplate: (id) => {
    set(state => ({
      generatedTemplates: state.generatedTemplates.filter(t => t.id !== id),
      selectedTemplateId:
        state.selectedTemplateId === id ? TEMPLATES[0].id : state.selectedTemplateId,
      fieldValues:
        state.selectedTemplateId === id ? buildDefaultValues(TEMPLATES[0]) : state.fieldValues,
    }));
  },

  selectTemplate: (id) => {
    const template = TEMPLATES.find(t => t.id === id);
    if (!template) return;
    const fieldValues = buildDefaultValues(template);
    set({
      selectedTemplateId: id,
      fieldValues,
      textObjects: [],
      uploadedImage: null,
      durationOverride: null,
    });
  },

  selectGeneratedTemplate: (id) => {
    const template = get().generatedTemplates.find(t => t.id === id);
    if (!template) return;
    const fieldValues = buildDefaultValues(template);
    set({
      selectedTemplateId: id,
      fieldValues,
      textObjects: [],
      durationOverride: null,
    });
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
    set((state) => ({
      textObjects: state.textObjects.map((item) => (
        item.id === id ? { ...item, [key]: value } : item
      )),
    }));
  },

  removeTextObject: (id) => {
    set((state) => ({
      textObjects: state.textObjects.filter((item) => item.id !== id),
    }));
  },

  resetFields: () => {
    const { selectedTemplateId } = get();
    const template = TEMPLATES.find(t => t.id === selectedTemplateId);
    const fieldValues = buildDefaultValues(template);
    set({
      fieldValues,
      textObjects: [],
    });
  },
}));
