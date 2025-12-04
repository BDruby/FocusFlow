// Utility functions for text processing

export const countWords = (text: string): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
};
