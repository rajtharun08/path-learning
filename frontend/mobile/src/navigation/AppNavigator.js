import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainTabNavigator from './MainTabNavigator';
import CourseDetailsScreen from '../screens/CourseDetailsScreen';
import LearningPathScreen from '../screens/LearningPathScreen';
import VideoPlayerScreen from '../screens/VideoPlayerScreen';
import LoginScreen from '../screens/LoginScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} />
      <Stack.Screen name="LearningPath" component={LearningPathScreen} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
    </Stack.Navigator>
  );
}
