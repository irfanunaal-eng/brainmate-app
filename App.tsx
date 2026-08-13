
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
import { ClassTeacherDashboardScreen } from './screens/ClassTeacherDashboardScreen';
import { PrivateTutorDashboardScreen } from './screens/PrivateTutorDashboardScreen';
import { StudentCoachDashboardScreen } from './screens/StudentCoachDashboardScreen';
import { GradesScreen } from './screens/GradesScreen';
import { AttendanceScreen } from './screens/AttendanceScreen';
import { NotesScreen } from './screens/NotesScreen';

import LocationTrackingScreen from './screens/LocationTrackingScreen';
import { GameLobbyScreen } from './screens/GameLobbyScreen';
import { EnglishGameScreen } from './screens/EnglishGameScreen';

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
        <Stack.Screen name="ClassTeacherDashboard" component={ClassTeacherDashboardScreen} />
        <Stack.Screen name="PrivateTutorDashboard" component={PrivateTutorDashboardScreen} />
        <Stack.Screen name="StudentCoachDashboard" component={StudentCoachDashboardScreen} />
        <Stack.Screen name="ScheduleScreen" component={ScheduleScreen} options={{ headerShown: false }} />
        <Stack.Screen name="GradesScreen" component={GradesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AttendanceScreen" component={AttendanceScreen} options={{ headerShown: false }} />
        <Stack.Screen name="NotesScreen" component={NotesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="LocationTrackingScreen" component={LocationTrackingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="GameLobbyScreen" component={GameLobbyScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EnglishGameScreen" component={EnglishGameScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
