module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: true,
        allowlist: [
          'API_BASE_URL',
          'API_URL',
          'DEV_MACHINE_IP',
          'INCIDENT_ASSETS_BASE_URL',
        ],
      },
    ],
  ],
};
