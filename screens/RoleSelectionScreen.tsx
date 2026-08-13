import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';

export function RoleSelectionScreen({ navigation }: any) {
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // Find role from profiles
      const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (data && data.role) {
        if (data.role === 'student') navigation.replace('StudentDashboard');
        else if (data.role === 'teacher') navigation.replace('TeacherDashboard');
        // Parent, Class Teacher, Private Tutor, and Student Coach all share the ParentDashboard tracking system
        else navigation.replace('ParentDashboard');
        return;
      }
    }
    setCheckingAuth(false);
  };

  const selectRole = (role: string) => {
    navigation.navigate('Login', { role });
  };

  return (
    <SafeAreaView className="flex-1" style={{ flex: 1, backgroundColor: '#4ECDC4' }}>
      {checkingAuth ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-gray-500 font-bold mt-4 text-lg">Oturum kontrol ediliyor...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-6 pt-10" style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40 }} showsVerticalScrollIndicator={false}>
          <View className="mb-12 items-center">
            <Text className="text-6xl font-extrabold mb-2" style={{ color: '#FFFFFF', textShadowColor: 'rgba(0, 0, 0, 0.1)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>BrainMate</Text>
            <Text className="text-lg text-center font-bold" style={{ color: '#0F4C5C' }}>
              Sana en uygun rolü seçerek başlayalım
            </Text>
          </View>

        <View className="pb-12">
          <TouchableOpacity 
            onPress={() => selectRole('student')}
            className="bg-blue-50 px-6 py-5 mb-4 rounded-2xl flex-row items-center justify-between shadow-sm active:bg-blue-100 border border-blue-200"
          >
            <View className="flex-1 pr-4">
              <Text className="text-xl font-extrabold text-blue-800">Öğrenci</Text>
              <Text className="text-blue-600/80 text-xs mt-1 font-medium">Ders çalış, oyun oyna, netlerini gör</Text>
            </View>
            <Text className="text-2xl">🎓</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => selectRole('parent')}
            className="bg-rose-50 px-6 py-5 mb-4 rounded-2xl flex-row items-center justify-between shadow-sm active:bg-rose-100 border border-rose-200"
          >
            <View className="flex-1 pr-4">
              <Text className="text-xl font-extrabold text-rose-800">Veli</Text>
              <Text className="text-rose-600/80 text-xs mt-1 font-medium">Öğrencinin ilerlemesini anlık takip et</Text>
            </View>
            <Text className="text-2xl">👨‍👩‍👧</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => selectRole('teacher')}
            className="bg-purple-50 px-6 py-5 mb-4 rounded-2xl flex-row items-center justify-between shadow-sm active:bg-purple-100 border border-purple-200"
          >
            <View className="flex-1 pr-4">
              <Text className="text-xl font-extrabold text-purple-800">Rehber Öğretmen</Text>
              <Text className="text-purple-600/80 text-xs mt-1 font-medium">Sınıfları yönet, toplu planlar hazırla</Text>
            </View>
            <Text className="text-2xl">👨‍🏫</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => selectRole('class_teacher')}
            className="bg-amber-50 px-6 py-5 mb-4 rounded-2xl flex-row items-center justify-between shadow-sm active:bg-amber-100 border border-amber-200"
          >
            <View className="flex-1 pr-4">
              <Text className="text-xl font-extrabold text-amber-800">Sınıf Rehber Öğretmeni</Text>
              <Text className="text-amber-700/80 text-xs mt-1 font-medium">Sınıf öğrencilerinin görevlerini takip et</Text>
            </View>
            <Text className="text-2xl">📝</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => selectRole('private_tutor')}
            className="bg-emerald-50 px-6 py-5 mb-4 rounded-2xl flex-row items-center justify-between shadow-sm active:bg-emerald-100 border border-emerald-200"
          >
            <View className="flex-1 pr-4">
              <Text className="text-xl font-extrabold text-emerald-800">Özel Ders Öğretmeni</Text>
              <Text className="text-emerald-700/80 text-xs mt-1 font-medium">Öğrenciye özel ders hedefleri belirle</Text>
            </View>
            <Text className="text-2xl">💡</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => selectRole('student_coach')}
            className="bg-indigo-100 px-6 py-5 mb-4 rounded-2xl flex-row items-center justify-between shadow-sm active:bg-indigo-200 border border-indigo-200"
          >
            <View className="flex-1 pr-4">
              <Text className="text-xl font-extrabold text-indigo-800">Öğrenci Koçu</Text>
              <Text className="text-indigo-600/80 text-xs mt-1 font-medium">Birebir gelişim takip ve strateji planla</Text>
            </View>
            <Text className="text-2xl">🎯</Text>
          </TouchableOpacity>
          
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
