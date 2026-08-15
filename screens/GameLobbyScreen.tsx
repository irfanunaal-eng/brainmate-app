import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const GLOBAL_LEVELS = [
  { id: 'A1', title: 'A1 Şampiyonu', desc: 'Başlangıç (A1) seviyesindeki tüm kelimeleri kapsar.', unlocked: true, stars: 3, stages: 15, words: 20 },
  { id: 'A2', title: 'A2 Kaptanı', desc: 'Temel (A2) seviyesindeki yeni kelimeleri içerir.', unlocked: true, stars: 1, stages: 20, words: 25 },
  { id: 'B1', title: 'B1 Uzmanı', desc: 'Orta (B1) seviyesi kelimelerini kapsar.', unlocked: true, stars: 0, stages: 25, words: 40 },
  { id: 'B2', title: 'B2 Lideri', desc: 'İleri (B2) seviye zenginleştirilmiş kelime havuzu.', unlocked: false, stars: 0, stages: 30, words: 50 },
  { id: 'C1', title: 'C1 Efsanesi', desc: 'Akademik ve akıcı (C1) seviye son kelimeler.', unlocked: false, stars: 0, stages: 40, words: 50 },
];

const CURRICULUM_GRADES: Record<string, any[]> = {
  '5': [
    { id: '5_U1', title: 'Unit 1: Hello!', desc: 'Tanışma ve Selamlaşma, Sınıf İçi Emirler.', unlocked: true, stageNames: ['Greetings', 'Introductions', 'Classroom Rules', 'Numbers & Age', 'Mixed Practice'], words: 20 },
    { id: '5_U2', title: 'Unit 2: My Town', desc: 'Ülkeler, Milletler ve Yönler.', unlocked: true, stageNames: ['Places', 'Directions', 'Countries', 'Nationalities', 'Locations'], words: 25 },
    { id: '5_U3', title: 'Unit 3: Games and Hobbies', desc: 'Oyunlar, Hobiler ve Sporlar.', unlocked: true, stageNames: ['Sports', 'Hobbies', 'Board Games', 'Abilities (Can)', 'Likes/Dislikes', 'Mixed Puzzle'], words: 30 },
    { id: '5_U4', title: 'Unit 4: My Daily Routine', desc: 'Günlük Rutinler, Eylemler ve Zaman.', unlocked: false, stageNames: ['Morning Routine', 'Telling Time', 'School Day', 'After School', 'Evening Routine'], words: 35 },
    { id: '5_U5', title: 'Unit 5: Health', desc: 'Sağlık İfadeleri ve Hastalıklar.', unlocked: false, stageNames: ['Body Parts', 'Illnesses', 'Feelings', 'Advices (Should)', 'At the Doctor'], words: 30 },
  ],
  '6': [
    { id: '6_U1', title: 'Unit 1: Life', desc: 'Günlük Yaşam Döngüsü ve İşler.', unlocked: true, stageNames: ['Daily Activities', 'Time & Dates', 'Family Routines', 'Chores', 'Weekly Tracker'], words: 25 },
    { id: '6_U2', title: 'Unit 2: Yummy Breakfast', desc: 'Yiyecekler ve Tercihler.', unlocked: false, stageNames: ['Breakfast Items', 'Drinks', 'Preferences', 'Ordering Food', 'Healthy Choices'], words: 35 },
  ],
  '7': [
    { id: '7_U1', title: 'Unit 1: Appearance', desc: 'Dış Görünüş ve Karakterler.', unlocked: true, stageNames: ['Physical traits', 'Personality', 'Comparison', 'Describing People', 'Guess Who'], words: 40 },
  ],
  '8': [
    { id: '8_U1', title: 'Unit 1: Friendship', desc: 'Arkadaşlık, Davetler ve LGS Hazırlık.', unlocked: true, stageNames: ['Making Friends', 'Invitations', 'Accepting', 'Refusing / Excuses', 'Personal Traits'], words: 45 },
  ],
  '9': [
    { id: '9_U1', title: 'Unit 1: Studying Abroad', desc: 'Yurtdışında Eğitim ve Yabancı Kültürler.', unlocked: true, stageNames: ['Meeting New People', 'Countries & Nationalities', 'Asking for Directions'], words: 40 },
  ],
  '10': [
    { id: '10_U1', title: 'Unit 1: School Life', desc: 'Okul Yaşamı, Kurallar ve Dersler.', unlocked: true, stageNames: ['School Subjects', 'Obligations (Must/Have to)', 'Extracurricular Activities'], words: 45 },
  ],
  '11': [
    { id: '11_U1', title: 'Unit 1: Future Jobs', desc: 'Gelecekteki Meslekler ve İstihdam.', unlocked: true, stageNames: ['Professions', 'Job Interviews', 'Future Tenses'], words: 50 },
  ],
  '12': [
    { id: '12_U1', title: 'Unit 1: Music', desc: 'Müzik Türleri ve İfade Biçimleri.', unlocked: true, stageNames: ['Genres', 'Expressing Preferences', 'Concerts & Events'], words: 50 },
  ]
};

