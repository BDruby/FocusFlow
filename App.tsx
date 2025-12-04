import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Upload, Play, Pause, FileText, Wand2, ArrowLeft, Loader2, Volume2, AlignLeft } from 'lucide-react';
import SettingsPanel from './components/SettingsPanel';
import Reader from './components/Reader';
import ReadingRuler from './components/ReadingRuler';
import { ReadingSettings, ThemeType, FontType, ProcessingState } from './types';
import { summarizeText, simplifyText, generateSpeech } from './services/geminiService';

const DEFAULT_TEXT = `Welcome to FocusFlow Reader.
欢迎使用 FocusFlow 阅读器。

This tool is designed to make reading easier, especially for neurodivergent minds. You can paste your own text here, or upload a text file.
这个工具旨在让阅读变得更轻松，特别是为了帮助多动症（ADHD）人群。您可以在此粘贴文本，或上传文本文件。

Try the "Bionic Reading" mode in the settings to highlight the start of words, which guides your eye. You can also change the colors, font size, and spacing to suit your preferences.
尝试设置中的“仿生阅读”模式，它通过高亮单词的开头来引导您的视线。您还可以更改颜色、字体大小和间距。

Use the AI tools to summarize long articles or simplify complex language. We hope this helps you focus and enjoy reading!
使用 AI 工具来总结长文章或简化复杂的语言。希望这对您的专注阅读有所帮助！`;

// Helper to decode raw PCM data from Gemini
const decodeAudioData = (
    data: ArrayBuffer,
    ctx: AudioContext,
    sampleRate: number = 24000
): AudioBuffer => {
    const pcmData = new Int16Array(data);
    const float32Data = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
        // Convert Int16 to Float32 [-1.0, 1.0]
        float32Data[i] = pcmData[i] / 32768.0;
    }
    
    const buffer = ctx.createBuffer(1, float32Data.length, sampleRate);
    buffer.copyToChannel(float32Data, 0);
    return buffer;
};

