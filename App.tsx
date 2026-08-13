
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { RoleSelectionScreen } from './screens/RoleSelectionScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import { LoginScreen } from './screens/LoginScreen';
import { StudentDashboardScreen } from './screens/StudentDashboardScreen';
import { ParentDashboardScreen } from './screens/ParentDashboardScreen';
import { TeacherDashboardScreen } from './screens/TeacherDashboardScreen';
import { SocialDashboardScreen } from './screens/SocialDashboardScreen';
import { EducationDashboardScreen } from './screens/EducationDashboardScreen';
import { AcademicDashboardScreen } from './screens/AcademicDashboardScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen} />
        <Stack.Screen name="ParentDashboard" component={ParentDashboardScreen} />
        <Stack.Screen name="TeacherDashboard" component={TeacherDashboardScreen} />
        <Stack.Screen name="SocialDashboard" component={SocialDashboardScreen} />
        <Stack.Screen name="EducationDashboard" component={EducationDashboardScreen} />
        <Stack.Screen name="AcademicDashboard" component={AcademicDashboardScreen} />
        <Stack.Screen name="ScheduleScreen" component={ScheduleScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
