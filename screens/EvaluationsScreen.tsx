import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, TextInput, KeyboardAvoidingView, Platform, Keyboard, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

type Evaluation = {
  id: string;
  authorRole: string; // 'teacher' (Okul Rehber) or 'student_coach' (Öğrenci Koçu)
  authorName: string;
  content: string;
  date: number;
};

export function EvaluationsScreen({ navigation, route }: any) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [userRole, setUserRole] = useState<string>('student');
  const [userName, setUserName] = useState<string>('Eğitimci');
  const [resolvedStudentId, setResolvedStudentId] = useState<string>('default');

  const canWrite = userRole === 'teacher' || userRole === 'student_coach' || userRole === 'class_teacher';

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let sId = 'default';
      
      if (user) {
         const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
         if (profile) {
            setUserRole(profile.role);
            
            // Name lookup
            const { data: details } = await supabase.from('users').select('full_name').eq('id', user.id).single();
            if (details && details.full_name) setUserName(details.full_name);
         }
      }

      if (route.params?.studentId) {
         sId = route.params.studentId; // Educator browsing student
      } else if (user && userRole === 'student') {
         sId = user.id; // Student browsing themselves
      }
      
      setResolvedStudentId(sId);

      const stored = await AsyncStorage.getItem(`@eval_logs_${sId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.sort((a: any, b: any) => b.date - a.date); // newest first
        setEvaluations(parsed);
      }
    } catch (e) {}
  };

  const handleSaveEval = async () => {
    if (!newContent.trim()) {
      setIsAdding(false);
      return;
    }
    
    let authorLabel = 'Okul Rehber Öğretmeni';
    if (userRole === 'student_coach') authorLabel = 'Öğrenci Koçu';
    else if (userRole === 'class_teacher') authorLabel = 'Sınıf Rehber Öğretmeni';
    else if (userRole === 'private_tutor') authorLabel = 'Özel Ders Öğretmeni';

    const newEval: Evaluation = {
        id: Date.now().toString(),
        authorRole: authorLabel,
        authorName: userName,
        content: newContent.trim(),
        date: Date.now()
    };

    const updated = [newEval, ...evaluations];
    setEvaluations(updated);
    
    try {
        await AsyncStorage.setItem(`@eval_logs_${resolvedStudentId}`, JSON.stringify(updated));
    } catch(e) {}
    
    setNewContent('');
    setIsAdding(false);
    Keyboard.dismiss();
  };

  const deleteEval = (id: string, authorLabel: string) => {
    let currentRoleLabel = 'Okul Rehber Öğretmeni';
    if (userRole === 'student_coach') currentRoleLabel = 'Öğrenci Koçu';
    else if (userRole === 'class_teacher') currentRoleLabel = 'Sınıf Rehber Öğretmeni';
    else if (userRole === 'private_tutor') currentRoleLabel = 'Özel Ders Öğretmeni';

    // Only the exact role type who wrote it can delete it (e.g. Coach can't delete Counselor's note)
    if (authorLabel !== currentRoleLabel) {
       Alert.alert('Yetki Hatası', 'Sadece kendi yazdığınız değerlendirmeleri silebilirsiniz.');
       return;
    }

    Alert.alert('Değerlendirmeyi Sil', 'Bu görüş raporunu silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
          const updated = evaluations.filter(e => e.id !== id);
          setEvaluations(updated);
          await AsyncStorage.setItem(`@eval_logs_${resolvedStudentId}`, JSON.stringify(updated));
      }}
    ]);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  };

  const visibleEvaluations = evaluations.filter(item => {
     if (userRole === 'parent' || userRole === 'student') return true;
     
     let expectedLabel = 'Okul Rehber Öğretmeni';
     if (userRole === 'student_coach') expectedLabel = 'Öğrenci Koçu';
     else if (userRole === 'class_teacher') expectedLabel = 'Sınıf Rehber Öğretmeni';
     else if (userRole === 'private_tutor') expectedLabel = 'Özel Ders Öğretmeni';
     
     if (item.authorRole === expectedLabel) return true;
     
     // Legacy Fallbacks
     if (userRole === 'student_coach' && item.authorRole === 'Okul Rehber Öğretmeni') return true;
     if (userRole === 'private_tutor' && item.authorRole === 'Okul Rehber Öğretmeni') return true;
     
     return false;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100 z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full">
          <Text className="text-lg">🔙</Text>
        </TouchableOpacity>
        <Text className="text-xl font-black text-slate-800">Eğitimci Görüşleri</Text>
        {canWrite ? (
           <TouchableOpacity onPress={() => setIsAdding(true)} className="w-10 h-10 items-center justify-center bg-indigo-50 rounded-full flex-row">
             <Text className="text-lg text-indigo-600 font-bold">📝</Text>
           </TouchableOpacity>
        ) : ( <View className="w-10 h-10" /> )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          
          {/* Add Evaluation Form */}
          {isAdding && canWrite && (
             <View className="bg-white p-5 rounded-3xl mb-6 shadow-sm border border-indigo-100">
                <Text className="font-extrabold text-indigo-900 mb-3 text-lg">Öğrenci Değerlendirme Raporu</Text>
                <TextInput 
                  value={newContent}
                  onChangeText={setNewContent}
                  placeholder="Psikolojik/Akademik durumu hakkındaki gözlemlerinizi veya önerilerinizi yazın..."
                  className="font-medium text-sm text-gray-700 p-4 bg-indigo-50/50 rounded-2xl min-h-[120px] mb-4 border border-indigo-100"
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
                <View className="flex-row justify-end border-t border-gray-50 pt-4">
                   <TouchableOpacity onPress={() => { setIsAdding(false);Keyboard.dismiss(); }} className="px-5 py-3 bg-gray-100 rounded-xl mr-3">
                     <Text className="font-bold text-gray-500">İptal</Text>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={handleSaveEval} className="px-6 py-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30">
                     <Text className="font-bold text-white">Yayınla</Text>
                   </TouchableOpacity>
                </View>
             </View>
          )}

          {/* Evaluations List */}
          {visibleEvaluations.length === 0 && !isAdding ? (
            <View className="items-center justify-center mt-20">
              <Text className="text-6xl mb-4 text-center">📋</Text>
              <Text className="text-slate-400 font-bold text-lg text-center mb-2">Henüz herhangi bir eğitimci görüşü bulunmuyor.</Text>
              <Text className="text-slate-400 text-xs text-center px-10">Eğitim kadrosu tarafından öğrencinin durumunu analiz eden raporlar buraya eklenecektir.</Text>
            </View>
          ) : (
            <View className="flex-col">
              {visibleEvaluations.map(item => {
                 const isCoach = item.authorRole === 'Öğrenci Koçu';
                 const isClassTeacher = item.authorRole === 'Sınıf Rehber Öğretmeni';
                 
                 let colorClass = 'bg-blue-50 border-blue-200';
                 let headerClass = 'bg-blue-500';
                 let icon = '🧠';
                 
                 if (isCoach) {
                    colorClass = 'bg-amber-50 border-amber-200';
                    headerClass = 'bg-amber-500';
                    icon = '🎯';
                 } else if (isClassTeacher) {
                    colorClass = 'bg-emerald-50 border-emerald-200';
                    headerClass = 'bg-emerald-500';
                    icon = '🏫';
                 }

                 return (
                    <View key={item.id} className={`${colorClass} w-full rounded-3xl mb-4 shadow-sm border overflow-hidden`}>
                      <View className={`${headerClass} flex-row px-4 py-3 items-center justify-between`}>
                         <View className="flex-row items-center">
                            <Text className="text-xl mr-2">{icon}</Text>
                            <Text className="font-extrabold text-white text-sm uppercase tracking-wide">{item.authorRole}</Text>
                         </View>
                         {canWrite && (userRole === 'student_coach' ? 'Öğrenci Koçu' : 'Okul Rehber Öğretmeni') === item.authorRole && (
                            <TouchableOpacity onPress={() => deleteEval(item.id, item.authorRole)} className="bg-white/20 p-1.5 rounded-full">
                               <Text className="text-xs">🗑️</Text>
                            </TouchableOpacity>
                         )}
                      </View>
                      
                      <View className="p-5 relative">
                         <Text className="font-medium text-slate-700 leading-6 text-base tracking-wide text-justify italic">"{item.content}"</Text>
                         
                         <View className="flex-row justify-between items-end mt-4 pt-3 border-t border-slate-200/50">
                            <Text className="text-xs font-black text-slate-500 tracking-wider">👩‍🏫 {item.authorName || 'Eğitmen Raporu'}</Text>
                            <Text className="text-[10px] font-bold text-slate-400">{formatDate(item.date)}</Text>
                         </View>
                      </View>
                    </View>
                 );
              })}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
