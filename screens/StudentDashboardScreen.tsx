import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ActivityIndicator, Share, Alert, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../lib/supabase';

export function StudentDashboardScreen({ navigation }: any) {
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('pairing_code')
        .eq('id', user.id)
        .single();
        
      if (data && !error) {
        setPairingCode(data.pairing_code);
      }
    }
    setLoading(false);
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

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1">
      <View className="flex-1 p-6 justify-center items-center">
        <Text className="text-3xl font-extrabold text-text mb-4" style={{ marginBottom: 16 }}>Öğrenci Paneli</Text>
        <Text className="text-gray-500 mb-8 text-center text-base" style={{ marginBottom: 32 }}>Velinizin veya rehber öğretmeninizin sizi takip edebilmesi için aşağıdaki bağlantı kodunu onlarla paylaşın.</Text>
        
        <View className="bg-tertiary p-8 rounded-3xl mb-8 w-full items-center shadow-sm" style={{ padding: 32, marginBottom: 32, width: '100%', alignItems: 'center' }}>
          <Text className="text-gray-700 mb-2 font-bold text-lg" style={{ marginBottom: 8 }}>Senin Bağlantı Kodun</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#fcd34d" />
          ) : (
            <>
              <View className="flex-row items-center bg-white/40 px-6 py-2 rounded-2xl mb-4 border border-white/60" style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 24, paddingVertical: 8 }}>
                <Text selectable={true} className="text-5xl font-extrabold tracking-widest text-primary mr-3" style={{ marginRight: 12 }}>
                  {pairingCode || "HATA"}
                </Text>
                <TouchableOpacity onPress={handleCopy} className="p-3 bg-white rounded-xl shadow-sm">
                  <Text className="text-xl">📋</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                onPress={handleShare}
                className="bg-white/50 px-6 py-2 rounded-full border border-white"
              >
                <Text className="text-primary font-bold">📤 Kodu Paylaş</Text>
              </TouchableOpacity>
            </>
          )}
        </View>




      </View>

        {/* Scrollable Bottom Navigation Bar */}
        <View 
          className="bg-white border-t border-gray-100 pt-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
          style={{ paddingBottom: 16 }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            <TouchableOpacity onPress={handleLogout} className="items-center justify-center bg-indigo-50 border-2 border-indigo-100 w-[56px] h-[56px] rounded-2xl mr-4">
              <Text className="text-4xl">🏠</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => navigation.navigate('EducationDashboard')} className="items-center justify-center bg-emerald-50 border-2 border-emerald-100 w-[56px] h-[56px] rounded-2xl mr-4">
              <Text className="text-4xl">📚</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => Alert.alert('Görevlerim', 'Sana atanan görevleri buradan görebileceksin.')} className="items-center justify-center bg-rose-50 border-2 border-rose-100 w-[56px] h-[56px] rounded-2xl mr-4">
              <Text className="text-4xl">🎯</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ScheduleScreen')} className="items-center justify-center bg-orange-50 border-2 border-orange-100 w-[56px] h-[56px] rounded-2xl mr-4">
              <Text className="text-4xl">🗓️</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('AcademicDashboard')} className="items-center justify-center bg-amber-50 border-2 border-amber-100 w-[56px] h-[56px] rounded-2xl mr-4">
              <Text className="text-4xl">📊</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => Alert.alert('Yakında', 'Devamsızlık detayların burada görünecek.')} className="items-center justify-center bg-cyan-50 border-2 border-cyan-100 w-[56px] h-[56px] rounded-2xl mr-4">
              <Text className="text-4xl">📅</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('SocialDashboard')} className="items-center justify-center bg-purple-50 border-2 border-purple-100 w-[56px] h-[56px] rounded-2xl mr-4">
              <Text className="text-4xl">🎮</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => Alert.alert('Yakında', 'Başarımların ve kazandığın rozetler!')} className="items-center justify-center bg-yellow-50 border-2 border-yellow-100 w-[56px] h-[56px] rounded-2xl mr-4">
              <Text className="text-4xl">🏆</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => Alert.alert('Yakında', 'Öğretmeninle veya koçunla mesajlaş.')} className="items-center justify-center bg-blue-50 border-2 border-blue-100 w-[56px] h-[56px] rounded-2xl">
              <Text className="text-4xl">💬</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}
