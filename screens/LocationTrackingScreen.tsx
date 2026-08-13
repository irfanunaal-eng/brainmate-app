import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Mock data to simulate student movement
const MOCK_STUDENT_PATH = [
  { latitude: 41.0082, longitude: 28.9784, time: '08:00', status: 'Evden Çıktı' },
  { latitude: 41.0112, longitude: 28.9810, time: '08:15', status: 'Yolda' },
  { latitude: 41.0150, longitude: 28.9850, time: '08:30', status: 'Okula Vardı' },
];

export default function LocationTrackingScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(MOCK_STUDENT_PATH[2]);

  useEffect(() => {
    // Simulate fetching GPS data from student device
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="mt-4 font-bold text-gray-400">GPS Sinyali Aranıyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white shadow-sm z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full mr-3">
          <Text className="text-lg">🔙</Text>
        </TouchableOpacity>
        <Text className="text-lg flex-1 font-extrabold text-gray-800">Canlı Konum Takibi</Text>
        <View className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center">
           <Text className="text-xl">📍</Text>
        </View>
      </View>

      <View className="flex-1 relative">
        <MapView
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: 41.0115,
            longitude: 28.9817,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {/* Path Line */}
          <Polyline 
            coordinates={MOCK_STUDENT_PATH.map(p => ({ latitude: p.latitude, longitude: p.longitude }))} 
            strokeColor="#4f46e5" 
            strokeWidth={4} 
            lineDashPattern={[2, 2]} 
          />
          
          {/* School Location */}
          <Marker coordinate={{ latitude: 41.0150, longitude: 28.9850 }} title="Okul">
             <View className="bg-white p-2 rounded-full border-4 border-indigo-500 shadow-xl">
                <Text className="text-2xl">🏫</Text>
             </View>
          </Marker>

          {/* Student Location */}
          <Marker coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }} title="Öğrenci (Şu an)">
             <View className="bg-white px-2 py-1 rounded-full border-2 border-emerald-500 shadow-xl">
                <Text className="text-sm">👦🏻 İrfan</Text>
             </View>
          </Marker>
        </MapView>
        
        {/* Info Overlay */}
        <View className="absolute bottom-10 left-5 right-5 bg-white rounded-3xl p-5 shadow-2xl border border-gray-100">
           <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                 <View className="w-3 h-3 bg-emerald-500 rounded-full mr-2 shadow-sm shadow-emerald-500" />
                 <Text className="font-extrabold text-gray-800">Şu Anki Durum</Text>
              </View>
              <Text className="text-xs font-bold text-gray-400">Son Güncelleme: 1 dk önce</Text>
           </View>
           
           <View className="bg-gray-50 flex-row items-center p-4 rounded-2xl mb-4 border border-gray-200">
              <View className="w-12 h-12 bg-emerald-100 rounded-full items-center justify-center mr-4">
                 <Text className="text-2xl">✅</Text>
              </View>
              <View className="flex-1">
                 <Text className="font-black text-gray-800 text-lg mb-1">{currentLocation.status}</Text>
                 <Text className="text-xs text-gray-500 font-medium">Öğrenci belirlenen güvenli bölgede (Okul).</Text>
              </View>
           </View>

           <TouchableOpacity className="w-full bg-indigo-600 py-4 rounded-xl flex-row justify-center items-center shadow-lg shadow-indigo-600/30">
              <Text className="text-white font-extrabold text-sm mr-2">Nerede Olduğunu Gör</Text>
              <Text>📳</Text>
           </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
