interface Document {
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
interface UserSettings {
    id: string;
    playbackSpeed: number;
    autoScroll: boolean;
    karaokeMode: boolean;
    videoLength: number;
    isMuted: boolean;
}
interface Segment {
    text: string;
    start: number;
    end: number;
}

export type { Document, Segment, UserSettings };
