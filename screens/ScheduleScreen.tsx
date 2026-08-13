import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Modal, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { scanScheduleImage, ParsedSchedule } from '../lib/ai-scanner';

const DAYS = [
  { id: 1, name: 'Pzt' },
  { id: 2, name: 'Sal' },
  { id: 3, name: 'Çar' },
  { id: 4, name: 'Per' },
  { id: 5, name: 'Cum' },
  { id: 6, name: 'Cmt' },
  { id: 7, name: 'Paz' },
];

const SCHEDULE_TYPES = [
  { id: 'okul', label: '🏫 Okul', color: 'bg-blue-100 border-blue-200 text-blue-800' },
  { id: 'dersane', label: '🏢 Dershane', color: 'bg-orange-100 border-orange-200 text-orange-800' },
  { id: 'ozel_ders', label: '👨‍🏫 Özel Ders', color: 'bg-purple-100 border-purple-200 text-purple-800' },
  { id: 'etut', label: '📚 Etüt / Bireysel', color: 'bg-emerald-100 border-emerald-200 text-emerald-800' }
];

export default function ScheduleScreen({ navigation, route }: any) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('okul');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('09:40');
  const [newMaterials, setNewMaterials] = useState('');
  const [newIsReminder, setNewIsReminder] = useState(false);
  const [newReminderMinutes, setNewReminderMinutes] = useState('15');

  // AI Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [previewSchedules, setPreviewSchedules] = useState<ParsedSchedule[]>([]);

  // If passed from parent/teacher dashboard
  const passedStudentId = route.params?.studentId;

  useEffect(() => {
    fetchUserDataAndSchedules();
  }, [selectedDay]);

  const fetchUserDataAndSchedules = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      const role = profile?.role || 'student';
      setUserRole(role);

      // Determine whose schedule to fetch
      let targetStudentId = user.id;
      if (role !== 'student' && passedStudentId) {
        targetStudentId = passedStudentId;
      } else if (role !== 'student') {
        // Fallback for demo: just fetch anything they created if no student passed
        // In a real app, we'd select a student first.
      }

      let query = supabase
        .from('schedules')
        .select('*')
        .eq('day_of_week', selectedDay)
        .order('start_time', { ascending: true });

      if (role === 'student' || passedStudentId) {
        query = query.eq('student_id', targetStudentId);
      } else {
        query = query.eq('creator_id', user.id);
      }

      const { data: schedulesData, error } = await query;

      if (error) throw error;
      setSchedules(schedulesData || []);
    } catch (error: any) {
      console.error('Error fetching schedules:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!newTitle.trim() || !newStartTime.trim() || !newEndTime.trim()) {
      Alert.alert('Hata', 'Lütfen ders adı, başlangıç ve bitiş saatlerini doldurun.');
      return;
    }

    try {
      setIsLoading(true);
      // Format times to HH:MM:00 for postgres TIME type
      const formattedStart = newStartTime.includes(':') && newStartTime.length === 5 ? `${newStartTime}:00` : newStartTime;
      const formattedEnd = newEndTime.includes(':') && newEndTime.length === 5 ? `${newEndTime}:00` : newEndTime;

      let targetStudentId = currentUserId;
      if (userRole !== 'student' && passedStudentId) {
        targetStudentId = passedStudentId;
      }

      const { error } = await supabase.from('schedules').insert([
        {
          student_id: targetStudentId,
          creator_id: currentUserId,
          day_of_week: selectedDay,
          start_time: formattedStart,
          end_time: formattedEnd,
          title: newTitle.trim(),
          schedule_type: newType,
          materials_needed: newMaterials.trim() || null,
          is_reminder_active: newIsReminder,
          reminder_minutes: parseInt(newReminderMinutes) || 15
        }
      ]);

      if (error) throw error;

      setIsModalVisible(false);
      resetForm();
      fetchUserDataAndSchedules();
      Alert.alert('Başarılı', 'Ders programı başarıyla eklendi!');
    } catch (error: any) {
      Alert.alert('Hata', error.message);
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Dersi Sil",
      "Bu dersi programdan silmek istediğine emin misin?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from('schedules').delete().eq('id', id);
              if (error) throw error;
              fetchUserDataAndSchedules();
            } catch (error: any) {
              Alert.alert('Hata', error.message);
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setNewTitle('');
    setNewType('okul');
    setNewStartTime('09:00');
    setNewEndTime('09:40');
    setNewMaterials('');
    setNewIsReminder(false);
    setNewReminderMinutes('15');
  };

  const handlePickImage = async (useCamera: boolean = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Gerekli', 'Kamerayı kullanabilmek için izin vermelisin.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          base64: true,
          quality: 0.5,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Gerekli', 'Galeriyi kullanabilmek için izin vermelisin.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          base64: true,
          quality: 0.5,
        });
      }

      if (!result.canceled && result.assets[0].base64) {
        setIsModalVisible(false); // Close add modal
        setIsScanning(true); // Start loading animation

        const parsedData = await scanScheduleImage(result.assets[0].base64);
        
        if (parsedData && parsedData.length > 0) {
          setPreviewSchedules(parsedData);
          setIsPreviewModalVisible(true);
        } else {
          Alert.alert('Bulunamadı', 'Görselde anlaşılır bir ders programı bulunamadı.');
        }
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Görsel işlenirken bir sorun oluştu.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSavePreviewSchedules = async () => {
    try {
      setIsScanning(true);
      
      let targetStudentId = currentUserId;
      if (userRole !== 'student' && passedStudentId) {
        targetStudentId = passedStudentId;
      }

      const rowsToInsert = previewSchedules.map(sch => ({
        student_id: targetStudentId,
        creator_id: currentUserId,
        day_of_week: sch.day_of_week,
        start_time: sch.start_time,
        end_time: sch.end_time,
        title: sch.title,
        schedule_type: sch.schedule_type,
        materials_needed: null,
        is_reminder_active: false,
        reminder_minutes: 15
      }));

      const { error } = await supabase.from('schedules').insert(rowsToInsert);
      if (error) throw error;

      setIsPreviewModalVisible(false);
      setPreviewSchedules([]);
      fetchUserDataAndSchedules();
      Alert.alert('Harika! 🎉', `${rowsToInsert.length} adet ders başarıyla eklendi.`);
    } catch (error: any) {
      Alert.alert('Kayıt Hatası', error.message);
    } finally {
      setIsScanning(false);
    }
  };

  const getTypeStyle = (typeId: string) => {
    const type = SCHEDULE_TYPES.find(t => t.id === typeId);
    return type?.color || 'bg-gray-100 border-gray-200 text-gray-800';
  };

  const getTypeLabel = (typeId: string) => {
    const type = SCHEDULE_TYPES.find(t => t.id === typeId);
    return type?.label || typeId;
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    // Postgres returns "09:00:00", we want "09:00"
    return timeString.substring(0, 5);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white shadow-sm z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full">
          <Text className="text-xl">🔙</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-extrabold text-gray-800">Ajanda</Text>
        <View className="w-10 h-10" />
      </View>

      {/* Days Tabs */}
      <View className="bg-white pb-3 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {DAYS.map(day => (
            <TouchableOpacity
              key={day.id}
              onPress={() => setSelectedDay(day.id)}
              className={`mr-3 px-5 py-3 rounded-2xl border-2 ${
                selectedDay === day.id 
                  ? 'bg-orange-50 border-orange-200' 
                  : 'bg-gray-50 border-transparent'
              }`}
            >
              <Text className={`font-bold ${selectedDay === day.id ? 'text-orange-600' : 'text-gray-500'}`}>
                {day.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Schedule List */}
      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#f97316" className="mt-10" />
        ) : schedules.length === 0 ? (
          <View className="items-center justify-center mt-20">
            <Text className="text-6xl mb-4">🧘‍♂️</Text>
            <Text className="text-gray-500 text-lg font-medium text-center">Bu gün için planlanmış{'\n'}herhangi bir dersin yok.</Text>
            <Text className="text-gray-400 text-center mt-2">Sağ alttaki + butonuna basarak{'\n'}yeni bir ders ekleyebilirsin.</Text>
          </View>
        ) : (
          schedules.map((schedule) => (
            <View key={schedule.id} className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-gray-100 relative">
              
              {/* Type Badge & Reminder */}
              <View className="flex-row justify-between items-start mb-3">
                <View className={`px-3 py-1 rounded-full border ${getTypeStyle(schedule.schedule_type).split(' ')[0]} ${getTypeStyle(schedule.schedule_type).split(' ')[1]}`}>
                  <Text className={`text-xs font-bold ${getTypeStyle(schedule.schedule_type).split(' ')[2]}`}>
                    {getTypeLabel(schedule.schedule_type)}
                  </Text>
                </View>
                <View className="flex-row space-x-2">
                  {schedule.materials_needed && (
                    <View className="bg-amber-100 w-8 h-8 rounded-full items-center justify-center">
                      <Text>🎒</Text>
                    </View>
                  )}
                  {schedule.is_reminder_active && (
                    <View className="bg-rose-100 w-8 h-8 rounded-full items-center justify-center">
                      <Text>🔔</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Time & Title */}
              <View className="flex-row items-center mb-4">
                <View className="bg-gray-50 px-3 py-2 rounded-xl mr-4 border border-gray-100">
                  <Text className="text-gray-800 font-black text-lg">{formatTime(schedule.start_time)}</Text>
                  <Text className="text-gray-400 font-bold text-xs text-center">{formatTime(schedule.end_time)}</Text>
                </View>
                <Text className="flex-1 text-xl font-bold text-gray-800" numberOfLines={2}>
                  {schedule.title}
                </Text>
              </View>

              {/* Materials */}
              {schedule.materials_needed && (
                <View className="bg-amber-50 p-3 rounded-xl mb-4 border border-amber-100">
                  <Text className="text-amber-800 font-semibold text-sm mb-1">🎒 Alınacaklar:</Text>
                  <Text className="text-amber-700 text-sm">{schedule.materials_needed}</Text>
                </View>
              )}

              {/* Actions */}
              <View className="flex-row justify-end mt-2 pt-4 border-t border-gray-50">
                <TouchableOpacity onPress={() => handleDelete(schedule.id)} className="bg-red-50 px-4 py-2 rounded-xl">
                  <Text className="text-red-600 font-bold">🗑️ Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB - Add Button */}
      <TouchableOpacity 
        onPress={() => setIsModalVisible(true)}
        className="absolute bottom-8 right-6 w-16 h-16 bg-orange-500 rounded-full items-center justify-center shadow-lg shadow-orange-500/30"
      >
        <Text className="text-white text-3xl font-light">+</Text>
      </TouchableOpacity>

      {/* Add Schedule Modal */}
      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100">
            <Text className="text-2xl font-bold text-gray-800">Ders / Etüt Ekle</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)} className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center">
              <Text className="text-lg">❌</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 pt-6">
            
            {/* AI Image Scanner Buttons */}
            <View className="bg-indigo-50 rounded-2xl p-4 mb-8 border border-indigo-100">
              <Text className="text-indigo-800 font-bold mb-3 text-center">🤖 Fotoğraftan Otomatik Ekle</Text>
              <View className="flex-row justify-between space-x-3">
                <TouchableOpacity onPress={() => handlePickImage(true)} className="flex-1 bg-white border border-indigo-200 py-3 rounded-xl items-center shadow-sm">
                  <Text className="text-2xl mb-1">📸</Text>
                  <Text className="text-indigo-700 font-semibold text-xs">Kamera</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handlePickImage(false)} className="flex-1 bg-white border border-indigo-200 py-3 rounded-xl items-center shadow-sm">
                  <Text className="text-2xl mb-1">🖼️</Text>
                  <Text className="text-indigo-700 font-semibold text-xs">Galeri</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-indigo-400 text-xs text-center mt-3">Programın fotoğrafını çek, yapay zeka senin yerine doldursun!</Text>
            </View>

            <View className="flex-row items-center justify-center mb-8">
              <View className="h-[1px] bg-gray-200 flex-1" />
              <Text className="text-gray-400 mx-4 font-medium">veya manuel ekle</Text>
              <View className="h-[1px] bg-gray-200 flex-1" />
            </View>

            <Text className="text-gray-500 font-semibold mb-2">Ders Adı</Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Örn: Matematik, Fizik Özel Ders"
              className="bg-gray-50 px-4 py-4 rounded-2xl mb-6 border border-gray-200 text-lg font-medium"
            />

            <Text className="text-gray-500 font-semibold mb-2">Tür</Text>
            <View className="bg-gray-50 rounded-2xl mb-6 border border-gray-200 overflow-hidden">
              <Picker
                selectedValue={newType}
                onValueChange={(itemValue: any) => setNewType(itemValue)}
              >
                {SCHEDULE_TYPES.map(type => (
                  <Picker.Item key={type.id} label={type.label} value={type.id} />
                ))}
              </Picker>
            </View>

            <View className="flex-row justify-between mb-6">
              <View className="flex-1 mr-2">
                <Text className="text-gray-500 font-semibold mb-2">Başlangıç (SS:DD)</Text>
                <TextInput
                  value={newStartTime}
                  onChangeText={setNewStartTime}
                  placeholder="09:00"
                  className="bg-gray-50 px-4 py-4 rounded-2xl border border-gray-200 text-lg font-bold text-center"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-gray-500 font-semibold mb-2">Bitiş (SS:DD)</Text>
                <TextInput
                  value={newEndTime}
                  onChangeText={setNewEndTime}
                  placeholder="09:40"
                  className="bg-gray-50 px-4 py-4 rounded-2xl border border-gray-200 text-lg font-bold text-center"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            </View>

            <Text className="text-amber-600 font-bold mb-2">🎒 Alınacak Eşyalar (İsteğe Bağlı)</Text>
            <TextInput
              value={newMaterials}
              onChangeText={setNewMaterials}
              placeholder="Örn: Eşofman takımı, Pergel seti"
              className="bg-amber-50 px-4 py-4 rounded-2xl mb-6 border border-amber-200 text-lg text-amber-800"
              multiline
            />

            {/* Reminder Toggle */}
            <TouchableOpacity 
              onPress={() => setNewIsReminder(!newIsReminder)}
              className={`flex-row justify-between items-center px-5 py-4 rounded-2xl mb-4 border ${newIsReminder ? 'bg-rose-50 border-rose-200' : 'bg-gray-50 border-gray-200'}`}
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">🔔</Text>
                <Text className={`text-lg font-bold ${newIsReminder ? 'text-rose-700' : 'text-gray-500'}`}>Hatırlatıcı Ayarla</Text>
              </View>
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${newIsReminder ? 'border-rose-500 bg-rose-500' : 'border-gray-300'}`}>
                {newIsReminder && <Text className="text-white text-xs">✓</Text>}
              </View>
            </TouchableOpacity>

            {newIsReminder && (
              <View className="flex-row items-center justify-between bg-rose-50 px-5 py-3 rounded-2xl mb-6 border border-rose-100">
                <Text className="text-rose-800 font-medium">Dersten kaç dakika önce?</Text>
                <TextInput
                  value={newReminderMinutes}
                  onChangeText={setNewReminderMinutes}
                  keyboardType="numeric"
                  className="bg-white px-4 py-2 rounded-xl font-bold text-rose-700 border border-rose-200 w-20 text-center"
                  maxLength={3}
                />
              </View>
            )}

            <TouchableOpacity 
              onPress={handleAddSchedule}
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl items-center mb-10 ${isLoading ? 'bg-orange-300' : 'bg-orange-500 shadow-md shadow-orange-500/30'}`}
            >
              <Text className="text-white font-bold text-xl">{isLoading ? 'Ekleniyor...' : 'Kaydet'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* AI Preview Modal */}
      <Modal visible={isPreviewModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-indigo-100 bg-indigo-50">
            <Text className="text-xl font-bold text-indigo-800">🤖 Bulunan Dersler</Text>
            <TouchableOpacity onPress={() => setIsPreviewModalVisible(false)} className="bg-indigo-100 w-10 h-10 rounded-full items-center justify-center">
              <Text className="text-lg">❌</Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 px-6 pt-4">
            <Text className="text-gray-500 mb-4 text-center">Yapay zeka aşağıdaki programı tespit etti. Kaydetmek istiyor musun?</Text>
            {previewSchedules.map((sch, idx) => (
              <View key={idx} className="bg-gray-50 p-4 rounded-xl mb-3 border border-gray-100 flex-row items-center justify-between">
                <View>
                  <Text className="font-bold text-gray-800 text-lg">{sch.title}</Text>
                  <Text className="text-gray-500 text-sm">
                    {DAYS.find(d => d.id === sch.day_of_week)?.name} • {formatTime(sch.start_time)} - {formatTime(sch.end_time)}
                  </Text>
                </View>
                <View className="bg-indigo-100 px-3 py-1 rounded-full">
                  <Text className="text-indigo-800 text-xs font-bold">{getTypeLabel(sch.schedule_type).split(' ')[1] || sch.schedule_type}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View className="p-6 border-t border-gray-100 bg-white">
            <TouchableOpacity 
              onPress={handleSavePreviewSchedules}
              disabled={isScanning}
              className={`w-full py-4 rounded-2xl items-center ${isScanning ? 'bg-indigo-300' : 'bg-indigo-600 shadow-md shadow-indigo-500/30'}`}
            >
              <Text className="text-white font-bold text-xl">{isScanning ? 'Kaydediliyor...' : 'Tümünü Kaydet'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Global Loading Overlay for AI */}
      {isScanning && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center z-50">
          <View className="bg-white p-8 rounded-3xl items-center shadow-2xl">
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text className="text-indigo-600 font-bold text-lg mt-4">Yapay Zeka Analiz Ediyor...</Text>
            <Text className="text-gray-500 text-sm mt-2 text-center">Bu işlem birkaç saniye sürebilir,{'\n'}lütfen bekle.</Text>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}
