import { View, Text, FlatList, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { getDb, getAllDocuments } from '@paperflip/core';
import { LibraryHeader } from '../src/components/LibraryHeader';
import { DocumentListItem } from '../src/components/DocumentListItem';
import { DocumentGridItem } from '../src/components/DocumentGridItem';
import { OptionsSheet } from '../src/components/OptionsSheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toggleFavourite, deleteDocument } from '@paperflip/core';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function LibraryScreen() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const loadDocuments = async () => {
    try {
      const docs = await getAllDocuments();
      setDocuments(docs);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
      setError(err.message || 'Failed to load library');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDocuments();

    let sub: any;
    getDb().then(db => {
      if (db && db.documents) {
        sub = db.documents.find().$.subscribe((docs: any) => {
          setDocuments(docs.map((d: any) => {
            const json = d.toJSON();
            delete json.segments;
            return json;
          }).sort((a: any, b: any) => b.lastViewedAt - a.lastViewedAt));
        });
      }
    }).catch(console.error);

    // Mock data injection for testing
    if (typeof window !== 'undefined') {
      const handleInject = (e: any) => {
        setDocuments(e.detail);
        setLoading(false);
      };
      window.addEventListener('testing:inject-docs', handleInject);
      return () => {
        window.removeEventListener('testing:inject-docs', handleInject);
        if (sub) sub.unsubscribe();
      };
    }

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDocuments();
  }, []);

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const lowerQuery = searchQuery.toLowerCase();
    return documents.filter(doc =>
      doc.documentId?.toLowerCase().includes(lowerQuery) ||
      doc.fullText?.toLowerCase().includes(lowerQuery)
    );
  }, [documents, searchQuery]);

  const renderHeader = () => (
    <View>
      <LibraryHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <View className="flex-row items-center justify-between px-6 mb-4">
        <Text className="text-white font-semibold text-lg">
          {filteredDocuments.length} Documents
        </Text>
        <View className="flex-row bg-brand-surface-dark border border-white/5 rounded-lg p-1">
          <Pressable
            className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white/10' : ''}`}
            onPress={() => setViewMode('grid')}
          >
            <MaterialIcons name="grid-view" size={20} color={viewMode === 'grid' ? '#00FF88' : '#888'} />
          </Pressable>
          <Pressable
            className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white/10' : ''}`}
            onPress={() => setViewMode('list')}
          >
            <MaterialIcons name="view-list" size={20} color={viewMode === 'list' ? '#00FF88' : '#888'} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  const handleToggleFavourite = async (id: string) => {
    await toggleFavourite(id);
    loadDocuments();
  };

  const handleDelete = async (id: string) => {
    await deleteDocument(id);
    loadDocuments();
  };

  const showOptions = (doc: any) => {
    setSelectedDoc(doc);
    setSheetVisible(true);
  };

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center py-20 px-6">
      <MaterialIcons name="menu-book" size={64} color="#333" />
      <Text className="text-white text-lg font-bold mt-4 text-center">
        {searchQuery ? 'No results found' : 'Your library is empty'}
      </Text>
      <Text className="text-brand-text-muted text-center mt-2">
        {searchQuery ? 'Try adjusting your search query.' : 'Upload a PDF from the home screen to get started.'}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-brand-bg">
      <SafeAreaView style={{flex: 1}} edges={['top']}>
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#00FF88" />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <MaterialIcons name="error-outline" size={48} color="#EF4444" />
            <Text className="text-white text-lg font-bold mt-4 text-center">Failed to load library</Text>
            <Text className="text-brand-text-muted text-center mt-2 mb-6">{error}</Text>
            <Pressable
              className="bg-brand-primary px-6 py-3 rounded-xl"
              onPress={loadDocuments}
            >
              <Text className="text-black font-bold">Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <View className="flex-1">
            <FlatList
              data={filteredDocuments}
              key={viewMode} // Force re-render when changing numColumns
              numColumns={viewMode === 'grid' ? 2 : 1}
              keyExtractor={(item) => item.documentId}
              ListHeaderComponent={renderHeader}
              ListEmptyComponent={renderEmpty}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FF88" />
              }
              contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 24 }}
              columnWrapperStyle={viewMode === 'grid' ? { justifyContent: 'space-between' } : undefined}
              renderItem={({ item }) =>
                viewMode === 'grid' ? (
                  <DocumentGridItem document={item} onShowOptions={showOptions} />
                ) : (
                  <DocumentListItem document={item} onShowOptions={showOptions} />
                )
              }
            />
          </View>
        )}
      </SafeAreaView>

      <OptionsSheet
        visible={sheetVisible}
        document={selectedDoc}
        onClose={() => setSheetVisible(false)}
        onToggleFavourite={handleToggleFavourite}
        onDelete={handleDelete}
      />
    </View>
  );
}
