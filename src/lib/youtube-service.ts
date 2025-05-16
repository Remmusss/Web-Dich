interface YouTubeTranscript {
  text: string;
  duration: number;
  offset: number;
}

export const youtubeService = {
  async fetchSubtitles(videoUrl: string) {
    try {
      const response = await fetch('/api/youtube-subtitles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch subtitles');
      }

      const data = await response.json();
      return {
        subtitles: this.transcriptToSrt(data.subtitles),
        videoId: data.videoId
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch subtitles');
    }
  },

  transcriptToSrt(transcripts: YouTubeTranscript[]): string {
    return transcripts
      .map((transcript, index) => {
        const startTime = this.formatTime(transcript.offset / 1000);
        const endTime = this.formatTime((transcript.offset + transcript.duration) / 1000);
        return `${index + 1}\n${startTime} --> ${endTime}\n${transcript.text}\n`;
      })
      .join('\n');
  },

  formatTime(seconds: number): string {
    const pad = (num: number): string => num.toString().padStart(2, '0');
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${ms.toString().padStart(3, '0')}`;
  },

  decodeHtmlEntities(text: string): string {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  },
}; 