import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, PlayCircle } from 'lucide-react-native';

// Import Screens
import Dashboard from './src/pages/Dashboard';
import PathsDirectory from './src/pages/PathsDirectory';
import Search from './src/pages/Search';
import LearningPath from './src/pages/LearningPath';
import CourseDetails from './src/pages/CourseDetails';
import VideoPlayer from './src/pages/VideoPlayer';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') {
            return <Home size={size} color={color} />;
          } else if (route.name === 'Paths') {
            return <PlayCircle size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: '#FFC837', // var(--accent-honey)
        tabBarInactiveTintColor: '#A0AEC0', // var(--text-silver)
        tabBarStyle: {
          backgroundColor: '#0F172A', // var(--bg-dark)
          borderTopWidth: 1,
          borderTopColor: '#1E293B', // var(--border-light)
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen name="Home" component={Dashboard} />
      <Tab.Screen name="Paths" component={PathsDirectory} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0F172A' },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Search" component={Search} />
        <Stack.Screen name="LearningPath" component={LearningPath} />
        <Stack.Screen name="CourseDetails" component={CourseDetails} />
        <Stack.Screen name="VideoPlayer" component={VideoPlayer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
