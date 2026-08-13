import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, TextInput, Alert, FlatList, Modal } from 'react-native';

const RELATION_TYPES = [
  { id: 'kalp', label: '💕 Canım / Sevgilim' },
  { id: 'kanka', label: '🤞 Öz Kardeşim / Kankam' },
  { id: 'rakip', label: '⚔️ Ebedi Rakip' },
  { id: 'guven', label: '🛡️ Sonsuz Güven' },
  { id: 'yeni', label: '👋 Yeni Tanıştık' },
  { id: 'ehiste', label: '🤷‍♂️ Eh İşte' }
];

export function SocialDashboardScreen({ navigation }: any) {
  const [friends, setFriends] = useState([
    { id: '1', name: 'Ahmet Y.', score: 1250, relation: 'rakip' },
    { id: '2', name: 'Ayşe K.', score: 980, relation: 'kanka' },
    { id: '3', name: 'Sen (Ben)', score: 850, relation: null },
    { id: '4', name: 'Mehmet D.', score: 420, relation: 'yeni' },
  ]);
  const [friendCode, setFriendCode] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<any>(null);

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
             setSelectedFriend(null);
          } 
        }
      ]
    );
  };

  const handleChangeRelation = (friendId: string, relId: string, relLabel: string) => {
    Alert.alert(
      'Bağlantı İsteği',
      `Arkadaşına "${relLabel}" etiketi isteği göndermek istediğinden emin misin?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { 
          text: 'Evet, Gönder', 
          onPress: () => {
            // Apply the tag instantly upon user confirmation, then notify them about the pending status
            setFriends(prev => prev.map(f => f.id === friendId ? { ...f, relation: relId } : f));
            setSelectedFriend(null);
            
            setTimeout(() => {
              Alert.alert(
                'İstek Gönderildi 📩', 
                `Bildirim başarıyla gönderildi. Karşı taraf onayladığında bu etiket karşılıklı olarak kilitlenecek!`
              );
            }, 500);
          } 
        }
      ]
    );
  };

  const renderFriendItem = ({ item, index }: any) => {
    const relObj = RELATION_TYPES.find(r => r.id === item.relation);
    const isMe = item.name.includes('Sen');

    return (
      <TouchableOpacity 
        activeOpacity={isMe ? 1 : 0.7}
        onPress={() => !isMe && setSelectedFriend(item)}
        className={`flex-row justify-between items-center p-4 mb-3 rounded-2xl border ${isMe ? 'bg-indigo-50 border-indigo-200 shadow-none' : 'bg-white border-gray-100 shadow-sm shadow-gray-100'}`}
      >
        <View className="flex-row items-center flex-1">
          <Text className={`text-xl font-bold w-10 ${isMe ? 'text-indigo-500' : 'text-gray-400'}`}>{index + 1}.</Text>
          <View className="flex-1">
            <Text className={`text-base font-extrabold mb-1 ${isMe ? 'text-indigo-800' : 'text-gray-800'}`} numberOfLines={1}>{item.name}</Text>
            {!isMe && relObj && (
              <View className="bg-gray-50 self-start px-2 py-1 rounded-md border border-gray-100 mt-0.5">
                <Text className="text-[10px] text-gray-500 font-bold">{relObj.label}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View className="items-end justify-center ml-2">
          <Text className={`font-black text-lg ${isMe ? 'text-indigo-600' : 'text-amber-500'}`}>{item.score}</Text>
          <Text className="text-gray-400 font-bold text-[10px]">XP Puanı</Text>
        </View>
      </TouchableOpacity>
    );
  };

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

      {/* Friend Detail / Relation Modal */}
      <Modal visible={!!selectedFriend} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/60 justify-end">
           <View className="bg-white rounded-t-3xl p-6 min-h-[50%]">
             <View className="flex-row justify-between items-center mb-6">
                <View>
                   <Text className="text-2xl font-extrabold text-gray-800">{selectedFriend?.name}</Text>
                   <Text className="text-sm font-bold text-gray-400">Yakınlık Derecesi ve Taktik Seç</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedFriend(null)} className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                   <Text className="text-lg">❌</Text>
                </TouchableOpacity>
             </View>

             <View className="mb-6">
               {RELATION_TYPES.map(rel => (
                 <TouchableOpacity 
                   key={rel.id} 
                   onPress={() => handleChangeRelation(selectedFriend?.id, rel.id, rel.label)}
                   className={`flex-row items-center p-4 mb-2 rounded-2xl border ${selectedFriend?.relation === rel.id ? 'bg-indigo-50 border-indigo-500' : 'bg-gray-50 border-gray-200'}`}
                 >
                    <Text className={`flex-1 font-bold ${selectedFriend?.relation === rel.id ? 'text-indigo-700' : 'text-gray-600'}`}>{rel.label}</Text>
                    {selectedFriend?.relation === rel.id && <Text>✅</Text>}
                 </TouchableOpacity>
               ))}
             </View>

             <View className="border-t border-gray-100 pt-6">
                <Text className="text-xs text-center text-gray-400 mb-4 font-bold px-4">
                  Oyunlarda rakip veya kanka olmak algoritmada eşleşme durumunuzu çok etkiler, rekabeti kızıştırır!
                </Text>

                <TouchableOpacity 
                  onPress={() => handleRemoveFriend(selectedFriend?.id, selectedFriend?.name)}
                  className="bg-red-50 border border-red-100 w-full py-4 rounded-xl flex-row justify-center items-center"
                >
                   <Text className="mr-2">🗑️</Text>
                   <Text className="text-red-500 font-extrabold text-base">Arkadaşlıktan Çıkar</Text>
                </TouchableOpacity>
             </View>
           </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
