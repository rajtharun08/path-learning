# Frontend — Hexaware Luminous (Expo / React Native)

The mobile and web frontend for the **Hexaware Luminous** learning platform. Built with **Expo SDK 55** and **React Native**, it runs as a native iOS/Android app and a full web app from a single codebase.

---

## Tech Stack

| Tool | Version |
|---|---|
| Expo | SDK 55 |
| React Native | 0.83.6 |
| React | 19.2.0 |
| React Navigation | v6 (Stack + Bottom Tabs) |
| expo-linear-gradient | ^55.0.13 |
| lucide-react-native | ^0.364.0 |
| AsyncStorage | 2.2.0 |
| react-native-youtube-iframe | ^2.3.0 |

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- **Expo CLI** — `npm install -g expo-cli`
- All backend services must be running (see the root README)

### Install dependencies

```bash
cd frontend/mobile
npm install
```

### Start the app

```bash
# Web (opens at http://localhost:8081)
npx expo start --web

# Expo Go (scan QR code with Expo Go app on mobile)
npx expo start

# Android emulator
npx expo start --android

# iOS simulator (macOS only)
npx expo start --ios
```

---

## Project Structure

```
frontend/mobile/
├── App.js                  # Root component — fonts, navigation, global header
├── app.json                # Expo config
├── src/
│   ├── constants/
│   │   ├── Auth.js         # getCurrentUserId, getScopedStorageKey helpers
│   │   └── Config.js       # API_URLS (backend service endpoints)
│   ├── navigation/
│   │   ├── AppNavigator.js    # Root navigator (Auth vs Main)
│   │   └── MainTabNavigator.js# Bottom tab navigator
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── PathsScreen.js
│   │   ├── LearningPathScreen.js
│   │   ├── CourseDetailsScreen.js
│   │   └── VideoPlayerScreen.js
│   └── theme/
│       └── Colors.js       # Global color tokens
```

---

## Screens

| Screen | Route | Description |
|---|---|---|
| `LoginScreen` | `Login` | Student login and admin/staff login |
| `DashboardScreen` | `Home` | Course list, search, continue learning |
| `PathsScreen` | `Paths` | Learning path directory |
| `LearningPathScreen` | `LearningPath` | Path details, curriculum, progress, ratings |
| `CourseDetailsScreen` | `CourseDetails` | Course lessons, resources, enroll |
| `VideoPlayerScreen` | `VideoPlayer` | YouTube video player with progress tracking |

---

## Configuration

Edit `src/constants/Config.js` to point to your backend services:

```js
export const API_URLS = {
  USER_SERVICE:     'http://localhost:8001',
  PLAYLIST_SERVICE: 'http://localhost:8002',
  PROGRESS_SERVICE: 'http://localhost:8003',
  ANALYTICS_SERVICE:'http://localhost:8004',
  PATH_SERVICE:     'http://localhost:8006',
};
```

> **Mobile devices**: Replace `localhost` with your machine's local IP address (e.g., `192.168.1.x`), since the device cannot reach `localhost` on the host machine.

---

## Authentication

- Users log in via the **User Service** (`:8001`)
- The returned `user_id` (UUID) is persisted in `AsyncStorage`
- Admin/staff users access the Admin Dashboard inside the app
- Session is scoped per user using `getScopedStorageKey(key)` to ensure data isolation between accounts on the same device

---

## Design System

All global colour tokens are defined in `src/theme/Colors.js`. The app uses a **premium light theme** with:

- **Navy** (`#040D43`) — primary text and interactive elements
- **Brand Blue** (`#1A56DB`) — buttons and CTAs
- **Canary Yellow** (`#F5A623`) — star ratings
- **Off-White** (`#F7F9FC`) — page backgrounds
- Inter font family (loaded via `@expo-google-fonts/inter`)

---

## Key Features

- **Cross-platform** — one codebase for iOS, Android, and Web
- **Focus-based data refresh** — screens re-fetch data whenever the user navigates back, ensuring progress is always up to date
- **Max-width layout** — web view capped at 820px for a desktop-friendly reading experience
- **Star ratings** — users can rate learning paths (1–5 stars); ratings update in real time
- **YouTube playback** — videos play in-app via `react-native-youtube-iframe`
