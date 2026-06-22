import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { Colors, FontSizes, Radii } from '../theme';

type AuthErrorBannerProps = {
  message: string;
};

export default function AuthErrorBanner({ message }: AuthErrorBannerProps) {
  if (!message.trim()) {
    return null;
  }

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <AlertCircle size={18} color={Colors.danger} style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: 'rgba(229, 62, 62, 0.25)',
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  icon: {
    marginTop: 1,
    marginRight: 10,
  },
  text: {
    flex: 1,
    fontSize: FontSizes.sm,
    lineHeight: 18,
    color: Colors.danger,
    fontWeight: '600',
  },
});