const SUBJECTS = [
  { id: 'english', icon: '🇬🇧', label: 'İngilizce' },
  { id: 'turkish', icon: '🇹🇷', label: 'Türkçe & Ede.' },
  { id: 'math', icon: '🧮', label: 'Matematik' },
  { id: 'science', icon: '🧬', label: 'Fen (Fiz/Kim/Biy)' },
  { id: 'history', icon: '🏛️', label: 'Tarih' },
  { id: 'geography', icon: '🌍', label: 'Coğrafya' },
  { id: 'philosophy', icon: '🤔', label: 'Felsefe & Din' },
];

export function GameLobbyScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const isParentView = route?.params?.isParentView || false;
  const [selectedMode, setSelectedMode] = useState<'solo' | 'duel'>('solo');
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [adminOverride, setAdminOverride] = useState(false);
  const [duelOpponent, setDuelOpponent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePath, setActivePath] = useState<'school' | 'global'>('school');
  const [activeGrade, setActiveGrade] = useState<string>('5');
  const [activeSubject, setActiveSubject] = useState<string>('english');

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const savedPath = await AsyncStorage.getItem('@game_path');
      const savedGrade = await AsyncStorage.getItem('@game_grade');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('grade').eq('id', user.id).single();
        let initialGrade = profile?.grade?.replace(/[^0-9]/g, '') || '5';
        if (!['5','6','7','8','9','10','11','12'].includes(initialGrade)) initialGrade = '5';
        
        setActivePath((savedPath as any) || 'school');
        setActiveGrade(savedGrade || initialGrade);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const switchPath = async (path: 'school' | 'global') => {
    setActivePath(path);
    setExpandedLevel(null);
    await AsyncStorage.setItem('@game_path', path);
  };

  const switchGrade = async (grade: string) => {
    setActiveGrade(grade);
    setExpandedLevel(null);
    await AsyncStorage.setItem('@game_grade', grade);
  };

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
        <View className="flex-row justify-between items-center mb-4 mt-2">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full">
            <Text className="text-xl">🔙</Text>
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-gray-800 ml-2 flex-1 text-center" adjustsFontSizeToFit numberOfLines={1}>
            {SUBJECTS.find(s => s.id === activeSubject)?.label} Edu-Pratik
          </Text>
          <TouchableOpacity 
            onPress={() => setAdminOverride(!adminOverride)}
            className={`px-3 py-2 rounded-full flex-row items-center ml-2 ${adminOverride ? 'bg-purple-100' : 'bg-amber-100'}`}
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
             {/* Subject Selector */}
             <View className="mb-6">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4, paddingVertical: 4 }}>
                  {SUBJECTS.map((sub) => (
                    <TouchableOpacity 
                      key={sub.id}
                      onPress={() => {
                        setActiveSubject(sub.id);
                        setExpandedLevel(null);
                      }}
                      className={`mr-3 flex-row items-center px-4 py-2.5 rounded-full border shadow-sm ${activeSubject === sub.id ? 'bg-indigo-600 border-indigo-700 shadow-indigo-300' : 'bg-white border-gray-200 shadow-gray-100'}`}
                    >
                      <Text className="mr-2 text-lg">{sub.icon}</Text>
                      <Text className={`font-black ${activeSubject === sub.id ? 'text-white' : 'text-gray-600'}`}>{sub.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
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

         {loading ? (
            <View className="mt-8 items-center"><ActivityIndicator size="large" color="#4f46e5" /></View>
         ) : (
            <>
              {/* Path Tabs */}
              <View className="flex-row mb-4 bg-gray-100 p-1 rounded-2xl">
                <TouchableOpacity 
                  onPress={() => switchPath('school')}
                  className={`flex-1 py-3 items-center rounded-xl ${activePath === 'school' ? 'bg-white shadow-sm border border-gray-200' : ''}`}
                >
                  <Text className={`font-bold ${activePath === 'school' ? 'text-indigo-600' : 'text-gray-500'}`}>📍 Okul (Sınıf Yolculuğu)</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => switchPath('global')}
                  className={`flex-1 py-3 items-center rounded-xl ${activePath === 'global' ? 'bg-white shadow-sm border border-gray-200' : ''}`}
                >
                  <Text className={`font-bold ${activePath === 'global' ? 'text-rose-600' : 'text-gray-500'}`}>🌍 Global (Tüm Seviyeler)</Text>
                </TouchableOpacity>
              </View>

              {/* Grade Tabs (Only for School Path) */}
              {activePath === 'school' && (
                <View className="mb-6">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4, paddingVertical: 4 }}>
                    {['5', '6', '7', '8', '9', '10', '11', '12'].map(g => (
                      <TouchableOpacity
                        key={g}
                        onPress={() => switchGrade(g)}
                        className={`mr-3 px-6 py-3 rounded-full border shadow-sm ${activeGrade === g ? 'bg-indigo-600 border-indigo-700 shadow-indigo-300' : 'bg-white border-gray-200 shadow-gray-100'}`}
                      >
                        <Text className={`font-black ${activeGrade === g ? 'text-white' : 'text-gray-600'}`}>{g}. Sınıf</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text className="text-xl font-extrabold text-gray-800 mb-4">{activePath === 'school' ? `${activeGrade}. Sınıf Üniteleri` : 'CEFR Seviyeleri (1000+ Kelime)'}</Text>

              {/* Levels List */}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {(() => {
                  const itemsToRender = activePath === 'school' ? (CURRICULUM_GRADES[activeGrade] || []) : GLOBAL_LEVELS;
                  return itemsToRender.map((level, idx) => {
                    const isPremiumOnly = activePath === 'global' ? (idx >= 2) : (!level.unlocked);
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
                            <Text className="text-gray-400 font-medium text-xs pr-1">{level.desc}</Text>
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
                              {[...Array(level.stageNames ? level.stageNames.length : (level.stages || 1))].map((_, i) => {
                                  const isStageUnlocked = adminOverride || i < 3; // Demo: first three stages unlocked natively
                                  const stageNameStr = level.stageNames ? `${i+1}. ${level.stageNames[i]}` : `Aşama ${i+1}`;
                                  
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
                                          <Text 
                                            className={`font-black flex-1 pr-1 ${isStageUnlocked ? (completionPct === 100 ? 'text-emerald-700' : 'text-indigo-800') : 'text-gray-400'}`}
                                            adjustsFontSizeToFit
                                            numberOfLines={1}
                                          >
                                            {stageNameStr}
                                          </Text>
                                          {isStageUnlocked && completionPct > 0 && (
                                            <Text className={`text-[10px] font-black ${completionPct === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                              %{completionPct}
                                            </Text>
                                          )}
                                        </View>

                                        <View className="flex-row justify-between w-full items-center">
                                          <Text className={`text-[10px] font-bold ${isStageUnlocked ? 'text-gray-500' : 'text-gray-400'}`}>~25 Kelime</Text>
                                          
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
                    );
                  });
                })()}
              </ScrollView>
            </>
         )}
      </View>
    </SafeAreaView>
  );
}
