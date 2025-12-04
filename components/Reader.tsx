import React, { useMemo } from 'react';
import { ReadingSettings, ThemeType, FontType } from '../types';

interface ReaderProps {
  text: string;
  settings: ReadingSettings;
}

// Helper to check for Chinese characters
const isChineseChar = (char: string) => /[\u4e00-\u9fa5]/.test(char);
const hasChinese = (text: string) => /[\u4e00-\u9fa5]/.test(text);

// Bionic Reading Transformation Logic
const transformToBionic = (text: string, strength: number = 2): React.ReactNode[] => {
  if (!text) return [];

  const paragraphs = text.split(/\n+/);

  return paragraphs.map((paragraph, pIndex) => {
    // Chinese Processing Logic
    if (hasChinese(paragraph)) {
       // Use Intl.Segmenter if available (modern browsers), otherwise split by char
       let segments: { segment: string }[] = [];
       if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
         const segmenter = new (Intl as any).Segmenter('zh', { granularity: 'word' });
         segments = Array.from(segmenter.segment(paragraph));
       } else {
         // Fallback: treat each character as a segment if Segmenter not supported
         segments = paragraph.split('').map(c => ({ segment: c }));
       }

       const processedSegments = segments.map((seg, sIndex) => {
         const word = seg.segment;
         if (!word.trim()) return <span key={sIndex}>{word}</span>;

         // If it's a punctuation or symbol, just return it
         if (!isChineseChar(word) && !/\w/.test(word)) {
            return <span key={sIndex}>{word}</span>;
         }

         // Determine bold length. 
         // For Chinese: 1 char -> bold 1 (effectively bold all, maybe too much? let's stick to standard bionic logic)
         // Actually for single char words in Chinese, bolding it makes it pop.
         // 2 chars -> bold 1
         // 3 chars -> bold 2
         // 4 chars -> bold 2
         let boldLength = 1;
         if (word.length >= 2) boldLength = Math.ceil(word.length / 2);
         if (strength === 1) boldLength = 1; // Light
         if (strength === 3) boldLength = Math.ceil(word.length * 0.7); // Strong

         const boldPart = word.substring(0, boldLength);
         const normalPart = word.substring(boldLength);

         return (
           <span key={`${pIndex}-${sIndex}`} className="mr-[1px] inline-block">
             <b className="font-bold text-current opacity-100">{boldPart}</b>
             <span className="opacity-80">{normalPart}</span>
           </span>
         );
       });

       return (
        <p key={pIndex} className="mb-6 last:mb-0 leading-relaxed text-justify">
          {processedSegments}
        </p>
      );
    }

    // English/Latin Processing Logic (Original)
    const words = paragraph.split(' ');
    const processedWords = words.map((word, wIndex) => {
      // Improved regex to handle contractions and international characters
      const match = word.match(/^(\W*)([\w\u00C0-\u017F\u4E00-\u9FFF'-]+)(\W*)$/);

      if (match) {
        const [, prefix, core, suffix] = match;
        
        if (!core) {
           return (
              <span key={`${pIndex}-${wIndex}`} className="mr-[0.25em]">{word} </span>
           );
        }

        let boldLength = 1;
        if (core.length > 3) boldLength = Math.ceil(core.length / 2);
        if (core.length <= 3 && strength >= 2) boldLength = 1; 
        if (strength === 3) boldLength = Math.ceil(core.length * 0.6);

        const boldPart = core.substring(0, boldLength);
        const normalPart = core.substring(boldLength);

        return (
          <span key={`${pIndex}-${wIndex}`} className="inline-block mr-[0.25em]">
            {prefix}
            <b className="font-bold text-current">{boldPart}</b>
            <span className="opacity-90">{normalPart}</span>
            {suffix}{' '}
          </span>
        );
      }
      
      return (
        <span key={`${pIndex}-${wIndex}`} className="mr-[0.25em]">
          {word}{' '}
        </span>
      );
    });

    return (
      <p key={pIndex} className="mb-6 last:mb-0">
        {processedWords}
      </p>
    );
  });
};

const Reader: React.FC<ReaderProps> = ({ text, settings }) => {
  
  const processedContent = useMemo(() => {
    if (settings.bionicEnabled) {
      return transformToBionic(text, settings.bionicStrength);
    }
    // If not bionic, just split by newlines for paragraphs
    return text.split(/\n+/).map((p, i) => (
      <p key={i} className="mb-6 last:mb-0">{p}</p>
    ));
  }, [text, settings.bionicEnabled, settings.bionicStrength]);

  const getThemeStyles = () => {
    switch (settings.theme) {
      case ThemeType.SEPIA:
        return 'bg-[#F4ECD8] text-[#5B4636]';
      case ThemeType.DARK:
        return 'bg-[#1a202c] text-[#e2e8f0]';
      case ThemeType.MINT:
        return 'bg-[#E0F2F1] text-[#263238]';
      case ThemeType.LIGHT:
      default:
        return 'bg-white text-gray-900';
    }
  };

  const getFontFamily = () => {
    switch (settings.font) {
      case FontType.SERIF: return 'font-serif';
      case FontType.MONO: return 'font-mono';
      case FontType.COMIC: return 'font-sans'; 
      case FontType.SANS:
      default: return 'font-sans';
    }
  };

  const fontStyle = settings.font === FontType.COMIC ? { fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' } : {};

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 w-full flex justify-center p-8 md:p-12 ${getThemeStyles()} ${getFontFamily()}`}
      style={{
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
        letterSpacing: `${settings.letterSpacing}px`,
        wordSpacing: `${settings.wordSpacing}px`,
        ...fontStyle
      }}
    >
      <div 
        className="max-w-full transition-all duration-300"
        style={{ maxWidth: `${settings.columnWidth}px` }}
      >
        {processedContent}
      </div>
    </div>
  );
};

export default Reader;