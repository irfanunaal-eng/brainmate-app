import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, TextInput, KeyboardAvoidingView, Platform, Keyboard, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

type TaskDoc = {
  id: string;
  title: string;
  subject: string;
  topic: string;
  hasAttachment: boolean;
  fileName?: string;
  fullText: string;
  bulletPoints: string[];
  status: 'pending' | 'in_progress' | 'completed';
  assignedByRole: string;
  date: number;
};

const SUBJECTS = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Tarih', 'İngilizce'];

export function TasksScreen({ navigation, route }: any) {
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [userRole, setUserRole] = useState<string>('student');
  const [resolvedStudentId, setResolvedStudentId] = useState<string>('default');

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState(SUBJECTS[0]);
  const [formTopic, setFormTopic] = useState('');
  const [formDocsMock, setFormDocsMock] = useState(false);
  const [formContent, setFormContent] = useState('');

  // Student View State
  const [viewingTask, setViewingTask] = useState<TaskDoc | null>(null);
  const [viewMode, setViewMode] = useState<'full' | 'bullets'>('full');

  const canWrite = userRole !== 'student';

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let sId = 'default';
      
      if (user) {
         const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
         if (profile) setUserRole(profile.role);
      }

      if (route.params?.studentId) {
         sId = route.params.studentId; 
      } else if (user && (!route.params?.studentId)) {
         sId = user.id; 
      }
      
      setResolvedStudentId(sId);

      const stored = await AsyncStorage.getItem(`@tasks_logs_${sId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.sort((a: any, b: any) => b.date - a.date);
        setTasks(parsed);
      } else {
        // Mock default task
        setTasks([{
           id: 't-123',
           title: 'Hücre Bölünmesi Çalışma Notları',
           subject: 'Biyoloji',
           topic: 'Mitoz ve Mayoz',
           hasAttachment: true,
           fileName: 'hücre_bolunmesi_ozet.pdf',
           fullText: 'Mitoz hücre bölünmesi, ana hücrenin bölünerek iki yeni yavru hücre oluşturmasıdır. Bu süreç büyüme ve yenilenmeyi sağlar. İnterfaz aşamasında DNA eşlenir. Ardından Profaz, Metafaz, Anafaz ve Telofaz evreleri gelir. Metafazda kromozomlar hücrenin ekvator bölgesine dizilir ve mikroskopta en net görüldükleri evredir.',
           bulletPoints: [
             'Mitoz bölünme büyüme ve doku onarımını sağlar.',
             'Bölünme öncesi İnterfaz (Hazırlık) evresinde DNA kendini eşler.',
             'Metafaz evresinde kromozomlar merkezde dizilir ve en belirgin haldedirler.',
             'Sonuçta genetik yapısı birbirinin tamamen aynısı olan 2 hücre oluşur.'
           ],
           status: 'pending',
           assignedByRole: 'Öğrenci Koçu',
           date: Date.now() - 86400000
        }]);
      }
    } catch (e) {}
  };

  const handleSaveTask = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      Alert.alert('Eksik Bilgi', 'Görev başlığı ve içeriği boş olamaz.');
      return;
    }

    // AI Mock Parsing Logic (Fake AI Summary for UI Demonstration)
    const bullets = formContent.split('.').filter(s => s.trim().length > 5).map(s => s.trim() + '.');

    const newTask: TaskDoc = {
        id: Date.now().toString(),
        title: formTitle,
        subject: formSubject,
        topic: formTopic || 'Genel Konu',
        hasAttachment: formDocsMock,
        fileName: formDocsMock ? `${formSubject.toLowerCase()}_notlar_${Date.now().toString().slice(-4)}.pdf` : undefined,
        fullText: formContent.trim(),
        bulletPoints: bullets.length > 0 ? bullets : [formContent.trim()],
        status: 'pending',
        assignedByRole: userRole === 'parent' ? 'Veli' : 'Öğretmen', // Simplified label
        date: Date.now()
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    
    try {
        await AsyncStorage.setItem(`@tasks_logs_${resolvedStudentId}`, JSON.stringify(updated));
    } catch(e) {}
    
    setFormTitle('');
    setFormTopic('');
    setFormContent('');
    setFormDocsMock(false);
    setIsAdding(false);
    Keyboard.dismiss();
    Alert.alert('Görev Atandı', 'Öğrencinin görev paneline yeni döküman eklendi. AI sistemi tarafından maddeler çıkarıldı!');
  };

  const updateTaskStatus = async (taskId: string, newStatus: 'in_progress' | 'completed') => {
      const updated = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
      setTasks(updated);
      setViewingTask(u => u && u.id === taskId ? { ...u, status: newStatus } : u);
      try {
        await AsyncStorage.setItem(`@tasks_logs_${resolvedStudentId}`, JSON.stringify(updated));
      } catch(e) {}
  };

  // ----- RENDERS -----

  if (viewingTask) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <View className="flex-row items-center px-6 py-4 bg-white border-b border-gray-100 z-10 shadow-sm">
          <TouchableOpacity onPress={() => setViewingTask(null)} className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full">
            <Text className="text-lg">🔙</Text>
          </TouchableOpacity>
          <View className="flex-1 ml-4 py-1">
             <Text className="text-sm font-bold text-indigo-500 uppercase tracking-widest">{viewingTask.subject} • {viewingTask.topic}</Text>
             <Text className="text-xl font-black text-slate-800" numberOfLines={1}>{viewingTask.title}</Text>
          </View>
        </View>

        <View className="flex-row bg-white border-b border-gray-100">
           <TouchableOpacity 
             onPress={() => setViewMode('full')}
             className={`flex-1 items-center justify-center py-4 border-b-2 ${viewMode === 'full' ? 'border-indigo-600' : 'border-transparent'}`}>
              <Text className={`font-black ${viewMode === 'full' ? 'text-indigo-600' : 'text-slate-400'}`}>📄 Tam Metin Göster</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             onPress={() => setViewMode('bullets')}
             className={`flex-1 items-center justify-center py-4 border-b-2 ${viewMode === 'bullets' ? 'border-amber-500' : 'border-transparent'}`}>
              <View className="flex-row items-center">
                 <Text className="mr-2">✨</Text>
                 <Text className={`font-black ${viewMode === 'bullets' ? 'text-amber-500' : 'text-slate-400'}`}>AI Özet Maddeleri</Text>
              </View>
           </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
           
           {viewingTask.hasAttachment && (
              <View className="flex-row items-center bg-rose-50 p-4 rounded-2xl mb-6 border border-rose-100 shadow-sm">
                 <Text className="text-3xl mr-3">📎</Text>
                 <View className="flex-1">
                    <Text className="font-bold text-rose-800 text-sm">Orjinal Döküman (PDF)</Text>
                    <Text className="font-bold text-rose-500/70 text-xs mt-0.5">{viewingTask.fileName}</Text>
                 </View>
                 <TouchableOpacity className="bg-rose-600 px-4 py-2 rounded-xl">
                    <Text className="font-black text-white text-xs">İndir</Text>
                 </TouchableOpacity>
              </View>
           )}

           {viewMode === 'full' ? (
              <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[300px]">
                 <Text className="text-base text-slate-700 leading-7 font-medium text-justify">{viewingTask.fullText}</Text>
              </View>
           ) : (
              <View className="bg-amber-50/50 p-6 rounded-3xl border-2 border-amber-100/50 min-h-[300px]">
                 <Text className="font-bold text-amber-500 mb-6 text-center text-xs tracking-widest uppercase">Sistem Tarafından Maddelendirildi</Text>
                 {viewingTask.bulletPoints.map((b, i) => (
                    <View key={i} className="flex-row mb-5 items-start px-2">
                       <View className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center mt-0.5 mr-3 shadow-sm shadow-amber-500/30">
                          <Text className="font-black text-white text-[10px]">{i+1}</Text>
                       </View>
                       <Text className="flex-1 text-slate-700 font-bold leading-6 text-sm">{b}</Text>
                    </View>
                 ))}
              </View>
           )}

           {!canWrite && viewingTask.status !== 'completed' && (
              <TouchableOpacity onPress={() => updateTaskStatus(viewingTask.id, 'completed')} className="mt-8 bg-emerald-500 py-5 rounded-2xl items-center shadow-lg shadow-emerald-500/30">
                 <Text className="text-white font-extrabold text-lg">✅ Görevi Tamamladım</Text>
              </TouchableOpacity>
           )}

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----- MAIN LIST RENDER -----
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View className="flex-row items-center px-6 py-4 bg-white border-b border-gray-100 z-10 shadow-sm">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full">
          <Text className="text-lg">🔙</Text>
        </TouchableOpacity>
        <Text className="flex-1 ml-4 text-xl font-black text-slate-800">{canWrite ? 'Görev Atamaları' : 'Görevlerim & Belgeler'}</Text>
        {canWrite && (
           <TouchableOpacity onPress={() => setIsAdding(!isAdding)} className="bg-indigo-600 px-4 py-2 rounded-xl shadow-sm shadow-indigo-600/30">
             <Text className="font-black text-xs text-white">{isAdding ? 'Listeye Dön' : '+ Belge Ata'}</Text>
           </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          
          {isAdding && canWrite ? (
             <View className="bg-white p-5 rounded-3xl mb-6 shadow-sm border border-gray-100">
                <Text className="font-extrabold text-indigo-900 mb-5 text-xl">Döküman & Görev Gönder</Text>
                
                <Text className="font-black text-xs text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Görev / Belge Başlığı</Text>
                <TextInput value={formTitle} onChangeText={setFormTitle} placeholder="Örn: Hafta Sonu Deneme Çözümleri" className="bg-slate-50 p-4 rounded-xl font-bold text-slate-700 mb-4 border border-slate-200" />
                
                <Text className="font-black text-xs text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ders Seçimi</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  {SUBJECTS.map(sub => (
                    <TouchableOpacity key={sub} onPress={() => setFormSubject(sub)} className={`px-4 py-2 rounded-xl mr-2 ${formSubject === sub ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                      <Text className={`font-bold ${formSubject === sub ? 'text-white' : 'text-slate-600'}`}>{sub}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text className="font-black text-xs text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Konu Adı (Opsiyonel)</Text>
                <TextInput value={formTopic} onChangeText={setFormTopic} placeholder="Örn: Newton Hareket Yasaları" className="bg-slate-50 p-4 rounded-xl font-bold text-slate-700 mb-5 border border-slate-200" />
                
                <View className="bg-rose-50 border border-rose-200 p-4 rounded-2xl mb-4 flex-row items-center justify-between">
                   <View className="flex-row items-center">
                     <Text className="text-2xl mr-3">📎</Text>
                     <View>
                        <Text className="font-extrabold text-rose-800">PDF / Word Eki (Mock)</Text>
                        <Text className="font-bold text-rose-600/70 text-xs">Belge iliştirmek ister misiniz?</Text>
                     </View>
                   </View>
                   <TouchableOpacity onPress={() => setFormDocsMock(!formDocsMock)} className={`w-12 h-6 rounded-full p-1 justify-center ${formDocsMock ? 'bg-rose-500' : 'bg-rose-200'}`}>
                      <View className={`w-4 h-4 bg-white rounded-full ${formDocsMock ? 'self-end' : 'self-start'}`} />
                   </TouchableOpacity>
                </View>

                <Text className="font-black text-xs text-slate-400 uppercase tracking-widest mb-1.5 ml-1">İçerik (Sistem Maddelendirecektir)</Text>
                <TextInput 
                  value={formContent} onChangeText={setFormContent} 
                  placeholder="Eğer belge taratamıyorsanız manuel içeriği buraya yapıştırın. Yapay zeka bu metni öğrenci için akıllı maddelere bölecektir..." 
                  className="font-medium text-sm text-gray-700 p-4 bg-slate-50 rounded-2xl min-h-[140px] mb-6 border border-slate-200" 
                  multiline textAlignVertical="top" 
                />

                <TouchableOpacity onPress={handleSaveTask} className="py-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/40 items-center">
                   <Text className="font-black text-white text-lg">Öğrenciye Ata & Çeviriyi Başlat</Text>
                </TouchableOpacity>
             </View>
          ) : (
            <View>
              {tasks.length === 0 ? (
                 <View className="items-center justify-center p-10 bg-slate-50 border border-dashed border-slate-200 rounded-3xl mt-4">
                    <Text className="text-4xl mb-4">📭</Text>
                    <Text className="text-slate-500 font-bold text-center">Henüz atanmış bir görev veya belge bulunmuyor.</Text>
                 </View>
              ) : (
                 tasks.map(task => {
                    const isCompleted = task.status === 'completed';
                    return (
                      <TouchableOpacity 
                        key={task.id} 
                        onPress={() => { setViewingTask(task); setViewMode('bullets'); }}
                        className={`bg-white rounded-3xl p-5 mb-4 border ${isCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-100'} shadow-sm`}
                      >
                         <View className="flex-row justify-between items-start mb-3">
                            <View className="flex-1 pr-4">
                               <View className="flex-row items-center mb-1">
                                  <View className="bg-indigo-100 px-2 py-1 rounded-md mr-2">
                                     <Text className="text-[10px] font-black text-indigo-700 uppercase">{task.subject}</Text>
                                  </View>
                                  {task.hasAttachment && <Text className="mr-1">📎</Text>}
                               </View>
                               <Text className={`font-black text-lg ${isCompleted ? 'text-emerald-900 line-through' : 'text-slate-800'}`}>{task.title}</Text>
                            </View>
                            <View className={`px-3 py-1.5 rounded-xl ${isCompleted ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                               <Text className={`font-extrabold text-[10px] uppercase ${isCompleted ? 'text-emerald-700' : 'text-amber-700'}`}>
                                  {isCompleted ? 'Tamamlandı' : 'Bekliyor'}
                               </Text>
                            </View>
                         </View>
                         <View className="flex-row justify-between items-end border-t border-gray-50 pt-3">
                            <Text className="font-bold text-slate-400 text-xs">Atayan: {task.assignedByRole}</Text>
                            <View className="flex-row items-center bg-slate-100 p-1.5 px-3 rounded-full">
                               <Text className="text-xs mr-2">✨</Text>
                               <Text className="font-black text-slate-500 text-[10px] uppercase">AI Özeti Hazır</Text>
                            </View>
                         </View>
                      </TouchableOpacity>
                    );
                 })
              )}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
