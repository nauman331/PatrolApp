import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '../theme';
import { useGuardNavigation } from '../navigation/utils';
import { useRoute } from '@react-navigation/native';
import type { GuardStackScreenProps } from '../navigation/types';

type PdfViewerRoute = GuardStackScreenProps<'PdfViewer'>['route'];

export default function PdfViewerScreen() {
  const navigation = useGuardNavigation();
  const route = useRoute<PdfViewerRoute>();
  const { uri, title } = route.params;

  // Android WebView doesn't support PDF viewing natively.
  // Using Google Docs Viewer as a workaround.
  const finalUri =
    Platform.OS === 'android'
      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(uri)}`
      : uri;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerStart} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title || 'View PDF'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.webviewContainer}>
          <WebView
            key={finalUri}
            source={{ uri: finalUri }}
            style={styles.webview}
            startInLoadingState
            originWhitelist={['*']}
            scalesPageToFit
            javaScriptEnabled
            domStorageEnabled
            allowFileAccess
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color={Colors.accent} />
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.headerStart },
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    backgroundColor: Colors.headerStart,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: { width: 36 },
  webviewContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  webview: { flex: 1, backgroundColor: Colors.white },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
});
