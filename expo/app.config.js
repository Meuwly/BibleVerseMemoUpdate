const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Config plugin: write ndk.dir to android/local.properties so Gradle can find
// a user-installed NDK when /opt/android-sdk/ndk is not writable.
const NDK_VERSION = '27.1.12297006';

function withNdkLocalProperties(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const ndkHome = path.join(os.homedir(), 'android-sdk', 'ndk', NDK_VERSION);

      // Only inject if the NDK is actually present at the user path; otherwise
      // let Gradle handle it (e.g. if the system SDK becomes writable).
      if (!fs.existsSync(ndkHome)) {
        return cfg;
      }

      const localProps = path.join(cfg.modRequest.platformProjectRoot, 'local.properties');
      let content = fs.existsSync(localProps) ? fs.readFileSync(localProps, 'utf8') : '';

      // Remove old ndk.dir lines and append the new one
      content = content.replace(/^ndk\.dir=.*$/m, '').trimEnd();
      content += `\nndk.dir=${ndkHome}\n`;
      fs.writeFileSync(localProps, content);

      return cfg;
    },
  ]);
}

module.exports = () => {
  const supabaseUrl =
    process.env.EXPO_PUBLIC_SUPABASE_URL
    ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    ?? process.env.SUPABASE_URL;

  const supabaseAnonKey =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    ?? process.env.SUPABASE_ANON_KEY;

  const appConfig = {
    name: 'Bible Verse Memo',
    slug: 'bibleversememo',
    version: '1.9',
    icon: './assets/images/icon.png',
    scheme: 'bibleversememo',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'online.timprojects.bibleversememo',
      usesIcloudStorage: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'online.timprojects.bibleversememo',
      permissions: ['INTERNET'],
      edgeToEdgeEnabled: true,
    },
    web: {
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      [
        'expo-router',
        {
          origin: 'https://localhost:8081/',
        },
      ],
      'expo-font',
      'expo-web-browser',
      [
        'expo-sqlite',
        {
          enableFTS: true,
          useSQLCipher: true,
          android: {
            enableFTS: false,
            useSQLCipher: false,
          },
          ios: {
            customBuildFlags: [
              '-DSQLITE_ENABLE_DBSTAT_VTAB=1 -DSQLITE_ENABLE_SNAPSHOT=1',
            ],
          },
        },
      ],
      [
        'expo-document-picker',
        {
          iCloudContainerEnvironment: 'Production',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: supabaseUrl,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
      eas: {
        projectId: '4ab5a7fc-d3db-4418-894c-33649835545c',
      },
    },
  };

  return withNdkLocalProperties(appConfig);
};
