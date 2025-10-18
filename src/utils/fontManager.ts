import { useEffect, useState } from 'react';

export type FontWeight = 300 | 400 | 500 | 600 | 700 | 800 | 900;

export interface FontConfig {
  family: string;
  weights: FontWeight[];
  fallback: string[];
}

export const BIGBESTY_FONT_CONFIG: FontConfig = {
  family: 'Bigbesty',
  weights: [400],
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
};

export function getFontFamily(config: FontConfig = BIGBESTY_FONT_CONFIG): string {
  return `'${config.family}', ${config.fallback.join(', ')}`;
}

export function applyFont(element: HTMLElement, config: FontConfig = BIGBESTY_FONT_CONFIG): void {
  element.style.fontFamily = getFontFamily(config);
}

export function applyGlobalFont(config: FontConfig = BIGBESTY_FONT_CONFIG): void {
  document.documentElement.style.setProperty('font-family', getFontFamily(config));
  document.body.style.fontFamily = getFontFamily(config);
}

export async function checkFontLoaded(fontFamily: string = 'Bigbesty'): Promise<boolean> {
  if ('fonts' in document) {
    try {
      await document.fonts.load(`1em ${fontFamily}`);
      return document.fonts.check(`1em ${fontFamily}`);
    } catch {
      return false;
    }
  }
  return false;
}

export function useFontLoader(config: FontConfig = BIGBESTY_FONT_CONFIG) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    checkFontLoaded(config.family)
      .then((isLoaded) => {
        setLoaded(isLoaded);
        if (isLoaded) {
          console.log(`✓ Font ${config.family} caricato con successo`);
          applyGlobalFont(config);
        } else {
          console.warn(`⚠ Font ${config.family} non trovato, usando fallback`);
        }
      })
      .catch((err) => {
        const errorObj = err instanceof Error ? err : new Error('Font loading failed');
        setError(errorObj);
        console.error(`✗ Errore caricamento font ${config.family}:`, errorObj);
      });
  }, [config.family]);

  return { loaded, error };
}

export default BIGBESTY_FONT_CONFIG;