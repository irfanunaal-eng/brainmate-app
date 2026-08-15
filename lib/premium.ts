import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { Alert } from 'react-native';

export const checkPremiumStatus = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check DB fresh status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, role')
      .eq('id', user.id)
      .single();

    if (!profile) return false;

    // Cache the role for UI dynamically
    await AsyncStorage.setItem('@user_role', profile.role || 'student');

    let isPremium = false;
    
    // Okul Rehber Öğretmeni ve Sınıf Rehber Öğretmeni are natively FREE.
    if (profile.role === 'teacher' || profile.role === 'class_teacher') {
      isPremium = true;
    }
    // Is actively paying subscriber
    else if (profile.subscription_status === 'active') {
      isPremium = true;
    }
    // Is on active trial
    else if (profile.subscription_status === 'trialing' && profile.trial_ends_at) {
      const trialEndDate = new Date(profile.trial_ends_at).getTime();
      const now = new Date().getTime();
      if (now < trialEndDate) {
        isPremium = true;
      } else {
        // Trial expired, update status in DB silently
        await supabase
          .from('profiles')
          .update({ subscription_status: 'expired' })
          .eq('id', user.id);
      }
    }

    // Cache it for fast checks
    await AsyncStorage.setItem('@is_premium', isPremium ? 'true' : 'false');
    
    return isPremium;
  } catch (error) {
    console.warn('Premium check error:', error);
    // Fallback to cache
    const cached = await AsyncStorage.getItem('@is_premium');
    return cached === 'true';
  }
};

export const requirePremium = async (navigation: any, featureName: string): Promise<boolean> => {
   // Fast cache check first
   let isPremium = false;
   const cached = await AsyncStorage.getItem('@is_premium');
   if (cached === 'true') {
      isPremium = true;
   } else {
      // Re-verify strictly
      isPremium = await checkPremiumStatus();
   }

   if (!isPremium) {
     Alert.alert(
       'BrainMate Pro Gerekli 👑', 
       `"${featureName}" özelliğini kullanabilmek veya sınırları kaldırmak için BrainMate Pro'ya geçmeniz veya 3 günlük ücretsiz denemenizi başlatmanız gerekmektedir.`,
       [
         { text: 'Vazgeç', style: 'cancel' },
         { text: 'Premium\'u İncele', style: 'default', onPress: () => navigation.navigate('SubscriptionScreen') }
       ]
     );
     return false;
   }
   
   return true;
};
