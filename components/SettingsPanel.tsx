import React from 'react';
import { ReadingSettings, ThemeType, FontType } from '../types';
import { Settings, Type, LayoutTemplate, Palette, Eye, MoveHorizontal } from 'lucide-react';

interface SettingsPanelProps {
  settings: ReadingSettings;
  onChange: (newSettings: ReadingSettings) => void;
  className?: string;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onChange, className }) => {
  
  const update = (key: keyof ReadingSettings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-8 ${className}`}>
      
      {/* Theme Selection */}
      <div className="space-y-3">
        <h3 className="flex items-center text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <Palette className="w-4 h-4 mr-2" /> Theme / 主题
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: ThemeType.LIGHT, bg: 'bg-white', border: 'border-gray-200', label: 'Light 亮色' },
            { id: ThemeType.SEPIA, bg: 'bg-[#F4ECD8]', border: 'border-[#E4DCC8]', label: 'Sepia 护眼' },
            { id: ThemeType.DARK, bg: 'bg-[#1a202c]', border: 'border-gray-700', label: 'Dark 暗色' },
            { id: ThemeType.MINT, bg: 'bg-[#E0F2F1]', border: 'border-[#B2DFDB]', label: 'Mint 薄荷' },
          ].map((theme) => (
            <button
              key={theme.id}
              onClick={() => update('theme', theme.id)}
              className={`h-12 rounded-lg border-2 ${theme.bg} ${theme.border} ${
                settings.theme === theme.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
              } transition-all duration-200 flex items-center justify-center`}
              aria-label={theme.label}
              title={theme.label}
            >
              {settings.theme === theme.id && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
            </button>
          ))}
        </div>
      </div>

      {/* Font Settings */}
      <div className="space-y-3">
        <h3 className="flex items-center text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <Type className="w-4 h-4 mr-2" /> Typography / 字体
        </h3>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
           {[
             { id: FontType.SANS, label: 'Sans 无衬线' },
             { id: FontType.SERIF, label: 'Serif 衬线' },
             { id: FontType.MONO, label: 'Mono 等宽' },
             { id: FontType.COMIC, label: 'Friendly 友好' },
           ].map(font => (
             <button
                key={font.id}
                onClick={() => update('font', font.id)}
                className={`px-3 py-2 text-sm rounded-md border ${
                  settings.font === font.id 
                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300' 
                    : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
             >
               {font.label}
             </button>
           ))}
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Size 大小</span>
              <span>{settings.fontSize}px</span>
            </div>
            <input 
              type="range" min="14" max="32" 
              value={settings.fontSize} 
              onChange={(e) => update('fontSize', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-500"
            />
          </div>
          
          <div className="space-y-1">
             <div className="flex justify-between text-xs text-gray-500">
              <span>Spacing 间距</span>
              <span>{settings.letterSpacing}px</span>
            </div>
             <input 
              type="range" min="0" max="3" step="0.5"
              value={settings.letterSpacing} 
              onChange={(e) => update('letterSpacing', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Focus Tools */}
      <div className="space-y-3">
        <h3 className="flex items-center text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <Eye className="w-4 h-4 mr-2" /> Focus Tools / 专注工具
        </h3>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex-grow" htmlFor="bionic-toggle">
            Bionic Reading <br/><span className="text-xs text-gray-500">仿生阅读 (加粗词首)</span>
          </label>
          <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
            <input 
              type="checkbox" 
              name="bionic-toggle" 
              id="bionic-toggle" 
              checked={settings.bionicEnabled}
              onChange={(e) => update('bionicEnabled', e.target.checked)}
              className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-5 checked:border-blue-500"
              style={{ top: '2px', left: '2px', borderColor: settings.bionicEnabled ? '#3b82f6' : '#d1d5db' }}
            />
             <label htmlFor="bionic-toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.bionicEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}></label>
          </div>
        </div>
        
        {settings.bionicEnabled && (
           <div className="pl-2 pr-2">
             <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Strength 强度</span>
             </div>
             <input 
                type="range" min="1" max="3" 
                value={settings.bionicStrength} 
                onChange={(e) => update('bionicStrength', Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-500"
              />
           </div>
        )}

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mt-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex-grow" htmlFor="ruler-toggle">
            Reading Ruler <br/><span className="text-xs text-gray-500">阅读尺 (鼠标跟随)</span>
          </label>
          <input 
            type="checkbox" 
            id="ruler-toggle"
            checked={settings.readingRulerEnabled}
            onChange={(e) => update('readingRulerEnabled', e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
          />
        </div>
      </div>

       {/* Layout */}
       <div className="space-y-3">
        <h3 className="flex items-center text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <LayoutTemplate className="w-4 h-4 mr-2" /> Layout / 布局
        </h3>
        <div className="space-y-1">
           <div className="flex justify-between text-xs text-gray-500">
              <span>Width 宽度</span>
              <span>Narrow 窄 &nbsp;&nbsp;&nbsp; Wide 宽</span>
            </div>
             <input 
              type="range" min="40" max="100" 
              value={settings.columnWidth / 10} // simplistic mapping
              onChange={(e) => update('columnWidth', Number(e.target.value) * 10)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-500"
            />
        </div>
       </div>

    </div>
  );
};

export default SettingsPanel;