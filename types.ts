export interface SongDetails {
  artistName: string;
  songName: string;
  credits: string; // "Executors" or extra info
}

export interface DesignConfig {
  template: 'center-classic' | 'modern-split' | 'minimal-bottom';
  fontFamily: 'Cairo' | 'Tajawal' | 'Amiri';
  primaryColor: string;
  overlayOpacity: number;
}

export interface BackgroundState {
  type: 'solid' | 'image' | 'generated';
  value: string; // Hex color or Data URL
  isLoading: boolean;
}
