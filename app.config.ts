import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  "name": "pumpky",
  "slug": "pumpky",
  "version": "1.0.0",
  "orientation": "portrait",
  "icon": "./assets/branding/icon.png",
  "scheme": "pumpky",
  "userInterfaceStyle": "automatic",
  "ios": {
    "icon": "./assets/branding/icon.png",
    "bundleIdentifier": "com.mdbandi123.pumpky"
  },
  "android": {
    "adaptiveIcon": {
      "backgroundColor": "#151219",
      "foregroundImage": "./assets/branding/foreground.png"
    },
    "predictiveBackGestureEnabled": false
  },
  "web": {
    "output": "server",
    "favicon": "./assets/branding/favicon.png"
  },
  "plugins": [
    "expo-router",
    "expo-asset",
    ["@reactvision/react-viro", {
      "provider": "none",
      "ios": { "cameraUsagePermission": "Pumpky uses the camera to bring your Halloween basket to life." }
    }],
    ["expo-camera", {
      "cameraPermission": "Pumpky uses the camera to bring your Halloween basket to life.",
      "microphonePermission": false,
      "recordAudioAndroid": false,
      "barcodeScannerEnabled": false
    }],
    "expo-sharing",
    [
      "expo-splash-screen",
      {
        "backgroundColor": "#151219",
        "image": "./assets/branding/foreground.png",
        "imageWidth": 160
      }
    ]
  ],
  "experiments": {
    "typedRoutes": true,
    "reactCompiler": true
  },
  "extra": {
    "router": {
      "asyncRoutes": {
        "web": true
      }
    },
    "eas": {
      "projectId": "9cebdc6b-043a-418c-99da-2dffca3266b3"
    }
  },
  "owner": "mdbandi123"
};

export default config;
