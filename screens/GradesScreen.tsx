import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, TextInput, KeyboardAvoidingView, Platform, Keyboard, Modal, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { MEB_ELECTIVES, ACADEMIC_YEARS } from '../constants/MebCurriculum';

const COL_WIDTH = 45;

const SUBJECTS = Array.from(new Set([
  'Türk Dili ve Edebiyatı', 'Matematik', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji',
  'Tarih', 'Coğrafya', 'Felsefe', 'Din Kültürü', 'İngilizce', 'İkinci Yabancı Dil',
  'Beden Eğitimi', 'Görsel Sanatlar', 'Müzik', 'Rehberlik', 'Etüt / Bireysel',
  ...MEB_ELECTIVES
]));

// Not sistemine dahil edilmeyen dersler (sınav notu yok, kredi hesaplamasını bozar)
const GRADE_EXCLUDED_SUBJECTS = [
  'Rehberlik',
];

export function GradesScreen({ navigation, route }: any) {
  const isFocused = useIsFocused();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [attStats, setAttStats] = useState({ mazeretsiz: 0, mazeretli: 0 });

  // Subject Picker states
  const [isSubjectPickerVisible, setSubjectPickerVisible] = useState(false);
  const [subjectPickerTargetId, setSubjectPickerTargetId] = useState<string | null>(null);
  const [customSubject, setCustomSubject] = useState('');
  const [savedCustomSubjects, setSavedCustomSubjects] = useState<string[]>([]);
  const allSubjects = [...SUBJECTS, ...savedCustomSubjects];

  const fetchData = async () => {
      setIsLoading(true);
      try {
        const stored = await AsyncStorage.getItem('@custom_subjects');
        if (stored) setSavedCustomSubjects(JSON.parse(stored));

        const { data: { user } } = await supabase.auth.getUser();
        let sId = user?.id;
        if (route?.params?.studentId) sId = route.params.studentId;

        if (sId) {
           let existingGrades: any[] = [];
           // HARD-RESET kapandı, normal not okuma aktif.
           
           try {
             const { data: dbGrades } = await supabase.from('grades').select('grades_data').eq('student_id', sId).single();
             if (dbGrades && dbGrades.grades_data) existingGrades = dbGrades.grades_data;
           } catch(e) {}

           if (existingGrades.length === 0) {
              const cached = await AsyncStorage.getItem(`@grades_cache_${sId}`);
              if (cached) existingGrades = JSON.parse(cached);
           }
           try {
              let logs: any[] = [];
              
              try {
                const { data: dbLogs } = await supabase.from('attendance_logs').select('*').eq('student_id', sId);
                if (dbLogs && dbLogs.length > 0) logs = dbLogs;
              } catch(e) {}

              if (logs.length === 0) {
                 const attLogsData = await AsyncStorage.getItem(`@att_logs_${sId}`);
                 if (attLogsData) logs = JSON.parse(attLogsData);
              }

              if (logs.length > 0) {
                  let mazeretsizSaat = 0;
                  let mazeretliSaat = 0;
                  let gecSayisi = 0;
                  const STATUS_OPTS: Record<string, string> = {
                    'yok': 'mazeretsiz', 'gec': 'gec', 'rapor': 'mazeretli', 'izin': 'mazeretli', 'faaliyet': 'present'
                  };
                  
                  logs.forEach((log: any) => {
                      const tType = STATUS_OPTS[log.statusId] || 'present';
                      if (tType === 'present') return;
                      if (tType === 'gec') {
                         gecSayisi++;
                      } else {
                         let hours = 0;
                         if (log.scope === 'tam_gun') hours = 8;
                         else if (log.scope === 'yarim_gun') hours = 4;
                         else if (log.periods && Array.isArray(log.periods)) hours = log.periods.length;
                         
                         if (tType === 'mazeretsiz') mazeretsizSaat += hours;
                         if (tType === 'mazeretli') mazeretliSaat += hours;
                      }
                  });
                  
                  const gecDenGelenYarimGunler = Math.floor(gecSayisi / 5);
                  mazeretsizSaat += (gecDenGelenYarimGunler * 4);

                  setAttStats({ 
                      mazeretsiz: +(mazeretsizSaat / 8).toFixed(2), 
                      mazeretli: +(mazeretliSaat / 8).toFixed(2) 
                  });
              }
           } catch(e) {}

           // Aktif akademik yılı oku (ScheduleScreen ile ortak key)
           const storedYear = await AsyncStorage.getItem('@selected_academic_year');
           const activeYear = storedYear || ACADEMIC_YEARS[3];

           let merged = [...existingGrades];
           let syncList: { name: string; hours: number }[] = [];

           // ÖNCELİK: Kullanıcının belirlediği saat kotalarından (Okul Programı Saatleri listesi) al
           const storedQuota = await AsyncStorage.getItem(`@school_quota_${sId}_${activeYear}`);
           if (storedQuota) {
              const parsedQuota = JSON.parse(storedQuota);
              if (parsedQuota && parsedQuota.length > 0) {
                 parsedQuota.forEach((q: any) => {
                    const t = (q.name || '').trim();
                    if (t && !GRADE_EXCLUDED_SUBJECTS.includes(t)) {
                        syncList.push({ name: t, hours: parseInt(q.hours, 10) || 0 });
                    }
                 });
              }
           }

           // EĞER kota listesi boşsa (eski veri vs.), fallback: veritabanı hücrelerini say
           if (syncList.length === 0) {
              const { data: schData } = await supabase
                 .from('schedules')
                 .select('title, schedule_type')
                 .eq('student_id', sId)
                 .eq('schedule_type', 'okul')
                 .eq('academic_year', activeYear);

              if (schData && schData.length > 0) {
                 const counts: Record<string, number> = {};
                 schData.forEach(r => {
                    const t = r.title.trim();
                    if (t && !GRADE_EXCLUDED_SUBJECTS.includes(t)) counts[t] = (counts[t] || 0) + 1;
                 });
                 Object.keys(counts).forEach(k => {
                    syncList.push({ name: k, hours: counts[k] });
                 });
              }
           }

           if (syncList.length > 0) {
              merged = syncList.map(item => {
                 const existing = existingGrades.find(s => s.name === item.name);
                 return existing
                    ? { ...existing, saat: item.hours.toString() }
                    : {
                        id: Date.now().toString() + Math.random().toString(),
                        no: '0', name: item.name, saat: item.hours.toString(),
                        t1: { yazili: ['','','','',''], perf: ['','','',''], uyg: ['','','',''], proje: '', muaf: false },
                        t2: { yazili: ['','','','',''], perf: ['','','',''], uyg: ['','','',''], proje: '', muaf: false },
                      };
              });
           }

           if (merged.length > 0) {
             merged.forEach((m, idx) => { m.no = (idx + 1).toString(); });
             setSubjects(merged);
           } else {
              setSubjects([]);
           }
        }
      } catch (e) {
      } finally {
        setIsLoading(false);
      }
  };

  useEffect(() => { 
    if (isFocused) fetchData(); 
  }, [isFocused]);



  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let sId = user?.id;
      if (route?.params?.studentId) sId = route.params.studentId;

      if (sId) {
        const payload = JSON.stringify(subjects);
        await AsyncStorage.setItem(`@grades_cache_${sId}`, payload);

        try {
          // If remote column doesn't exist yet, it safely errors while relying on cache.
          await supabase.from('grades').upsert({ student_id: sId, grades_data: subjects });
        } catch (e) {}

        Alert.alert('Harika', 'Not tablon başarıyla kaydedildi!');
      }
    } catch(e) {
      Alert.alert('Hata', 'Kaydedilirken bir sorun oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Notları Sıfırla',
      'Tüm not verileri silinecek ve program sayfasındaki dersler taze yüklenecek. Emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sıfırla', style: 'destructive', onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              let sId = user?.id;
              if (route?.params?.studentId) sId = route.params.studentId;
              if (sId) {
                await AsyncStorage.removeItem(`@grades_cache_${sId}`);
                try { await supabase.from('grades').delete().eq('student_id', sId); } catch(e) {}
              }
            } catch(e) {}
            setSubjects([]);
            // Sıfırdan senkronize et
            await fetchData();
        }}
      ]
    );
  };

  const updateGrade = (subId: string, term: string, field: string, index: number | null, value: string | boolean) => {
    setSubjects(prev => prev.map(s => {
      if (s.id !== subId) return s;
      const tData = { ...s[term] };
      if (index !== null) {
        tData[field][index] = value;
      } else {
        tData[field] = value; 
      }
      return { ...s, [term]: tData };
    }));
  };

  const updateSubjectInfo = (subId: string, field: string, value: string) => {
    setSubjects(prev => prev.map(s => {
      if (s.id !== subId) return s;
      return { ...s, [field]: value };
    }));
  };

  const addNewSubjectRow = () => {
    const newNo = (subjects.length + 1).toString();
    setSubjects(prev => [...prev, {
      id: Date.now().toString(), no: newNo, name: '', saat: '2',
      t1: { yazili: ['','','','',''], perf: ['','','',''], uyg: ['','','',''], proje: '', muaf: false },
      t2: { yazili: ['','','','',''], perf: ['','','',''], uyg: ['','','',''], proje: '', muaf: false },
    }]);
  };

  const removeSubjectRow = (id: string) => {
    setSubjects(prev => {
      const filtered = prev.filter(s => s.id !== id);
      return filtered.map((s, idx) => ({...s, no: (idx + 1).toString()}));
    });
  };

  const handleSelectSubject = (selectedTitle: string) => {
    if (subjectPickerTargetId) {
      updateSubjectInfo(subjectPickerTargetId, 'name', selectedTitle);
    }
    setSubjectPickerVisible(false);
  };

  const submitCustomSubject = async () => {
    const trimmed = customSubject.trim();
    if (!trimmed) return;
    
    if (!allSubjects.includes(trimmed)) {
      const newList = [...savedCustomSubjects, trimmed];
      setSavedCustomSubjects(newList);
      try {
        await AsyncStorage.setItem('@custom_subjects', JSON.stringify(newList));
      } catch (e) {}
    }
    
    Keyboard.dismiss();
    handleSelectSubject(trimmed);
  };

  const removeCustomSubject = async (subjectToRemove: string) => {
    const newList = savedCustomSubjects.filter(s => s !== subjectToRemove);
    setSavedCustomSubjects(newList);
    try {
      await AsyncStorage.setItem('@custom_subjects', JSON.stringify(newList));
    } catch (e) {}
  };

  const getTermAvg = (t: any) => {
    if (t.muaf) return null;
    const nums = [...t.yazili, ...t.perf, ...t.uyg, t.proje].map(parseFloat).filter(v => !isNaN(v));
    if (nums.length === 0) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  };

  const calcGlobalTerm = (term: 't1' | 't2') => {
    let totalScore = 0;
    let totalHours = 0;
    subjects.forEach(sub => {
       const avg = getTermAvg(sub[term]); 
       const saat = parseFloat(sub.saat);
       if (avg !== null && !sub[term].muaf && !isNaN(saat) && saat > 0) {
          totalScore += avg * saat;
          totalHours += saat;
       }
    });
    if (totalHours === 0) return null;
    return totalScore / totalHours;
  };

  const getCert = (avg: number | null, term: 't1' | 't2' | 'global') => {
    if (avg === null) return '-';
    
    let hasFailed = false;
    subjects.forEach(sub => {
       const subAvg = term === 'global' ? 
           ((getTermAvg(sub.t1) !== null && getTermAvg(sub.t2) !== null) ? (getTermAvg(sub.t1)! + getTermAvg(sub.t2)!)/2 : (getTermAvg(sub.t1) || getTermAvg(sub.t2)))
           : getTermAvg(sub[term]);
       if (subAvg !== null && subAvg < 50 && !sub[term]?.muaf) hasFailed = true;
    });

    if (hasFailed) return '🔴 Başarısız (Zayıf Var)';
    if (attStats.mazeretsiz > 5) return '⚠️ Devamsızlıktan Belge Alamaz';
    
    if (avg >= 85.00) return '🏆 Takdir Belgesi';
    if (avg >= 70.00) return '🎖️ Teşekkür Belgesi';
    if (avg >= 50.00) return '🟢 Seçimlik Geçti';
    return '🔴 Başarısız';
  };

  const t1AvgGlobal = calcGlobalTerm('t1');
  const t2AvgGlobal = calcGlobalTerm('t2');
  const yearEndGlobal = (t1AvgGlobal !== null && t2AvgGlobal !== null) ? ((t1AvgGlobal + t2AvgGlobal) / 2) : (t1AvgGlobal !== null ? t1AvgGlobal : t2AvgGlobal);

  const renderTermSubheaders = () => {
    const cols = [];
    for(let i=1; i<=5; i++) cols.push(`Y${i}`);
    for(let i=1; i<=4; i++) cols.push(`P${i}`);
    for(let i=1; i<=4; i++) cols.push(`U${i}`);
    cols.push('Prj', 'Muaf', 'D. Ort');
    return cols.map((c, i) => (
      <View key={i} style={{width: COL_WIDTH, borderRightWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc'}}>
        <Text style={{fontSize: 9, fontWeight: 'bold', color: '#64748b'}}>{c}</Text>
      </View>
    ));
  };

  const DataColumnsHeader = () => (
    <View style={{height: 68, borderBottomWidth: 1, borderColor: '#ccc'}}>
      <View style={{flexDirection: 'row'}}>
        {/* 1. DÖNEM */}
        <View style={{width: COL_WIDTH * 16, borderRightWidth: 2, borderColor: '#9ca3af', backgroundColor: '#e0f2fe', alignItems: 'center'}}>
          <Text style={{fontWeight: 'bold', padding: 5, fontSize: 12, color: '#0369a1'}}>1. DÖNEM</Text>
        </View>
        {/* 2. DÖNEM */}
        <View style={{width: COL_WIDTH * 16, borderRightWidth: 2, borderColor: '#9ca3af', backgroundColor: '#fce7f3', alignItems: 'center'}}>
          <Text style={{fontWeight: 'bold', padding: 5, fontSize: 12, color: '#be185d'}}>2. DÖNEM</Text>
        </View>
         {/* YIL SONU */}
        <View style={{width: COL_WIDTH, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center'}}>
          <Text style={{fontWeight: 'bold', padding: 5, fontSize: 10, color: '#b45309'}}>YIL SONU</Text>
        </View>
      </View>
      
      <View style={{flexDirection: 'row', height: 40}}>
         {renderTermSubheaders()}
         {renderTermSubheaders()}
         <View style={{width: COL_WIDTH, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fffbeb'}}><Text style={{fontSize: 8, fontWeight: 'bold', textAlign: 'center'}}>Y.S.{'\n'}Ort</Text></View>
      </View>
    </View>
  );

  const renderTermCells = (subId: string, term: string, tData: any, avg: number | null) => {
    const inputs: React.ReactNode[] = [];
    const pushGroup = (field: string, count: number) => {
        for(let i=0; i<count; i++) {
            inputs.push(
               <View key={`${term}-${field}-${i}`} style={{width: COL_WIDTH, borderRightWidth: 1, borderColor: '#eee'}}>
                  <TextInput
                     value={tData[field][i]}
                     onChangeText={v => updateGrade(subId, term, field, i, v)}
                     keyboardType="decimal-pad"
                     returnKeyType="done"
                     maxLength={3}
                     style={{flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#334155'}}
                  />
               </View>
            )
        }
    };
    
    pushGroup('yazili', 5);
    pushGroup('perf', 4);
    pushGroup('uyg', 4);
    
    // Proje
    inputs.push(
       <View key={`${term}-proje`} style={{width: COL_WIDTH, borderRightWidth: 1, borderColor: '#eee', backgroundColor: '#f0fdf4'}}>
          <TextInput
             value={tData.proje}
             onChangeText={v => updateGrade(subId, term, 'proje', null, v)}
             keyboardType="decimal-pad"
             returnKeyType="done"
             maxLength={3}
             style={{flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: '#166534'}}
          />
       </View>
    );

    // Muaf Toggle
    inputs.push(
       <TouchableOpacity 
          key={`${term}-muaf`} 
          onPress={() => updateGrade(subId, term, 'muaf', null, !tData.muaf)}
          style={{width: COL_WIDTH, borderRightWidth: 1, borderColor: '#eee', backgroundColor: tData.muaf ? '#fee2e2' : '#fff', alignItems: 'center', justifyContent: 'center'}}
       >
          {tData.muaf && <Text style={{fontSize: 9, color: '#dc2626', fontWeight: 'bold'}}>Muaf</Text>}
          {!tData.muaf && <Text style={{fontSize: 9, color: '#cbd5e1'}}>-</Text>}
       </TouchableOpacity>
    );

    // Ders Ortalamasi
    inputs.push(
       <View key={`${term}-ort`} style={{width: COL_WIDTH, borderRightWidth: 2, borderColor: '#9ca3af', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9'}}>
          <Text style={{fontSize: 12, fontWeight: 'bold', color: '#0f172a'}}>{avg !== null && !tData.muaf ? avg.toFixed(1) : '-'}</Text>
       </View>
    );

    return inputs;
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#f8fafc'}}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        
        {/* Header */}
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#f1f5f9', zIndex: 10}}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', borderRadius: 20}}>
            <Text style={{fontSize: 20}}>🔙</Text>
          </TouchableOpacity>
          <Text style={{flex: 1, fontSize: 17, fontWeight: '900', color: '#1e293b', textAlign: 'center', marginHorizontal: 8}} numberOfLines={1} adjustsFontSizeToFit>Yazılı ve Performans Notları</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <TouchableOpacity onPress={handleReset} style={{width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', borderRadius: 20}}>
              <Text style={{fontSize: 18}}>🗑️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={isSaving} style={{width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: isSaving ? '#cbd5e1' : '#e0e7ff', borderRadius: 20}}>
              {isSaving ? <ActivityIndicator size="small" color="#4f46e5" /> : <Text style={{fontSize: 20}}>💾</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={{flex: 1}} contentContainerStyle={{padding: 16, paddingBottom: 60}} keyboardShouldPersistTaps="handled">
          
          {/* Global Summary Card with Weighted Averages */}
          <TouchableOpacity activeOpacity={1} onPress={() => Keyboard.dismiss()} style={{flexDirection: 'row', backgroundColor: 'white', padding: 12, borderRadius: 16, marginBottom: 16, paddingHorizontal: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, borderWidth: 1, borderColor: '#e2e8f0'}}>
             <View style={{flex: 1, alignItems: 'center', borderRightWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 4}}>
                <Text style={{fontSize: 10, fontWeight: '800', color: '#64748b'}}>1. DÖNEM AĞIRLIKLI ORT.</Text>
                <Text style={{fontSize: 22, fontWeight: '900', color: '#0369a1', marginVertical: 4}}>{t1AvgGlobal !== null ? t1AvgGlobal.toFixed(2) : '-'}</Text>
                <Text style={{fontSize: 9, fontWeight: '900', color: t1AvgGlobal && t1AvgGlobal >= 70 ? '#16a34a' : '#d97706', textAlign: 'center'}}>{getCert(t1AvgGlobal, 't1')}</Text>
             </View>

             <View style={{flex: 1, alignItems: 'center', borderRightWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 4}}>
                <Text style={{fontSize: 10, fontWeight: '800', color: '#64748b'}}>2. DÖNEM AĞIRLIKLI ORT.</Text>
                <Text style={{fontSize: 22, fontWeight: '900', color: '#be185d', marginVertical: 4}}>{t2AvgGlobal !== null ? t2AvgGlobal.toFixed(2) : '-'}</Text>
                <Text style={{fontSize: 9, fontWeight: '900', color: t2AvgGlobal && t2AvgGlobal >= 70 ? '#16a34a' : '#d97706', textAlign: 'center'}}>{getCert(t2AvgGlobal, 't2')}</Text>
             </View>

             <View style={{flex: 1, alignItems: 'center', paddingHorizontal: 4}}>
                <Text style={{fontSize: 10, fontWeight: '800', color: '#64748b'}}>YIL SONU ORTALAMASI</Text>
                <Text style={{fontSize: 22, fontWeight: '900', color: '#0f172a', marginVertical: 4}}>{yearEndGlobal !== null ? yearEndGlobal.toFixed(2) : '-'}</Text>
                <Text style={{fontSize: 10, fontWeight: '800', textAlign: 'center', color: yearEndGlobal && yearEndGlobal >= 50 ? '#16a34a' : '#dc2626'}}>
                  {getCert(yearEndGlobal, 'global')}
                </Text>
             </View>
          </TouchableOpacity>



          <View style={{flexDirection: 'row', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, overflow: 'hidden', backgroundColor: 'white'}}>
            
            {/* Frozen Left Column */}
            <View style={{borderRightWidth: 2, borderColor: '#9ca3af', backgroundColor: '#f8fafc', zIndex: 10}}>
              <View style={{height: 68, borderBottomWidth: 1, borderColor: '#ccc', flexDirection: 'row'}}>
                 <View style={{width: 30, borderRightWidth: 1, borderColor: '#e2e8f0', justifyContent: 'flex-end', paddingBottom: 6, alignItems: 'center'}}>
                   <Text style={{fontSize: 9, fontWeight: 'bold', color: '#475569'}}>Sıra</Text>
                 </View>
                 <View style={{width: 110, borderRightWidth: 1, borderColor: '#e2e8f0', justifyContent: 'flex-end', paddingBottom: 6, alignItems: 'center'}}>
                   <Text style={{fontSize: 10, fontWeight: 'bold', color: '#475569'}}>Ders Adı</Text>
                 </View>
                 <View style={{width: 35, justifyContent: 'flex-end', paddingBottom: 6, alignItems: 'center'}}>
                   <Text style={{fontSize: 8, fontWeight: 'bold', color: '#475569'}}>H.D.S.</Text>
                 </View>
              </View>
              
              <View>
                {subjects.map((sub) => (
                  <View key={sub.id} style={{flexDirection: 'row', height: 45, borderBottomWidth: 1, borderColor: '#e5e7eb'}}>
                      <View style={{width: 30, borderRightWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center'}}>
                        <Text style={{fontSize: 10, fontWeight: '800', color: '#64748b'}}>{sub.no}</Text>
                      </View>
                      <View style={{width: 110, borderRightWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center'}}>
                        <TouchableOpacity 
                          style={{paddingLeft: 4, height: '100%', justifyContent: 'center'}}
                          onPress={() => {
                             setSubjectPickerTargetId(sub.id);
                             setCustomSubject('');
                             setSubjectPickerVisible(true);
                          }}
                        >
                          <Text style={{fontSize: 9, fontWeight: '800', color: sub.name ? '#1e293b' : '#94a3b8'}} numberOfLines={2}>
                            {sub.name || "Ders Seç"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{width: 35, justifyContent: 'center'}}>
                        <TextInput 
                          value={sub.saat}
                          onChangeText={(v) => updateSubjectInfo(sub.id, 'saat', v)}
                          keyboardType="numeric"
                          returnKeyType="done"
                          maxLength={2}
                          style={{fontSize: 13, fontWeight: '900', color: '#0284c7', textAlign: 'center', height: '100%'}}
                          placeholder="0"
                        />
                      </View>
                  </View>
                ))}
                
                {/* Sabit Sütun Toplam Saati */}
                <View style={{flexDirection: 'row', height: 40, borderBottomWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f1f5f9', alignItems: 'center'}}>
                    <View style={{width: 140, borderRightWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'flex-end', paddingRight: 6}}>
                        <Text style={{fontSize: 10, fontWeight: '900', color: '#475569'}}>TOPLAM SAAT:</Text>
                    </View>
                    <View style={{width: 35, justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{fontSize: 12, fontWeight: '900', color: '#1e293b'}}>
                           {subjects.reduce((sum, s) => sum + (parseInt(s.saat) || 0), 0)}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity onPress={addNewSubjectRow} style={{padding: 12, alignItems: 'center', justifyContent: 'center'}}>
                   <Text style={{color: '#4f46e5', fontWeight: 'bold', fontSize: 13}}>+ Yeni Ders Ekle</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Scrollable Right Columns */}
            <ScrollView horizontal showsHorizontalScrollIndicator={true} bounces={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
              <View>
                <DataColumnsHeader />

                <View>
                  {subjects.map((sub) => {
                    const t1Avg = getTermAvg(sub.t1);
                    const t2Avg = getTermAvg(sub.t2);
                    const yAvg = (t1Avg !== null && t2Avg !== null) ? ((t1Avg + t2Avg) / 2) : (t1Avg !== null ? t1Avg : t2Avg);
                    
                    return (
                      <View key={sub.id} style={{flexDirection: 'row', height: 45, borderBottomWidth: 1, borderColor: '#e5e7eb'}}>
                          {renderTermCells(sub.id, 't1', sub.t1, t1Avg)}
                          {renderTermCells(sub.id, 't2', sub.t2, t2Avg)}
                          
                          <View style={{width: COL_WIDTH, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef3c7'}}>
                            <Text style={{fontWeight: '900', fontSize: 13, color: '#92400e'}}>{yAvg !== null ? yAvg.toFixed(2) : '-'}</Text>
                          </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

          </View>

          {/* Kısaltmalar Dizini */}
          <View style={{marginTop: 12, backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5}}>
            <Text style={{fontSize: 10, fontWeight: '900', color: '#64748b', marginBottom: 6}}>KISALTMALAR DİZİNİ</Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
              <Text style={{fontSize: 9, color: '#475569', marginRight: 12, marginBottom: 6}}><Text style={{fontWeight: '900', color: '#0f172a'}}>H.D.S.:</Text> Haftalık Ders Saati</Text>
              <Text style={{fontSize: 9, color: '#475569', marginRight: 12, marginBottom: 6}}><Text style={{fontWeight: '900', color: '#0f172a'}}>Y1, Y2:</Text> Yazılı Sınav</Text>
              <Text style={{fontSize: 9, color: '#475569', marginRight: 12, marginBottom: 6}}><Text style={{fontWeight: '900', color: '#0f172a'}}>P1, P2:</Text> Performans Notu</Text>
              <Text style={{fontSize: 9, color: '#475569', marginRight: 12, marginBottom: 6}}><Text style={{fontWeight: '900', color: '#0f172a'}}>U1, U2:</Text> Uygulama Notu</Text>
              <Text style={{fontSize: 9, color: '#475569', marginRight: 12, marginBottom: 6}}><Text style={{fontWeight: '900', color: '#0f172a'}}>Prj:</Text> Proje Notu</Text>
              <Text style={{fontSize: 9, color: '#475569', marginRight: 12, marginBottom: 6}}><Text style={{fontWeight: '900', color: '#0f172a'}}>D. Ort:</Text> Dönem Ortalaması</Text>
              <Text style={{fontSize: 9, color: '#475569', marginRight: 12, marginBottom: 6}}><Text style={{fontWeight: '900', color: '#0f172a'}}>Muaf:</Text> Ortalamaya Etki Etmez</Text>
              <Text style={{fontSize: 9, color: '#475569', marginRight: 12, marginBottom: 6}}><Text style={{fontWeight: '900', color: '#0f172a'}}>Y.S. Ort:</Text> Yıl Sonu Ortalaması</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Subject Picker Modal */}
      <Modal visible={isSubjectPickerVisible} animationType="slide" transparent={true}>
        <View style={{flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <View style={{backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', padding: 24}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
              <Text style={{fontSize: 24, fontWeight: '900', color: '#1e293b'}}>Ders Seçin</Text>
              <TouchableOpacity onPress={() => setSubjectPickerVisible(false)} style={{width: 40, height: 40, backgroundColor: '#f1f5f9', borderRadius: 20, alignItems: 'center', justifyContent: 'center'}}>
                <Text style={{fontSize: 16}}>❌</Text>
              </TouchableOpacity>
            </View>
            
            <View style={{flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 24, backgroundColor: '#f8fafc'}}>
               <TextInput 
                  placeholder="Listede yoksa buraya yazın..." 
                  style={{flex: 1, fontWeight: 'bold', color: '#334155', height: 48, fontSize: 16}}
                  value={customSubject}
                  onChangeText={setCustomSubject}
                  returnKeyType="done"
               />
               <TouchableOpacity 
                 disabled={!customSubject.trim()} 
                 onPress={submitCustomSubject} 
                 style={{marginLeft: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: customSubject.trim() ? '#4f46e5' : '#cbd5e1'}}
               >
                  <Text style={{color: 'white', fontWeight: '800'}}>Ekle</Text>
               </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
               
               <TouchableOpacity 
                 onPress={() => {
                    if (subjectPickerTargetId) {
                       removeSubjectRow(subjectPickerTargetId);
                       setSubjectPickerVisible(false);
                    }
                 }} 
                 style={{paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#fee2e2'}}
               >
                  <Text style={{color: '#ef4444', fontWeight: '900', fontSize: 16}}>🗑️ Bu Dersi Tablodan Sil</Text>
               </TouchableOpacity>

               <Text style={{color: '#94a3b8', fontWeight: 'bold', marginBottom: 8, marginTop: 12, marginLeft: 8}}>TÜM DERSLER {savedCustomSubjects.length > 0 && "(Özel Dersler Dahil)"}</Text>
               {allSubjects.map((subItem, idx) => {
                 const isCustom = savedCustomSubjects.includes(subItem);
                 return (
                   <View key={idx} style={{flexDirection: 'row', borderBottomWidth: 1, borderColor: '#f1f5f9', alignItems: 'center'}}>
                     <TouchableOpacity style={{flex: 1, paddingVertical: 16, paddingHorizontal: 8}} onPress={() => handleSelectSubject(subItem)}>
                        <Text style={{color: '#1e293b', fontWeight: '800', fontSize: 18}}>{subItem}</Text>
                     </TouchableOpacity>
                     {isCustom && (
                        <TouchableOpacity onPress={() => removeCustomSubject(subItem)} style={{padding: 16}}>
                           <Text style={{fontSize: 16, color: '#ef4444'}}>🗑️</Text>
                        </TouchableOpacity>
                     )}
                   </View>
                 );
               })}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
