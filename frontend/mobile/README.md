# 📱 Hexaware Luminous Mobile

A premium mobile learning experience built with React Native and Expo, designed to provide a seamless "Discovery ➔ Preview ➔ Learning" journey for students.

## ✨ Features

- **Personalized Dashboard**: "Continue Learning" section with real-time progress tracking and rounded progress indicators.
- **Path Exploration**: Browse structured learning paths curated by experts.
- **Deep Search**: Instantly find courses and paths across the entire platform.
- **Advanced Course Details**: Comprehensive overview of lessons, metadata, and dynamic content loading.
- **Professional Video Player**: Integrated YouTube player with automatic progress persistence, bookmarking, and note-taking.
- **Premium UX**: Ultra-fast perceived performance using professional Skeleton Loaders and shimmer animations.
- **Hexaware Luminous Design**: A sleek, modern aesthetic following Lumino design standards.

## 🛠️ Technology Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Navigation**: [React Navigation](https://reactnavigation.org/)
- **Icons**: [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)
- **Typography**: [Inter](https://fonts.google.com/specimen/Inter) via Expo Google Fonts
- **Styling**: Native StyleSheet with custom theme tokens
- **Visuals**: [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later)
- Expo Go app on your physical device (iOS/Android) OR an emulator setup.

### Installation

1. Navigate to the mobile directory:
   ```bash
   cd frontend/mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Use the QR code in your terminal to open the app in **Expo Go**.

## 📁 Project Structure

- `src/screens`: Individual app screens (Dashboard, Paths, CourseDetails, etc.)
- `src/navigation`: App and Tab navigators
- `src/theme`: Centralized color palette and design tokens
- `src/constants`: API configuration and environment constants
- `src/components`: Reusable UI components
