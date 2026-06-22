module.exports = {
  dependencies: {
    'react-native-image-marker': {
      platforms: {
        // Android uses react-native-view-shot; marker stays as JS fallback only.
        android: null,
      },
    },
  },
};
