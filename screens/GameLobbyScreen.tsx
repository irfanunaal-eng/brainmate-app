import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const LEVELS = [
  { id: 'A1', title: 'A1 Şampiyonu', desc: 'Başlangıç (A1) seviyesindeki tüm kelimeleri kapsar.', unlocked: true, stars: 3, stages: 15, words: 20 },
  { id: 'A2', title: 'A2 Kaptanı', desc: 'Temel (A2) seviyesindeki yeni kelimeleri içerir.', unlocked: true, stars: 1, stages: 20, words: 25 },
  { id: 'B1', title: 'B1 Uzmanı', desc: 'Orta (B1) seviyesi kelimelerini kapsar.', unlocked: true, stars: 0, stages: 25, words: 40 },
  { id: 'B2', title: 'B2 Lideri', desc: 'İleri (B2) seviye zenginleştirilmiş kelime havuzu.', unlocked: false, stars: 0, stages: 30, words: 50 },
  { id: 'C1', title: 'C1 Efsanesi', desc: 'Akademik ve akıcı (C1) seviye son kelimeler.', unlocked: false, stars: 0, stages: 40, words: 50 },
];

export function GameLobbyScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const isParentView = route?.params?.isParentView || false;
  const [selectedMode, setSelectedMode] = useState<'solo' | 'duel'>('solo');
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [adminOverride, setAdminOverride] = useState(false);
  const [duelOpponent, setDuelOpponent] = useState<string | null>(null);

  const toggleLevel = async (id: string, isPremiumOnly: boolean) => {
    if (isPremiumOnly && !adminOverride) {
      const { requirePremium } = await import('../lib/premium');
      const isPremium = await requirePremium(navigation, 'İleri Kur Eğitim Oyunları (B1 ve Üzeri)');
      if (!isPremium) return;
    }
    setExpandedLevel(prev => prev === id ? null : id);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 p-6">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6 mt-2">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full">
            <Text className="text-xl">🔙</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-extrabold text-gray-800">İngilizce Ustası</Text>
          <TouchableOpacity 
            onPress={() => setAdminOverride(!adminOverride)}
            className={`px-3 py-2 rounded-full flex-row items-center ${adminOverride ? 'bg-purple-100' : 'bg-amber-100'}`}
          >
            <Text className={`${adminOverride ? 'text-purple-600' : 'text-amber-600'} font-black mr-1`}>450</Text>
            <Text className="text-xs">{adminOverride ? '🔓' : '⚡'}</Text>
          </TouchableOpacity>
        </View>

        {isParentView ? (
           <View className="p-5 rounded-3xl mb-6 shadow-sm bg-purple-50 border border-purple-100">
              <Text className="text-lg font-black mb-1 text-purple-800">Oyun Takip Modu 🕵️‍♂️</Text>
              <Text className="text-sm font-medium text-purple-600/80">
                Bu alanda sadece öğrencinizin oyun seviyelerindeki ilerleyişini, aşamalarını ve kelime hakimiyetini izleyebilirsiniz. Eğitsel oyunları bizzat tecrübe etme ve düello yetkisi tamamen öğrencinize aittir.
              </Text>
           </View>
        ) : (
           <>
             {/* Mode Selection */}
             <View className="bg-gray-100 p-1 rounded-2xl flex-row mb-6">
               <TouchableOpacity 
                 onPress={() => setSelectedMode('solo')}
                 className={`flex-1 py-3 items-center justify-center rounded-xl transition-all ${selectedMode === 'solo' ? 'bg-white shadow-sm' : 'bg-transparent'}`}
               >
                 <Text className={`font-bold ${selectedMode === 'solo' ? 'text-indigo-600 text-base' : 'text-gray-500'}`}>🧍‍♂️ Bireysel Çalış</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 onPress={() => setSelectedMode('duel')}
                 className={`flex-1 py-3 items-center justify-center rounded-xl transition-all ${selectedMode === 'duel' ? 'bg-rose-500 shadow-sm shadow-rose-300' : 'bg-transparent'}`}
               >
                 <Text className={`font-bold ${selectedMode === 'duel' ? 'text-white text-base' : 'text-gray-500'}`}>⚔️ Arkadaşla Düello</Text>
               </TouchableOpacity>
             </View>

             <View className={`p-5 rounded-3xl mb-6 shadow-sm ${selectedMode === 'solo' ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-50 border-rose-100'} border`}>
                <Text className={`text-lg font-black mb-1 ${selectedMode === 'solo' ? 'text-indigo-800' : 'text-rose-800'}`}>
                  {selectedMode === 'solo' ? 'Kelime Hazneni Genişlet' : 'Meydan Okuma Zamanı!'}
                </Text>
                <Text className={`text-sm font-medium ${selectedMode === 'solo' ? 'text-indigo-600/80' : 'text-rose-600/80'}`}>
                  {selectedMode === 'solo' 
                     ? 'İngilizcede en sık kullanılan hayati kelimeleri sırayla aç. Hızlı olan kazanır, can (❤️) puanlarına dikkat et!' 
                     : 'Sosyal ağından bir "Ebedi Rakip" veya "Kanka" seç. Aynı kelimeleri kim daha hızlı bilecek?'}
                </Text>
             </View>

             {selectedMode === 'duel' && (
                <View className="mb-6">
                   <Text className="font-extrabold text-gray-800 mb-2 text-sm uppercase tracking-widest pl-1">Meydan Okunacak Rakibi Seç:</Text>
                   <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
                      {['Ahmet Y. (Rakip)', 'Ayşe K. (Kanka)', 'Mehmet D.'].map((f, i) => (
                         <TouchableOpacity 
                            key={i} 
                            onPress={() => setDuelOpponent(f)}
                            className={`mr-3 px-5 py-3 rounded-2xl border ${duelOpponent === f ? 'bg-rose-500 border-rose-600 shadow-sm shadow-rose-200' : 'bg-white border-gray-200 shadow-sm shadow-gray-100'}`}
                         >
                            <Text className={`font-bold ${duelOpponent === f ? 'text-white' : 'text-gray-700'}`}>{duelOpponent === f ? '🎯 ' : ''}{f}</Text>
                         </TouchableOpacity>
                      ))}
                      <TouchableOpacity onPress={async () => {
                         const { requirePremium } = await import('../lib/premium');
                         const isPremium = await requirePremium(navigation, 'Arkadaş Ekleme Sınırı');
                         if (isPremium) navigation.navigate('SocialDashboard');
                      }} className="mr-3 px-5 py-3 rounded-2xl border border-dashed border-gray-400 bg-gray-50 flex-row items-center">
                         <Text className="text-gray-600 font-extrabold">+ Sosyal Ağdan Ekle</Text>
                      </TouchableOpacity>
                   </ScrollView>
                </View>
             )}
           </>
        )}

        <Text className="text-xl font-extrabold text-gray-800 mb-4">Seviyeler</Text>

        {/* Levels List */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {LEVELS.map((level, idx) => {
            // First 2 modes (A1, A2) are free (idx 0 and 1). Rest are premium.
            const isPremiumOnly = (idx >= 2);
            
            // Visual state indicating if it's considered premium-locked visually
            const visualUnlockedLevel = adminOverride || !isPremiumOnly;

            return (
            <View key={level.id} className="mb-3">
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => toggleLevel(level.id, isPremiumOnly)}
                className={`flex-row items-center border p-5 rounded-2xl ${visualUnlockedLevel ? (expandedLevel === level.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100 shadow-sm shadow-gray-100') : 'bg-slate-50 border-slate-200'}`}
              >
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${visualUnlockedLevel ? 'bg-indigo-100' : 'bg-slate-200'}`}>
                  {visualUnlockedLevel ? <Text className="text-xl">🏆</Text> : <Text className="text-xl">👑</Text>}
                </View>
                
                <View className="flex-1">
                  <Text className={`text-lg font-black ${visualUnlockedLevel ? 'text-gray-800' : 'text-slate-600'}`}>
                     {level.title}
                  </Text>
                  <Text className="text-gray-400 font-medium text-xs">{level.desc}</Text>
                </View>

                <View className="items-end">
                  {visualUnlockedLevel ? (
                    <Text className="text-gray-400 font-bold">{expandedLevel === level.id ? '🔼 Kapat' : '🔽 Aç'}</Text>
                  ) : (
                    <Text className="text-xs font-bold text-amber-500 mt-1 uppercase">Pro Kilit</Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Sub-stages (Accordion Expansion) */}
              {expandedLevel === level.id && (
                <View className="bg-indigo-50/50 rounded-b-2xl border border-t-0 border-indigo-100 p-2 mx-2">
                   <View className="flex-row flex-wrap justify-between p-2">
                     {[...Array(level.stages)].map((_, i) => {
                        const isStageUnlocked = adminOverride || i < 3; // Demo: first three stages unlocked natively
                        
                        // Pseudo-metrics for completion parity:
                        let completionPct = 0;
                        let successScore: number | null = null;
                        if (isStageUnlocked) {
                          if (i === 0) { completionPct = 100; successScore = 95; }
                          else if (i === 1) { completionPct = 100; successScore = 70; }
                          else if (i === 2) { completionPct = 40; }
                        }

                        return (
                          <TouchableOpacity 
                            key={i}
                            disabled={!isStageUnlocked || isParentView}
                            onPress={() => navigation.navigate('EnglishGameScreen', { levelId: level.id, stage: i + 1, mode: selectedMode })}
                            className={`w-[48%] py-3 mb-2 rounded-xl items-center border relative overflow-hidden ${isStageUnlocked ? 'bg-white border-indigo-200 shadow-sm' : 'bg-gray-100 border-gray-200 opacity-60'}`}
                          >
                             {/* Embedded Visual Progress Bar Background */}
                             {isStageUnlocked && completionPct > 0 && (
                                <View className={`absolute left-0 top-0 bottom-0 ${completionPct === 100 ? 'bg-emerald-100/40' : 'bg-amber-100/40'}`} style={{ width: `${completionPct}%` }} />
                             )}
                             
                             <View className="z-10 w-full px-3">
                               <View className="flex-row justify-between w-full items-center mb-0.5">
                                 <Text className={`font-black ${isStageUnlocked ? (completionPct === 100 ? 'text-emerald-700' : 'text-indigo-800') : 'text-gray-400'}`}>
                                   Aşama {i+1}
                                 </Text>
                                 {isStageUnlocked && completionPct > 0 && (
                                   <Text className={`text-[10px] font-black ${completionPct === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                     %{completionPct}
                                   </Text>
                                 )}
                               </View>

                               <View className="flex-row justify-between w-full items-center">
                                 <Text className={`text-[10px] font-bold ${isStageUnlocked ? 'text-gray-500' : 'text-gray-400'}`}>{level.words} Kelime</Text>
                                 
                                 {isStageUnlocked && completionPct === 100 && successScore !== null && (
                                   <Text className="text-[10px] font-black text-emerald-700">Başarı: {successScore}</Text>
                                 )}
                                 {isStageUnlocked && completionPct > 0 && completionPct < 100 && (
                                   <Text className="text-[10px] font-bold text-amber-600">Oynanıyor</Text>
                                 )}
                               </View>
                             </View>
                          </TouchableOpacity>
                        );
                     })}
                   </View>
                </View>
              )}
            </View>
          )})}
        </ScrollView>

      </View>
    </SafeAreaView>
  );
}
