import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export function StudentCoachDashboardScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState('students');
  const [taskText, setTaskText] = useState('');

  const dummyStudents = [
    { id: '1', name: 'Zeynep Çelik', goal: 'Tıp Fakültesi', status: 'Denemelerde Artış Var' },
  ];

  const handleAssignTask = () => {
    if (!taskText) {
      Alert.alert('Hata', 'Lütfen bir strateji veya hedef yazın.');
      return;
    }
    Alert.alert('Başarılı', 'Öğretim stratejisi öğrenciye başarıyla gönderildi.');
    setTaskText('');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      navigation.replace('RoleSelection');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1">
      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-center mb-6 mt-2">
          <View>
            <Text className="text-3xl font-extrabold text-indigo-900">Öğrenci Koçu</Text>
            <Text className="text-gray-500 font-medium">Strateji ve Akademik Takip</Text>
          </View>
          <TouchableOpacity 
            className="bg-indigo-50 px-4 py-3 rounded-xl flex-row items-center border border-indigo-100"
            onPress={handleLogout}
          >
            <Text className="text-indigo-800 font-bold">🏠 Ana Ekran</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Menüsü */}
        <View className="flex-row mb-6 bg-gray-100 p-1 rounded-2xl">
          <TouchableOpacity 
            onPress={() => setActiveTab('students')}
            className={`flex-1 py-3 items-center rounded-xl ${activeTab === 'students' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-bold ${activeTab === 'students' ? 'text-indigo-600' : 'text-gray-500'}`}>Koçluk Öğrencileri</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('tasks')}
            className={`flex-1 py-3 items-center rounded-xl ${activeTab === 'tasks' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-bold ${activeTab === 'tasks' ? 'text-indigo-600' : 'text-gray-500'}`}>Strateji Gir</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'students' ? (
          <View>
            <Text className="text-xl font-extrabold text-gray-800 mb-4">Takip Edilenler</Text>
            {dummyStudents.map((student) => (
              <View key={student.id} className="bg-white p-4 rounded-2xl mb-3 border border-gray-100 shadow-sm flex-row justify-between items-center">
                <View>
                  <Text className="font-extrabold text-gray-800 text-lg">{student.name}</Text>
                  <Text className="text-indigo-600 font-bold text-sm">🎯 {student.goal} • {student.status}</Text>
                </View>
                <TouchableOpacity className="bg-indigo-100 px-4 py-2 rounded-xl" onPress={() => navigation.navigate('ScheduleScreen', { studentId: student.id })}>
                  <Text className="text-indigo-800 font-bold">İlerleme</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View>
            <Text className="text-xl font-extrabold text-gray-800 mb-4">Yeni Haftalık Strateji</Text>
            <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-6">
              <TextInput 
                className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-700 h-24 mb-4"
                placeholder="Örn: Bu hafta özellikle TYT denemesinde süre tutarak çözeceğiz."
                multiline
                textAlignVertical="top"
                value={taskText}
                onChangeText={setTaskText}
              />
              <TouchableOpacity onPress={handleAssignTask} className="bg-indigo-500 py-4 rounded-xl items-center shadow-sm">
                <Text className="text-white font-bold text-lg">Strateji Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}
