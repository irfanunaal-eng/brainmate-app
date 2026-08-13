import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, TextInput } from 'react-native';

export function AcademicDashboardScreen({ navigation }: any) {
  // Mock Data
  const [absences, setAbsences] = useState({
    unexcused: 3.5, // Özürsüz (max 10)
    excused: 5,     // Özürlü/Raporlu (toplam max 30)
    late: 2         // Geç kalma (5 geç kalma = 1 yarım gün özürsüz)
  });

  const [average, setAverage] = useState('86.5'); // Takdir

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-center mb-6 mt-2">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Text className="text-primary font-bold text-lg">← Geri</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-extrabold text-text">Akademik Panel</Text>
          <View className="w-10" />
        </View>

        {/* Takdir / Teşekkür Hesaplama */}
        <View className="bg-secondary/10 p-6 rounded-3xl mb-8 border border-secondary/20">
          <Text className="text-secondary-800 font-extrabold text-xl mb-2">Not Ortalaması & Belge</Text>
          <Text className="text-gray-500 mb-4 text-sm">Girilen sınav notlarına göre dönem sonu MEB belge tahmini.</Text>
          
          <View className="flex-row items-center justify-between bg-white p-5 rounded-2xl shadow-sm mb-4">
            <View>
              <Text className="text-gray-400 font-bold mb-1">Güncel Ortalama</Text>
              <Text className="text-4xl font-extrabold text-gray-800">{average}</Text>
            </View>
            <View className="bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
              <Text className="text-primary font-extrabold text-lg">🏅 Takdir</Text>
            </View>
          </View>
          
          <TouchableOpacity className="bg-secondary w-full py-3 rounded-xl items-center shadow-sm">
            <Text className="text-white font-bold">Notları Düzenle</Text>
          </TouchableOpacity>
        </View>

        {/* Devamsızlık Takibi */}
        <Text className="text-xl font-extrabold text-text mb-4">M.E.B. Devamsızlık Takibi 📅</Text>
        <Text className="text-gray-400 mb-6 text-sm">Dikkat: Özürsüz devamsızlık 10 günü aşarsa sınıf tekrarı uygulanır. 5 kez geç kalmak 1 yarım gün sayılır.</Text>

        <View className="flex-row flex-wrap justify-between mb-8">
          {/* Özürsüz */}
          <View className="bg-red-50 p-4 rounded-2xl w-[48%] border border-red-100 mb-4">
            <Text className="text-red-500 font-bold mb-1 text-sm">Özürsüz</Text>
            <View className="flex-row items-end">
              <Text className="text-3xl font-extrabold text-red-600">{absences.unexcused}</Text>
              <Text className="text-red-400 font-bold mb-1 ml-1">/ 10</Text>
            </View>
            <View className="w-full bg-red-200 h-2 mt-2 rounded-full overflow-hidden">
              <View className="bg-red-500 h-full" style={{ width: `${(absences.unexcused / 10) * 100}%` }} />
            </View>
          </View>

          {/* Özürlü */}
          <View className="bg-emerald-50 p-4 rounded-2xl w-[48%] border border-emerald-100 mb-4">
            <Text className="text-emerald-600 font-bold mb-1 text-sm">Özürlü (Rapor)</Text>
            <View className="flex-row items-end">
              <Text className="text-3xl font-extrabold text-emerald-700">{absences.excused}</Text>
              <Text className="text-emerald-500 font-bold mb-1 ml-1">/ 20</Text>
            </View>
            <View className="w-full bg-emerald-200 h-2 mt-2 rounded-full overflow-hidden">
              <View className="bg-emerald-500 h-full" style={{ width: `${(absences.excused / 20) * 100}%` }} />
            </View>
          </View>

          {/* Geç Kalma */}
          <View className="bg-amber-50 p-4 rounded-2xl w-full border border-amber-100">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-amber-600 font-bold text-sm">Geç Kalma</Text>
              <Text className="text-amber-600 font-bold text-xs bg-amber-200 px-2 py-1 rounded-md">3 Hak Kaldı</Text>
            </View>
            <Text className="text-gray-700 font-medium text-sm">
              <Text className="font-extrabold text-amber-600 text-lg">{absences.late} </Text> 
              kez geç kaldın. 5 olunca 0.5 gün özürsüz yazılacak.
            </Text>
          </View>
        </View>

        <TouchableOpacity className="bg-white border-2 border-gray-200 w-full py-4 rounded-xl items-center mb-10 shadow-sm">
          <Text className="text-gray-600 font-bold text-lg">+ Yeni Devamsızlık Ekle</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
