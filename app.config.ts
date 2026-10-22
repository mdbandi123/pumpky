import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  "name": "pumpky",
  "slug": "pumpky",
  "version": "1.0.0",
  "orientation": "portrait",
  "icon": "./assets/images/icon.png",
  "scheme": "pumpky",
  "userInterfaceStyle": "automatic",
  "ios": {
    "icon": "./assets/expo.icon"
  },
  "android": {
    "adaptiveIcon": {
      "backgroundColor": "#E6F4FE",
      "foregroundImage": "./assets/images/android-icon-foreground.png",
      "backgroundImage": "./assets/images/android-icon-background.png",
      "monochromeImage": "./assets/images/android-icon-monochrome.png"
    },
    "predictiveBackGestureEnabled": false
  },
  "web": {
    "output": "server",
    "favicon": "./assets/images/favicon.png"
  },
  "plugins": [
    "expo-router",
    [
      "expo-splash-screen",
      {
        "backgroundColor": "#208AEF",
        "image": "./assets/images/splash-icon.png",
        "imageWidth": 76
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
