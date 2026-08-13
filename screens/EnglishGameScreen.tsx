import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Mock Vocabulary DB for 200 Level
const WORD_DB = [
  { en: 'Time', tr: 'Zaman', options: ['Zaman', 'Gün', 'Saat', 'Dakika'] },
  { en: 'Person', tr: 'Kişi', options: ['İnsan', 'Kişi', 'Çocuk', 'Adam'] },
  { en: 'Year', tr: 'Yıl', options: ['Yıl', 'Ay', 'Hafta', 'Dönem'] },
  { en: 'Way', tr: 'Yol', options: ['Sokak', 'Cadde', 'Yol', 'Yön'] },
  { en: 'Day', tr: 'Gün', options: ['Gün', 'Gece', 'Sabah', 'Akşam'] },
];

export function EnglishGameScreen({ route }: any) {
  const navigation = useNavigation();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timerAnimated] = useState(new Animated.Value(100)); // 100% width
  const [isGameOver, setIsGameOver] = useState(false);

  const currentWord = WORD_DB[currentWordIndex % WORD_DB.length]; // loop for demo

  // Timer simulation
  useEffect(() => {
    if (isGameOver) return;
    
    timerAnimated.setValue(100);
    Animated.timing(timerAnimated, {
      toValue: 0,
      duration: 10000, // 10 seconds per word
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        handleWrongAnswer();
      }
    });

    return () => timerAnimated.stopAnimation();
  }, [currentWordIndex, isGameOver]);

  const handleWrongAnswer = () => {
    if (lives > 1) {
      setLives(prev => prev - 1);
      setCurrentWordIndex(prev => prev + 1);
    } else {
      setLives(0);
      setIsGameOver(true);
    }
  };

  const handleOptionPress = (selectedOption: string) => {
    timerAnimated.stopAnimation();
    if (selectedOption === currentWord.tr) {
      // Correct
      setScore(prev => prev + 10);
      setCurrentWordIndex(prev => prev + 1);
    } else {
      // Wrong
      handleWrongAnswer();
    }
  };

  if (isGameOver) {
    return (
      <SafeAreaView className="flex-1 bg-surface justify-center items-center p-6">
        <Text className="text-8xl mb-8">💀</Text>
        <Text className="text-4xl font-black text-gray-800 mb-2">Oyun Bitti!</Text>
        <Text className="text-xl text-gray-500 font-bold mb-10">Skorun: {score} XP</Text>
        
        <TouchableOpacity 
          onPress={() => {
            setScore(0);
            setLives(3);
            setCurrentWordIndex(0);
            setIsGameOver(false);
          }}
          className="bg-indigo-600 w-full py-4 rounded-xl items-center shadow-lg shadow-indigo-600/30 mb-4"
        >
          <Text className="text-white font-extrabold text-lg">Tekrar Dene 🔄</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="bg-gray-100 w-full py-4 rounded-xl items-center"
        >
          <Text className="text-gray-600 font-bold text-lg">Lobiye Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header Info */}
      <View className="flex-row justify-between items-center p-5">
         <View className="flex-row items-center">
            <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full mr-3">
              <Text className="text-xl">🔙</Text>
            </TouchableOpacity>
            <View>
               <Text className="text-indigo-800 font-extrabold text-xl">{score} XP</Text>
               <Text className="text-gray-400 text-xs font-bold">İlk 200 Kelime (Solo)</Text>
            </View>
         </View>

         <View className="flex-row bg-rose-50 px-3 py-2 rounded-full border border-rose-100">
           {[...Array(3)].map((_, i) => (
             <Text key={i} className={`text-sm ${i < lives ? 'opacity-100' : 'opacity-20 grayscale'}`}>❤️</Text>
           ))}
         </View>
      </View>

      {/* Timer Bar */}
      <View className="w-full h-2 bg-gray-100">
        <Animated.View 
          className="h-full bg-amber-500 rounded-r-full"
          style={{ 
            width: timerAnimated.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%']
            }) 
          }}
        />
      </View>

      <View className="flex-1 p-6 justify-center">
         {/* Question Area */}
         <View className="bg-white p-10 rounded-3xl items-center shadow-lg shadow-indigo-100/50 mb-10 border border-gray-100">
            <Text className="text-gray-400 font-bold text-sm mb-2 tracking-widest uppercase">Türkçesi Nedir?</Text>
            <Text className="text-6xl font-black text-indigo-900">{currentWord.en}</Text>
         </View>

         {/* Options Grid */}
         <View className="flex-row flex-wrap justify-between">
           {currentWord.options.map((opt, i) => (
             <TouchableOpacity 
               key={i}
               onPress={() => handleOptionPress(opt)}
               className="w-[48%] bg-indigo-50 border-2 border-indigo-100 py-6 mb-4 rounded-2xl items-center shadow-sm"
             >
               <Text className="text-xl font-bold text-indigo-800">{opt}</Text>
             </TouchableOpacity>
           ))}
         </View>
      </View>
    </SafeAreaView>
  );
}
