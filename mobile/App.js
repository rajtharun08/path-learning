import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, backgroundColor: '#ffffff' }}>
            <Text style={{ color: '#07125E', fontSize: 22, fontWeight: 'bold', fontStyle: 'italic', textAlign: 'left' }}>Hexaware Luminous</Text>
          </View>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
