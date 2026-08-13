import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const LEVELS = [
  { id: '200', title: 'İlk 200 Kelime', desc: 'Başlangıç Seviyesi (A1)', unlocked: true, stars: 3 },
  { id: '500', title: 'İlk 500 Kelime', desc: 'Temel Seviye (A2)', unlocked: true, stars: 1 },
  { id: '1000', title: 'İlk 1000 Kelime', desc: 'Orta Seviye (B1)', unlocked: false, stars: 0 },
  { id: '2000', title: 'İlk 2000 Kelime', desc: 'İleri Seviye (B2)', unlocked: false, stars: 0 },
  { id: '3000', title: 'İlk 3000 Kelime', desc: 'Akıcı (C1)', unlocked: false, stars: 0 },
];

export function GameLobbyScreen() {
  const navigation = useNavigation<any>();
  const [selectedMode, setSelectedMode] = useState<'solo' | 'duel'>('solo');
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);

  const toggleLevel = (id: string, isUnlocked: boolean) => {
    if (!isUnlocked) return;
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
          <View className="bg-amber-100 px-3 py-2 rounded-full flex-row items-center">
            <Text className="text-amber-600 font-black mr-1">450</Text>
            <Text className="text-xs">⚡</Text>
          </View>
        </View>

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

        {/* Info Box */}
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

        <Text className="text-xl font-extrabold text-gray-800 mb-4">Seviyeler</Text>

        {/* Levels List */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {LEVELS.map((level) => (
            <View key={level.id} className="mb-3">
              <TouchableOpacity 
                disabled={!level.unlocked}
                onPress={() => toggleLevel(level.id, level.unlocked)}
                className={`flex-row items-center border p-5 rounded-2xl ${level.unlocked ? (expandedLevel === level.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100 shadow-sm shadow-gray-100') : 'bg-gray-50 border-gray-200 opacity-60'}`}
              >
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${level.unlocked ? 'bg-indigo-100' : 'bg-gray-200'}`}>
                  {level.unlocked ? <Text className="text-xl">🏆</Text> : <Text className="text-xl">🔒</Text>}
                </View>
                
                <View className="flex-1">
                  <Text className={`text-lg font-black ${level.unlocked ? 'text-gray-800' : 'text-gray-500'}`}>{level.title}</Text>
                  <Text className="text-gray-400 font-medium text-xs">{level.desc}</Text>
                </View>

                <View className="items-end">
                  {level.unlocked && (
                    <Text className="text-gray-400 font-bold">{expandedLevel === level.id ? '🔼 Kapat' : '🔽 Aç'}</Text>
                  )}
                  {!level.unlocked && (
                    <Text className="text-xs font-bold text-gray-400 mt-1">Kilitli</Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Sub-stages (Accordion Expansion) */}
              {expandedLevel === level.id && (
                <View className="bg-indigo-50/50 rounded-b-2xl border border-t-0 border-indigo-100 p-2 mx-2">
                   <View className="flex-row flex-wrap justify-between p-2">
                     {[...Array(10)].map((_, i) => {
                        const isStageUnlocked = i < 2; // Demo: first two are unlocked
                        return (
                          <TouchableOpacity 
                            key={i}
                            disabled={!isStageUnlocked}
                            onPress={() => navigation.navigate('EnglishGameScreen', { levelId: level.id, stage: i + 1, mode: selectedMode })}
                            className={`w-[48%] py-3 mb-2 rounded-xl items-center border ${isStageUnlocked ? 'bg-white border-indigo-200 shadow-sm' : 'bg-gray-100 border-gray-200 opacity-60'}`}
                          >
                             <Text className={`font-bold ${isStageUnlocked ? 'text-indigo-800' : 'text-gray-400'}`}>Aşama {i+1}</Text>
                             <Text className="text-[10px] text-gray-400 mt-0.5">20 Kelime</Text>
                          </TouchableOpacity>
                        );
                     })}
                   </View>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

      </View>
    </SafeAreaView>
  );
}
