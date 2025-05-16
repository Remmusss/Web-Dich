declare namespace YT {
  interface PlayerOptions {
    videoId?: string;
    width?: number;
    height?: number;
    playerVars?: {
      autoplay?: 0 | 1;
      controls?: 0 | 1;
      modestbranding?: 0 | 1;
      rel?: 0 | 1;
      [key: string]: any;
    };
    events?: {
      onReady?: (event: { target: Player }) => void;
      onStateChange?: (event: { data: number; target: Player }) => void;
      [key: string]: any;
    };
  }

  interface Player {
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    getCurrentTime(): number;
    getPlayerState(): number;
    destroy(): void;
  }

  const PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };

  class Player {
    constructor(elementId: string, options: PlayerOptions);
  }
}

declare global {
  interface Window {
    YT?: {
      Player: typeof YT.Player;
      PlayerState: typeof YT.PlayerState;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
} 