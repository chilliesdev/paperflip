export interface Document {
  documentId: string;
  segments: string[];
  fullText?: string;
  videoLengthAtSegmentation?: number;
  currentSegmentIndex: number;
  currentSegmentProgress: number;
  createdAt: number;
  lastViewedAt: number;
  isFavourite: boolean;
  totalSegments?: number;
  currentSegmentLength?: number;
}

export interface UserSettings {
  id: string;
  playbackSpeed: number;
  autoScroll: boolean;
  karaokeMode: boolean;
  videoLength: number;
  isMuted: boolean;
}

export interface Segment {
  text: string;
  start: number;
  end: number;
}
