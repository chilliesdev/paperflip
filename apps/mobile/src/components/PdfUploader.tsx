import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { MaterialIcons } from '@expo/vector-icons';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PdfUploaderProps {
  onPdfParsed: (data: { text: string; filename: string }) => void;
  onPdfError: (error: { error: string }) => void;
}

export function PdfUploader({ onPdfParsed, onPdfError }: PdfUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [debugStatus, setDebugStatus] = useState<string | null>(null);

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      if (!result.assets || result.assets.length === 0) return;

      setIsLoading(true);
      setDebugStatus('Processing...');

      const file = result.assets[0];

      // Read the file as Base64 using expo-file-system
      const fileUri = file.uri;
      const base64Data = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert Base64 to binary array (Uint8Array)
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Load PDF
      const loadingTask = pdfjsLib.getDocument({ data: bytes });
      const pdf = await loadingTask.promise;

      // Parse PDF
      const pagePromises: Promise<string>[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        pagePromises.push(
          pdf.getPage(i).then(async (page) => {
            const text = await page.getTextContent();
            return text.items
              .map((item) => ('str' in item ? item.str : ''))
              .join(' ');
          })
        );
      }

      const pageTexts = await Promise.all(pagePromises);
      const textContent = pageTexts.join(' ');

      onPdfParsed({ text: textContent, filename: file.name });
      setDebugStatus('Done');
    } catch (error: unknown) {
      console.error('Error parsing PDF:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setDebugStatus('Error: ' + errorMessage);
      onPdfError({ error: 'Failed to process PDF: ' + errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="relative group mt-8 w-full max-w-md self-center px-6">
      <Pressable
        onPress={handleFileUpload}
        disabled={isLoading}
        className="relative bg-brand-surface-dark/60 p-8 flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 active:opacity-80"
      >
        <View className="w-16 h-16 bg-brand-primary/10 rounded-full items-center justify-center mb-4">
          {isLoading ? (
            <ActivityIndicator size="large" color="#00FF88" />
          ) : (
            <MaterialIcons name="upload-file" size={32} color="#00FF88" />
          )}
        </View>
        <Text className="text-xl font-bold tracking-tight text-white mb-2">
          {isLoading ? 'Processing...' : 'Open PDF'}
        </Text>
        <Text className="text-brand-text-muted text-sm mb-4">Tap to browse files</Text>

        <View className="flex-row items-center space-x-2">
          <MaterialIcons name="access-time" size={16} color="#00FF88" />
          <Text className="text-[10px] font-bold uppercase tracking-widest text-brand-primary ml-1">
            Instant • Zero Latency
          </Text>
        </View>
      </Pressable>
      {debugStatus && debugStatus !== 'Ready' && !isLoading && debugStatus !== 'Done' && (
        <Text className="mt-2 text-xs text-red-400 text-center">{debugStatus}</Text>
      )}
    </View>
  );
}
