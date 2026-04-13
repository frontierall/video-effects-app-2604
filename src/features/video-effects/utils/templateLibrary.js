import { TEMPLATES } from '../data/videoEffectTemplates';

export function getTemplateById(selectedTemplateId, generatedTemplates = []) {
  return (
    TEMPLATES.find(template => template.id === selectedTemplateId) ||
    generatedTemplates.find(template => template.id === selectedTemplateId) ||
    null
  );
}

export function getAllTemplates(generatedTemplates = []) {
  return [...TEMPLATES, ...generatedTemplates];
}
