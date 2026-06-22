import React from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Text,
  useWindowDimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Colors } from '../theme';
import { normalizeDisplayImageUri } from '../utils/imageUri';

type ImageViewerModalProps = {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
};

export default function ImageViewerModal({
  visible,
  uri,
  onClose,
}: ImageViewerModalProps) {
  const { width, height } = useWindowDimensions();
  const displayUri = normalizeDisplayImageUri(uri);

  if (!displayUri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.95)" />
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <X size={22} color={Colors.white} />
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: displayUri }}
            style={{ width: width - 32, height: height * 0.72 }}
            resizeMode="contain"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 24,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 12,
  },
  closeText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  imageWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
