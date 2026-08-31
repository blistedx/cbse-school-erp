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
    name: 'Antigravity Emerald Forest',
    category: 'Classic',
    description: 'The iconic Deep Emerald & Mint Green chalkboard heritage aesthetic.',
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
    id: 'midnight',
    name: 'Antigravity Midnight Obsidian',
    category: 'Dark',
    description: 'Sleek Cyberpunk Dark Mode with glowing Cyan and deep slate panels.',
    isDark: true,
    colors: {
      primary: '#0B1120',
      primaryHover: '#1E293B',
      primaryLight: '#1E293B',
      accent: '#06B6D4',
      accentHover: '#0891B2',
      background: '#040711',
      surface: '#0F172A',
      surfaceBorder: '#1E293B',
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
      heroGradient: 'linear-gradient(135deg, #0B1120 0%, #0369A1 100%)'
    }
  },
  {
    id: 'sapphire',
    name: 'Antigravity Royal Sapphire',
    category: 'Vibrant',
    description: 'Executive Cobalt & Electric Royal Blue for modern institutional governance.',
    isDark: false,
    colors: {
      primary: '#0B1E3B',
      primaryHover: '#1E3A8A',
      primaryLight: '#EFF6FF',
      accent: '#2563EB',
      accentHover: '#1D4ED8',
      background: '#F0F4F8',
      surface: '#FFFFFF',
      surfaceBorder: '#D8E2ED',
      textPrimary: '#0B1E3B',
      textSecondary: '#334155',
      heroGradient: 'linear-gradient(135deg, #0B1E3B 0%, #1D4ED8 100%)'
    }
  },
  {
    id: 'amethyst',
    name: 'Antigravity Amethyst Nebula',
    category: 'Vibrant',
    description: 'Majestic Royal Violet and Neon Lavender for visionary leadership.',
    isDark: false,
    colors: {
      primary: '#2E1065',
      primaryHover: '#4C1D95',
      primaryLight: '#FAF5FF',
      accent: '#9333EA',
      accentHover: '#7E22CE',
      background: '#F8F5FC',
      surface: '#FFFFFF',
      surfaceBorder: '#E9D5FF',
      textPrimary: '#2E1065',
      textSecondary: '#581C87',
      heroGradient: 'linear-gradient(135deg, #2E1065 0%, #7E22CE 100%)'
    }
  },
  {
    id: 'crimson',
    name: 'Antigravity Crimson Velvet',
    category: 'Classic',
    description: 'Prestigious Burgundy Red and Rose Gold for heritage institutions.',
    isDark: false,
    colors: {
      primary: '#4C0519',
      primaryHover: '#881337',
      primaryLight: '#FFF1F2',
      accent: '#E11D48',
      accentHover: '#BE123C',
      background: '#FCF8F9',
      surface: '#FFFFFF',
      surfaceBorder: '#FECDD3',
      textPrimary: '#4C0519',
      textSecondary: '#881337',
      heroGradient: 'linear-gradient(135deg, #4C0519 0%, #9F1239 100%)'
    }
  },
  {
    id: 'sunset',
    name: 'Antigravity Sunset Terracotta',
    category: 'Vibrant',
    description: 'Warm Bronze, Amber Glow, and Terracotta tones inspired by desert sunsets.',
    isDark: false,
    colors: {
      primary: '#431407',
      primaryHover: '#7C2D12',
      primaryLight: '#FFF7ED',
      accent: '#EA580C',
      accentHover: '#C2410C',
      background: '#FAF7F4',
      surface: '#FFFFFF',
      surfaceBorder: '#FED7AA',
      textPrimary: '#431407',
      textSecondary: '#7C2D12',
      heroGradient: 'linear-gradient(135deg, #431407 0%, #C2410C 100%)'
    }
  },
  {
    id: 'nordic',
    name: 'Antigravity Nordic Frost',
    category: 'Minimal',
    description: 'Clean Scandinavian Titanium Slate & Glacial Teal for ultra-crisp clarity.',
    isDark: false,
    colors: {
      primary: '#0F172A',
      primaryHover: '#334155',
      primaryLight: '#F0FDFA',
      accent: '#0D9488',
      accentHover: '#0F766E',
      background: '#F1F5F9',
      surface: '#FFFFFF',
      surfaceBorder: '#CBD5E1',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      heroGradient: 'linear-gradient(135deg, #0F172A 0%, #0D9488 100%)'
    }
  },
  {
    id: 'cyberpunk',
    name: 'Antigravity Cyberpunk Neon',
    category: 'Dark',
    description: 'Deep Void Purple with Hot Pink & Neon Violet high-contrast accents.',
    isDark: true,
    colors: {
      primary: '#180033',
      primaryHover: '#2E0854',
      primaryLight: '#2E0854',
      accent: '#F43F5E',
      accentHover: '#E11D48',
      background: '#090014',
      surface: '#150029',
      surfaceBorder: '#38006B',
      textPrimary: '#FFFFFF',
      textSecondary: '#C084FC',
      heroGradient: 'linear-gradient(135deg, #180033 0%, #BE123C 100%)'
    }
  },
  {
    id: 'solarized',
    name: 'Antigravity Solarized Cream',
    category: 'Minimal',
    description: 'Warm Sandstone, Ochre Amber, and Espresso for comforting readability.',
    isDark: false,
    colors: {
      primary: '#292524',
      primaryHover: '#44403C',
      primaryLight: '#FEF3C7',
      accent: '#D97706',
      accentHover: '#B45309',
      background: '#F7F5F0',
      surface: '#FFFFFF',
      surfaceBorder: '#E7E5E4',
      textPrimary: '#292524',
      textSecondary: '#57534E',
      heroGradient: 'linear-gradient(135deg, #292524 0%, #78350F 100%)'
    }
  }
];

export const getThemeById = (id?: string): AntigravityTheme => {
  return ANTIGRAVITY_THEMES.find(t => t.id === id) || ANTIGRAVITY_THEMES[0];
};

export const applyAntigravityTheme = (themeId: string) => {
  if (typeof document === 'undefined') return;
  const theme = getThemeById(themeId);
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
    '--theme-text-muted': theme.colors.textSecondary
  };

  Object.entries(properties).forEach(([k, v]) => {
    root.style.setProperty(k, v);
    if (body) body.style.setProperty(k, v);
  });

  root.setAttribute('data-theme', theme.id);
  if (body) body.setAttribute('data-theme', theme.id);

  if (theme.isDark) {
    root.classList.add('dark');
    if (body) body.classList.add('dark');
  } else {
    root.classList.remove('dark');
    if (body) body.classList.remove('dark');
  }

  localStorage.setItem('antigravity_erp_theme', theme.id);
};
