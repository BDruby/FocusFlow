export enum ThemeType {
  LIGHT = 'light',
  SEPIA = 'sepia',
  DARK = 'dark',
  MINT = 'mint'
}

export enum FontType {
  SANS = 'sans',
  SERIF = 'serif',
  MONO = 'mono',
  COMIC = 'comic' // Often cited as readable for some
}

export interface ReadingSettings {
  theme: ThemeType;
  font: FontType;
  fontSize: number; // in px
  lineHeight: number; // multiplier
  letterSpacing: number; // in px
  wordSpacing: number; // in px
  bionicEnabled: boolean;
  bionicStrength: number; // 1-3, determines how many chars are bolded
  readingRulerEnabled: boolean;
  columnWidth: number; // max-width in ch or px
}

export interface ProcessingState {
  isSummarizing: boolean;
  isSpeaking: boolean;
  isSimplifying: boolean;
}
