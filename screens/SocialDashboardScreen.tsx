import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';

export function SocialDashboardScreen({ navigation }: any) {
  const [friends, setFriends] = useState([
    { id: '1', name: 'Ahmet Y.', score: 1250 },
    { id: '2', name: 'Ayşe K.', score: 980 },
    { id: '3', name: 'Sen (Ben)', score: 850 },
    { id: '4', name: 'Mehmet D.', score: 420 },
  ]);
  const [friendCode, setFriendCode] = useState('');

  const handleAddFriend = () => {
    if (friendCode.length < 6) {
      Alert.alert('Hata', 'Lütfen 6 haneli arkadaşlık kodunu girin.');
      return;
    }
    Alert.alert('Başarılı', 'Arkadaşlık isteği gönderildi!');
    setFriendCode('');
  };

  const handleRemoveFriend = (id: string, name: string) => {
    Alert.alert(
      'Bağlantıyı Sil',
      `${name} adlı kişiyi arkadaş ağından çıkarmak istediğine emin misin? Bu işlem geri alınamaz.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { 
          text: 'Evet, Çıkar', 
          style: 'destructive', 
          onPress: () => {
            setFriends(prev => prev.filter(f => f.id !== id));
          } 
        }
      ]
    );
  };

  const renderFriendItem = ({ item, index }: any) => (
    <View className={`flex-row justify-between items-center p-4 mb-2 rounded-xl border ${item.name.includes('Sen') ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100 shadow-sm shadow-gray-50'}`}>
      <View className="flex-row items-center flex-1">
        <Text className={`text-lg font-bold w-8 ${item.name.includes('Sen') ? 'text-indigo-500' : 'text-gray-400'}`}>{index + 1}.</Text>
        <Text className={`text-base font-extrabold flex-1 ${item.name.includes('Sen') ? 'text-indigo-800' : 'text-gray-700'}`} numberOfLines={1}>{item.name}</Text>
      </View>
      <View className="flex-row items-center">
        <Text className={`font-black text-lg mr-3 ${item.name.includes('Sen') ? 'text-indigo-600' : 'text-amber-500'}`}>{item.score} XP</Text>
        {!item.name.includes('Sen') && (
          <TouchableOpacity onPress={() => handleRemoveFriend(item.id, item.name)} className="w-8 h-8 items-center justify-center bg-red-50 rounded-lg border border-red-100 opacity-60 active:opacity-100">
             <Text className="text-sm">🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 p-6">
        <View className="flex-row justify-between items-center mb-6 mt-2">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full">
            <Text className="text-xl">🔙</Text>
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
          data={[...friends].sort((a, b) => b.score - a.score)}
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
