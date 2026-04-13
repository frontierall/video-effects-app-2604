import { useState } from 'react';
import { TemplateSelector } from '../features/video-effects/components/TemplateSelector';
import { FieldEditor } from '../features/video-effects/components/FieldEditor';
import { CanvasPreview } from '../features/video-effects/components/CanvasPreview';
import { ExportPanel } from '../features/video-effects/components/ExportPanel';
import { AITemplateGenerator } from '../features/video-effects/components/AITemplateGenerator';
import { AudioPanel } from '../features/video-effects/components/AudioPanel';

export function VideoEffectsTab() {
  const [activeTab, setActiveTab] = useState('design'); // 'design' | 'ai' | 'music' | 'export'

  const tabs = [
    { id: 'design', label: '🎨 디자인', desc: '텍스트, 색상, 로고 설정' },
    { id: 'ai',     label: '✨ AI 생성', desc: '자연어로 새 효과 만들기' },
    { id: 'music',  label: '🎵 음악',   desc: '배경 음악 업로드/검색' },
    { id: 'export', label: '💾 내보내기', desc: '최종 MP4 파일 다운로드' },
  ];

  return (
    <div className="pb-12 space-y-10">
      <section>
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
              <span className="w-7 h-7 bg-red-500 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-lg shadow-red-500/20">
                1
              </span>
              영상 효과 제작 (템플릿)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              전문적인 비주얼과 사운드가 조화된 영상 소스를 만듭니다.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          {/* 왼쪽: 템플릿 라이브러리 */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-3xl border dark:border-gray-700 p-4 shadow-sm h-full">
              <TemplateSelector />
            </div>
          </div>

          {/* 오른쪽: 작업 공간 */}
          <div className="space-y-6">
            {/* 상단: 미리보기 컨테이너 */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border dark:border-gray-700 p-5 shadow-sm overflow-hidden">
              <CanvasPreview />
            </div>

            {/* 하단: 컨트롤 센터 (탭 방식) */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border dark:border-gray-700 shadow-sm overflow-hidden min-h-[480px]">
              {/* 탭 헤더 */}
              <div className="flex border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-4 px-2 text-center transition-all relative ${
                      activeTab === tab.id
                        ? 'text-red-500 font-bold bg-white dark:bg-gray-800'
                        : 'text-gray-500 dark:text-gray-400 font-medium hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    <div className="text-sm">{tab.label}</div>
                    <div className="text-[10px] opacity-60 font-normal mt-0.5 hidden sm:block">
                      {tab.desc}
                    </div>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
                    )}
                  </button>
                ))}
              </div>

              {/* 탭 내용 */}
              <div className="p-6">
                {activeTab === 'design' && <FieldEditor />}
                {activeTab === 'ai'     && <AITemplateGenerator />}
                {activeTab === 'music'  && <AudioPanel />}
                {activeTab === 'export' && <ExportPanel />}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
