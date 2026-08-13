import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';

const dummyFriends = [
  { id: '1', name: 'Ahmet Y.', score: 1250 },
  { id: '2', name: 'Ayşe K.', score: 980 },
  { id: '3', name: 'Sen (Ben)', score: 850 },
  { id: '4', name: 'Mehmet D.', score: 420 },
];

export function SocialDashboardScreen({ navigation }: any) {
  const [friendCode, setFriendCode] = useState('');

  const handleAddFriend = () => {
    if (friendCode.length < 6) {
      Alert.alert('Hata', 'Lütfen 6 haneli arkadaşlık kodunu girin.');
      return;
    }
    Alert.alert('Başarılı', 'Arkadaşlık isteği gönderildi!');
    setFriendCode('');
  };

  const renderFriendItem = ({ item, index }: any) => (
    <View className={`flex-row justify-between items-center p-4 mb-2 rounded-xl border ${item.name.includes('Sen') ? 'bg-primary/10 border-primary' : 'bg-white border-gray-100'}`}>
      <View className="flex-row items-center">
        <Text className="text-lg font-bold text-gray-500 w-8">{index + 1}.</Text>
        <Text className={`text-lg font-bold ${item.name.includes('Sen') ? 'text-primary' : 'text-gray-700'}`}>{item.name}</Text>
      </View>
      <Text className="text-secondary font-extrabold text-lg">{item.score} XP</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 p-6">
        <View className="flex-row justify-between items-center mb-6 mt-2">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Text className="text-primary font-bold text-lg">← Geri</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-extrabold text-text">Sosyal Ağ</Text>
          <View className="w-10" />
        </View>

        <View className="bg-gray-50 p-5 rounded-2xl mb-8 border border-gray-200">
          <Text className="text-gray-700 font-bold mb-3 text-base">Arkadaş Ekle</Text>
          <View className="flex-row">
            <TextInput 
              className="flex-1 bg-white px-4 py-3 rounded-xl border border-gray-200 text-lg uppercase tracking-widest font-bold mr-3"
              placeholder="KODGİR"
              maxLength={6}
              autoCapitalize="characters"
              value={friendCode}
              onChangeText={setFriendCode}
            />
            <TouchableOpacity 
              onPress={handleAddFriend}
              className="bg-secondary px-6 rounded-xl justify-center items-center shadow-sm"
            >
              <Text className="text-white font-bold">Ekle</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-gray-400 text-xs mt-2">Güvenlik için sadece 6 haneli özel kodu olanları ekleyebilirsin.</Text>
        </View>

        <Text className="text-xl font-extrabold text-text mb-4">Liderlik Tablosu 🏆</Text>
        
        <FlatList
          data={dummyFriends.sort((a, b) => b.score - a.score)}
          keyExtractor={item => item.id}
          renderItem={renderFriendItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />

        <TouchableOpacity 
          className="bg-primary w-full py-4 rounded-xl items-center mt-4 shadow-sm"
          onPress={() => Alert.alert('Yakında', 'Sıra tabanlı oyun lobisi çok yakında açılacak!')}
        >
          <Text className="text-white font-bold text-lg">🎮 Oyun Lobisine Gir</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
