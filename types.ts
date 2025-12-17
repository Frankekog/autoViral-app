export type UserTier = 'free' | 'pro';
export type ScriptMode = 'auto' | 'custom';
export type VoiceSource = 'ai' | 'file' | 'record';

export interface User {
  id: string;
  name: string;
  email: string;
  tier: UserTier;
}

export interface ScriptData {
  title: string;
  script: string;
  visualPrompt: string;
  thumbnailPrompt?: string;
  tags: string[];
  captions?: string;
}

export enum AspectRatio {
  SHORTS = '9:16',
  WIDESCREEN = '16:9',
  SQUARE = '1:1',
}

export enum GenerationStatus {
  IDLE = 'idle',
  GENERATING_SCRIPT = 'generating_script',
  GENERATING_ASSETS = 'generating_assets',
  COMPLETE = 'complete',
  ERROR = 'error',
}

export interface GeneratedAssets {
  scriptData: ScriptData | null;
  audioUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
}

export interface GenerationProgress {
  script: boolean;
  audio: boolean;
  video: boolean;
  thumbnail: boolean;
  videoProgressMessage?: string;
}

export interface OptionItem {
  label: string;
  value: string;
  isPro?: boolean;
}

export const DURATION_OPTIONS: OptionItem[] = [
  { label: '30 Seconds', value: '30 seconds' },
  { label: '1 Minute', value: '1 minute' },
  { label: '2 Minutes', value: '2 minutes' },
  { label: '4 Minutes', value: '4 minutes', isPro: true },
  { label: '10 Minutes', value: '10 minutes', isPro: true },
  { label: '30 Minutes', value: '30 minutes', isPro: true },
];

export const VOICE_OPTIONS: OptionItem[] = [
  // Native Gemini Voices
  { label: 'Fenrir (Gemini - Deep Male)', value: 'Fenrir' },
  { label: 'Puck (Gemini - Energetic Male)', value: 'Puck' },
  { label: 'Kore (Gemini - Calm Female)', value: 'Kore' },
  { label: 'Charon (Gemini - Authoritative Male)', value: 'Charon' },
  { label: 'Zephyr (Gemini - Friendly Female)', value: 'Zephyr' },
  // ElevenLabs Style Mappings (Pro)
  { label: 'Adam (ElevenLabs Style - Deep Narrative)', value: 'eleven_adam', isPro: true },
  { label: 'Rachel (ElevenLabs Style - Clear & Calm)', value: 'eleven_rachel', isPro: true },
  { label: 'Antoni (ElevenLabs Style - Well Rounded)', value: 'eleven_antoni', isPro: true },
  { label: 'Bella (ElevenLabs Style - Soft & Friendly)', value: 'eleven_bella', isPro: true },
  { label: 'Josh (ElevenLabs Style - Deep & Resonant)', value: 'eleven_josh', isPro: true },
  // Custom
  { label: 'Custom Voice Name', value: 'custom_voice', isPro: true },
];

export const VISUAL_STYLE_OPTIONS: OptionItem[] = [
  { label: 'Cinematic (High Quality)', value: 'Cinematic, dramatic lighting, high production value, 4k, movie feel', isPro: true },
  { label: 'Documentary (Realistic)', value: 'Realistic, documentary style, natural lighting, handheld camera feel' },
  { label: 'Animated (3D/2D)', value: '3D animation style, vibrant colors, smooth rendering, Pixar-like' },
  { label: 'Fast-Paced (Social)', value: 'High energy, bright lighting, trendy social media aesthetic, dynamic movement' },
  { label: 'Cyberpunk (Futuristic)', value: 'Cyberpunk, neon lights, futuristic, dark atmosphere, high tech', isPro: true },
  { label: 'Minimalist (Clean)', value: 'Minimalist, clean lines, soft lighting, uncluttered composition' },
];

export const CAPTION_FONT_OPTIONS: OptionItem[] = [
  { label: 'Viral Bold (Heavy)', value: 'font-sans font-black uppercase tracking-tight' },
  { label: 'Standard Bold', value: 'font-sans font-bold' },
  { label: 'Clean Regular', value: 'font-sans font-normal' },
  { label: 'Minimal Light', value: 'font-sans font-light tracking-wide' },
  { label: 'Cinematic Serif', value: 'font-serif font-semibold tracking-wide' },
  { label: 'Typewriter (Mono)', value: 'font-mono' },
];

export const CAPTION_COLOR_OPTIONS: OptionItem[] = [
  { label: 'White', value: 'text-white' },
  { label: 'Yellow', value: 'text-yellow-400' },
  { label: 'Neon Green', value: 'text-green-400' },
  { label: 'Rose Red', value: 'text-rose-500' },
  { label: 'Cyan', value: 'text-cyan-400' },
];

export const CAPTION_EFFECT_OPTIONS: OptionItem[] = [
  { label: 'No Effect', value: '' },
  { label: 'Drop Shadow', value: 'drop-shadow-lg' },
  { label: 'Outline (Stroke)', value: '[text-shadow:-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000,2px_2px_0_#000]' },
  { label: 'Subtle Glow', value: 'drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]' },
  { label: 'Dark Box', value: 'bg-black/70 px-3 py-1 rounded-lg shadow-xl' },
];