const App: React.FC = () => {
  const [text, setText] = useState<string>(DEFAULT_TEXT);
  const [viewMode, setViewMode] = useState<'input' | 'read'>('input');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ReadingSettings>({
    theme: ThemeType.LIGHT,
    font: FontType.SANS,
    fontSize: 20,
    lineHeight: 1.8,
    letterSpacing: 0.5,
    wordSpacing: 2,
    bionicEnabled: true,
    bionicStrength: 2,
    readingRulerEnabled: false,
    columnWidth: 800,
  });

  const [processing, setProcessing] = useState<ProcessingState>({
    isSummarizing: false,
    isSpeaking: false,
    isSimplifying: false,
  });

  // Audio Context Refs for Raw PCM Playback
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup audio on unmount or text change
  useEffect(() => {
    return () => stopAudio();
  }, [text, viewMode]);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      audioSourceRef.current = null;
    }
    
    // Do not close AudioContext, reuse it or suspend it. 
    // Suspending is good practice if not used, but keeping it open is simpler for this demo.
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend();
    }

    setProcessing(prev => ({ ...prev, isSpeaking: false }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setText(content);
        setViewMode('read');
      };
      reader.readAsText(file);
    }
  };

  const handleSummarize = async () => {
    setProcessing(p => ({ ...p, isSummarizing: true }));
    try {
      const summary = await summarizeText(text);
      setText(summary); 
      setViewMode('read');
    } catch (err) {
      alert("Failed to summarize. Check API Key. \n总结失败，请检查API Key。");
    } finally {
      setProcessing(p => ({ ...p, isSummarizing: false }));
    }
  };

  const handleSimplify = async () => {
    setProcessing(p => ({ ...p, isSimplifying: true }));
    try {
      const simplified = await simplifyText(text);
      setText(simplified);
      setViewMode('read');
    } catch (err) {
      alert("Failed to simplify. Check API Key. \n简化失败，请检查API Key。");
    } finally {
      setProcessing(p => ({ ...p, isSimplifying: false }));
    }
  };

  const handleTTS = async () => {
    if (processing.isSpeaking) {
      stopAudio();
      return;
    }

    setProcessing(p => ({ ...p, isSpeaking: true }));
    
    try {
      // 1. Initialize AudioContext if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      } else if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // 2. Fetch PCM Data
      const pcmBuffer = await generateSpeech(text);
      
      // 3. Decode PCM to AudioBuffer
      const audioBuffer = decodeAudioData(pcmBuffer, audioContextRef.current, 24000);

      // 4. Play
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setProcessing(p => ({ ...p, isSpeaking: false }));
        audioSourceRef.current = null;
      };

      source.start(0);
      audioSourceRef.current = source;

    } catch (err) {
      console.error(err);
      alert("Failed to generate speech. \n语音生成失败。");
      setProcessing(p => ({ ...p, isSpeaking: false }));
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${settings.theme === ThemeType.DARK ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b transition-colors duration-300
        ${settings.theme === ThemeType.DARK ? 'bg-gray-900 border-gray-800 text-white' : 
          settings.theme === ThemeType.SEPIA ? 'bg-[#F4ECD8] border-[#E4DCC8] text-[#5B4636]' :
          settings.theme === ThemeType.MINT ? 'bg-[#E0F2F1] border-[#B2DFDB] text-[#263238]' :
          'bg-white border-gray-200 text-gray-800'
        }`}>
        
        <div className="flex items-center gap-3">
           {viewMode === 'read' && (
             <button 
               onClick={() => setViewMode('input')}
               className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
               title="Back to Input / 返回"
             >
               <ArrowLeft className="w-5 h-5" />
             </button>
           )}
           <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
             <span className="bg-blue-600 text-white p-1 rounded-md"><AlignLeft className="w-4 h-4"/></span>
             FocusFlow
           </h1>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'read' && (
            <>
               <button 
                onClick={handleTTS}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${processing.isSpeaking 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300' 
                    : 'bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20'}`}
              >
                {processing.isSpeaking ? (
                   <Pause className="w-4 h-4" />
                ) : (
                   <Volume2 className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                    {processing.isSpeaking ? 'Stop / 停止' : 'Listen / 朗读'}
                </span>
              </button>

              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
                aria-label="Settings"
                title="Settings / 设置"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Settings Sidebar / Drawer */}
      {showSettings && viewMode === 'read' && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowSettings(false)}>
           <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
           <div className="relative w-full max-w-sm h-full overflow-y-auto bg-white dark:bg-gray-800 shadow-2xl animate-in slide-in-from-right duration-200" onClick={e => e.stopPropagation()}>
             <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
               <h2 className="font-semibold text-lg dark:text-white">Reading Preferences<br/><span className="text-sm font-normal text-gray-500">阅读偏好</span></h2>
               <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">Close 关闭</button>
             </div>
             <SettingsPanel settings={settings} onChange={setSettings} className="border-none shadow-none" />
           </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow flex flex-col relative">
        {settings.readingRulerEnabled && viewMode === 'read' && <ReadingRuler />}

        {viewMode === 'input' ? (
          <div className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="text-center space-y-2">
                   <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What would you like to read?<br/><span className="text-lg font-normal text-gray-500">您想阅读什么？</span></h2>
                   <p className="text-gray-500 dark:text-gray-400">Paste your text below or upload a file to get started.<br/>请在下方粘贴文本或上传文件。</p>
                </div>

                <textarea
                  className="w-full h-64 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:border-blue-500 focus:ring-0 transition resize-none text-lg"
                  placeholder="Paste text here... / 在此粘贴文本..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex gap-2">
                     <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition"
                      >
                        <Upload className="w-5 h-5" />
                        <span>Upload File<br/><span className="text-xs">上传文件</span></span>
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept=".txt,.md" 
                        className="hidden" 
                      />
                  </div>

                  <button
                    onClick={() => setViewMode('read')}
                    disabled={!text.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Start Reading<br/><span className="text-xs">开始阅读</span></span>
                  </button>
                </div>

                {text.trim() && (
                   <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-3 justify-center">
                      <button 
                        onClick={handleSummarize}
                        disabled={processing.isSummarizing}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 text-sm font-medium transition"
                      >
                         {processing.isSummarizing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Wand2 className="w-4 h-4"/>}
                         Summarize (AI 总结)
                      </button>
                      
                      <button 
                        onClick={handleSimplify}
                        disabled={processing.isSimplifying}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-900/20 dark:text-teal-300 text-sm font-medium transition"
                      >
                         {processing.isSimplifying ? <Loader2 className="w-4 h-4 animate-spin"/> : <Wand2 className="w-4 h-4"/>}
                         Simplify (简化文本)
                      </button>
                   </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <Reader text={text} settings={settings} />
        )}
      </main>

    </div>
  );
};

export default App;