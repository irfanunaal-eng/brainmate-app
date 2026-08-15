import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { supabase } from '../lib/supabase';

export function ParentDashboardScreen({ navigation }: any) {
  const [pairingCode, setPairingCode] = useState('');
  const [linkedStudents, setLinkedStudents] = useState<any[]>([]);
  const [studentName, setStudentName] = useState('Öğrenci');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [panelTitle, setPanelTitle] = useState('Eğitimci Paneli');
  const [userRole, setUserRole] = useState<string>('');
  
  useEffect(() => {
    checkExistingPairing();
  }, []);

  const checkExistingPairing = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      let role = '';
      if (profile) {
        role = profile.role;
        setUserRole(role);
        if (role === 'parent') setPanelTitle('Veli Paneli');
        else if (role === 'teacher') setPanelTitle('Okul Rehber Öğretmeni Paneli');
        else if (role === 'class_teacher') setPanelTitle('Sınıf Rehber Öğretmeni Paneli');
        else if (role === 'private_tutor') setPanelTitle('Özel Ders Öğretmeni Paneli');
        else if (role === 'student_coach') setPanelTitle('Öğrenci Koçu Paneli');
      }

      // Check traditional parent links
      const { data: parentLinks } = await supabase
        .from('parent_student_links')
        .select(`student_id, profiles:student_id ( full_name, role, student_no )`)
        .eq('parent_id', user.id);
      
      const links = parentLinks || [];
      if (links.length > 0) {
        setLinkedStudents(links);
        
        // If it's a parent, they usually have 1 child and want to see the dashboard immediately. 
        // If they have multiple, we can still auto-select the first, or let them pick. For now, parents auto-select.
        if (role === 'parent' && links.length === 1) {
            setStudentId(links[0].student_id);
            setStudentName((links[0].profiles as any)?.full_name || 'Öğrenci');
        }
      }
    }
    setLoading(false);
  };

  const handlePairing = async () => {
    setErrorMessage('');
    if (pairingCode.length < 6) {
      setErrorMessage('Lütfen 6 haneli kodu eksiksiz girin.');
      return;
    }
    
    setLoading(true);
    // Find student by pairing code
    const { data: studentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('pairing_code', pairingCode.toUpperCase().trim())
      .single();

    if (profileError || !studentProfile) {
      setErrorMessage(`Öğrenci bulunamadı. (Detay: ${profileError?.message || 'Bilinmiyor'})`);
      setLoading(false);
      return;
    }

    // YENİ KURAL: Okul veya Sınıf Rehber Öğretmeni ise eklediği çocuğun PRO olması kuralı denetlenebilir (İleri aşama için).

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Create link
      const { error: linkError } = await supabase
        .from('parent_student_links')
        .insert([{ parent_id: user.id, student_id: studentProfile.id }]);

      if (linkError) {
        setErrorMessage(`Bağlantı Hatası: ${linkError.message}`);
      } else {
        const newStudent = { student_id: studentProfile.id, profiles: { full_name: studentProfile.full_name, role: 'student' } };
        setLinkedStudents([...linkedStudents, newStudent]);
        setPairingCode('');
        Alert.alert('Başarılı', `${studentProfile.full_name} isimli öğrenci listenize başarıyla eklendi!`);
        
        if (userRole === 'parent') {
           setStudentName(studentProfile.full_name || 'Öğrenci');
           setStudentId(studentProfile.id);
        }
      }
    }
    setLoading(false);
  };

  const selectStudent = (id: string, name: string) => {
     setStudentId(id);
     setStudentName(name);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      navigation.replace('RoleSelection');
    }
  };

  const isEducator = userRole !== 'parent' && userRole !== 'student' && userRole !== '';
  const showStudentList = (isEducator && !studentId) || (!isEducator && linkedStudents.length === 0);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fcd34d" />
        </View>
      ) : showStudentList ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 p-6">
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            <View className="flex-row justify-between items-center mb-6 mt-4">
               <Text className="text-3xl font-extrabold text-text">{panelTitle}</Text>
               <TouchableOpacity onPress={handleLogout} className="bg-gray-100 p-3 rounded-full">
                  <Text className="text-xl">🚪</Text>
               </TouchableOpacity>
            </View>

            {/* Compact Öğrenci Ekleme Bölümü */}
            <View className="mb-8">
               <Text className="font-extrabold text-gray-800 text-sm uppercase tracking-widest mb-2 ml-1">KOD İLE ÖĞRENCİ EKLE</Text>
               <View className="flex-row items-center space-x-2">
                 <TextInput 
                   className="flex-1 bg-white px-4 py-3.5 rounded-xl border border-gray-200 text-lg font-bold text-center tracking-widest uppercase text-gray-800 shadow-sm"
                   placeholder="XXXXXX"
                   placeholderTextColor="#cbd5e1"
                   maxLength={6}
                   autoCapitalize="characters"
                   value={pairingCode}
                   onChangeText={setPairingCode}
                 />
                 <TouchableOpacity onPress={handlePairing} className="bg-indigo-600 px-6 py-3.5 rounded-xl shadow-sm ml-2">
                   <Text className="text-white font-bold text-base">Ekle</Text>
                 </TouchableOpacity>
               </View>
               {errorMessage ? <Text className="text-red-500 font-bold mt-2 px-1 text-xs">{errorMessage}</Text> : null}
            </View>

            <Text className="font-extrabold text-gray-800 text-sm uppercase tracking-widest mb-2 ml-1">KAYITLI ÖĞRENCİLER</Text>
            
            {linkedStudents.length === 0 ? (
               <View className="items-center justify-center p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
                  <Text className="text-3xl mb-3">👥</Text>
                  <Text className="text-gray-500 font-medium text-center text-sm">Henüz listenizde öğrenci bulunmuyor. Yukarıdaki alandan ekleyebilirsiniz.</Text>
               </View>
            ) : (
               <View className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-6">
                 {linkedStudents.map((link, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      onPress={() => selectStudent(link.student_id, link.profiles?.full_name || 'Öğrenci')}
                      className={`px-5 py-4 flex-row justify-between items-center ${idx !== linkedStudents.length -1 ? 'border-b border-gray-100' : ''} active:bg-gray-50`}
                    >
                       <View className="flex-row items-center">
                          <Text className="text-gray-400 font-extrabold text-base w-7">{idx + 1}.</Text>
                          <View>
                             <Text className="font-extrabold text-gray-900 text-base mb-0.5">{link.profiles?.full_name}</Text>
                             <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                               Öğrenci No: {link.profiles?.student_no || '-'}
                             </Text>
                          </View>
                       </View>
                       <View className="bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
                          <Text className="text-slate-600 font-bold text-xs">Eriş ➔</Text>
                       </View>
                    </TouchableOpacity>
                 ))}
               </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View className="flex-1">
        <ScrollView className="flex-1 p-6" style={{ flex: 1, padding: 24 }} showsVerticalScrollIndicator={false}>
          <View className="flex-row justify-between items-center mb-6 mt-2" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
            <View>
              <Text className="text-3xl font-extrabold text-text">{panelTitle}</Text>
              <Text className="text-gray-500 font-medium">Bağlı Öğrenci: {studentName}</Text>
            </View>
            {isEducator && (
               <TouchableOpacity onPress={() => setStudentId(null)} className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full">
                 <Text className="text-lg">🔙</Text>
               </TouchableOpacity>
            )}
          </View>

          {/* Hızlı Özet */}
          <View className="flex-row justify-between mb-6" style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
            <View className="bg-primary p-4 rounded-2xl w-[48%] items-center shadow-sm" style={{ padding: 16, width: '48%', alignItems: 'center' }}>
              <Text className="text-white/80 font-bold text-xs mb-1">Bu Hafta Çalışılan</Text>
              <Text className="text-2xl font-extrabold text-white">12 Saat</Text>
            </View>
            <View className="bg-red-50 p-4 rounded-2xl w-[48%] items-center border border-red-100 shadow-sm">
              <Text className="text-red-400 font-bold text-xs mb-1">Devamsızlık</Text>
              <Text className="text-2xl font-extrabold text-red-600">3.5 Gün</Text>
            </View>
          </View>

          {/* Kilitli İçerik / Premium Çağrısı */}
          <View className="bg-amber-50 p-6 rounded-3xl mb-8 border-2 border-amber-200 relative overflow-hidden" style={{ padding: 24, marginBottom: 32, overflow: 'hidden' }}>
            <View className="absolute -right-4 -top-4 w-20 h-20 bg-amber-200 rounded-full opacity-50" style={{ position: 'absolute', right: -16, top: -16, width: 80, height: 80 }} />
            
            <Text className="text-amber-800 font-extrabold text-xl mb-2" style={{ marginBottom: 8 }}>⭐ Premium Takip Aboneliği</Text>
            <Text className="text-amber-700 mb-5 text-sm leading-5">
              Öğrencinizin branş bazlı Türkiye geneli sıralamasını, zayıf olduğu konuları analiz eden yapay zeka raporunu ve anlık bildirimleri açmak için BrainMate Premium'a geçin.
            </Text>
            
            <TouchableOpacity 
              onPress={() => Alert.alert('Premium Satın Al', 'Burada RevenueCat ile Apple/Google Pay ekranı açılacaktır.')}
              className="bg-amber-500 w-full py-4 rounded-xl items-center shadow-sm"
            >
              <Text className="text-white font-extrabold text-lg">Aylık 199₺ ile Kilidi Aç</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xl font-extrabold text-gray-800 mb-4" style={{ marginBottom: 16 }}>Son Girilen Notlar</Text>
          <View className="bg-white p-4 rounded-2xl mb-3 border border-gray-100 flex-row justify-between items-center shadow-sm" style={{ padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text className="font-bold text-gray-700 text-base">Matematik 1. Sınav</Text>
            <Text className="text-emerald-500 font-extrabold text-xl">85</Text>
          </View>
          <View className="bg-white p-4 rounded-2xl mb-3 border border-gray-100 flex-row justify-between items-center shadow-sm" style={{ padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text className="font-bold text-gray-700 text-base">Fizik 1. Sınav</Text>
            <Text className="text-amber-500 font-extrabold text-xl">60</Text>
          </View>
          <View style={{ height: 80 }} />
          
        </ScrollView>
        
        {/* Scrollable Bottom Navigation Bar */}
        <View 
          className="bg-white border-t border-gray-100 pt-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
          style={{ paddingBottom: Platform.OS === 'ios' ? 24 : 16 }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => isEducator ? setStudentId(null) : navigation.navigate('ParentDashboard')} className="items-center justify-center bg-indigo-50 border-2 border-indigo-200 w-[56px] h-[56px] rounded-2xl shadow-sm shadow-indigo-100 mb-1">
                <Text className="text-3xl">🏠</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-indigo-700">Ana Sayfa</Text>
            </View>

            {userRole === 'parent' && (
              <View className="items-center mr-4">
                <TouchableOpacity onPress={() => navigation.navigate('LocationTrackingScreen')} className="items-center justify-center bg-sky-50 border-2 border-sky-200 w-[56px] h-[56px] rounded-2xl mb-1">
                  <Text className="text-3xl">📍</Text>
                </TouchableOpacity>
                <Text className="text-[10px] font-bold text-sky-700">Konum</Text>
              </View>
            )}
            
            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => navigation.navigate('NotesScreen', { studentId })} className="items-center justify-center bg-fuchsia-50 border-2 border-fuchsia-100 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">📌</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-fuchsia-700">Notlar/Ödev</Text>
            </View>

            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => navigation.navigate('ScheduleScreen', { studentId: studentId })} className="items-center justify-center bg-orange-50 border-2 border-orange-100 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">🗓️</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-orange-700">Program</Text>
            </View>
            
            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => navigation.navigate('GradesScreen', { studentId })} className="items-center justify-center bg-teal-50 border-2 border-teal-100 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">📝</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-teal-700">Sınav Notları</Text>
            </View>

            {['parent', 'teacher', 'student_coach', 'class_teacher'].includes(userRole) && (
              <View className="items-center mr-4">
                <TouchableOpacity onPress={() => navigation.navigate('EvaluationsScreen', { studentId })} className="items-center justify-center bg-lime-50 border-2 border-lime-100 w-[56px] h-[56px] rounded-2xl mb-1">
                  <Text className="text-3xl">📋</Text>
                </TouchableOpacity>
                <Text className="text-[10px] font-bold text-lime-700">Değerlendirme</Text>
              </View>
            )}
            
            {userRole !== 'private_tutor' && (
              <View className="items-center mr-4">
                <TouchableOpacity onPress={() => navigation.navigate('AttendanceScreen', { studentId })} className="items-center justify-center bg-cyan-50 border-2 border-cyan-100 w-[56px] h-[56px] rounded-2xl mb-1">
                  <Text className="text-3xl">🚦</Text>
                </TouchableOpacity>
                <Text className="text-[10px] font-bold text-cyan-700">Devamsızlık</Text>
              </View>
            )}
            
            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => navigation.navigate('TasksScreen', { studentId })} className="items-center justify-center bg-rose-50 border-2 border-rose-100 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">🎯</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-rose-700">Görev Ata</Text>
            </View>
            
            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => navigation.navigate('EducationDashboard', { studentId })} className="items-center justify-center bg-emerald-50 border-2 border-emerald-100 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">📚</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-emerald-700">Eğitimler</Text>
            </View>
            
            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => navigation.navigate('AcademicDashboard', { studentId })} className="items-center justify-center bg-amber-50 border-2 border-amber-100 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">📊</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-amber-700">Akademik</Text>
            </View>
            
            <View className="items-center mr-4">
              <TouchableOpacity onPress={() => navigation.navigate('MessagesScreen', { isParentView: true, studentId: studentId })} className="items-center justify-center bg-blue-50 border-2 border-blue-100 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">💬</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-blue-700">Mesajlar</Text>
            </View>

            {['parent', 'teacher', 'class_teacher'].includes(userRole) && (
              <View className="items-center mr-4">
                <TouchableOpacity onPress={() => navigation.navigate('SocialDashboard', { isParentView: true, studentId })} className="items-center justify-center bg-pink-50 border-2 border-pink-100 w-[56px] h-[56px] rounded-2xl mb-1">
                  <Text className="text-3xl">🫂</Text>
                </TouchableOpacity>
                <Text className="text-[10px] font-bold text-pink-700">Sosyal Ağ</Text>
              </View>
            )}

            {userRole !== 'private_tutor' && (
              <>
                <View className="items-center mr-4">
                  <TouchableOpacity onPress={() => navigation.navigate('GameLobbyScreen', { isParentView: true, studentId })} className="items-center justify-center bg-purple-50 border-2 border-purple-100 w-[56px] h-[56px] rounded-2xl mb-1">
                    <Text className="text-3xl">👾</Text>
                  </TouchableOpacity>
                  <Text className="text-[10px] font-bold text-purple-700">Oyunlar</Text>
                </View>
                
                <View className="items-center mr-4">
                  <TouchableOpacity onPress={() => Alert.alert('Rozetler', 'Yakında öğrencinizin kazandığı başarımları buradan görebileceksiniz.')} className="items-center justify-center bg-yellow-50 border-2 border-yellow-100 w-[56px] h-[56px] rounded-2xl mb-1">
                    <Text className="text-3xl">🏆</Text>
                  </TouchableOpacity>
                  <Text className="text-[10px] font-bold text-yellow-700">Rozetler</Text>
                </View>
              </>
            )}

            <View className="items-center">
              <TouchableOpacity onPress={handleLogout} className="items-center justify-center bg-red-50 border-2 border-red-100 w-[56px] h-[56px] rounded-2xl mb-1">
                <Text className="text-3xl">🚪</Text>
              </TouchableOpacity>
              <Text className="text-[10px] font-bold text-red-700">Çıkış</Text>
            </View>

          </ScrollView>
        </View>
        </View>
      )}
    </SafeAreaView>
  );
}
