import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Animated, Dimensions, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

import * as Speech from 'expo-speech';

const ROOT_WORD_DB = require('../assets/vocabulary.json');

export function EnglishGameScreen({ route }: any) {
  const { levelId } = route.params || { levelId: 'A1' };
  const DB = ROOT_WORD_DB[levelId] || ROOT_WORD_DB['A1'];
  const navigation = useNavigation();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timerAnimated] = useState(new Animated.Value(100));
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameHistory, setGameHistory] = useState<{en: string, tr: string, correct: boolean}[]>([]);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ visible: boolean; correct: boolean } | null>(null);
  
  const currentWord = DB[currentWordIndex % DB.length];

  const playVoice = async (text: string) => {
    if (!text) return;
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }
      Speech.speak(text, { language: 'en-US' });
    } catch (e) {
      console.log('Speech error:', e);
    }
  };

  // Generate dynamic options when word changes
  useEffect(() => {
    // Pick 3 random wrong answers
    const wrongAnswers = DB
      .filter((w: any) => w.en !== currentWord.en)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((w: any) => w.tr);
    
    // Combine with correct answer and shuffle
    const combined = [...wrongAnswers, currentWord.tr].sort(() => 0.5 - Math.random());
    setCurrentOptions(combined);
  }, [currentWordIndex]);

  // Read word aloud when it appears
  useEffect(() => {
    if (!isGameOver && !feedback) {
      playVoice(currentWord.en);
    }
  }, [currentWordIndex, isGameOver, feedback]);

  // Timer simulation
  useEffect(() => {
    if (isGameOver || feedback) return;
    
    timerAnimated.setValue(100);
    Animated.timing(timerAnimated, {
      toValue: 0,
      duration: 10000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        handleWrongAnswer(currentWord);
      }
    });

    return () => timerAnimated.stopAnimation();
  }, [currentWordIndex, isGameOver, feedback]);

  const handleWrongAnswer = (wordObj: any) => {
    setGameHistory(prev => [...prev, { en: wordObj.en, tr: wordObj.tr, correct: false }]);
    setFeedback({ visible: true, correct: false });
    playVoice(wordObj.sentence || wordObj.en);
  };

  const handleOptionPress = (selectedOption: string) => {
    timerAnimated.stopAnimation();
    if (selectedOption === currentWord.tr) {
      // Correct
      setGameHistory(prev => [...prev, { en: currentWord.en, tr: currentWord.tr, correct: true }]);
      setScore(prev => prev + 10);
      setFeedback({ visible: true, correct: true });
      playVoice(currentWord.sentence || currentWord.en);
    } else {
      // Wrong
      handleWrongAnswer(currentWord);
    }
  };

  const handleNextWord = () => {
    setFeedback(null);
    if (!feedback?.correct) {
      if (lives > 1) {
        setLives(prev => prev - 1);
        setCurrentWordIndex(prev => prev + 1);
      } else {
        setLives(0);
        setIsGameOver(true);
      }
    } else {
      setCurrentWordIndex(prev => prev + 1);
    }
  };

  if (isGameOver) {
    return (
      <SafeAreaView className="flex-1 bg-surface justify-center p-6">
        <View className="items-center mb-6">
          <Text className="text-6xl mb-4">💀</Text>
          <Text className="text-3xl font-black text-gray-800 mb-1">Oyun Bitti!</Text>
          <Text className="text-lg text-indigo-600 font-bold">Kazanılan: {score} XP</Text>
        </View>

        <Text className="font-extrabold text-gray-800 mb-3 text-lg">Cevap Özeti</Text>
        <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
           <ScrollView showsVerticalScrollIndicator={false}>
             {gameHistory.map((item, idx) => (
                <View key={idx} className="flex-row items-center border-b border-gray-50 py-3">
                   <Text className="text-xl mr-3">{item.correct ? '✅' : '❌'}</Text>
                   <View className="flex-1">
                     <Text className={`font-bold text-base ${item.correct ? 'text-gray-800' : 'text-red-500'}`}>{item.en}</Text>
                     <Text className="text-xs text-gray-500 font-medium">Anlamı: {item.tr}</Text>
                   </View>
                </View>
             ))}
           </ScrollView>
        </View>
        
        <TouchableOpacity 
          onPress={() => {
            setScore(0);
            setLives(3);
            setCurrentWordIndex(0);
            setGameHistory([]);
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

  if (feedback) {
     return (
        <SafeAreaView className="flex-1 justify-center p-6 bg-surface">
           <View className={`items-center p-8 rounded-3xl border-4 ${feedback.correct ? 'bg-emerald-50 border-emerald-500 shadow-emerald-200' : 'bg-rose-50 border-rose-500 shadow-rose-200'} shadow-lg mb-8`}>
              <Text className="text-7xl mb-4">{feedback.correct ? '🎯' : '❌'}</Text>
              <View className="flex-row items-center justify-center mb-2">
                 <Text className={`text-4xl font-black ${feedback.correct ? 'text-emerald-700' : 'text-rose-700'}`}>{currentWord.en}</Text>
                 <TouchableOpacity onPress={() => playVoice(currentWord.en)} className="ml-3 bg-white/50 p-2 rounded-full shadow-sm shadow-black/5">
                    <Text className="text-xl">🔊</Text>
                 </TouchableOpacity>
              </View>
              <Text className="text-lg font-bold text-gray-500 uppercase tracking-widest mb-6">{currentWord.tr}</Text>

              {currentWord.sentence ? (
                 <View className="bg-white/60 p-4 rounded-2xl w-full relative pt-8 mt-2">
                    <TouchableOpacity 
                       onPress={() => playVoice(currentWord.sentence.split('(')[0])} 
                       className="absolute -top-5 self-center bg-indigo-500 w-12 h-12 justify-center items-center rounded-full shadow-lg shadow-indigo-200"
                    >
                       <Text className="text-xl ml-1">🔊</Text>
                    </TouchableOpacity>
                    <Text className="text-center font-bold text-gray-800 italic mb-2 leading-6">"{currentWord.sentence.split('(')[0].trim()}"</Text>
                    {currentWord.sentence.includes('(') && (
                      <Text className="text-center text-xs font-medium text-gray-500">{currentWord.sentence.split('(')[1].replace(')', '').trim()}</Text>
                    )}
                 </View>
              ) : null}
           </View>

           <TouchableOpacity 
              onPress={handleNextWord}
              className={`w-full py-5 rounded-2xl items-center shadow-lg ${feedback.correct ? 'bg-emerald-600 shadow-emerald-500/30' : 'bg-rose-600 shadow-rose-500/30'}`}
           >
              <Text className="text-white font-extrabold text-xl">Devam Et {feedback.correct ? '👍' : '💔'}</Text>
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
               <Text className="text-gray-400 text-xs font-bold">{levelId} Seviyesi</Text>
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
         <View className="bg-white p-10 rounded-3xl items-center shadow-lg shadow-indigo-100/50 mb-10 border border-gray-100 relative">
            <TouchableOpacity 
               onPress={() => playVoice(currentWord.en)} 
               className="absolute top-4 right-4 bg-indigo-50 w-12 h-12 justify-center items-center rounded-full"
            >
               <Text className="text-2xl ml-1">🔊</Text>
            </TouchableOpacity>
            <Text className="text-gray-400 font-bold text-sm mb-2 tracking-widest uppercase mt-4">Türkçesi Nedir?</Text>
            <Text className="text-6xl font-black text-indigo-900">{currentWord.en}</Text>
         </View>

         {/* Options Grid */}
         <View className="flex-row flex-wrap justify-between">
           {currentOptions.map((opt: string, i: number) => (
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
