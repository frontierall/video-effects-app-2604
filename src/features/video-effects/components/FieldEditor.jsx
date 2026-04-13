import { useVideoEffectsStore } from '../hooks/useVideoEffectsStore';
import { getTemplateById } from '../utils/templateLibrary';

function LogoUpload({ uploadedImage, onUpload }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      onUpload({
        url: event.target.result,
        name: file.name,
        type: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        채널 로고 / 이미지
      </label>
      <div className="flex items-center gap-4">
        {uploadedImage ? (
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <img src={uploadedImage.url} alt="Logo Preview" className="w-full h-full object-contain" />
            <button 
              onClick={() => onUpload(null)}
              className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg hover:bg-red-600 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-xl border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center bg-white dark:bg-gray-800 text-gray-300">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <label className="flex-1">
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <div className="cursor-pointer py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-bold text-center hover:border-red-400 transition-all bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm active:scale-[0.98]">
            {uploadedImage ? '이미지 변경' : '브랜드 로고 업로드'}
          </div>
        </label>
      </div>
    </div>
  );
}

export function FieldEditor() {
  const {
    selectedTemplateId,
    fieldValues,
    textObjects,
    setFieldValue,
    addTextObject,
    updateTextObject,
    removeTextObject,
    resetFields,
    resetFieldsToOriginal,
    uploadedImage,
    setUploadedImage,
    generatedTemplates,
    presets,
    saveCurrentAsPreset,
    applyPreset,
    deletePreset,
    saveCurrentAsTemplateDefault,
    clearTemplateDefault,
    templateDefaults,
  } = useVideoEffectsStore();
  
  const template = getTemplateById(selectedTemplateId, generatedTemplates);
  const relatedPresets = presets.filter(preset => preset.templateId === selectedTemplateId);
  const hasTemplateDefault = Boolean(templateDefaults[selectedTemplateId]);
  if (!template) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <section className="space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">프리셋</h4>
                <p className="text-[11px] text-gray-400 mt-1">현재 설정을 이름으로 저장하고 다시 불러옵니다.</p>
              </div>
              <button
                onClick={() => {
                  const name = window.prompt('프리셋 이름을 입력하세요.');
                  if (name) saveCurrentAsPreset(name);
                }}
                className="px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold transition-colors"
              >
                현재 설정 저장
              </button>
            </div>
            {relatedPresets.length > 0 ? (
              <div className="space-y-2">
                {relatedPresets.map(preset => (
                  <div key={preset.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{preset.name}</p>
                      <p className="text-[10px] text-gray-400">저장된 설정 재적용</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => applyPreset(preset.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-red-300 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-bold transition-all"
                      >
                        불러오기
                      </button>
                      <button
                        onClick={() => deletePreset(preset.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 text-[10px] font-bold transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400">이 템플릿에 저장된 프리셋이 없습니다.</p>
            )}
          </div>

          <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">내 기본값</h4>
                <p className="text-[11px] text-gray-400 mt-1">이 템플릿을 다시 선택할 때 기본으로 적용할 설정입니다.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={saveCurrentAsTemplateDefault}
                className="px-3 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[11px] font-bold transition-colors"
              >
                내 기본값으로 저장
              </button>
              {hasTemplateDefault && (
                <>
                  <button
                    onClick={resetFields}
                    className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:border-red-400 transition-colors"
                  >
                    내 기본값으로 복원
                  </button>
                  <button
                    onClick={() => clearTemplateDefault(selectedTemplateId)}
                    className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-[11px] font-bold text-gray-500 hover:text-red-500 transition-colors"
                  >
                    내 기본값 삭제
                  </button>
                </>
              )}
              <button
                onClick={resetFieldsToOriginal}
                className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:border-red-400 transition-colors"
              >
                원본 기본값으로 초기화
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 1. 로고 업로드 */}
      <section>
        <LogoUpload uploadedImage={uploadedImage} onUpload={setUploadedImage} />
      </section>

      {/* 2. 템플릿 기본 필드 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">기본 속성</h4>
          <div className="flex items-center gap-3">
            {hasTemplateDefault && (
              <button onClick={resetFields} className="text-[10px] text-gray-400 hover:text-red-500 font-bold transition-colors">
                내 기본값 복원
              </button>
            )}
            <button onClick={resetFieldsToOriginal} className="text-[10px] text-gray-400 hover:text-red-500 font-bold transition-colors">
              원본 초기화
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {template.fields.map(field => (
            <div key={field.id} className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400">
                {field.label}
              </label>

              {field.type === 'text' && (
                <input
                  type="text"
                  value={fieldValues[field.id] ?? field.default}
                  onChange={e => setFieldValue(field.id, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400/50 transition-all"
                />
              )}

              {field.type === 'color' && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fieldValues[field.id] ?? field.default}
                    onChange={e => setFieldValue(field.id, e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer bg-white dark:bg-gray-700 p-1"
                  />
                  <input
                    type="text"
                    value={fieldValues[field.id] ?? field.default}
                    onChange={e => {
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setFieldValue(field.id, v);
                    }}
                    className="flex-1 px-3 py-2 text-xs font-mono border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    maxLength={7}
                  />
                </div>
              )}

              {field.type === 'number' && (
                <input
                  type="number"
                  value={fieldValues[field.id] ?? field.default}
                  onChange={e => setFieldValue(field.id, e.target.value)}
                  min={field.min ?? 1}
                  max={field.max ?? 99}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400/50"
                />
              )}

              {field.type === 'select' && (
                <select
                  value={fieldValues[field.id] ?? field.default}
                  onChange={e => setFieldValue(field.id, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400/50"
                >
                  {field.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 3. 추가 텍스트 객체 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">추가 자막</h4>
          <button
            onClick={addTextObject}
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-red-500 hover:text-white text-gray-600 dark:text-gray-300 text-[11px] font-bold transition-all active:scale-[0.95]"
          >
            + 텍스트 추가
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {textObjects.map((item, index) => (
            <div
              key={item.id}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-white dark:bg-gray-800/50 shadow-sm relative group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-red-500 uppercase">Layer {index + 1}</span>
                <button
                  onClick={() => removeTextObject(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <input
                type="text"
                value={item.text}
                onChange={(e) => updateTextObject(item.id, 'text', e.target.value)}
                className="w-full px-0 py-1 text-sm border-b border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-400 transition-colors"
                placeholder="내용 입력..."
              />

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Size</span>
                    <span className="text-[10px] text-gray-400">{Math.round((Number(item.size) || 0.05) * 100)}%</span>
                  </div>
                  <input
                    type="range" min={0.02} max={0.16} step={0.005} value={item.size}
                    onChange={(e) => updateTextObject(item.id, 'size', Number(e.target.value))}
                    className="w-full h-1 appearance-none bg-gray-200 dark:bg-gray-700 rounded-full accent-red-500"
                  />
                </div>
                <input
                  type="color" value={item.color}
                  onChange={(e) => updateTextObject(item.id, 'color', e.target.value)}
                  className="w-8 h-8 rounded-full border-none cursor-pointer p-0 overflow-hidden"
                />
              </div>
            </div>
          ))}
        </div>
        {textObjects.length === 0 && (
          <p className="text-[11px] text-gray-400 text-center py-4">추가 자막 레이어가 없습니다.</p>
        )}
      </section>
    </div>
  );
}
