import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

export function AcademicDashboardScreen({ navigation, route }: any) {
  const isFocused = useIsFocused();
  const [isLoading, setIsLoading] = useState(true);
  
  const [absences, setAbsences] = useState({
    unexcused: 0, 
    excused: 0,   
    late: 0       
  });

  const [average, setAverage] = useState<string | null>(null);

  useEffect(() => {
    if (isFocused) {
       fetchAcademicData();
    }
  }, [isFocused]);

  const getAvg = (arr: string[]) => {
    const valid = arr.map(v => parseFloat(v)).filter(v => !isNaN(v));
    if(valid.length === 0) return null;
    return valid.reduce((a,b)=>a+b,0)/valid.length;
  };

  const fetchAcademicData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let sId = user?.id;
      if (route?.params?.studentId) sId = route.params.studentId;
      if (!sId) return;

      // --- DEVAMSIZLIK ÇEKME ---
      try {
         let logs: any[] = [];
         
         // Önce veritabanından çekmeyi dene (farklı cihazdan giren veliler için)
         try {
           const { data: dbLogs } = await supabase.from('attendance_logs').select('*').eq('student_id', sId);
           if (dbLogs && dbLogs.length > 0) logs = dbLogs;
         } catch(e) {}

         // Eğer veritabanı boş ise (veya çekemediyse) yerel cache'e bak
         if (logs.length === 0) {
            const attLogsData = await AsyncStorage.getItem(`@att_logs_${sId}`);
            if (attLogsData) logs = JSON.parse(attLogsData);
         }

         if (logs && logs.length > 0) {
             let mazeretsizSaat = 0;
             let mazeretliSaat = 0;
             let gecSayisi = 0;
             const STATUS_OPTS: Record<string, string> = {
               'yok': 'mazeretsiz', 'gec': 'gec', 'rapor': 'mazeretli', 'izin': 'mazeretli', 'faaliyet': 'present'
             };
             
             logs.forEach((log: any) => {
                 const tType = STATUS_OPTS[log.statusId] || 'present';
                 if (tType === 'present') return;
                 if (tType === 'gec') {
                    gecSayisi++;
                 } else {
                    let hours = 0;
                    if (log.scope === 'tam_gun') hours = 8;
                    else if (log.scope === 'yarim_gun') hours = 4;
                    else if (log.periods && Array.isArray(log.periods)) hours = log.periods.length;
                    
                    if (tType === 'mazeretsiz') mazeretsizSaat += hours;
                    if (tType === 'mazeretli') mazeretliSaat += hours;
                 }
             });
             
             // 5 geç kalma = 0.5 gün (4 saat) özürsüz devamsızlık
             const gecDenGelenYarimGunler = Math.floor(gecSayisi / 5);
             mazeretsizSaat += (gecDenGelenYarimGunler * 4);

             setAbsences({
               unexcused: +(mazeretsizSaat / 8).toFixed(2),
               excused: +(mazeretliSaat / 8).toFixed(2),
               late: gecSayisi
             });
         }
      } catch(e) {}

      // --- NOTLARI ÇEKME VE HESAPLAMA ---
      let existingGrades: any[] = [];
      try {
        const { data: dbGrades } = await supabase.from('grades').select('grades_data').eq('student_id', sId).single();
        if (dbGrades && dbGrades.grades_data) existingGrades = dbGrades.grades_data;
      } catch(e) {}

      if (existingGrades.length === 0) {
         const cached = await AsyncStorage.getItem(`@grades_cache_${sId}`);
         if (cached) existingGrades = JSON.parse(cached);
      }

      const getTermAvgFlat = (tData: any) => {
         if (tData.muaf) return null;
         // GradesScreen.tsx'deki getTermAvg ile tam entegre!
         const nums = [...(tData.yazili || []), ...(tData.perf || []), ...(tData.uyg || []), tData.proje]
            .map((v: any) => parseFloat(v))
            .filter((v: number) => !isNaN(v));
         
         if (nums.length === 0) return null;
         return nums.reduce((a, b) => a + b, 0) / nums.length;
      };

      let totalScore = 0;
      let totalSaat = 0;

      existingGrades.forEach(sub => {
         const termData = sub['t1']; // 1. Dönem
         if (!termData || termData.muaf) return;

         const avg = getTermAvgFlat(termData);
         const saat = parseFloat(sub.saat);

         if (avg !== null && !isNaN(saat) && saat > 0) {
            totalScore += avg * saat;
            totalSaat += saat;
         }
      });

      if (totalSaat > 0) {
        setAverage((totalScore / totalSaat).toFixed(2));
      } else {
        setAverage(null);
      }

    } catch (error) {
       console.warn(error);
    } finally {
       setIsLoading(false);
    }
  };

  const getCert = (avg: number) => {
    if (avg >= 85) return { name: 'Takdir', color: '#16a34a', bg: 'bg-green-100', text: 'text-green-700', icon: '🏅' };
    if (avg >= 70) return { name: 'Teşekkür', color: '#d97706', bg: 'bg-amber-100', text: 'text-amber-700', icon: '🥈' };
    return { name: 'Belge Yok', color: '#94a3b8', bg: 'bg-gray-100', text: 'text-gray-600', icon: '📝' };
  };

  const certData = average ? getCert(parseFloat(average)) : getCert(0);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-center mb-6 mt-2">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full">
            <Text className="text-xl">🔙</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-extrabold text-text">Akademik Panel</Text>
          <View className="w-10">
            {isLoading && <ActivityIndicator color="#4f46e5" />}
          </View>
        </View>

        {/* Takdir / Teşekkür Hesaplama */}
        <View className="bg-secondary/10 p-6 rounded-3xl mb-8 border border-secondary/20">
          <Text className="text-secondary-800 font-extrabold text-xl mb-2">Not Ortalaması & Belge</Text>
          <Text className="text-gray-500 mb-4 text-sm">Girilen sınav notlarına göre dönem sonu MEB belge tahmini.</Text>
          
          <View className="flex-row items-center justify-between bg-white p-5 rounded-2xl shadow-sm mb-4">
            <View>
              <Text className="text-gray-400 font-bold mb-1">1. Dönem Ort.</Text>
              <Text className="text-4xl font-extrabold text-gray-800">{average || '-'}</Text>
            </View>
            <View className={`px-4 py-2 rounded-xl border ${certData.bg} border-gray-200`}>
              <Text className={`${certData.text} font-extrabold text-lg`}>{certData.icon} {certData.name}</Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={() => navigation.navigate('Grades')} className="bg-secondary w-full py-3 rounded-xl items-center shadow-sm">
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
              <View className="bg-red-500 h-full" style={{ width: `${Math.min((absences.unexcused / 10) * 100, 100)}%` }} />
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
