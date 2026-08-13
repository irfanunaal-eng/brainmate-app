import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export function TeacherDashboardScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState('students');
  const [taskText, setTaskText] = useState('');

  const dummyStudents = [
    { id: '1', name: 'Ahmet Yılmaz', grade: '12-A', status: 'Sınava Hazırlanıyor' },
    { id: '2', name: 'Ayşe Kaya', grade: '11-B', status: 'Eksikleri Var' },
    { id: '3', name: 'Mehmet Demir', grade: '8-C', status: 'LGS Hedefli' },
  ];

  const handleAssignTask = () => {
    if (!taskText) {
      Alert.alert('Hata', 'Lütfen bir görev açıklaması yazın.');
      return;
    }
    Alert.alert('Başarılı', 'Görev tüm öğrencilere başarıyla atandı!');
    setTaskText('');
  };

  const handleUploadPDF = () => {
    Alert.alert('Dosya Yükleme', 'PDF yükleme penceresi açılıyor...');
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
            <Text className="text-3xl font-extrabold text-text">Rehber Öğretmen</Text>
            <Text className="text-gray-500 font-medium">Hoş geldiniz, Hocam.</Text>
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
            <Text className={`font-bold ${activeTab === 'students' ? 'text-primary' : 'text-gray-500'}`}>Öğrencilerim</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('tasks')}
            className={`flex-1 py-3 items-center rounded-xl ${activeTab === 'tasks' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-bold ${activeTab === 'tasks' ? 'text-primary' : 'text-gray-500'}`}>Görev Ata</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'students' ? (
          <View>
            <Text className="text-xl font-extrabold text-gray-800 mb-4">Bağlı Öğrenciler</Text>
            {dummyStudents.map((student) => (
              <View key={student.id} className="bg-white p-4 rounded-2xl mb-3 border border-gray-100 shadow-sm flex-row justify-between items-center">
                <View>
                  <Text className="font-extrabold text-gray-800 text-lg">{student.name}</Text>
                  <Text className="text-secondary font-bold text-sm">{student.grade} • {student.status}</Text>
                </View>
                <TouchableOpacity className="bg-primary/10 px-4 py-2 rounded-xl">
                  <Text className="text-primary font-bold">İncele</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            <TouchableOpacity className="bg-white border-2 border-dashed border-gray-300 p-4 rounded-2xl mt-4 items-center">
              <Text className="text-gray-400 font-bold">+ Yeni Öğrenci Ekle (Kod ile)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text className="text-xl font-extrabold text-gray-800 mb-4">Toplu Görev veya Dosya Ata</Text>
            
            <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-6">
              <Text className="font-bold text-gray-700 mb-2">Görev Açıklaması</Text>
              <TextInput 
                className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-700 h-24 mb-4"
                placeholder="Örn: 1. Ünite testini hafta sonuna kadar bitirin."
                multiline
                textAlignVertical="top"
                value={taskText}
                onChangeText={setTaskText}
              />
              <TouchableOpacity 
                onPress={handleAssignTask}
                className="bg-primary py-4 rounded-xl items-center shadow-sm"
              >
                <Text className="text-white font-bold text-lg">Gönder (Tüm Öğrencilere)</Text>
              </TouchableOpacity>
            </View>

            <View className="bg-tertiary/20 p-6 rounded-3xl border border-tertiary/40 items-center">
              <Text className="font-extrabold text-gray-800 mb-2 text-lg">PDF Ders Notu Gönder</Text>
              <Text className="text-gray-600 mb-4 text-center text-sm">Öğrencilerin paneline düşecek bir deneme sınavı veya test PDF'i yükleyin.</Text>
              <TouchableOpacity 
                onPress={handleUploadPDF}
                className="bg-white border border-gray-300 w-full py-4 rounded-xl items-center shadow-sm"
              >
                <Text className="text-gray-700 font-bold text-lg">📂 Dosya Seç (PDF)</Text>
              </TouchableOpacity>
            </View>

          </View>
        )}

      </ScrollView>

        {/* Scrollable Bottom Navigation Bar */}
        <View 
          className="bg-white border-t border-gray-100 pt-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
          style={{ paddingBottom: 16 }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            <TouchableOpacity onPress={handleLogout} className="items-center justify-center bg-indigo-50 border-2 border-indigo-100 w-[56px] h-[56px] rounded-2xl mr-4">
              <Text className="text-4xl">🏠</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => navigation.navigate('ScheduleScreen')} className="items-center justify-center bg-orange-50 border-2 border-orange-100 w-[56px] h-[56px] rounded-2xl mr-4">
              <Text className="text-4xl">🗓️</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => Alert.alert('Yakında', 'Görev atama ekranı eklenecek.')} className="items-center justify-center bg-rose-50 border-2 border-rose-100 w-[56px] h-[56px] rounded-2xl mr-4">
              <Text className="text-4xl">🎯</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => Alert.alert('Yakında', 'Öğrenci hakkında özel not alma ekranı eklenecek.')} className="items-center justify-center bg-purple-50 border-2 border-purple-100 w-[56px] h-[56px] rounded-2xl mr-4">
              <Text className="text-4xl">✍️</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => Alert.alert('Yakında', 'Öğrencinin eğitim ve kronometre performansını görebileceksin.')} className="items-center justify-center bg-emerald-50 border-2 border-emerald-100 w-[56px] h-[56px] rounded-2xl mr-4">
              <Text className="text-4xl">📚</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => Alert.alert('Yakında', 'Öğrencinin detaylı raporları eklenecek.')} className="items-center justify-center bg-amber-50 border-2 border-amber-100 w-[56px] h-[56px] rounded-2xl mr-4">
              <Text className="text-4xl">📊</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => Alert.alert('Yakında', 'Öğrenciye mesaj gönder.')} className="items-center justify-center bg-blue-50 border-2 border-blue-100 w-[56px] h-[56px] rounded-2xl">
              <Text className="text-4xl">💬</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}
