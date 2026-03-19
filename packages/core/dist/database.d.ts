import { RxStorage } from 'rxdb';

declare global {
    var __rxdb_plugins_added: boolean | undefined;
    var __rxdb_devmode_added: boolean | undefined;
}
declare const documentSchema: {
    readonly version: 8;
    readonly primaryKey: "documentId";
    readonly type: "object";
    readonly properties: {
        readonly documentId: {
            readonly type: "string";
            readonly maxLength: 100;
        };
        readonly segments: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        };
        readonly fullText: {
            readonly type: "string";
        };
        readonly videoLengthAtSegmentation: {
            readonly type: "number";
        };
        readonly currentSegmentIndex: {
            readonly type: "number";
        };
        readonly currentSegmentProgress: {
            readonly type: "number";
        };
        readonly createdAt: {
            readonly type: "number";
            readonly multipleOf: 1;
            readonly minimum: 0;
            readonly maximum: 100000000000000;
            readonly maxLength: 100;
        };
        readonly lastViewedAt: {
            readonly type: "number";
            readonly multipleOf: 1;
            readonly minimum: 0;
            readonly maximum: 100000000000000;
            readonly maxLength: 100;
        };
        readonly isFavourite: {
            readonly type: "boolean";
        };
        readonly totalSegments: {
            readonly type: "number";
        };
        readonly currentSegmentLength: {
            readonly type: "number";
        };
    };
    readonly required: readonly ["documentId", "segments", "createdAt", "lastViewedAt", "isFavourite"];
};
declare const settingsSchema: any;
declare const DEFAULT_SETTINGS: {
    id: string;
    playbackSpeed: number;
    autoScroll: boolean;
    karaokeMode: boolean;
    videoLength: number;
    isMuted: boolean;
};
declare function setDbStorage(storage: RxStorage<any, any>, devMode?: boolean): void;
declare function getDb(): Promise<any>;
declare function addDocument(documentId: string, segments: string[], fullText?: string, videoLengthAtSegmentation?: number, currentSegmentIndex?: number): Promise<any>;
declare function upsertDocument(documentId: string, segments: string[], fullText?: string, videoLengthAtSegmentation?: number, currentSegmentIndex?: number): Promise<any>;
declare function getRecentUploads(limit?: number): Promise<any>;
declare function getDocument(documentId: string): Promise<any>;
declare function updateDocumentProgress(documentId: string, index: number, progress?: number): Promise<void>;
declare function toggleFavourite(documentId: string): Promise<boolean>;
declare function deleteDocument(documentId: string): Promise<boolean>;
declare function resetDb(): void;
declare function getAllDocuments(): Promise<any>;
type Settings = typeof DEFAULT_SETTINGS;
declare function getSettings(): Promise<any>;
declare function updateSettings(patch: Partial<typeof DEFAULT_SETTINGS>): Promise<void>;
declare function getSettingsObservable(): Promise<any>;
declare function resegmentDocument(documentId: string, newVideoLength: number): Promise<any>;

export { DEFAULT_SETTINGS, type Settings, addDocument, deleteDocument, documentSchema, getAllDocuments, getDb, getDocument, getRecentUploads, getSettings, getSettingsObservable, resegmentDocument, resetDb, setDbStorage, settingsSchema, toggleFavourite, updateDocumentProgress, updateSettings, upsertDocument };
