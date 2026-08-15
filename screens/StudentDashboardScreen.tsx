import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ActivityIndicator, Share, Alert, ScrollView, Modal, TextInput } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../lib/supabase';
import { ACADEMIC_YEARS, GRADES, TRACKS_ANADOLU } from '../constants/MebCurriculum';

const InlineDropdown = ({ label, value, options, onSelect }: any) => {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o:any) => o.value === value)?.label || '- Seçiniz -';
  
  return (
    <View className="mb-4 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm shadow-black/5">
      <TouchableOpacity activeOpacity={0.7} onPress={() => setOpen(!open)}>
         <View className="flex-row items-center justify-between p-4 bg-gray-50/50">
            <View>
               <Text className="text-[10px] font-black tracking-widest text-indigo-500 uppercase mb-1">{label}</Text>
               <Text className="font-extrabold text-gray-800 text-sm">{selectedLabel}</Text>
            </View>
            <View className={`w-8 h-8 rounded-full items-center justify-center ${open ? 'bg-indigo-100 rotate-180' : 'bg-gray-100'}`}>
               <Text className="text-gray-500 text-xs">▼</Text>
            </View>
         </View>
      </TouchableOpacity>
      
      {open && (
         <View className="max-h-48 bg-gray-50 border-t border-gray-100">
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
               {options.map((opt:any) => (
                  <TouchableOpacity 
                     key={opt.value} 
                     onPress={() => { onSelect(opt.value); setOpen(false); }}
                     className={`px-4 py-4 border-b border-gray-200 flex-row justify-between items-center ${value === opt.value ? 'bg-indigo-50' : 'bg-transparent'}`}
                  >
                     <Text className={`font-bold ${value === opt.value ? 'text-indigo-700' : 'text-gray-700'}`}>{opt.label}</Text>
                     {value === opt.value && <Text className="text-indigo-600">✓</Text>}
                  </TouchableOpacity>
               ))}
            </ScrollView>
         </View>
      )}
    </View>
  );
};

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
  const [editYear, setEditYear] = useState(ACADEMIC_YEARS[3]);
  const [editGrade, setEditGrade] = useState('9');
  const [editTrack, setEditTrack] = useState('');
  const [editIsAnadolu, setEditIsAnadolu] = useState(true);
  const [editStudentNo, setEditStudentNo] = useState('');

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
        .select('pairing_code, full_name, academic_year, grade, school_track, school_type')
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
        
        // Fetch academic info from profiles table (if available)
        // Ensure supabase 'profiles' has academic_year and grade initialized properly in real DB
        if ((profile as any).academic_year) setEditYear((profile as any).academic_year);
        if ((profile as any).grade) setEditGrade((profile as any).grade);
        if ((profile as any).school_track) setEditTrack((profile as any).school_track);
        if ((profile as any).school_type) setEditIsAnadolu((profile as any).school_type === 'anadolu');
        if ((profile as any).student_no) setEditStudentNo((profile as any).student_no);
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
      
      // Async refresh premium status
      import('../lib/premium').then(({ checkPremiumStatus }) => checkPremiumStatus());
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
        .update({ 
           full_name: editName.trim(),
           academic_year: editYear,
           grade: editGrade,
           school_track: editTrack,
           school_type: editIsAnadolu ? 'anadolu' : 'meslek'
        // Error bypassed locally if academic_year missing in test env
        } as any)
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
        <View className="flex-row justify-between items-center mb-6">
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

        {/* Premium Upgrade Banner */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('SubscriptionScreen')}
          className="bg-indigo-600 rounded-3xl p-5 mb-8 flex-row items-center border-b-4 border-indigo-700 shadow-xl shadow-indigo-300"
        >
          <View className="bg-amber-400 w-12 h-12 rounded-full items-center justify-center mr-4">
             <Text className="text-2xl">👑</Text>
          </View>
          <View className="flex-1">
             <Text className="text-white font-black text-lg mb-1">BrainMate Pro</Text>
             <Text className="text-indigo-100 font-medium text-xs">İlk 3 Gün Ücretsiz Deneyin 🚀</Text>
          </View>
          <View className="bg-indigo-500 px-3 py-2 rounded-xl">
             <Text className="text-white font-bold text-xs uppercase">GEÇİŞ YAP</Text>
          </View>
        </TouchableOpacity>

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
            <TouchableOpacity onPress={() => navigation.navigate('TasksScreen')} className="items-center justify-center bg-rose-50 border-2 border-rose-100 w-[56px] h-[56px] rounded-2xl mb-1">
              <Text className="text-3xl">🎯</Text>
            </TouchableOpacity>
            <Text className="text-[10px] font-bold text-rose-700">Görevlerim</Text>
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
            <TouchableOpacity onPress={() => navigation.navigate('MessagesScreen', { isParentView: false })} className="items-center justify-center bg-blue-50 border-2 border-blue-100 w-[56px] h-[56px] rounded-2xl mb-1">
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
              className="bg-gray-50 px-5 py-4 rounded-xl border border-gray-200 text-lg font-medium mb-4"
            />

            <Text className="text-gray-700 font-bold mb-2 ml-1">Okul Numarası</Text>
            <TextInput
              value={editStudentNo}
              onChangeText={setEditStudentNo}
              placeholder="Örn: 1453"
              keyboardType="number-pad"
              className="bg-gray-50 px-5 py-4 rounded-xl border border-gray-200 text-lg font-medium mb-6"
            />
            
            <View className="mb-4">
               <InlineDropdown 
                  label="Bulunduğun Eğitim Yılı"
                  value={editYear}
                  options={ACADEMIC_YEARS.map(y => ({ label: y, value: y }))}
                  onSelect={setEditYear}
               />
               
               <InlineDropdown 
                  label="Kaçıncı Sınıfsın?"
                  value={editGrade}
                  options={GRADES.map(g => ({ label: g.label, value: g.id }))}
                  onSelect={setEditGrade}
               />
               
               {(editGrade === '11' || editGrade === '12') && (
                  <>
                     <InlineDropdown 
                        label="Okul Türün Nedir?"
                        value={editIsAnadolu ? 'anadolu' : 'meslek'}
                        options={[
                           { label: 'Anadolu / Genel Lise', value: 'anadolu' },
                           { label: 'Mesleki / Teknik Lise', value: 'meslek' }
                        ]}
                        onSelect={(v: string) => setEditIsAnadolu(v === 'anadolu')}
                     />

                     {editIsAnadolu ? (
                        <InlineDropdown 
                           label="Hangi Alandasın?"
                           value={editTrack}
                           options={[
                              { label: '- Alan Seçiniz -', value: '' },
                              ...TRACKS_ANADOLU.map(t => ({ label: t.label, value: t.id }))
                           ]}
                           onSelect={setEditTrack}
                        />
                     ) : (
                        <View className="mb-4 bg-orange-50 border border-orange-100 p-3 rounded-xl">
                           <Text className="text-orange-800 text-xs font-bold mb-1">Meslek Lisesi Bilgisi</Text>
                           <Text className="text-orange-600 text-[10px] leading-4">Zorunlu derslerin atanırken alan bazlı teknik derslerini manuel olarak ders programından ekleyebilirsin.</Text>
                        </View>
                     )}
                  </>
               )}
            </View>

            <TouchableOpacity 
              onPress={handleSaveProfile}
              disabled={loading}
              className={`w-full py-4 rounded-xl items-center shadow-sm mb-4 ${loading ? 'bg-primary/50' : 'bg-primary active:bg-indigo-700'}`}
            >
              <Text className="text-white font-bold text-lg">{loading ? 'Değişiklikleri Kaydet' : 'Değişiklikleri Kaydet'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
