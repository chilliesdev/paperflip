export interface Document {
  documentId: string;
  segments: string[];
  fullText: string;
  thumbnailUri: string;
  videoLengthAtSegmentation: number;
  currentSegmentIndex: number;
  currentSegmentProgress: number;
  createdAt: number;
  lastViewedAt: number;
  isFavourite: boolean;
  totalSegments: number;
  currentSegmentLength: number;
}

export interface Settings {
  id: string;
  playbackSpeed: number;
  autoScroll: boolean;
  karaokeMode: boolean;
  videoLength: number;
  isMuted: boolean;
  autoResume: boolean;
  darkMode: boolean;
  textScale: number;
  backgroundUrl: string;
}

export interface Segment {
  text: string;
  start: number;
  end: number;
}
