import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, SafeAreaView, TouchableOpacity, TextInput, 
  KeyboardAvoidingView, Platform, FlatList, Keyboard
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function MessagesScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const isParentView = route?.params?.isParentView || false;
  const targetId = route?.params?.studentId || 'default-student';

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const stored = await AsyncStorage.getItem(`@chat_${targetId}`);
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        // Initial Mock Message depending on view
        const initialMock = {
          id: 'mock-1',
          text: isParentView ? 'Merhaba yavrum, bugün okul nasıldı?' : 'Ailenle sohbet penceresi başlatıldı.',
          sender: isParentView ? 'me' : 'them',
          timestamp: new Date().toISOString()
        };
        setMessages([initialMock]);
      }
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  };

  const saveMessages = async (newMsgs: any[]) => {
    try {
      await AsyncStorage.setItem(`@chat_${targetId}`, JSON.stringify(newMsgs));
    } catch (e) {
      console.log(e);
    }
  };

  const handleSend = () => {
    if (!message.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      text: message.trim(),
      sender: 'me',
      timestamp: new Date().toISOString()
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    saveMessages(updated);
    setMessage('');

    // Simulate auto-reply so it feels alive
    setTimeout(() => {
        const replyMsg = {
            id: (Date.now() + 1).toString(),
            text: isParentView ? 'Evet, şu an uygulamadayım çalışıyorum. 📚' : 'Tamamdır yavrum, kolay gelsin, başarılar! ❤️',
            sender: 'them',
            timestamp: new Date().toISOString()
        };
        const finalMsgs = [...updated, replyMsg];
        setMessages(finalMsgs);
        saveMessages(finalMsgs);
    }, 1500);
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center p-5 bg-white border-b border-gray-100 shadow-sm z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full mr-3">
          <Text className="text-xl">🔙</Text>
        </TouchableOpacity>
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3">
            <Text className="text-2xl">{isParentView ? '👶' : '👨‍👩‍👧'}</Text>
          </View>
          <View>
            <Text className="text-xl font-extrabold text-gray-800 tracking-tight">
              {isParentView ? 'Öğrenciniz (Özel Sohbet)' : 'Ailenle Sohbet'}
            </Text>
            <Text className="text-xs font-bold text-emerald-500">🟢 Çevrimiçi</Text>
          </View>
        </View>
      </View>

      {/* Chat Area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined} 
        style={{ flex: 1 }}
      >
        <FlatList
          ref={flatListRef}
          className="flex-1 px-4 py-2"
          data={messages}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMe = item.sender === 'me';
            return (
              <View className={`mb-3 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
                <View className={`max-w-[75%] p-4 rounded-3xl ${isMe ? 'bg-indigo-600 rounded-br-none shadow-sm shadow-indigo-300' : 'bg-white rounded-tl-none border border-gray-200 shadow-sm shadow-gray-100'}`}>
                  <Text className={`text-base font-medium ${isMe ? 'text-white' : 'text-gray-800'}`}>
                    {item.text}
                  </Text>
                  <Text className={`text-[10px] mt-1 font-bold text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* Input Area */}
        <View className="p-4 bg-white border-t border-gray-100 flex-row items-center pb-8">
           <View className="flex-1 bg-gray-50 flex-row items-center px-4 py-3 rounded-3xl border border-gray-200">
             <TextInput 
               className="flex-1 text-base font-medium text-gray-800"
               placeholder="Bir mesaj yazın..."
               placeholderTextColor="#94a3b8"
               value={message}
               onChangeText={setMessage}
               multiline
               maxLength={200}
             />
             <TouchableOpacity className="ml-2 bg-gray-200 w-8 h-8 rounded-full items-center justify-center">
               <Text>📎</Text>
             </TouchableOpacity>
           </View>
           <TouchableOpacity 
             onPress={handleSend}
             className={`w-12 h-12 ml-3 rounded-full items-center justify-center shadow-lg ${message.trim() ? 'bg-indigo-600 shadow-indigo-400/50' : 'bg-gray-300 shadow-none'}`}
             disabled={!message.trim()}
           >
             <Text className="text-white text-lg">🚀</Text>
           </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
