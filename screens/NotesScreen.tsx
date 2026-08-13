import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

type Note = {
  id: string;
  title: string;
  content: string;
  date: number;
  color: string;
};

const COLORS = ['bg-yellow-100/80', 'bg-blue-100/80', 'bg-emerald-100/80', 'bg-rose-100/80', 'bg-purple-100/80', 'bg-orange-100/80'];

export function NotesScreen({ navigation, route }: any) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [userId, setUserId] = useState<string>('default');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    let uId = user?.id || 'default';
    if (route.params?.studentId) uId = route.params.studentId;
    setUserId(uId);

    try {
      const stored = await AsyncStorage.getItem(`@notes_${uId}`);
      if (stored) {
        setNotes(JSON.parse(stored));
      }
    } catch (e) {}
  };

  const saveNotes = async (newNotes: Note[]) => {
    setNotes(newNotes);
    try {
      await AsyncStorage.setItem(`@notes_${userId}`, JSON.stringify(newNotes));
    } catch(e) {}
  };

  const handleCreateNote = () => {
    if (!newTitle.trim() && !newContent.trim()) {
      setIsAdding(false);
      return;
    }
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const note: Note = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      content: newContent.trim(),
      date: Date.now(),
      color
    };
    saveNotes([note, ...notes]);
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
    Keyboard.dismiss();
  };

  const deleteNote = (id: string) => {
    Alert.alert('Notu Sil', 'Bu notu silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => {
          saveNotes(notes.filter(n => n.id !== id));
      }}
    ]);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100 z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full">
          <Text className="text-lg">🔙</Text>
        </TouchableOpacity>
        <Text className="text-xl font-black text-gray-800">Ajanda & Ödevler</Text>
        <TouchableOpacity onPress={() => setIsAdding(true)} className="w-10 h-10 items-center justify-center bg-fuchsia-50 rounded-full">
          <Text className="text-lg text-fuchsia-600 font-bold">➕</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          
          {isAdding && (
             <View className="bg-white p-4 rounded-3xl mb-6 shadow-sm border border-gray-200">
                <TextInput 
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="Başlık (Örn: Matematik Ödevi)"
                  className="font-black text-lg mb-2 text-gray-800 px-2"
                  autoFocus
                />
                <TextInput 
                  value={newContent}
                  onChangeText={setNewContent}
                  placeholder="Not detaylarını buraya yaz..."
                  className="font-medium text-sm text-gray-600 px-2 min-h-[80px]"
                  multiline
                  textAlignVertical="top"
                />
                <View className="flex-row justify-end mt-4 border-t border-gray-100 pt-3">
                   <TouchableOpacity onPress={() => setIsAdding(false)} className="px-4 py-2 bg-gray-100 rounded-xl mr-2">
                     <Text className="font-bold text-gray-500">İptal</Text>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={handleCreateNote} className="px-5 py-2 bg-fuchsia-600 rounded-xl">
                     <Text className="font-bold text-white">Kaydet</Text>
                   </TouchableOpacity>
                </View>
             </View>
          )}

          {notes.length === 0 && !isAdding ? (
            <View className="items-center justify-center mt-20">
              <Text className="text-6xl mb-4">📝</Text>
              <Text className="text-gray-400 font-bold text-lg text-center">Henüz not eklenmedi.</Text>
              <Text className="text-gray-400 text-sm text-center px-10 mt-1">Ödevlerini veya hatırlaman gerekenleri buradan takip edebilirsin.</Text>
            </View>
          ) : (
            <View className="flex-col">
              {notes.map(note => (
                <View key={note.id} className={`${note.color} w-full p-5 rounded-3xl mb-4 shadow-sm relative border border-black/5`}>
                  <TouchableOpacity onPress={() => deleteNote(note.id)} className="absolute top-4 right-4 w-8 h-8 items-center justify-center bg-white/40 rounded-full z-10">
                    <Text className="text-xs">🗑️</Text>
                  </TouchableOpacity>
                  {note.title ? <Text className="font-black text-lg text-gray-800 mb-2 pr-8">{note.title}</Text> : null}
                  {note.content ? <Text className="font-medium text-gray-700 leading-5 mb-4">{note.content}</Text> : null}
                  <Text className="text-[10px] font-bold text-gray-500/80 uppercase tracking-widest">{formatDate(note.date)}</Text>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
