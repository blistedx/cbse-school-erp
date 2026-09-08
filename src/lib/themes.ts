/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
export interface AntigravityTheme {
  id: string;
  name: string;
  category: 'Classic' | 'Dark' | 'Vibrant' | 'Minimal';
  description: string;
  isDark: boolean;
  colors: {
    primary: string;         // Main brand dark e.g. #122A24
    primaryHover: string;    // Hover dark e.g. #1C443A
    primaryLight: string;    // Subtle tint e.g. #EBF5EF
    accent: string;          // Vivid accent e.g. #10B981
    accentHover: string;     // Vivid accent hover
    background: string;      // Body canvas e.g. #F4F8F5 or #090D16
    surface: string;         // Card background e.g. #FFFFFF or #1E293B
    surfaceBorder: string;   // Card border e.g. #DCE8E0 or #334155
    textPrimary: string;     // Text main e.g. #122A24 or #F8FAFC
    textSecondary: string;   // Text muted e.g. #2D5A4E or #94A3B8
    heroGradient: string;    // Banner gradient
  };
}

export const ANTIGRAVITY_THEMES: AntigravityTheme[] = [
  {
    id: 'emerald',
    name: 'Default (Emerald Heritage)',
    category: 'Classic',
    description: 'The iconic Deep Emerald & Mint Green chalkboard heritage aesthetic (Default).',
    isDark: false,
    colors: {
      primary: '#122A24',
      primaryHover: '#1C443A',
      primaryLight: '#EBF5EF',
      accent: '#10B981',
      accentHover: '#059669',
      background: '#F4F8F5',
      surface: '#FFFFFF',
      surfaceBorder: '#DCE8E0',
      textPrimary: '#122A24',
      textSecondary: '#2D5A4E',
      heroGradient: 'linear-gradient(135deg, #122A24 0%, #1C443A 100%)'
    }
  },
  {
    id: 'monochrome',
    name: 'Black & White (Monochrome)',
    category: 'Minimal',
    description: 'Ultra-clean high-contrast Pitch Black & Crisp White editorial aesthetic.',
    isDark: false,
    colors: {
      primary: '#09090B',
      primaryHover: '#18181B',
      primaryLight: '#F4F4F5',
      accent: '#09090B',
      accentHover: '#27272A',
      background: '#F8F9FA',
      surface: '#FFFFFF',
      surfaceBorder: '#E4E4E7',
      textPrimary: '#09090B',
      textSecondary: '#52525B',
      heroGradient: 'linear-gradient(135deg, #09090B 0%, #27272A 100%)'
    }
  }
];

export const getThemeById = (id?: string): AntigravityTheme => {
  return ANTIGRAVITY_THEMES.find(t => t.id === id) || ANTIGRAVITY_THEMES[0];
};

export const getSavedThemeId = (): string => {
  if (typeof window === 'undefined') return 'emerald';
  const saved = localStorage.getItem('antigravity_erp_theme');
  return saved === 'monochrome' ? 'monochrome' : 'emerald';
};

export const applyAntigravityTheme = (themeId: string) => {
  if (typeof document === 'undefined') return;
  const effectiveId = themeId === 'monochrome' ? 'monochrome' : 'emerald';
  const theme = getThemeById(effectiveId);
  const root = document.documentElement;
  const body = document.body;
  
  const properties: Record<string, string> = {
    '--board-1': theme.colors.primary,
    '--board-2': theme.colors.primaryHover,
    '--parchment': theme.colors.background,
    '--paper-white': theme.colors.surface,
    '--text-dark': theme.colors.textPrimary,
    '--theme-accent': theme.colors.accent,
    '--theme-accent-hover': theme.colors.accentHover,
    '--theme-accent-light': theme.colors.primaryLight,
    '--theme-border': theme.colors.surfaceBorder,
    '--theme-text-muted': theme.colors.textSecondary,
    '--ink-navy': theme.id === 'monochrome' ? '#09090B' : '#16233F',
    '--red-pen': theme.id === 'monochrome' ? '#18181B' : '#C4432B',
  };

  Object.entries(properties).forEach(([k, v]) => {
    root.style.setProperty(k, v);
    if (body) body.style.setProperty(k, v);
  });

  root.setAttribute('data-theme', theme.id);
  if (body) body.setAttribute('data-theme', theme.id);

  // Both supported themes are crisp light-canvas themes; remove stale dark mode classes
  root.classList.remove('dark');
  if (body) body.classList.remove('dark');

  localStorage.setItem('antigravity_erp_theme', theme.id);
};
