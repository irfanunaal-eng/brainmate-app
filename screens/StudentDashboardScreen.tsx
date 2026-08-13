import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ActivityIndicator, Share, Alert } from 'react-native';
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

  return (
    <SafeAreaView className="flex-1 bg-surface">
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

        <TouchableOpacity 
          className="bg-primary w-full py-4 rounded-xl items-center shadow-sm mb-3"
          style={{ width: '100%', paddingVertical: 16, marginBottom: 12, alignItems: 'center' }}
          onPress={() => navigation.navigate('EducationDashboard')}
        >
          <Text className="text-white font-bold text-lg">📚 Eğitim Takibi & Kronometre</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-emerald-500 w-full py-4 rounded-xl items-center shadow-sm mb-3"
          style={{ width: '100%', paddingVertical: 16, marginBottom: 12, alignItems: 'center' }}
          onPress={() => navigation.navigate('AcademicDashboard')}
        >
          <Text className="text-white font-bold text-lg">🎓 MEB Not & Devamsızlık</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-secondary w-full py-4 rounded-xl items-center shadow-sm mb-4"
          style={{ width: '100%', paddingVertical: 16, marginBottom: 16, alignItems: 'center' }}
          onPress={() => navigation.navigate('SocialDashboard')}
        >
          <Text className="text-white font-bold text-lg">🤝 Sosyal Ağ & Oyunlar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="py-3 px-8 rounded-xl"
          onPress={() => navigation.navigate('RoleSelection')}
        >
          <Text className="text-gray-400 font-bold">Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
