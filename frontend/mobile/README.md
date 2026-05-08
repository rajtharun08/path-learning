# Frontend — Hexaware Luminous Mobile App

A cross-platform React Native app (iOS, Android, Web) built with Expo. Students browse and enroll in learning paths, watch lessons, and track their progress. Admins manage all content through a built-in Admin Studio.

---

## Tech Stack

| | |
|---|---|
| **Framework** | React Native + Expo |
| **Navigation** | React Navigation (Stack + Bottom Tabs) |
| **Icons** | `lucide-react-native` |
| **Fonts** | Google Fonts via `expo-google-fonts` (Inter) |
| **Video Player** | `react-native-webview` (YouTube embed) |

---

## Screens

| Screen | Path | Description |
|---|---|---|
| **Login** | `LoginScreen.js` | Email + password login with role selection |
| **Dashboard** | `DashboardScreen.js` | Home feed — enrolled paths, course catalog, search bar |
| **Paths** | `PathsScreen.js` | Browse and search learning paths (Stale-While-Revalidate) |
| **Course Details** | `CourseDetailsScreen.js` | Overview, lessons, outcomes, enrollment |
| **Video Player** | `VideoPlayerScreen.js` | Lesson playback with progress tracking |
| **Learning Path** | `LearningPathScreen.js` | Step-by-step path progress view |
| **Admin Studio** | `AdminCoursesScreen.js` | Full admin panel — manage courses, lessons, paths |

---

## Admin Studio Features

The **Admin** tab is only visible to users with `staff` or `admin` roles.

### Courses Tab
- ✅ **Import from YouTube:** Import entire playlists as courses (requires backend API Key).
- ✅ **Manual Creation:** Create courses (title, description, outcomes, thumbnail, author).
- ✅ **Full Editability:** Edit or delete ANY course (manual or imported) and its lessons.
- ✅ **Thumbnail Support:** Handle YouTube thumbnails or manual Base64 uploads.
- ✅ **Lesson Management:** Add, edit, reorder, or delete lessons in any course.
- ✅ **Resources:** Attach links and files to courses.

### Paths Tab
- ✅ Create learning paths (title, description, editor name, select courses)
- ✅ Manage path course sequence (reorder with ↑ / ↓, remove courses)
- ✅ Delete learning paths

---

## Configuration

### API Endpoints

Edit `src/constants/Config.js` to set the backend IP:

```js
// For Web (same machine): use 'localhost'
// For Mobile: use your machine's local IP address
const BASE_IP = Platform.OS === 'web' ? 'localhost' : '192.168.x.x';

export const API_URLS = {
  USER_SERVICE:     `http://${BASE_IP}:8001`,
  PLAYLIST_SERVICE: `http://${BASE_IP}:8002`,
  PATH_SERVICE:     `http://${BASE_IP}:8006`,
  PROGRESS_SERVICE: `http://${BASE_IP}:8003`,
};
```

---

## Running the App

```bash
cd frontend/mobile
npm install
npx expo start
```

| Platform | Command |
|---|---|
| Web browser | Press `w` |
| Android emulator | Press `a` |
| iOS simulator | Press `i` |
| Physical device | Scan QR code with Expo Go |

---

## Notes

- **YouTube Embedding:** Videos are embedded via the official iframe API within a native WebView for optimized performance.
- **Permanent Memory:** The app implements a sophisticated `AsyncStorage` caching layer. Data is rendered instantly from local storage, while background syncs ensure the UI is always up-to-date with zero flicker.
- **Instant Transitions:** High-impact course and path metadata is passed during navigation to ensure details screens load in 0.0ms.
