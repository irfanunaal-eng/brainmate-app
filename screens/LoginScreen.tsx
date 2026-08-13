import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export function LoginScreen({ route, navigation }: any) {
  const { role } = route.params;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigateToDashboard = () => {
    if (role === 'student') navigation.replace('StudentDashboard');
    else if (role === 'teacher') navigation.replace('TeacherDashboard');
    else navigation.replace('ParentDashboard'); // parent, class_teacher, private_tutor, student_coach all go here
  };

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert('Hata', error.message);
    } else {
      navigateToDashboard();
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true);
    const { data: authData, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: { role: role } }
    });
    if (error) {
      Alert.alert('Hata', error.message);
    } else if (authData.user) {
      // Profili upsert yap (Eski hesaplarda veya trigger calismadiginda foreign_key hatasini onlemek icin)
      await supabase
        .from('profiles')
        .upsert({ id: authData.user.id, role: role, pairing_code: null })
        .select();

      // Not: E-posta doğrulaması kapalıysa direkt giriş yapmış sayılır
      navigateToDashboard();
    }
    setLoading(false);
  };

  // Geliştirici (Dev) Ortamı İçin Hızlı Giriş
  const handleDevQuickLogin = async () => {
    setLoading(true);
    const devEmail = `dev_${role}@brainmate.app`;
    const devPass = '123456';
    
    // Önce giriş yapmayı dene
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: devEmail, password: devPass });
    
    if (signInError) {
      // Hesap yoksa otomatik kaydet
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: devEmail,
        password: devPass,
        options: { data: { role: role } }
      });
      
      if (!signUpError && authData.user) {
        await supabase
          .from('profiles')
          .upsert({ id: authData.user.id, role: role, pairing_code: null })
          .select();
          
        navigateToDashboard();
      } else {
        Alert.alert('Hızlı Giriş Hatası', signUpError?.message || 'Bilinmeyen hata');
      }
    } else {
      navigateToDashboard();
    }
    setLoading(false);
  };

  let roleText = 'Kullanıcı';
  if (role === 'student') roleText = 'Öğrenci';
  else if (role === 'parent') roleText = 'Veli';
  else if (role === 'teacher') roleText = 'Rehber Öğretmen';
  else if (role === 'class_teacher') roleText = 'Sınıf Rehber Öğretmeni';
  else if (role === 'private_tutor') roleText = 'Özel Ders Öğretmeni';
  else if (role === 'student_coach') roleText = 'Öğrenci Koçu';

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 px-6 justify-center relative"
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="absolute top-12 left-6 z-10 w-10 h-10 items-center justify-center bg-gray-100 rounded-full"
        >
          <Text className="text-xl">🔙</Text>
        </TouchableOpacity>

        <Text className="text-4xl font-extrabold text-gray-800 mb-2 mt-16">{roleText} Girişi</Text>
        <Text className="text-gray-500 mb-10 text-base">Eğitim asistanına hoş geldin. Hemen giriş yap veya yeni bir hesap oluştur.</Text>

        <View>
          {__DEV__ && (
            <TouchableOpacity 
              onPress={handleDevQuickLogin}
              disabled={loading}
              className="bg-amber-400 w-full py-4 rounded-xl items-center mb-8 shadow-sm flex-row justify-center border-2 border-amber-500"
            >
              <Text className="text-2xl mr-2">⚡</Text>
              <Text className="text-amber-900 font-extrabold text-lg">Tek Tıkla Giriş (Test Hesabı)</Text>
            </TouchableOpacity>
          )}

          <View className="mb-4" style={{ marginBottom: 16 }}>
            <Text className="text-gray-700 font-bold mb-2 ml-1">E-posta Adresi</Text>
            <TextInput 
              className="bg-gray-50 px-5 py-4 rounded-xl border border-gray-200 text-base"
              placeholder="ornek@mail.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="mb-8" style={{ marginBottom: 32 }}>
            <Text className="text-gray-700 font-bold mb-2 ml-1">Şifre</Text>
            <TextInput 
              className="bg-gray-50 px-5 py-4 rounded-xl border border-gray-200 text-base"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity 
            onPress={handleLogin}
            disabled={loading}
            className="bg-primary w-full py-4 rounded-xl items-center mb-4 active:bg-indigo-700 shadow-sm"
            style={{ marginBottom: 16, paddingVertical: 16 }}
          >
            <Text className="text-white font-bold text-lg">{loading ? 'Bekleniyor...' : 'Giriş Yap'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleRegister}
            disabled={loading}
            className="bg-emerald-500 w-full py-4 rounded-xl items-center active:bg-emerald-600 shadow-sm"
            style={{ marginBottom: 16, paddingVertical: 16 }}
          >
            <Text className="text-white font-bold text-lg">{loading ? 'Bekleniyor...' : 'Yeni Kayıt Ol'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
