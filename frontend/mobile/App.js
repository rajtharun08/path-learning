import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ActivityIndicator, Platform } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import AppNavigator from './src/navigation/AppNavigator';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0A56F1" />
      </View>
    );
  }

  const BrandingHeader = () => (
    <View style={{ 
      width: '100%', 
      alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
      backgroundColor: '#ffffff' 
    }}>
      <View style={{ 
        width: '100%', 
        maxWidth: Platform.OS === 'web' ? 820 : '100%',
        paddingHorizontal: 16, 
        paddingTop: 10, 
        paddingBottom: 10 
      }}>
        <Text style={{ color: '#07125E', fontSize: 22, fontFamily: 'Inter_700Bold', fontStyle: 'italic', textAlign: 'left' }}>Hexaware Luminous</Text>
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
          <BrandingHeader />
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
