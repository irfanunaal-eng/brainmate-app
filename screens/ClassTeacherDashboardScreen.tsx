import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export function ClassTeacherDashboardScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState('students');
  const [taskText, setTaskText] = useState('');

  const dummyStudents = [
    { id: '1', name: 'Ahmet Yılmaz', grade: '12-A', status: 'Devamsızlık Sınırda' },
    { id: '2', name: 'Ayşe Kaya', grade: '12-A', status: 'Sorun Yok' },
  ];

  const handleAssignTask = () => {
    if (!taskText) {
      Alert.alert('Hata', 'Lütfen sınıfınız için bir mesaj yazın.');
      return;
    }
    Alert.alert('Başarılı', 'Sınıf öğrencilerine duyuru başarıyla gönderildi!');
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
            <Text className="text-3xl font-extrabold text-amber-900">Sınıf Öğretmeni</Text>
            <Text className="text-gray-500 font-medium">Sınıfını buradan yönetebilirsin.</Text>
          </View>
          <TouchableOpacity 
            className="bg-amber-50 px-4 py-3 rounded-xl flex-row items-center border border-amber-100"
            onPress={handleLogout}
          >
            <Text className="text-amber-800 font-bold">🏠 Ana Ekran</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Menüsü */}
        <View className="flex-row mb-6 bg-gray-100 p-1 rounded-2xl">
          <TouchableOpacity 
            onPress={() => setActiveTab('students')}
            className={`flex-1 py-3 items-center rounded-xl ${activeTab === 'students' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-bold ${activeTab === 'students' ? 'text-amber-600' : 'text-gray-500'}`}>Sınıfım (12-A)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('tasks')}
            className={`flex-1 py-3 items-center rounded-xl ${activeTab === 'tasks' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-bold ${activeTab === 'tasks' ? 'text-amber-600' : 'text-gray-500'}`}>Sınıfa Duyuru</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'students' ? (
          <View>
            <Text className="text-xl font-extrabold text-gray-800 mb-4">Yoklama ve Sınıf Listesi</Text>
            {dummyStudents.map((student) => (
              <View key={student.id} className="bg-white p-4 rounded-2xl mb-3 border border-gray-100 shadow-sm flex-row justify-between items-center">
                <View>
                  <Text className="font-extrabold text-gray-800 text-lg">{student.name}</Text>
                  <Text className="text-amber-600 font-bold text-sm">{student.status}</Text>
                </View>
                <TouchableOpacity className="bg-amber-100 px-4 py-2 rounded-xl">
                  <Text className="text-amber-800 font-bold">Detay</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View>
            <Text className="text-xl font-extrabold text-gray-800 mb-4">Sınıf Genel Duyuru</Text>
            <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-6">
              <TextInput 
                className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-700 h-24 mb-4"
                placeholder="Örn: Yarınki veli toplantısına tüm velilerin katılımı zorunludur."
                multiline
                textAlignVertical="top"
                value={taskText}
                onChangeText={setTaskText}
              />
              <TouchableOpacity onPress={handleAssignTask} className="bg-amber-500 py-4 rounded-xl items-center shadow-sm">
                <Text className="text-white font-bold text-lg">Duyuru Gönder</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}
