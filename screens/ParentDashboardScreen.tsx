import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { supabase } from '../lib/supabase';

export function ParentDashboardScreen({ navigation }: any) {
  const [pairingCode, setPairingCode] = useState('');
  const [isPaired, setIsPaired] = useState(false);
  const [studentName, setStudentName] = useState('Öğrenci');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [panelTitle, setPanelTitle] = useState('Eğitimci Paneli');
  
  // Task assignment state
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState('50');
  const [assigningTask, setAssigningTask] = useState(false);

  useEffect(() => {
    checkExistingPairing();
  }, []);

  const checkExistingPairing = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile) {
        if (profile.role === 'parent') setPanelTitle('Veli Paneli');
        else if (profile.role === 'class_teacher') setPanelTitle('Sınıf Rehber Öğretmeni Paneli');
        else if (profile.role === 'private_tutor') setPanelTitle('Özel Ders Öğretmeni Paneli');
        else if (profile.role === 'student_coach') setPanelTitle('Öğrenci Koçu Paneli');
      }

      const { data, error } = await supabase
        .from('parent_student_links')
        .select(`
          student_id,
          profiles:student_id ( full_name, role )
        `)
        .eq('parent_id', user.id)
        .limit(1);
      
      if (data && data.length > 0) {
        setIsPaired(true);
        setStudentId(data[0].student_id);
        // Fallback for full_name if null, use email or generic
        setStudentName((data[0].profiles as any)?.full_name || 'Öğrenci');
      }
    }
    setLoading(false);
  };

  const handlePairing = async () => {
    setErrorMessage('');
    if (pairingCode.length < 6) {
      setErrorMessage('Lütfen 6 haneli kodu eksiksiz girin.');
      return;
    }
    
    setLoading(true);
    // Find student by pairing code
    const { data: studentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('pairing_code', pairingCode.toUpperCase().trim())
      .single();

    if (profileError || !studentProfile) {
      setErrorMessage(`Öğrenci bulunamadı. (Detay: ${profileError?.message || 'Bilinmiyor'})`);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Create link
      const { error: linkError } = await supabase
        .from('parent_student_links')
        .insert([{ parent_id: user.id, student_id: studentProfile.id }]);

      if (linkError) {
        setErrorMessage(`Bağlantı Hatası: ${linkError.message}`);
      } else {
        setStudentName(studentProfile.full_name || 'Öğrenci');
        setStudentId(studentProfile.id);
        setIsPaired(true);
      }
    }
    setLoading(false);
  };

  const handlePremiumPurchase = () => {
    Alert.alert('Premium Satın Al', 'Burada RevenueCat ile Apple/Google Pay ekranı açılacaktır.');
  };

  const handleAssignTask = async () => {
    if (!newTaskTitle.trim()) {
      return Alert.alert('Hata', 'Lütfen ders veya konu adı girin.');
    }
    const minutes = parseInt(newTaskMinutes);
    if (isNaN(minutes) || minutes <= 0) {
      return Alert.alert('Hata', 'Geçerli bir süre girin.');
    }

    setAssigningTask(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && studentId) {
      const { error } = await supabase.from('tasks').insert([{
        student_id: studentId,
        creator_id: user.id,
        title: newTaskTitle.trim(),
        planned_minutes: minutes,
        status: 'bekliyor'
      }]);

      if (error) {
        Alert.alert('Hata', 'Görev atanamadı: ' + error.message);
      } else {
        Alert.alert('Başarılı! 🎯', `${studentName} isimli öğrenciye görev atandı!`);
        setNewTaskTitle('');
        setNewTaskMinutes('50');
        setIsTaskModalVisible(false);
      }
    }
    setAssigningTask(false);
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
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fcd34d" />
        </View>
      ) : !isPaired ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 p-6 justify-center">
          <Text className="text-3xl font-extrabold text-text mb-2 mt-4">{panelTitle}</Text>
          <Text className="text-gray-500 mb-10 text-base">Öğrencinizin gelişimini, ders çalışma sürelerini ve devamsızlıklarını anlık takip etmek için onun cihazındaki 6 haneli bağlantı kodunu girin.</Text>
          
          <View className="mb-8">
            <Text className="text-gray-700 font-bold ml-1 mb-2 text-lg">Öğrenci Bağlantı Kodu</Text>
            <TextInput 
              className="bg-gray-50 px-5 py-6 rounded-2xl border border-gray-200 text-3xl tracking-widest uppercase font-extrabold text-center text-primary"
              placeholder="XXXXXX"
              placeholderTextColor="#cbd5e1"
              maxLength={6}
              autoCapitalize="characters"
              value={pairingCode}
              onChangeText={setPairingCode}
            />
            {errorMessage ? (
              <Text className="text-red-500 font-bold mt-3 text-center px-2">{errorMessage}</Text>
            ) : null}
          </View>

          <TouchableOpacity 
            onPress={handlePairing}
            className="bg-secondary w-full py-4 rounded-xl items-center mb-6 shadow-sm"
          >
            <Text className="text-white font-bold text-lg">Öğrenciyi Ekle</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="py-3 items-center mt-auto mb-4"
            onPress={handleLogout}
          >
            <Text className="text-gray-500 font-bold text-base">🏠 Ana Ekran</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      ) : (
        <View className="flex-1">
        <ScrollView className="flex-1 p-6" style={{ flex: 1, padding: 24 }} showsVerticalScrollIndicator={false}>
          <View className="flex-row justify-between items-center mb-6 mt-2" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
            <View>
              <Text className="text-3xl font-extrabold text-text">{panelTitle}</Text>
              <Text className="text-gray-500 font-medium">Bağlı Öğrenci: {studentName}</Text>
            </View>
          </View>

          {/* Hızlı Özet */}
          <View className="flex-row justify-between mb-6" style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
            <View className="bg-primary p-4 rounded-2xl w-[48%] items-center shadow-sm" style={{ padding: 16, width: '48%', alignItems: 'center' }}>
              <Text className="text-white/80 font-bold text-xs mb-1">Bu Hafta Çalışılan</Text>
              <Text className="text-2xl font-extrabold text-white">12 Saat</Text>
            </View>
            <View className="bg-red-50 p-4 rounded-2xl w-[48%] items-center border border-red-100 shadow-sm">
              <Text className="text-red-400 font-bold text-xs mb-1">Devamsızlık</Text>
              <Text className="text-2xl font-extrabold text-red-600">3.5 Gün</Text>
            </View>
          </View>



          {/* Kilitli İçerik / Premium Çağrısı */}
          <View className="bg-amber-50 p-6 rounded-3xl mb-8 border-2 border-amber-200 relative overflow-hidden" style={{ padding: 24, marginBottom: 32, overflow: 'hidden' }}>
            <View className="absolute -right-4 -top-4 w-20 h-20 bg-amber-200 rounded-full opacity-50" style={{ position: 'absolute', right: -16, top: -16, width: 80, height: 80 }} />
            
            <Text className="text-amber-800 font-extrabold text-xl mb-2" style={{ marginBottom: 8 }}>⭐ Premium Takip Aboneliği</Text>
            <Text className="text-amber-700 mb-5 text-sm leading-5">
              Öğrencinizin branş bazlı Türkiye geneli sıralamasını, zayıf olduğu konuları analiz eden yapay zeka raporunu ve anlık bildirimleri açmak için BrainMate Premium'a geçin.
            </Text>
            
            <TouchableOpacity 
              onPress={handlePremiumPurchase}
              className="bg-amber-500 w-full py-4 rounded-xl items-center shadow-sm"
            >
              <Text className="text-white font-extrabold text-lg">Aylık 199₺ ile Kilidi Aç</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xl font-extrabold text-gray-800 mb-4" style={{ marginBottom: 16 }}>Son Girilen Notlar</Text>
          <View className="bg-white p-4 rounded-2xl mb-3 border border-gray-100 flex-row justify-between items-center shadow-sm" style={{ padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text className="font-bold text-gray-700 text-base">Matematik 1. Sınav</Text>
            <Text className="text-emerald-500 font-extrabold text-xl">85</Text>
          </View>
          <View className="bg-white p-4 rounded-2xl mb-3 border border-gray-100 flex-row justify-between items-center shadow-sm" style={{ padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text className="font-bold text-gray-700 text-base">Fizik 1. Sınav</Text>
            <Text className="text-amber-500 font-extrabold text-xl">60</Text>
          </View>
          <View style={{ height: 80 }} />
          
        </ScrollView>
        
        {/* Scrollable Bottom Navigation Bar */}
        <View 
          className="bg-white border-t border-gray-100 pt-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
          style={{ paddingBottom: Platform.OS === 'ios' ? 24 : 16 }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => navigation.navigate('ParentDashboard')} className="items-center justify-center bg-indigo-50 border-2 border-indigo-200 w-[56px] h-[56px] rounded-2xl shadow-sm shadow-indigo-100 mb-1">
                <Text className="text-3xl">🏠</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-indigo-700">Ana Sayfa</Text>
            </View>

            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => navigation.navigate('LocationTrackingScreen')} className="items-center justify-center bg-sky-50 border-2 border-sky-200 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">📍</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-sky-700">Konum</Text>
            </View>
            
            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => navigation.navigate('NotesScreen')} className="items-center justify-center bg-fuchsia-50 border-2 border-fuchsia-100 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">📌</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-fuchsia-700">Notlar/Ödev</Text>
            </View>

            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => navigation.navigate('ScheduleScreen', { studentId: studentId })} className="items-center justify-center bg-orange-50 border-2 border-orange-100 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">🗓️</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-orange-700">Program</Text>
            </View>
            
            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => navigation.navigate('GradesScreen')} className="items-center justify-center bg-teal-50 border-2 border-teal-100 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">📝</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-teal-700">Sınav Notları</Text>
            </View>
            
            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => navigation.navigate('AttendanceScreen')} className="items-center justify-center bg-cyan-50 border-2 border-cyan-100 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">🚦</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-cyan-700">Devamsızlık</Text>
            </View>
            
            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => setIsTaskModalVisible(true)} className="items-center justify-center bg-rose-50 border-2 border-rose-100 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">🎯</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-rose-700">Görev Ata</Text>
            </View>
            
            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => navigation.navigate('EducationDashboard')} className="items-center justify-center bg-emerald-50 border-2 border-emerald-100 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">📚</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-emerald-700">Eğitimler</Text>
            </View>
            
            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => navigation.navigate('AcademicDashboard')} className="items-center justify-center bg-amber-50 border-2 border-amber-100 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">📊</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-amber-700">Akademik</Text>
            </View>
            
            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => Alert.alert('Mesajlar (Yakında)', 'Buradan sadece kendi öğrencinizle mesajlaşabilirsiniz. Sistem gereği öğrencinizin öğretmenleri/arkadaşları ile olan mesajlarını göremezsiniz ancak doğrudan kendiniz onunla burada iletişime geçebilirsiniz.')} className="items-center justify-center bg-blue-50 border-2 border-blue-100 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">💬</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-blue-700">Mesajlar</Text>
            </View>

            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => navigation.navigate('SocialDashboard', { isParentView: true })} className="items-center justify-center bg-pink-50 border-2 border-pink-100 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">🫂</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-pink-700">Sosyal Ağ</Text>
            </View>

            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => navigation.navigate('GameLobbyScreen', { isParentView: true })} className="items-center justify-center bg-purple-50 border-2 border-purple-100 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">👾</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-purple-700">Oyunlar</Text>
            </View>
            
            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => Alert.alert('Rozetler', 'Yakında öğrencinizin kazandığı başarımları buradan görebileceksiniz.')} className="items-center justify-center bg-yellow-50 border-2 border-yellow-100 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">🏆</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-yellow-700">Rozetler</Text>
            </View>

            <View className="items-center">
              <TouchableOpacity onPress={handleLogout} className="items-center justify-center bg-red-50 border-2 border-red-100 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">🚪</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-red-700">Çıkış</Text>
            </View>

          </ScrollView>
        </View>
        </View>
      )}

      {/* Görev Atama Modalı */}
      <Modal
        visible={isTaskModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white p-6 rounded-t-3xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-extrabold text-text">Yeni Görev Ata</Text>
              <TouchableOpacity onPress={() => setIsTaskModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                <Text className="text-gray-500 font-bold">Kapat</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-gray-700 font-bold ml-1 mb-2">Ders veya Konu Adı</Text>
            <TextInput
              className="bg-gray-50 px-5 py-4 rounded-xl border border-gray-200 font-bold text-text mb-4"
              placeholder="Örn: Fizik - Elektrik Devreleri"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
            />

            <Text className="text-gray-700 font-bold ml-1 mb-2">Hedeflenen Süre (Dakika)</Text>
            <TextInput
              className="bg-gray-50 px-5 py-4 rounded-xl border border-gray-200 font-bold text-text mb-8"
              placeholder="50"
              keyboardType="number-pad"
              value={newTaskMinutes}
              onChangeText={setNewTaskMinutes}
            />

            <TouchableOpacity
              onPress={handleAssignTask}
              disabled={assigningTask}
              className={`w-full py-4 rounded-xl items-center shadow-sm mb-4 ${assigningTask ? 'bg-gray-400' : 'bg-secondary'}`}
            >
              {assigningTask ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Öğrenciye Gönder</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
