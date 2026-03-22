import { View, Text, Pressable, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type OptionsSheetProps = {
  visible: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  document: any;
  onClose: () => void;
  onDelete: (id: string) => void;
  onToggleFavourite: (id: string) => void;
};

export function OptionsSheet({ visible, document, onClose, onDelete, onToggleFavourite }: OptionsSheetProps) {
  if (!document) return null;

  const isFavourite = document.isFavourite;

  const handleToggleFavourite = () => {
    onToggleFavourite(document.documentId);
    onClose();
  };

  const handleDelete = () => {
    onDelete(document.documentId);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        {/* Backdrop */}
        <Pressable
          className="absolute inset-0 bg-black/60"
          onPress={onClose}
        />

        {/* Sheet Content */}
        <View className="bg-brand-bg/95 border-t border-white/10 rounded-t-3xl pb-10 pt-4 px-6 shadow-2xl">

          {/* Handle */}
          <View className="w-full items-center mb-6">
            <View className="w-12 h-1.5 bg-white/20 rounded-full" />
          </View>

          <View className="flex-col space-y-2">
            <Pressable
              className="flex-row items-center p-4 rounded-xl active:bg-white/10"
              onPress={handleToggleFavourite}
            >
              <View className="w-10 h-10 rounded-full bg-brand-surface-dark border border-white/10 items-center justify-center mr-4">
                <MaterialIcons
                  name={isFavourite ? "star" : "star-border"}
                  size={24}
                  color={isFavourite ? "#00FF88" : "#888"}
                />
              </View>
              <Text className="text-white font-semibold text-base">
                {isFavourite ? "Remove from Favourites" : "Set as Favourite"}
              </Text>
            </Pressable>

            <Pressable
              className="flex-row items-center p-4 rounded-xl active:bg-red-500/20 mt-2"
              onPress={handleDelete}
            >
              <View className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 items-center justify-center mr-4">
                <MaterialIcons name="delete" size={24} color="#EF4444" />
              </View>
              <Text className="text-red-500 font-semibold text-base">
                Delete Document
              </Text>
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  );
}
