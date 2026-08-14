import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, TextInput, KeyboardAvoidingView, Platform, Keyboard, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { WebView } from 'react-native-webview';
import { Modal } from 'react-native';
import { supabase } from '../lib/supabase';

type TaskDoc = {
  id: string;
  title: string;
  subject: string;
  topic: string;
  hasAttachment: boolean;
  fileName?: string;
  fileUri?: string;
  fullText: string;
  bulletPoints: string[];
  status: 'pending' | 'in_progress' | 'completed';
  assignedByRole: string;
  assignedByName?: string;
  date: number;
};
const DEFAULT_SUBJECTS = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türk Dili ve Edebiyatı', 'Tarih', 'İngilizce'];

export function TasksScreen({ navigation, route }: any) {
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [dynamicSubjects, setDynamicSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  const [isAdding, setIsAdding] = useState(false);
  const [userRole, setUserRole] = useState<string>('student');
  const [userName, setUserName] = useState<string>('İsimsiz Eğitmen');
  const [resolvedStudentId, setResolvedStudentId] = useState<string>('default');

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState(DEFAULT_SUBJECTS[0]);
  const [formTopic, setFormTopic] = useState('');
  const [pickedDoc, setPickedDoc] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [formContent, setFormContent] = useState('');

  // Student View State
  const [viewingTask, setViewingTask] = useState<TaskDoc | null>(null);
  const [viewMode, setViewMode] = useState<'full' | 'bullets'>('full');
  
  // Immersive PDF Viewer State (primarily iOS or external fallbacks)
  const [pdfViewerUri, setPdfViewerUri] = useState<string | null>(null);

  const canWrite = userRole !== 'student' && userRole !== 'parent';

  // Compute the standardized display name for the role to use as horizontal isolation key
  const userFullName = userRole === 'parent' ? 'Veli' : 
                       userRole === 'student_coach' ? 'Öğrenci Koçu' : 
                       userRole === 'private_tutor' ? 'Özel Ders Öğretmeni' : 
                       userRole === 'class_teacher' ? 'Sınıf Rehber Öğretmeni' : 
                       userRole === 'teacher' ? 'Okul Rehber Öğretmeni' : 
                       'Rehber Öğretmen';

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

         const { data: details } = await supabase.from('users').select('full_name').eq('id', user.id).single();
         if (details && details.full_name) setUserName(details.full_name);
      }

      if (route.params?.studentId) {
         sId = route.params.studentId; 
      } else if (user && (!route.params?.studentId)) {
         sId = user.id; 
      }
      
      setResolvedStudentId(sId);

      // Load dynamic subjects from Student's schedule
      try {
        const schedRaw = await AsyncStorage.getItem(`@schedules_${sId}`);
        if (schedRaw) {
           const parsedSched = JSON.parse(schedRaw);
           let extractedSubjects = new Set<string>();
           if (parsedSched.schoolGrid) {
              parsedSched.schoolGrid.forEach((row: any) => {
                 row.days.forEach((daySubj: string) => {
                    if (daySubj && daySubj.trim() !== '') extractedSubjects.add(daySubj.trim());
                 });
              });
           }
           if (extractedSubjects.size > 0) {
              const dynArr = Array.from(extractedSubjects);
              setDynamicSubjects(dynArr);
              setFormSubject(dynArr[0]);
           }
        }
      } catch (e) {}

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
    if (!formTitle.trim() && !pickedDoc) {
      Alert.alert('Eksik Bilgi', 'Görev başlığı girmeli veya en az bir belge yüklemelisiniz.');
      return;
    }

    // AI Mock Parsing Logic (Fake AI Summary for UI Demonstration)
    const bullets = formContent.split('.').filter(s => s.trim().length > 5).map(s => s.trim() + '.');

    const newTask: TaskDoc = {
        id: Date.now().toString(),
        title: formTitle,
        subject: formSubject,
        topic: formTopic || 'Genel Konu',
        hasAttachment: pickedDoc !== null,
        fileName: pickedDoc ? pickedDoc.name : undefined,
        fileUri: pickedDoc ? pickedDoc.uri : undefined,
        fullText: formContent.trim() || '',
        bulletPoints: bullets.length > 0 && formContent.trim() ? bullets : [],
        status: 'pending',
        assignedByRole: userFullName,
        assignedByName: userName,
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
    setPickedDoc(null);
    setIsAdding(false);
    Keyboard.dismiss();
    Alert.alert('Görev Atandı', 'Öğrencinin görev paneline yeni döküman eklendi. AI sistemi tarafından metin analizi tamamlandı!');
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        try {
          const safeName = asset.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const finalUri = (FileSystem as any).documentDirectory + `task_${Date.now()}_${safeName}`;
          await (FileSystem as any).copyAsync({ from: asset.uri, to: finalUri });
          
          setPickedDoc({ ...asset, uri: finalUri, name: asset.name });
        } catch (copyErr) {
          console.log('Copy Error:', copyErr);
          // Fallback to cache URI if copy fails
          setPickedDoc(asset);
        }
      }
    } catch(err) {
      console.log('Error picking doc', err);
      Alert.alert('Hata', 'Dosya seçilirken bir sorun oluştu.');
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: 'in_progress' | 'completed') => {
      const updated = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
      setTasks(updated);
      setViewingTask(u => u && u.id === taskId ? { ...u, status: newStatus } : u);
      try {
        await AsyncStorage.setItem(`@tasks_logs_${resolvedStudentId}`, JSON.stringify(updated));
      } catch(e) {}
  };

  const handleDownloadDocument = async (uri?: string, name?: string) => {
    if (!uri) {
       Alert.alert('Hata', 'İndirilecek fiziksel dosya bulunamadı.');
       return;
    }
    
    // For iOS, natively render the local PDF inside our invisible WebView Modal fullscreen!
    if (Platform.OS === 'ios') {
       if (name?.toLowerCase().endsWith('.pdf')) {
          setPdfViewerUri(uri);
          return;
       } else {
          // If it's not a PDF, fallback to iOS Quick Look via Share
          await Sharing.shareAsync(uri, { UTI: 'public.document' });
          return;
       }
    }

    // For Android, try to push to the local OS PDF Viewer (Google Drive PDF Viewer etc.)
    try {
       const cUri = await (FileSystem as any).getContentUriAsync(uri);
       await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
         data: cUri,
         flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
         type: name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : '*/*'
       });
    } catch(intentErr: any) {
       console.log('Intent Error:', intentErr);
       // If no PDF viewer is installed (common in emulators), alert them cleanly.
       Alert.alert(
         'PDF Okuyucu Bulunamadı', 
         'Cihazınızda (veya simülatörünüzde) bu dosyayı açacak bir PDF/Belge okuyucu uygulama yüklü değil. Dosyayı paylaş menüsüyle dışarı aktarabilirsiniz.',
         [
           { text: 'İptal', style: 'cancel' },
           { text: 'Paylaş', onPress: () => Sharing.shareAsync(uri, { dialogTitle: 'Belgeyi Paylaş: ' + name }) }
         ]
       );
    }
  };

  // Filter logic: Parent and Student sees all tasks. Role users see only their OWN tasks.
  const visibleTasks = (userRole === 'student' || userRole === 'parent')
    ? tasks
    : tasks.filter(t => {
        if (t.assignedByRole === userFullName) return true;
        
        // Legacy Data Fallback (from earlier label versions)
        if (userRole === 'teacher' && t.assignedByRole === 'Rehber Öğretmen') return true;
        if (userRole === 'student_coach' && (t.assignedByRole === 'Öğrenci Koçu' || t.assignedByRole === 'Rehber Öğretmen')) return true;
        if (userRole === 'private_tutor' && (t.assignedByRole === 'Özel Ders Öğretmeni' || t.assignedByRole === 'Rehber Öğretmen')) return true;
        if (userRole === 'class_teacher' && (t.assignedByRole === 'Sınıf Öğretmeni' || t.assignedByRole === 'Sınıf Rehber Öğretmeni')) return true;
        
        return false;
    });

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

        {viewingTask.fullText ? (
          <View className="flex-row bg-white border-b border-gray-100">
             <TouchableOpacity 
               onPress={() => setViewMode('full')}
               className={`flex-1 items-center justify-center py-4 border-b-2 ${viewMode === 'full' ? 'border-indigo-600' : 'border-transparent'}`}>
                <Text className={`font-black ${viewMode === 'full' ? 'text-indigo-600' : 'text-slate-400'}`}>📄 Eğitim Notu</Text>
             </TouchableOpacity>
             <TouchableOpacity 
               onPress={() => setViewMode('bullets')}
               className={`flex-1 items-center justify-center py-4 border-b-2 ${viewMode === 'bullets' ? 'border-amber-500' : 'border-transparent'}`}>
                <View className="flex-row items-center">
                   <Text className="mr-2">✨</Text>
                   <Text className={`font-black ${viewMode === 'bullets' ? 'text-amber-500' : 'text-slate-400'}`}>AI Özet</Text>
                </View>
             </TouchableOpacity>
          </View>
        ) : null}

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
           
           {viewingTask.hasAttachment && (
              <View className="flex-row items-center bg-rose-50 p-4 rounded-2xl mb-6 border border-rose-100 shadow-sm">
                 <Text className="text-3xl mr-3">📎</Text>
                 <View className="flex-1">
                    <Text className="font-bold text-rose-800 text-sm">Fiziksel Döküman</Text>
                    <Text className="font-bold text-rose-500/70 text-xs mt-0.5" numberOfLines={1}>{viewingTask.fileName}</Text>
                 </View>
                 <TouchableOpacity onPress={() => handleDownloadDocument(viewingTask.fileUri, viewingTask.fileName)} className="bg-rose-600 px-4 py-2 rounded-xl scale-95 shadow-sm shadow-rose-600/30">
                    <Text className="font-black text-white text-xs">Görüntüle / Aç</Text>
                 </TouchableOpacity>
              </View>
           )}

           {viewingTask.fullText ? (
             viewMode === 'full' ? (
                <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[150px]">
                   <Text className="text-base text-slate-700 leading-7 font-medium text-justify">{viewingTask.fullText}</Text>
                </View>
             ) : (
                <View className="bg-amber-50/50 p-6 rounded-3xl border-2 border-amber-100/50 min-h-[150px]">
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
             )
           ) : (
              <View className="items-center justify-center p-10 bg-indigo-50/50 rounded-3xl border border-dashed border-indigo-200 mt-4">
                 <Text className="text-4xl mb-4">📋</Text>
                 <Text className="text-indigo-800 font-bold text-center text-sm mb-2">Bu görev için ek bir çalışma notu eklenmemiş.</Text>
                 <Text className="text-indigo-500 font-medium text-center text-xs px-4">Sadece yukarıdaki dosyayı incelemeniz ve açıp okumanız yeterlidir.</Text>
              </View>
           )}

           {!canWrite && viewingTask.status !== 'completed' && (
              <TouchableOpacity onPress={() => updateTaskStatus(viewingTask.id, 'completed')} className="mt-8 bg-emerald-500 py-5 rounded-2xl items-center shadow-lg shadow-emerald-500/30">
                 <Text className="text-white font-extrabold text-lg">✅ Görevi Tamamladım</Text>
              </TouchableOpacity>
           )}

        </ScrollView>

        {/* Built-in iOS Native PDF Viewer Modal */}
        <Modal visible={!!pdfViewerUri} animationType="slide" presentationStyle="pageSheet">
           <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
              <View className="flex-row justify-between items-center p-4 bg-gray-900">
                 <Text className="font-bold text-white text-lg ml-2">PDF Görüntüleyici</Text>
                 <TouchableOpacity onPress={() => setPdfViewerUri(null)} className="bg-gray-800 px-4 py-2 rounded-full">
                    <Text className="font-bold text-white">Kapat</Text>
                 </TouchableOpacity>
              </View>
              {pdfViewerUri && (
                 <WebView 
                    source={{ uri: pdfViewerUri }} 
                    style={{ flex: 1 }} 
                    originWhitelist={['*']}
                    allowFileAccess={true}
                 />
              )}
           </SafeAreaView>
        </Modal>

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
                
                <Text className="font-black text-xs text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ders Seçimi (Öğrenci Programından)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  {dynamicSubjects.map(sub => (
                    <TouchableOpacity key={sub} onPress={() => setFormSubject(sub)} className={`px-4 py-2 rounded-xl mr-2 ${formSubject === sub ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                      <Text className={`font-bold ${formSubject === sub ? 'text-white' : 'text-slate-600'}`}>{sub}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text className="font-black text-xs text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Konu Adı (Opsiyonel)</Text>
                <TextInput value={formTopic} onChangeText={setFormTopic} placeholder="Örn: Newton Hareket Yasaları" className="bg-slate-50 p-4 rounded-xl font-bold text-slate-700 mb-5 border border-slate-200" />
                
                <View className={`bg-rose-50 border ${pickedDoc ? 'border-rose-400' : 'border-rose-200'} p-4 rounded-2xl mb-4 flex-row items-center justify-between`}>
                   <View className="flex-row items-center flex-1">
                     <Text className="text-2xl mr-3">📎</Text>
                     <View className="flex-1 pr-2">
                        <Text className="font-extrabold text-rose-800">{pickedDoc ? 'Belge Hazır' : 'PDF / Word Eki (Opsiyonel)'}</Text>
                        <Text className="font-bold text-rose-600/70 text-xs mt-0.5" numberOfLines={1}>{pickedDoc ? pickedDoc.name : 'Cihazınızdan bir belge yükleyin'}</Text>
                     </View>
                   </View>
                   <TouchableOpacity onPress={pickedDoc ? () => setPickedDoc(null) : handlePickDocument} className={`px-4 py-2 rounded-xl ${pickedDoc ? 'bg-rose-100' : 'bg-rose-500'}`}>
                      <Text className={`font-black text-xs ${pickedDoc ? 'text-rose-600' : 'text-white'}`}>{pickedDoc ? 'Kaldır' : 'Yükle'}</Text>
                   </TouchableOpacity>
                </View>

                <Text className="font-black text-xs text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Kısa Çalışma Notu (Opsiyonel)</Text>
                <TextInput 
                  value={formContent} onChangeText={setFormContent} 
                  placeholder="Kopyala/yapıştır zor geliyorsa boş bırak! Ama kısa bir metin eklersen onu AI ile maddelendirebiliriz." 
                  className="font-medium text-sm text-gray-700 p-4 bg-slate-50 rounded-2xl min-h-[140px] mb-6 border border-slate-200" 
                  multiline textAlignVertical="top" 
                />
                
                <TouchableOpacity onPress={handleSaveTask} className="py-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/40 items-center">
                   <Text className="font-black text-white text-lg">Öğrenciye Ata & Çeviriyi Başlat</Text>
                </TouchableOpacity>
             </View>
          ) : (
            <View>
              {visibleTasks.length === 0 ? (
                 <View className="items-center justify-center p-10 bg-slate-50 border border-dashed border-slate-200 rounded-3xl mt-4">
                    <Text className="text-4xl mb-4">📭</Text>
                    <Text className="text-slate-500 font-bold text-center">Henüz atanmış bir görev veya belge bulunmuyor.</Text>
                 </View>
              ) : (
                 visibleTasks.map(task => {
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
                                   <Text className="text-[10px] font-extrabold text-slate-400 capitalize bg-slate-100/50 px-2 py-1 rounded-md">
                                      {task.assignedByRole} {task.assignedByName ? task.assignedByName : ''}
                                   </Text>
                                </View>
                                <Text className={`font-extrabold text-lg ${isCompleted ? 'text-emerald-900 line-through' : 'text-slate-800'}`}>{task.title}</Text>
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
