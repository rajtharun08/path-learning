import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Compass } from 'lucide-react-native';
import DashboardScreen from '../screens/DashboardScreen';
import PathsScreen from '../screens/PathsScreen';
import Colors from '../theme/Colors';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') {
            return <Home color={color} size={size} />;
          } else if (route.name === 'Paths') {
            return <Compass color={color} size={size} />;
          }
        },
        tabBarActiveTintColor: Colors.primaryDark,
        tabBarInactiveTintColor: Colors.textSilver,
        tabBarStyle: {
          backgroundColor: Colors.bgWhite,
          borderTopWidth: 1,
          borderTopColor: Colors.borderLight2,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Paths" component={PathsScreen} />
    </Tab.Navigator>
  );
}
