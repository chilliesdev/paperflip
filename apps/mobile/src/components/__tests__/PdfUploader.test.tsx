import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PdfUploader } from '../PdfUploader';
import * as DocumentPicker from 'expo-document-picker';
import { extractText } from 'expo-pdf-text-extract';
import PdfThumbnail from 'react-native-pdf-thumbnail';

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

// Mock expo-pdf-text-extract
jest.mock('expo-pdf-text-extract', () => ({
  extractText: jest.fn(),
}));

// Mock react-native-pdf-thumbnail
jest.mock('react-native-pdf-thumbnail', () => ({
  generate: jest.fn(),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

describe('PdfUploader', () => {
  const onPdfParsed = jest.fn();
  const onPdfError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(
      <PdfUploader onPdfParsed={onPdfParsed} onPdfError={onPdfError} />
    );
    
    expect(getByText('Open PDF')).toBeTruthy();
    expect(getByText('Tap to browse files')).toBeTruthy();
  });

  it('handles successful file upload', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'test-uri', name: 'test.pdf' }],
    });
    (extractText as jest.Mock).mockResolvedValue('Test extracted text');
    (PdfThumbnail.generate as jest.Mock).mockResolvedValue({ uri: 'thumb-uri' });

    const { getByText } = render(
      <PdfUploader onPdfParsed={onPdfParsed} onPdfError={onPdfError} />
    );
    
    const uploadButton = getByText('Open PDF');
    fireEvent.press(uploadButton);

    await waitFor(() => {
      expect(onPdfParsed).toHaveBeenCalledWith({
        text: 'Test extracted text',
        filename: 'test.pdf',
        thumbnailUri: 'thumb-uri',
      });
    });
  });

  it('handles cancellation', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: true,
    });

    const { getByText } = render(
      <PdfUploader onPdfParsed={onPdfParsed} onPdfError={onPdfError} />
    );
    
    const uploadButton = getByText('Open PDF');
    fireEvent.press(uploadButton);

    await waitFor(() => {
      expect(DocumentPicker.getDocumentAsync).toHaveBeenCalled();
      expect(extractText).not.toHaveBeenCalled();
      expect(onPdfParsed).not.toHaveBeenCalled();
    });
  });

  it('handles errors during extraction', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'test-uri', name: 'test.pdf' }],
    });
    (extractText as jest.Mock).mockRejectedValue(new Error('Extraction failed'));

    const { getByText } = render(
      <PdfUploader onPdfParsed={onPdfParsed} onPdfError={onPdfError} />
    );
    
    const uploadButton = getByText('Open PDF');
    fireEvent.press(uploadButton);

    await waitFor(() => {
      expect(onPdfError).toHaveBeenCalledWith({
        error: 'Failed to process PDF: Extraction failed',
      });
    });
  });
});
