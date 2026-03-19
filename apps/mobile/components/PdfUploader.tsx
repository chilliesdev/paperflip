import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { FileUp } from 'lucide-react-native';

interface PdfUploaderProps {
  onUploadSuccess: (fileUri: string, fileName: string) => void;
  onUploadError: (error: string) => void;
}

export function PdfUploader({ onUploadSuccess, onUploadError }: PdfUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const pickDocument = async () => {
    try {
      setIsUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsUploading(false);
        return;
      }

      const file = result.assets[0];
      const newUri = (FileSystem.documentDirectory || '') + file.name;

      await FileSystem.copyAsync({
        from: file.uri,
        to: newUri,
      });

      onUploadSuccess(newUri, file.name);
    } catch (err) {
      console.error('Error picking document:', err);
      onUploadError('Failed to pick document.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={pickDocument}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <FileUp color="#ffffff" size={24} style={styles.icon} />
            <Text style={styles.buttonText}>Upload PDF</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6', // blue-500
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
