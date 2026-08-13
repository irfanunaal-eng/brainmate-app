import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

// Global state to persist timer across screen navigations
let globalTimer = 25 * 60;
let globalIsRunning = false;
let globalSubject = '';
let globalSelectedTaskId: string | null = null;
let globalLastUnmountTime: number | null = null;

export function EducationDashboardScreen({ navigation }: any) {
  const [timer, setTimer] = useState(globalTimer); // 25 dakika Pomodoro veya Görev süresi
  const [isRunning, setIsRunning] = useState(globalIsRunning);
  const [subject, setSubject] = useState(globalSubject);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(globalSelectedTaskId);
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    // If it was running in the background while unmounted, calculate elapsed time
    if (globalIsRunning && globalLastUnmountTime) {
      const elapsedSeconds = Math.floor((Date.now() - globalLastUnmountTime) / 1000);
      const newTimer = Math.max(0, globalTimer - elapsedSeconds);
      setTimer(newTimer);
      globalTimer = newTimer;
    }
    globalLastUnmountTime = null;

    return () => {
      // When leaving the screen, record the exact time so we can calculate background progress
      globalLastUnmountTime = Date.now();
    };
  }, []);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data && !error) {
        setTasks(data);
      }
    }
    setLoadingTasks(false);
  };

  useEffect(() => {
    globalTimer = timer;
    globalIsRunning = isRunning;
    globalSubject = subject;
    globalSelectedTaskId = selectedTaskId;
  }, [timer, isRunning, subject, selectedTaskId]);

  useEffect(() => {
    let interval: any;
    if (isRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && isRunning) {
      setIsRunning(false);
      handleSaveSession(25); // Tamamlandı
    }
    return () => clearInterval(interval);
  }, [isRunning, timer]);

  const handleSaveSession = async (minutes: number) => {
    if (minutes <= 0) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const finalSubject = subject.trim() === '' ? 'Serbest Çalışma' : subject;
      const { error } = await supabase
        .from('study_sessions')
        .insert([{ student_id: user.id, subject: finalSubject, duration_minutes: Math.ceil(minutes) }]);
      
      if (error) {
        Alert.alert('Kayıt Hatası', error.message);
      } else {
        // Eğer bir görev seçiliyse, o görevin ilerlemesini de güncelle
        if (selectedTaskId) {
          const task = tasks.find(t => t.id === selectedTaskId);
          if (task) {
            const newCompleted = (task.completed_minutes || 0) + Math.ceil(minutes);
            const isCompleted = newCompleted >= task.planned_minutes;
            await supabase.from('tasks').update({
              completed_minutes: newCompleted,
              status: isCompleted ? 'tamamlandi' : 'devam_ediyor'
            }).eq('id', selectedTaskId);
            
            fetchTasks(); // Listeyi yenile
          }
        }

        Alert.alert('Harika! 🚀', `${Math.ceil(minutes)} dakikalık çalışma süren başarıyla eklendi. (Veliniz/Öğretmeniniz anlık görebilir)`);
        setTimer(25 * 60);
        setIsRunning(false);
        setSelectedTaskId(null);
        setSubject('');
      }
    }
  };

  const finishEarlyAndSave = () => {
    if (!isRunning) return Alert.alert('Hata', 'Sayaç şu an çalışmıyor.');
    
    setIsRunning(false);
    
    // Calculate elapsed based on whether a task is selected or it's a standard pomodoro
    let elapsedSeconds = 0;
    if (selectedTaskId) {
       const task = tasks.find(t => t.id === selectedTaskId);
       if (task) {
         const startingSeconds = (task.planned_minutes - (task.completed_minutes || 0)) * 60;
         elapsedSeconds = startingSeconds - timer;
       }
    } else {
       elapsedSeconds = (25 * 60) - timer;
    }
    
    const elapsedMinutes = elapsedSeconds / 60;
    
    if (elapsedMinutes < 1) {
      Alert.alert('Çok Erken', 'Kaydedilecek kadar çalışmadın (En az 1 dakika).');
      return;
    }
    
    handleSaveSession(elapsedMinutes);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimer(25 * 60);
    setSelectedTaskId(null);
    setSubject('');
  };

  const handleSelectTask = (task: any) => {
    if (isRunning) return Alert.alert('Hata', 'Önce mevcut sayacı durdurmalısınız.');
    if (task.status === 'tamamlandi') return Alert.alert('Bilgi', 'Bu görev zaten tamamlanmış!');
    
    const remainingMinutes = task.planned_minutes - (task.completed_minutes || 0);
    if (remainingMinutes <= 0) return;
    
    setSelectedTaskId(task.id);
    setSubject(task.title);
    setTimer(remainingMinutes * 60);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-center mb-6 mt-2">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Text className="text-primary font-bold text-lg">← Geri</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-extrabold text-text">Eğitim & Takip</Text>
          <View className="w-10" />
        </View>

        {/* Pomodoro Timer */}
        <View className="bg-primary p-6 rounded-3xl mb-8 items-center shadow-sm">
          <Text className="text-white/90 font-bold text-lg mb-4">Ne Çalışıyorsun?</Text>
          
          <TextInput 
            className="bg-white/20 px-6 py-3 rounded-xl text-white font-bold w-full text-center text-lg mb-4 border border-white/30"
            placeholder="Örn: Matematik - Üslü Sayılar"
            placeholderTextColor="#fef3c7"
            value={subject}
            onChangeText={setSubject}
          />
          
          <Text className="text-7xl font-extrabold text-white tracking-widest my-2">{formatTime(timer)}</Text>
          <View className="flex-row mt-2 items-center">
            <TouchableOpacity 
              onPress={toggleTimer}
              className={`px-8 py-4 rounded-full mr-3 ${isRunning ? 'bg-red-400' : 'bg-white'}`}
            >
              <Text className={`font-extrabold text-lg ${isRunning ? 'text-white' : 'text-primary'}`}>
                {isRunning ? 'Durdur' : 'Başlat'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={finishEarlyAndSave}
              className="bg-emerald-500 px-5 py-4 rounded-full shadow-sm mr-3"
            >
              <Text className="font-bold text-base text-white">Kaydet</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={resetTimer}
              className="px-4 py-4 rounded-full border border-white/40 justify-center"
            >
              <Text className="font-bold text-base text-white">Sıfırla</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* İstatistikler */}
        <Text className="text-xl font-extrabold text-text mb-4">Deneme Sınavı Netlerin 📈</Text>
        <View className="flex-row mb-8">
          <View className="flex-1 bg-tertiary/40 p-5 rounded-2xl items-center border border-tertiary mr-2">
            <Text className="text-gray-600 font-bold mb-1 text-xs text-center">Son TYT Denemesi</Text>
            <Text className="text-2xl font-extrabold text-gray-800">74.5 Net</Text>
          </View>
          <View className="flex-1 bg-secondary/10 p-5 rounded-2xl items-center border border-secondary/30 ml-2">
            <Text className="text-gray-600 font-bold mb-1 text-xs text-center">Son LGS Denemesi</Text>
            <Text className="text-2xl font-extrabold text-gray-800">415 Puan</Text>
          </View>
        </View>

        {/* Görevler / Üniteler */}
        <Text className="text-xl font-extrabold text-text mb-4">Sana Atanan Görevler 🎯</Text>
        <View className="bg-gray-50 p-5 rounded-2xl mb-8 border border-gray-200">
          {loadingTasks ? (
            <ActivityIndicator color="#fcd34d" />
          ) : tasks.length === 0 ? (
            <Text className="text-gray-400 font-bold text-center py-4">Henüz sana atanmış bir görev yok.</Text>
          ) : (
            tasks.map((task) => {
              const isCompleted = task.status === 'tamamlandi';
              const isSelected = selectedTaskId === task.id;
              
              return (
                <View key={task.id} className={`flex-row items-center justify-between mb-4 ${isSelected ? 'bg-amber-100/50 p-2 rounded-xl -mx-2' : ''}`}>
                  <View className="flex-row items-center flex-1">
                    <View className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${isCompleted ? 'bg-secondary' : 'border-2 border-secondary'}`}>
                      {isCompleted && <Text className="text-white text-sm font-bold">✓</Text>}
                    </View>
                    <View className="flex-1">
                      <Text className={`text-gray-700 font-bold text-base ${isCompleted ? 'line-through text-gray-400' : ''}`} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text className="text-gray-400 text-xs font-bold">
                        {task.completed_minutes || 0} / {task.planned_minutes} dk tamamlandı
                      </Text>
                    </View>
                  </View>
                  
                  {!isCompleted && !isSelected && (
                    <TouchableOpacity 
                      onPress={() => handleSelectTask(task)}
                      className="bg-primary px-3 py-2 rounded-lg ml-2"
                    >
                      <Text className="text-white font-bold text-xs">Başla</Text>
                    </TouchableOpacity>
                  )}
                  {isSelected && (
                    <View className="bg-amber-500 px-3 py-2 rounded-lg ml-2">
                      <Text className="text-white font-bold text-xs">Seçili</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
