import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ActivityIndicator, Share, Alert, ScrollView, Modal, TextInput } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../lib/supabase';

const SCHEDULE_TYPES = [
  { id: 'okul', label: '🏫 Okul', color: 'bg-blue-100 border-blue-200 text-blue-800' },
  { id: 'dersane', label: '🏢 Dershane', color: 'bg-orange-100 border-orange-200 text-orange-800' },
  { id: 'ozel_ders', label: '👨‍🏫 Özel Ders', color: 'bg-purple-100 border-purple-200 text-purple-800' },
  { id: 'etut', label: '📚 Etüt', color: 'bg-emerald-100 border-emerald-200 text-emerald-800' }
];

export function StudentDashboardScreen({ navigation }: any) {
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dashboard states
  const [firstName, setFirstName] = useState<string>('Öğrenci');
  const [todaySchedules, setTodaySchedules] = useState<any[]>([]);
  const [isCodeModalVisible, setIsCodeModalVisible] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 1. Fetch Profile & Pairing Code
      const { data: profile } = await supabase
        .from('profiles')
        .select('pairing_code, full_name')
        .eq('id', user.id)
        .single();
        
      if (profile) {
        setPairingCode(profile.pairing_code);
        if (profile.full_name) {
          setFirstName(profile.full_name.split(' ')[0]);
          setEditName(profile.full_name);
        } else {
          setIsProfileModalVisible(true);
        }
      }

      // 2. Fetch Today's Schedule
      // Convert JS Date (0=Sun, 1=Mon) to our format (1=Mon, 7=Sun)
      let todayIdx = new Date().getDay();
      if (todayIdx === 0) todayIdx = 7;

      const { data: schedules } = await supabase
        .from('schedules')
        .select('*')
        .eq('student_id', user.id)
        .eq('day_of_week', todayIdx)
        .order('start_time', { ascending: true });

      setTodaySchedules(schedules || []);
    }
    setLoading(false);
  };

  const handleGenerateCode = async () => {
    setLoading(true);
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let newCode = '';
    for (let i = 0; i < 6; i++) {
      newCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ pairing_code: newCode })
        .eq('id', user.id);
        
      if (!error) {
        setPairingCode(newCode);
        Alert.alert('Başarılı', 'Yeni bağlantı kodu oluşturuldu. Veli veya öğretmenlerinle paylaşabilirsin.');
      } else {
        Alert.alert('Hata', 'Kod oluşturulamadı.');
      }
    }
    setLoading(false);
  };

  const handleRevokeCode = async () => {
    Alert.alert(
      "Kodu İptal Et",
      "Mevcut bağlantı kodunu iptal etmek istediğine emin misin? (Daha önce bağlanan kişilerin erişimi kesilmez, sadece yeni kişiler bu kodla bağlanamaz.)",
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "İptal Et", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { error } = await supabase
                .from('profiles')
                .update({ pairing_code: null })
                .eq('id', user.id);
                
              if (!error) {
                setPairingCode(null);
              }
            }
            setLoading(false);
          }
        }
      ]
    );
  };

  const handleCopy = async () => {
    if (!pairingCode) return;
    await Clipboard.setStringAsync(pairingCode);
    Alert.alert('Kopyalandı', 'Bağlantı kodu panoya kopyalandı!');
  };

  const handleShare = async () => {
    if (!pairingCode) return;
    try {
      await Share.share({
        message: `BrainMate uygulamasına katıl! Öğrenci Bağlantı Kodum: ${pairingCode}\nVelim veya rehber öğretmenim olarak beni takip edebilirsin.`,
      });
    } catch (error: any) {
      Alert.alert('Hata', 'Paylaşım yapılamadı.');
    }
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

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Hata', 'Lütfen adını gir.');
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName.trim() })
        .eq('id', user.id);
        
      if (!error) {
        setFirstName(editName.trim().split(' ')[0]);
        setIsProfileModalVisible(false);
        Alert.alert('Harika', 'Profilin başarıyla güncellendi!');
      } else {
        Alert.alert('Hata', 'Profil güncellenemedi.');
      }
    }
    setLoading(false);
  };

  const formatTime = (timeStr: string) => timeStr ? timeStr.substring(0, 5) : '';
  
  const getTypeStyle = (typeId: string) => {
    const type = SCHEDULE_TYPES.find(t => t.id === typeId);
    return type?.color || 'bg-gray-100 border-gray-200 text-gray-800';
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      
      {/* Main Dashboard ScrollView */}
      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-4xl font-extrabold text-gray-800 mb-1">Merhaba, {firstName} 👋</Text>
            <Text className="text-gray-500 font-semibold text-base">Bugün ne yapalım?</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setIsProfileModalVisible(true)}
            className="w-14 h-14 bg-blue-100 rounded-full border-4 border-white items-center justify-center shadow-sm"
          >
            <Text className="text-2xl">😎</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats / Summary Widgets */}
        <View className="flex-row space-x-4 mb-8">
          <View className="flex-1 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mr-2">
            <View className="w-10 h-10 bg-rose-100 rounded-full items-center justify-center mb-3">
              <Text className="text-xl">🎯</Text>
            </View>
            <Text className="text-3xl font-black text-gray-800 mb-1">3</Text>
            <Text className="text-gray-500 font-medium text-xs">Bekleyen Görev</Text>
          </View>
          
          <View className="flex-1 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm ml-2">
            <View className="w-10 h-10 bg-emerald-100 rounded-full items-center justify-center mb-3">
              <Text className="text-xl">🏆</Text>
            </View>
            <Text className="text-3xl font-black text-gray-800 mb-1">%100</Text>
            <Text className="text-gray-500 font-medium text-xs">Haftalık Devam</Text>
          </View>
        </View>

        {/* Today's Schedule Section */}
        <View className="flex-row justify-between items-end mb-4">
          <Text className="text-xl font-extrabold text-gray-800">Bugünün Programı</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ScheduleScreen')}>
            <Text className="text-primary font-bold">Tümünü Gör</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#4f46e5" className="my-10" />
        ) : todaySchedules.length === 0 ? (
          <View className="bg-white rounded-3xl p-8 items-center border border-gray-100 shadow-sm mb-10">
            <Text className="text-6xl mb-4">🧘‍♂️</Text>
            <Text className="text-gray-800 font-bold text-lg mb-1">Bugün dersin yok!</Text>
            <Text className="text-gray-500 text-center">Dinlenmek veya kendi çalışmalarını yapmak için harika bir gün.</Text>
          </View>
        ) : (
          <View className="mb-10">
            {todaySchedules.map((sch) => (
              <View key={sch.id} className="bg-white rounded-3xl p-4 mb-3 border border-gray-100 shadow-sm flex-row items-center">
                <View className="bg-gray-50 px-3 py-2 rounded-2xl mr-4 border border-gray-100 items-center justify-center min-w-[70px]">
                  <Text className="text-gray-800 font-black text-base">{formatTime(sch.start_time)}</Text>
                  <Text className="text-gray-400 font-bold text-[10px]">{formatTime(sch.end_time)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-800 mb-1" numberOfLines={1}>{sch.title}</Text>
                  <View className={`self-start px-2 py-0.5 rounded-full border ${getTypeStyle(sch.schedule_type).split(' ')[0]} ${getTypeStyle(sch.schedule_type).split(' ')[1]}`}>
                    <Text className={`text-[10px] font-bold ${getTypeStyle(sch.schedule_type).split(' ')[2]}`}>
                      {SCHEDULE_TYPES.find(t => t.id === sch.schedule_type)?.label?.split(' ')[1] || sch.schedule_type}
                    </Text>
                  </View>
                </View>
                {sch.materials_needed && (
                  <View className="w-8 h-8 bg-amber-100 rounded-full items-center justify-center ml-2">
                    <Text className="text-sm">🎒</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Scrollable Bottom Navigation Bar */}
      <View className="bg-white border-t border-gray-100 pt-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-8">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          
          <View className="items-center mr-4">
            <TouchableOpacity onPress={() => {}} className="items-center justify-center bg-indigo-50 border-2 border-indigo-200 w-[56px] h-[56px] rounded-2xl shadow-sm shadow-indigo-100 mb-1">
              <Text className="text-3xl">🏠</Text>
            </TouchableOpacity>
            <Text className="text-[10px] font-bold text-indigo-700">Ana Sayfa</Text>
          </View>
          
          <View className="items-center mr-4">
            <TouchableOpacity onPress={() => navigation.navigate('NotesScreen')} className="items-center justify-center bg-fuchsia-50 border-2 border-fuchsia-100 w-[56px] h-[56px] rounded-2xl mb-1">
              <Text className="text-3xl">📌</Text>
            </TouchableOpacity>
            <Text className="text-[10px] font-bold text-fuchsia-700">Notlar/Ödevler</Text>
          </View>

          <View className="items-center mr-4">
            <TouchableOpacity onPress={() => navigation.navigate('ScheduleScreen')} className="items-center justify-center bg-orange-50 border-2 border-orange-100 w-[56px] h-[56px] rounded-2xl mb-1">
              <Text className="text-3xl">🗓️</Text>
            </TouchableOpacity>
            <Text className="text-[10px] font-bold text-orange-700">Programım</Text>
          </View>

          <View className="items-center mr-4">
            <TouchableOpacity onPress={() => navigation.navigate('GradesScreen')} className="items-center justify-center bg-teal-50 border-2 border-teal-100 w-[56px] h-[56px] rounded-2xl mb-1">
              <Text className="text-3xl">📝</Text>
            </TouchableOpacity>
            <Text className="text-[10px] font-bold text-teal-700">Notlarım</Text>
          </View>
          
          <View className="items-center mr-4">
            <TouchableOpacity onPress={() => navigation.navigate('AttendanceScreen')} className="items-center justify-center bg-cyan-50 border-2 border-cyan-100 w-[56px] h-[56px] rounded-2xl mb-1">
              <Text className="text-3xl">🚦</Text>
            </TouchableOpacity>
            <Text className="text-[10px] font-bold text-cyan-700">Devamsızlık</Text>
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
            <TouchableOpacity onPress={() => Alert.alert('Yakında', 'Öğretmeniniz, aileniz, eğitim koçunuz veya arkadaşlarınızla buradan anlık olarak mesajlaşabileceksiniz.')} className="items-center justify-center bg-blue-50 border-2 border-blue-100 w-[56px] h-[56px] rounded-2xl mb-1">
              <Text className="text-3xl">💬</Text>
            </TouchableOpacity>
            <Text className="text-[10px] font-bold text-blue-700">Mesajlar</Text>
          </View>
          
          <View className="items-center mr-4">
            <TouchableOpacity onPress={() => navigation.navigate('SocialDashboard')} className="items-center justify-center bg-pink-50 border-2 border-pink-100 w-[56px] h-[56px] rounded-2xl mb-1">
              <Text className="text-3xl">🫂</Text>
            </TouchableOpacity>
            <Text className="text-[10px] font-bold text-pink-700">Sosyal Ağ</Text>
          </View>

          <View className="items-center mr-4">
            <TouchableOpacity onPress={() => navigation.navigate('GameLobbyScreen')} className="items-center justify-center bg-purple-50 border-2 border-purple-100 w-[56px] h-[56px] rounded-2xl mb-1">
              <Text className="text-3xl">👾</Text>
            </TouchableOpacity>
            <Text className="text-[10px] font-bold text-purple-700">Oyunlar</Text>
          </View>
          
          <View className="items-center mr-4">
            <TouchableOpacity onPress={() => Alert.alert('Yakında', 'Başarımların ve kazandığın rozetler!')} className="items-center justify-center bg-yellow-50 border-2 border-yellow-100 w-[56px] h-[56px] rounded-2xl mb-1">
              <Text className="text-3xl">🏆</Text>
            </TouchableOpacity>
            <Text className="text-[10px] font-bold text-yellow-700">Rozetler</Text>
          </View>

          <View className="items-center mr-4">
            <TouchableOpacity onPress={() => setIsCodeModalVisible(true)} className="items-center justify-center bg-gray-50 border-2 border-gray-200 w-[56px] h-[56px] rounded-2xl mb-1">
              <Text className="text-3xl">🔑</Text>
            </TouchableOpacity>
            <Text className="text-[10px] font-bold text-gray-600">Kod</Text>
          </View>
          
          <View className="items-center">
            <TouchableOpacity onPress={handleLogout} className="items-center justify-center bg-red-50 border-2 border-red-100 w-[56px] h-[56px] rounded-2xl mb-1">
              <Text className="text-3xl">🚪</Text>
            </TouchableOpacity>
            <Text className="text-[10px] font-bold text-red-700">Çıkış</Text>
          </View>
        </ScrollView>
      </View>

      {/* Pairing Code Modal */}
      <Modal visible={isCodeModalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 min-h-[50%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-extrabold text-gray-800">Bağlantı Şifresi</Text>
              <TouchableOpacity onPress={() => setIsCodeModalVisible(false)} className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center">
                <Text className="text-lg">❌</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-gray-600 mb-6 text-[13px] font-medium leading-5">
              Öğretmenlerinin veya velinin profilini takip edebilmesi için bu kodu kullanabilirsin. Ayrıca arkadaşlarına kodunu gönder, bağlantı kur ve birlikte oynayarak öğrenin! Bir kez bağlandıktan sonra yeni kod üretmene gerek yoktur.
            </Text>
            
            <View className="bg-gray-50 p-8 rounded-3xl mb-8 w-full items-center border border-gray-200">
              {loading ? (
                <ActivityIndicator size="large" color="#4f46e5" />
              ) : pairingCode ? (
                <>
                  <Text className="text-gray-400 font-bold text-xs tracking-widest uppercase mb-3">Aktif Kod</Text>
                  <View className="flex-row items-center bg-white px-6 py-3 rounded-2xl mb-6 border border-gray-200 shadow-sm">
                    <Text selectable={true} className="text-5xl font-extrabold tracking-widest text-primary mr-4">
                      {pairingCode}
                    </Text>
                    <TouchableOpacity onPress={handleCopy} className="p-3 bg-indigo-50 rounded-xl">
                      <Text className="text-xl">📋</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View className="flex-row space-x-3 w-full justify-center">
                    <TouchableOpacity 
                      onPress={handleShare}
                      className="bg-indigo-600 px-5 py-4 rounded-xl flex-1 items-center mr-2 shadow-sm"
                    >
                      <Text className="text-white font-bold text-lg">📤 Paylaş</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={handleRevokeCode}
                      className="bg-rose-100 px-5 py-4 rounded-xl border border-rose-200 flex-1 items-center ml-2"
                    >
                      <Text className="text-rose-700 font-bold text-lg">❌ İptal Et</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View className="items-center w-full py-4">
                  <View className="w-16 h-16 bg-gray-200 rounded-full items-center justify-center mb-4">
                    <Text className="text-2xl">🔒</Text>
                  </View>
                  <Text className="text-gray-600 text-center mb-8 text-base">
                    Şu an aktif bir şifren bulunmuyor. Paylaşım yapmak için yeni bir şifre üretebilirsin.
                  </Text>
                  <TouchableOpacity 
                    onPress={handleGenerateCode}
                    className="bg-primary w-full py-4 rounded-2xl items-center shadow-md shadow-primary/30"
                  >
                    <Text className="text-white font-bold text-xl">✨ Şifre Üret</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Edit Modal */}
      <Modal visible={isProfileModalVisible} animationType="fade" transparent={true}>
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-extrabold text-gray-800">Profili Düzenle</Text>
              <TouchableOpacity onPress={() => setIsProfileModalVisible(false)} className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center">
                <Text className="text-lg">❌</Text>
              </TouchableOpacity>
            </View>

            <View className="items-center mb-6">
              <View className="w-24 h-24 bg-blue-100 rounded-full border-4 border-white items-center justify-center shadow-sm mb-2">
                <Text className="text-5xl">😎</Text>
              </View>
              <Text className="text-blue-600 font-bold text-xs">Avatarı Değiştir (Yakında)</Text>
            </View>

            <Text className="text-gray-700 font-bold mb-2 ml-1">Adın ve Soyadın</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Adını buraya yaz..."
              className="bg-gray-50 px-5 py-4 rounded-xl border border-gray-200 text-lg font-medium mb-6"
            />

            <TouchableOpacity 
              onPress={handleSaveProfile}
              disabled={loading}
              className={`w-full py-4 rounded-xl items-center shadow-sm ${loading ? 'bg-primary/50' : 'bg-primary active:bg-indigo-700'}`}
            >
              <Text className="text-white font-bold text-lg">{loading ? 'Kaydediliyor...' : 'Kaydet'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
