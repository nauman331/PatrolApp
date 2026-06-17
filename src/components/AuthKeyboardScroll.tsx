import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  findNodeHandle,
  Keyboard,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';

export type AuthKeyboardScrollHandle = {
  scrollToField: (fieldRef: React.RefObject<View | null>) => void;
};

type AuthKeyboardScrollProps = {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** When false, only the form body scrolls (header stays fixed). Default true. */
  wrapFullScreen?: boolean;
};

const FIELD_TOP_OFFSET = 96;
const EXTRA_SCROLL_PADDING = 32;

const AuthKeyboardScroll = forwardRef<
  AuthKeyboardScrollHandle,
  AuthKeyboardScrollProps
>(function AuthKeyboardScroll(
  { children, contentContainerStyle, wrapFullScreen = true },
  ref,
) {
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardHeightRef = useRef(0);
  const pendingFieldRef = useRef<React.RefObject<View | null> | null>(null);

  const scrollToField = useCallback(
    (fieldRef: React.RefObject<View | null>) => {
      pendingFieldRef.current = fieldRef;

      const runScroll = () => {
        const field = fieldRef.current;
        const scrollView = scrollRef.current;
        if (!field || !scrollView) {
          return;
        }

        const scrollHandle = findNodeHandle(scrollView);
        if (!scrollHandle) {
          return;
        }

        field.measureLayout(
          scrollHandle,
          (_x, y, _width, height) => {
            scrollView.scrollTo({
              y: Math.max(0, y + height - FIELD_TOP_OFFSET),
              animated: true,
            });
          },
          () => {},
        );
      };

      runScroll();
      requestAnimationFrame(runScroll);
      setTimeout(runScroll, Platform.OS === 'android' ? 100 : 50);
      setTimeout(runScroll, 250);
    },
    [],
  );

  useImperativeHandle(ref, () => ({ scrollToField }), [scrollToField]);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, event => {
      const nextHeight = event.endCoordinates.height;
      keyboardHeightRef.current = nextHeight;
      setKeyboardHeight(nextHeight);

      if (pendingFieldRef.current) {
        scrollToField(pendingFieldRef.current);
        setTimeout(
          () => {
            if (pendingFieldRef.current) {
              scrollToField(pendingFieldRef.current);
            }
          },
          Platform.OS === 'android' ? 150 : 80,
        );
      }
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardHeightRef.current = 0;
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToField]);

  // iOS: shrink scroll area above keyboard. Android: adjustResize already resizes
  // the window — only add content padding so manual scroll has room.
  const keyboardInsetStyle =
    Platform.OS === 'ios' && keyboardHeight > 0
      ? { marginBottom: keyboardHeight }
      : null;

  const keyboardContentStyle =
    keyboardHeight > 0
      ? {
          paddingBottom:
            Platform.OS === 'android'
              ? keyboardHeight + EXTRA_SCROLL_PADDING
              : EXTRA_SCROLL_PADDING,
        }
      : null;

  const scrollView = (
    <View style={[styles.flex, keyboardInsetStyle]}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          keyboardContentStyle,
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        nestedScrollEnabled
      >
        {children}
      </ScrollView>
    </View>
  );

  if (!wrapFullScreen) {
    return <View style={styles.formScroll}>{scrollView}</View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {scrollView}
    </SafeAreaView>
  );
});

export default AuthKeyboardScroll;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  formScroll: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: { flex: 1 },
  scroll: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    flexGrow: 1,
    backgroundColor: Colors.bg,
    paddingBottom: 16,
  },
});
