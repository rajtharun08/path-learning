import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Compass, ShieldCheck, Search } from 'lucide-react-native';
import DashboardScreen from '../screens/DashboardScreen';
import PathsScreen from '../screens/PathsScreen';
import AdminCoursesScreen from '../screens/AdminCoursesScreen';
import { getAuthSession } from '../constants/Auth';
import Colors from '../theme/Colors';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const authSession = await getAuthSession();
      if (isMounted) {
        setSession(authSession);
      }
    };

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const isAdminView = ['admin', 'staff'].includes((session?.role || '').toLowerCase());

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Dashboard') {
            return <LayoutDashboard color={color} size={size} />;
          } else if (route.name === 'Paths') {
            return <Compass color={color} size={size} />;
          } else if (route.name === 'Admin') {
            return <ShieldCheck color={color} size={size} />;
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
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Paths" component={PathsScreen} />
      {isAdminView ? <Tab.Screen name="Admin" component={AdminCoursesScreen} /> : null}
    </Tab.Navigator>
  );
}
