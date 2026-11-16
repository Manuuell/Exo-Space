// The player's settings for looking around: how fast the mouse turns the
// camera, whether up and down are swapped, how wide the view is, whether the
// mouse is smoothed, and whether the browser is asked for raw mouse input
// (without the system's pointer acceleration). Saved in the browser, read
// back at start; a save that cannot be read gives the defaults.
//
// Pure data, no DOM and no Three.js: the tests load this file in Node.

export interface Settings {
  /** How fast the mouse turns the camera: 1 is the game's own speed. */
  sensitivity: number;
  /** Mouse up looks down. */
  invertY: boolean;
  /** Vertical field of view on foot, in degrees. Aiming narrows it. */
  fov: number;
  /** Eases the camera after the mouse instead of following it at once. */
  smoothing: boolean;
  /** Asks the browser for raw mouse input, without pointer acceleration. */
  rawInput: boolean;
  /** Volumes from 0 to 1: everything, then the music, the effects and the ambience under it. */
  master: number;
  music: number;
  sfx: number;
  ambience: number;
}

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  sensitivity: 1,
  invertY: false,
  fov: 60,
  smoothing: false,
  rawInput: true,
  master: 0.8,
  music: 0.45,
  sfx: 0.9,
  ambience: 0.6,
};

const VOLUME = { min: 0, max: 1, step: 0.05 } as const;

export const SETTING_LIMITS = {
  sensitivity: { min: 0.2, max: 3, step: 0.05 },
  fov: { min: 50, max: 90, step: 1 },
  master: VOLUME,
  music: VOLUME,
  sfx: VOLUME,
  ambience: VOLUME,
} as const;

export interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const SETTINGS_KEY = 'exo-space.settings';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Any value made into valid settings: what is missing or wrong takes the default. */
export function sanitizeSettings(value: unknown): Settings {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as Partial<Record<keyof Settings, unknown>>;
  const number = (input: unknown, fallback: number, limits: { min: number; max: number }) =>
    typeof input === 'number' && Number.isFinite(input) ? clamp(input, limits.min, limits.max) : fallback;
  const flag = (input: unknown, fallback: boolean) => (typeof input === 'boolean' ? input : fallback);
  return {
    sensitivity: number(raw.sensitivity, DEFAULT_SETTINGS.sensitivity, SETTING_LIMITS.sensitivity),
    invertY: flag(raw.invertY, DEFAULT_SETTINGS.invertY),
    fov: number(raw.fov, DEFAULT_SETTINGS.fov, SETTING_LIMITS.fov),
    smoothing: flag(raw.smoothing, DEFAULT_SETTINGS.smoothing),
    rawInput: flag(raw.rawInput, DEFAULT_SETTINGS.rawInput),
    master: number(raw.master, DEFAULT_SETTINGS.master, VOLUME),
    music: number(raw.music, DEFAULT_SETTINGS.music, VOLUME),
    sfx: number(raw.sfx, DEFAULT_SETTINGS.sfx, VOLUME),
    ambience: number(raw.ambience, DEFAULT_SETTINGS.ambience, VOLUME),
  };
}

/** The saved settings, or the defaults when there are none or they cannot be read. */
export function loadSettings(storage: Storage | null): Settings {
  try {
    const text = storage?.getItem(SETTINGS_KEY) ?? null;
    return sanitizeSettings(text === null ? {} : JSON.parse(text));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Saves the settings; a browser that refuses storage keeps them for this visit only. */
export function saveSettings(storage: Storage | null, settings: Settings): void {
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(sanitizeSettings(settings)));
  } catch {
    // Private windows and blocked storage: nothing to do.
  }
}
