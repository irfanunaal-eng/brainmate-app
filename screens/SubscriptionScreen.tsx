import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../lib/supabase';

export function SubscriptionScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Hata', 'Kullanıcı bulunamadı, lütfen önce giriş yapın.');
        return;
      }

      // Simulate RevenueCat / StoreKit Purchase process
      // In production, this would be: await Purchases.purchasePackage(package)
      
      // We calculate the trial end date (3 days from now)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 3);

      // Update the user's profile with trial status
      const { error } = await supabase
        .from('profiles')
        .update({ 
           subscription_status: 'trialing', 
           trial_ends_at: trialEndsAt.toISOString(),
           subscription_plan: 'monthly_49'
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      Alert.alert(
        'Tebrikler! 🎉', 
        '3 günlük ücretsiz deneme süreniz başladı. BrainMate Pro özelliklerinin tadını çıkarın!',
        [{ text: 'Muhteşem', onPress: () => navigation.goBack() }]
      );

    } catch (error: any) {
      Alert.alert('İşlem Başarısız', error.message || 'Ücretsiz deneme başlatılamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View className="items-center px-6 pt-12 pb-8">
          <View className="bg-amber-400 w-24 h-24 rounded-3xl items-center justify-center mb-6 shadow-2xl flex-row">
            <Text className="text-5xl">🧠</Text>
            <Text className="text-5xl absolute -right-2 -bottom-2">👑</Text>
          </View>
          <Text className="text-3xl font-black text-white text-center mb-2 tracking-tight">BrainMate Pro'ya Geçin</Text>
          <Text className="text-slate-400 text-center text-base px-4">Tüm eğitim ve takip özelliklerine hiçbir sınır olmadan erişin. Başarı şansınızı ikiye katlayın.</Text>
        </View>

        {/* Features Checklist */}
        <View className="px-8 mt-2 mb-8">
          {[
            { icon: '🚀', text: 'Sınırsız Akademik Takip ve Analiz' },
            { icon: '🤖', text: 'Gelişmiş Yapay Zeka Desteği' },
            { icon: '📊', text: 'Detaylı Veli & Koç Raporları' },
            { icon: '🎮', text: 'Oyunlaştırma ve Edu-Game Sınırsız XP' },
            { icon: '🛡️', text: '7/24 Kesintisiz Bulut Senkronizasyonu' }
          ].map((feat, idx) => (
            <View key={idx} className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center mr-3">
                <Text className="text-sm">{feat.icon}</Text>
              </View>
              <Text className="text-slate-200 font-bold text-base">{feat.text}</Text>
            </View>
          ))}
        </View>

        {/* Pricing Card */}
        <View className="px-6 mb-8">
          <View className="bg-slate-800 rounded-3xl p-6 border-2 border-indigo-500 relative shadow-2xl">
            <View className="absolute -top-4 self-center bg-indigo-500 px-4 py-1 rounded-full shadow-lg">
               <Text className="text-white font-black text-xs uppercase tracking-widest">En Popüler Plan</Text>
            </View>
            
            <View className="items-center mt-4 mb-2">
               <Text className="text-slate-400 font-bold mb-1 uppercase tracking-widest text-xs">YENİ NESİL EĞİTİM</Text>
               <View className="flex-row items-end justify-center mb-3">
                 <Text className="text-5xl font-black text-white">49 ₺</Text>
                 <Text className="text-slate-400 font-bold mb-2 ml-1">/ ay</Text>
               </View>
               <Text className="text-indigo-400 font-bold text-sm bg-indigo-500/10 px-3 py-1 rounded-full">12 Ay Geçerli Sabit Fiyat Garantisi</Text>
            </View>
            
            <View className="bg-slate-700/50 rounded-2xl p-4 mt-4">
               <Text className="text-white text-center font-bold text-base">İlk 3 Gün Ücretsiz Kullan! 🎁</Text>
               <Text className="text-slate-400 text-center text-xs mt-1">İstediğin zaman tek tıkla App Store / Google Play üzerinden iptal edebilirsin.</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <View className="px-6 pb-12 items-center">
          <TouchableOpacity 
            onPress={handleSubscribe}
            disabled={loading}
            className="w-full bg-indigo-500 py-5 rounded-2xl items-center shadow-lg active:bg-indigo-600 mb-4"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-black text-lg">3 Günlük Ücretsiz Denemeyi Başlat</Text>
            )}
          </TouchableOpacity>
          <Text className="text-slate-500 text-xs text-center px-4">
            Deneme süresi bittikten sonra bağlı olduğunuz mağaza üzerinden aylık tahsilat yapılır. 
            Ayarlar {'>'} Aboneliklerim sekmesinden süreniz dolmadan dilediğiniz an iptal edebilirsiniz.
          </Text>
        </View>
        
        <TouchableOpacity 
             onPress={() => navigation.goBack()} 
             className="w-12 h-12 bg-slate-800 rounded-full items-center justify-center absolute top-12 left-6 border border-slate-700"
           >
             <Text className="text-white text-lg">✕</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
