import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { scanScheduleImage } from '../lib/ai-scanner';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Modal, Keyboard } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ACADEMIC_YEARS, GRADES, TRACKS_ANADOLU, TRACKS_MESLEK, 
  MEB_MANDATORY_COURSES, MEB_MANDATORY_MESLEK_GENERIC, MEB_ELECTIVES 
} from '../constants/MebCurriculum';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const SUBJECTS = Array.from(new Set([
  'Türk Dili ve Edebiyatı', 'Matematik', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji',
  'Tarih', 'Coğrafya', 'Felsefe', 'Din Kültürü', 'İngilizce', 'İkinci Yabancı Dil',
  'Beden Eğitimi', 'Görsel Sanatlar', 'Müzik', 'Rehberlik', 'Etüt / Bireysel',
  ...MEB_ELECTIVES
]));

type GridRow = {
  id: string;
  start: string;
  end: string;
  days: string[]; // 0 to 6 mapping to Mon-Sun
};

const createEmptyGrid = (rowCount: number): GridRow[] => {
  return Array(rowCount).fill(null).map(() => ({
    id: Math.random().toString(36).substr(2, 9),
    start: '',
    end: '',
    days: ['', '', '', '', '', '', '']
  }));
};

const InlineDropdown = ({ label, value, options, onSelect }: any) => {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o:any) => o.value === value)?.label || '- Seçiniz -';
  
  return (
    <View className="mb-4 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm shadow-black/5">
      <TouchableOpacity activeOpacity={0.7} onPress={() => setOpen(!open)}>
         <Text className="text-[10px] font-extrabold text-gray-500 bg-gray-50 px-4 py-2 border-b border-gray-100 uppercase tracking-widest">{label}</Text>
         <View className="px-4 py-4 flex-row justify-between items-center bg-white">
            <Text className="font-extrabold text-indigo-700 text-base">{selectedLabel}</Text>
            <Text className="text-gray-400 text-xs">{open ? '▲' : '▼'}</Text>
         </View>
      </TouchableOpacity>
      
      {open && (
         <View className="max-h-48 bg-gray-50 border-t border-gray-100">
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
               {options.map((opt:any) => (
                  <TouchableOpacity 
                     key={opt.value} 
                     onPress={() => { onSelect(opt.value); setOpen(false); }}
                     className={`px-4 py-4 border-b border-gray-200 flex-row justify-between items-center ${value === opt.value ? 'bg-indigo-50' : 'bg-transparent'}`}
                  >
                     <Text className={`font-bold ${value === opt.value ? 'text-indigo-700' : 'text-gray-700'}`}>{opt.label}</Text>
                     {value === opt.value && <Text className="text-indigo-600">✓</Text>}
                  </TouchableOpacity>
               ))}
            </ScrollView>
         </View>
      )}
    </View>
  );
};

export default function ScheduleScreen({ navigation, route }: any) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [isAnadoluTrack, setIsAnadoluTrack] = useState(true);

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [pickerMeta, setPickerMeta] = useState<{type: string, rowIndex: number, field: 'start'|'end', date: Date} | null>(null);

  const [isSubjectPickerVisible, setSubjectPickerVisible] = useState(false);
  const [subjectPickerTargetType, setSubjectPickerTargetType] = useState<'grid'|'quota'>('grid');
  const [subjectPickerMeta, setSubjectPickerMeta] = useState<{type: string, rowIndex: number, dayIdx: number} | null>(null);
  const [quotaTargetMeta, setQuotaTargetMeta] = useState<{type: string, qId: string} | null>(null);
  const [floatingSubject, setFloatingSubject] = useState<{name: string, sourceGrid: string, sourceRow: number, sourceDay: number} | null>(null);
  const [lunchBreakIndex, setLunchBreakIndex] = useState<number>(4);
  const [lunchBreakDuration, setLunchBreakDuration] = useState<number>(50);
  
  const [customSubject, setCustomSubject] = useState('');
  const [savedCustomSubjects, setSavedCustomSubjects] = useState<string[]>([]);
  
  const allSubjects = [...SUBJECTS, ...savedCustomSubjects];

  useEffect(() => {
    const loadCustomSubjects = async () => {
      try {
        const stored = await AsyncStorage.getItem('@custom_subjects');
        if (stored) setSavedCustomSubjects(JSON.parse(stored));
      } catch (e) {}
    };
    loadCustomSubjects();
  }, []);

  const [schoolGrid, setSchoolGrid] = useState<GridRow[]>(createEmptyGrid(10));
  const [dershaneGrid, setDershaneGrid] = useState<GridRow[]>(createEmptyGrid(8));
  const [ozelDersGrid, setOzelDersGrid] = useState<GridRow[]>(createEmptyGrid(8));
  const [etutGrid, setEtutGrid] = useState<GridRow[]>(createEmptyGrid(8));

  // Quota Input States for Auto Distribution Builder
  const [schoolQuota, setSchoolQuota] = useState<{id: string, name: string, hours: string}[]>([]);
  const [dershaneQuota, setDershaneQuota] = useState<{id: string, name: string, hours: string}[]>([]);
  const [ozelDersQuota, setOzelDersQuota] = useState<{id: string, name: string, hours: string}[]>([]);
  const [etutQuota, setEtutQuota] = useState<{id: string, name: string, hours: string}[]>([]);

  // Okul Quota Security States
  const [isSchoolQuotaLocked, setIsSchoolQuotaLocked] = useState(false);
  const [unlockModalVisible, setUnlockModalVisible] = useState(false);
  const [unlockInput, setUnlockInput] = useState('');

  const passedStudentId = route.params?.studentId;

  // Onboarding Hooks
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [onboardYear, setOnboardYear] = useState(ACADEMIC_YEARS[3]);
  const [onboardGrade, setOnboardGrade] = useState('9');
  const [onboardTrack, setOnboardTrack] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleAutoPopulateCurriculum = async () => {
     let mappingKey = onboardGrade;
     if (onboardGrade === '11' || onboardGrade === '12') {
         if (isAnadoluTrack) {
            mappingKey = onboardTrack ? `${onboardGrade}_${onboardTrack}` : `${onboardGrade}_sayisal`;
         } else {
            mappingKey = 'meslek_generic';
         }
     }

     let mandatoryList = MEB_MANDATORY_COURSES[mappingKey];
     if (!mandatoryList && !isAnadoluTrack) {
        mandatoryList = MEB_MANDATORY_MESLEK_GENERIC;
     }

     const resolvedStudentId = passedStudentId || currentUserId;
     if (mandatoryList) {
        const generatedQuota = mandatoryList.map(item => ({
           id: Math.random().toString(36).substr(2, 9),
           name: item.name,
           hours: item.hours.toString()
        }));
        setSchoolQuota(generatedQuota);
        setIsSchoolQuotaLocked(true);
        if (resolvedStudentId) {
           await AsyncStorage.setItem(`@school_quota_${resolvedStudentId}`, JSON.stringify(generatedQuota));
        }
     }

     setShowOnboardingModal(false);
     if (resolvedStudentId) {
        await AsyncStorage.setItem(`@onboarded_schedule_${resolvedStudentId}`, 'true');
     }
  };

  const checkOnboardingStatus = async (sId: string, role: string) => {
     if (role !== 'student') return; // Only prompt onboarding if user is actual student
     try {
        const status = await AsyncStorage.getItem(`@onboarded_schedule_${sId}`);
        if (!status) setShowOnboardingModal(true);
     } catch (e) {}
  };

  const populateGrid = (allSchedules: any[], types: string[], rowCount: number, setGrid: any) => {
    const filtered = allSchedules.filter(s => types.includes(s.schedule_type));
    const rowMap = new Map<string, GridRow>();
    
    filtered.forEach(s => {
      const key = `${s.start_time.substring(0,5)}-${s.end_time.substring(0,5)}`;
      if (!rowMap.has(key)) {
        rowMap.set(key, {
          id: Math.random().toString(36).substr(2, 9),
          start: s.start_time.substring(0,5),
          end: s.end_time.substring(0,5),
          days: ['', '', '', '', '', '', '']
        });
      }
      const row = rowMap.get(key)!;
      row.days[s.day_of_week - 1] = s.title;
    });

    const rows = Array.from(rowMap.values());
    rows.sort((a, b) => a.start.localeCompare(b.start));
    
    while (rows.length < rowCount) {
      rows.push({
        id: Math.random().toString(36).substr(2, 9),
        start: '', end: '', days: ['', '', '', '', '', '', '']
      });
    }
    const finalGrid = rows.slice(0, Math.max(rows.length, rowCount));
    setGrid(finalGrid); 
    return finalGrid;
  }

  const hydrateQuotasFromSchedules = (schedules: any[]) => {
     const hQ = (types: string[], setQuota: any) => {
        const filtered = schedules.filter(s => types.includes(s.schedule_type));
        const summary: Record<string, number> = {};
        filtered.forEach(s => {
           const t = s.title.trim();
           if (t) summary[t] = (summary[t] || 0) + 1;
        });
        const qList = Object.keys(summary).map(key => ({
           id: Math.random().toString(36).substr(2, 9),
           name: key, hours: summary[key].toString()
        }));
        setQuota(qList);
     };
     hQ(['okul'], setSchoolQuota);
     hQ(['dersane'], setDershaneQuota);
     hQ(['ozel_ders', 'ozel'], setOzelDersQuota);
     hQ(['etut'], setEtutQuota);
  };

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      const role = profile?.role || 'student';
      setUserRole(role);

      let targetStudentId = user.id;
      if (role !== 'student' && passedStudentId) {
         targetStudentId = passedStudentId;
      }

      const { data: schedulesData, error } = await supabase
        .from('schedules').select('*').eq('student_id', targetStudentId);

      if (error) throw error;
      
      const schedules = schedulesData || [];
      populateGrid(schedules, ['okul'], 10, setSchoolGrid);
      populateGrid(schedules, ['dersane'], 8, setDershaneGrid);
      populateGrid(schedules, ['ozel_ders', 'ozel'], 8, setOzelDersGrid);
      populateGrid(schedules, ['etut'], 8, setEtutGrid);

      // Load quotas directly from storage preventing override resets
      try {
         const sq = await AsyncStorage.getItem(`@school_quota_${targetStudentId}`);
         if (sq) {
            const parsed = JSON.parse(sq);
            setSchoolQuota(parsed);
            if (parsed && parsed.length > 0) setIsSchoolQuotaLocked(true);
         } else hydrateQuotasFromSchedules(schedules); // fallback
      } catch(e) { hydrateQuotasFromSchedules(schedules); }

      checkOnboardingStatus(targetStudentId, role);

    } catch (error: any) {
      console.error('Error fetching schedules:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let targetStudentId = currentUserId;
      if (userRole !== 'student' && passedStudentId) {
        targetStudentId = passedStudentId;
      }

      const allSchedulesToInsert: any[] = [];

      const appendToInsert = (grid: GridRow[], type: string) => {
        grid.forEach((row, rowIdx) => {
          const h = (8 + rowIdx).toString().padStart(2, '0');
          const autoStart = `${h}:00:00`;
          const autoEnd = `${h}:40:00`;
          
          const startFormat = row.start ? (row.start.length === 5 ? `${row.start}:00` : row.start) : autoStart;
          const endFormat = row.end ? (row.end.length === 5 ? `${row.end}:00` : row.end) : autoEnd;
          
          row.days.forEach((title, idx) => {
            if (title.trim()) {
              allSchedulesToInsert.push({
                student_id: targetStudentId, creator_id: currentUserId,
                day_of_week: idx + 1, start_time: startFormat, end_time: endFormat,
                title: title.trim(), schedule_type: type,
              });
            }
          });
        });
      };

      appendToInsert(schoolGrid, 'okul');
      appendToInsert(dershaneGrid, 'dersane');
      appendToInsert(ozelDersGrid, 'ozel_ders');
      appendToInsert(etutGrid, 'etut');

      // First delete old ones for this student
      const { error: deleteError } = await supabase.from('schedules').delete().eq('student_id', targetStudentId);
      if (deleteError) throw deleteError;

      // Insert new ones
      if (allSchedulesToInsert.length > 0) {
        const { error: insertError } = await supabase.from('schedules').insert(allSchedulesToInsert);
        if (insertError) throw insertError;
      }
      
      await AsyncStorage.setItem(`@school_quota_${targetStudentId}`, JSON.stringify(schoolQuota));
      setIsSchoolQuotaLocked(true);

      Alert.alert('Başarılı', 'Ders programın başarıyla güncellendi!');
      
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePickImage = async (useCamera: boolean) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Gerekli', 'Kamerayı kullanabilmek için izin vermelisin.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.5 });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Gerekli', 'Galeriyi kullanabilmek için izin vermelisin.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.5 });
      }

      if (!result.canceled && result.assets && result.assets[0].base64) {
        setIsScanning(true);
        const parsedData = await scanScheduleImage(result.assets[0].base64);
        
        if (parsedData && parsedData.length > 0) {
          const r1 = populateGrid(parsedData, ['okul'], 10, setSchoolGrid);
          const r2 = populateGrid(parsedData, ['dersane'], 8, setDershaneGrid);
          const r3 = populateGrid(parsedData, ['ozel_ders', 'ozel'], 8, setOzelDersGrid);
          const r4 = populateGrid(parsedData, ['etut'], 8, setEtutGrid);
          
          hydrateQuotasFromSchedules(parsedData); // Auto sync wizard parameters upon scan injection

          Alert.alert('Harika!', 'Yapay zeka programı analiz edip tabloya yerleştirdi. Ekranda kontrol edip kaydedebilirsin.');
        } else {
          Alert.alert('Bulunamadı', 'Görselde anlaşılır bir ders programı bulunamadı.');
        }
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Görsel işlenirken bir sorun oluştu.');
    } finally {
      setIsScanning(false);
    }
  };

  const promptImagePicker = () => {
    Alert.alert('Fotoğraftan Tabloyu Doldur', 'Programın resmini yüklemek için bir yöntem seç:', [
      { text: 'Kamera', onPress: () => handlePickImage(true) },
      { text: 'Galeri', onPress: () => handlePickImage(false) },
      { text: 'İptal', style: 'cancel' }
    ]);
  };

  const showTimePicker = (type: string, rowIndex: number, field: 'start' | 'end', currentValue: string) => {
    let date = new Date();
    if (currentValue && currentValue.includes(':')) {
      const [hh, mm] = currentValue.split(':');
      date.setHours(parseInt(hh, 10));
      date.setMinutes(parseInt(mm, 10));
    } else {
      date.setHours(8, 0, 0, 0);
    }
    setPickerMeta({ type, rowIndex, field, date });
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmDate = (date: Date) => {
    if (pickerMeta) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`;
      updateCell(pickerMeta.type, pickerMeta.rowIndex, pickerMeta.field, formattedTime);
    }
    hideDatePicker();
  };

  const openSubjectPicker = (type: string, rowIndex: number, dayIdx: number) => {
    setSubjectPickerTargetType('grid');
    setSubjectPickerMeta({ type, rowIndex, dayIdx });
    setCustomSubject('');
    setSubjectPickerVisible(true);
  };

  const pickupSubject = (type: string, rowIdx: number, colIdx: number, currentText: string) => {
     if (!currentText || floatingSubject) return;
     setFloatingSubject({ name: currentText, sourceGrid: type, sourceRow: rowIdx, sourceDay: colIdx });
     updateCell(type, rowIdx, 'day', '', colIdx); 
  };

  const dropSubject = (type: string, rowIdx: number, colIdx: number, currentText: string) => {
     if (!floatingSubject) return;
     updateCell(type, rowIdx, 'day', floatingSubject.name, colIdx);
     if (currentText) {
         setFloatingSubject({ name: currentText, sourceGrid: type, sourceRow: rowIdx, sourceDay: colIdx });
     } else {
         setFloatingSubject(null);
     }
  };

  const cancelFloating = () => {
      if (!floatingSubject) return;
      updateCell(floatingSubject.sourceGrid, floatingSubject.sourceRow, 'day', floatingSubject.name, floatingSubject.sourceDay);
      setFloatingSubject(null);
  };

  const handleCellPress = (type: string, rowIdx: number, colIdx: number, currentText: string) => {
      if (floatingSubject) {
          dropSubject(type, rowIdx, colIdx, currentText);
      } else {
          openSubjectPicker(type, rowIdx, colIdx);
      }
  };

  const openSubjectPickerForQuota = (type: string, qId: string) => {
    setSubjectPickerTargetType('quota');
    setQuotaTargetMeta({ type, qId });
    setCustomSubject('');
    setSubjectPickerVisible(true);
  };

  const handleSelectSubject = (subjectTitle: string) => {
    if (subjectPickerTargetType === 'grid' && subjectPickerMeta) {
      updateCell(subjectPickerMeta.type, subjectPickerMeta.rowIndex, 'day', subjectTitle, subjectPickerMeta.dayIdx);
    } else if (subjectPickerTargetType === 'quota' && quotaTargetMeta) {
      updateQuotaCell(quotaTargetMeta.type, quotaTargetMeta.qId, 'name', subjectTitle);
    }
    setSubjectPickerVisible(false);
  };

  const updateQuotaCell = (quotaType: string, qId: string, field: string, value: string) => {
     const up = (qList: any[], setter: any) => setter(qList.map((q: any) => q.id === qId ? {...q, [field]: value} : q));
     if (quotaType === 'okul') up(schoolQuota, setSchoolQuota);
     else if (quotaType === 'dersane') up(dershaneQuota, setDershaneQuota);
     else if (quotaType === 'ozel_ders') up(ozelDersQuota, setOzelDersQuota);
     else if (quotaType === 'etut') up(etutQuota, setEtutQuota);
  };

  const removeQuotaRow = () => {
    if (!quotaTargetMeta) return;
    const { type, qId } = quotaTargetMeta;
    const up = (qList: any[], setter: any) => setter(qList.filter((q: any) => q.id !== qId));
    if (type === 'okul') up(schoolQuota, setSchoolQuota);
    else if (type === 'dersane') up(dershaneQuota, setDershaneQuota);
    else if (type === 'ozel_ders') up(ozelDersQuota, setOzelDersQuota);
    else if (type === 'etut') up(etutQuota, setEtutQuota);
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

  const updateCell = (gridType: string, rowIndex: number, field: 'start' | 'end' | 'day', value: string, dayIdx?: number) => {
    let targetGrid: GridRow[] = [];
    let setter: any;
    if (gridType === 'okul') { targetGrid = [...schoolGrid]; setter = setSchoolGrid; }
    else if (gridType === 'dersane') { targetGrid = [...dershaneGrid]; setter = setDershaneGrid; }
    else if (gridType === 'ozel_ders') { targetGrid = [...ozelDersGrid]; setter = setOzelDersGrid; }
    else if (gridType === 'etut') { targetGrid = [...etutGrid]; setter = setEtutGrid; }
    else return;

    if (field === 'start') {
        targetGrid[rowIndex].start = value;
        // MEB Akıllı Saat Dağıtımı Mola Uyarlamalı (40 Dk Ders, 10 Dk Teneffüs, Dinamik Öğle Arası)
        if (rowIndex === 0 && gridType === 'okul' && value.includes(':')) {
           Alert.alert(
              "Akıllı Saat Dağıtımı",
              `MEB şablonuna göre (40 dk ders, 10 dk teneffüs ve ${lunchBreakIndex + 1}. ders sonu ${lunchBreakDuration} dk öğle arası) geri kalan tüm hücre saatleri işlensin mi?`,
              [
                { text: "Manuel Gireceğim", style: "cancel" },
                { text: "Otomatik Doldur", onPress: () => {
                     let currentMins = parseInt(value.split(':')[0]) * 60 + parseInt(value.split(':')[1]);
                     const newGrid = [...targetGrid];
                     for (let i = 0; i < newGrid.length; i++) {
                         let startMins = currentMins;
                         let endMins = currentMins + 40;
                         const sh = Math.floor(startMins / 60).toString().padStart(2, '0');
                         const sm = (startMins % 60).toString().padStart(2, '0');
                         const eh = Math.floor(endMins / 60).toString().padStart(2, '0');
                         const em = (endMins % 60).toString().padStart(2, '0');
                         newGrid[i].start = `${sh}:${sm}`;
                         newGrid[i].end = `${eh}:${em}`;
                         currentMins = endMins + (i === lunchBreakIndex ? lunchBreakDuration : 10);
                     }
                     setter(newGrid);
                  }
                }
              ]
           );
        }
    }
    else if (field === 'end') targetGrid[rowIndex].end = value;
    else if (field === 'day' && dayIdx !== undefined) targetGrid[rowIndex].days[dayIdx] = value;
    setter(targetGrid);
  };

  const clearGrid = (type: string) => {
    Alert.alert(
      "Programı Temizle",
      "Bu tablodaki tüm dersler silinecek. Onaylıyor musun?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive", 
          onPress: () => {
             const newGrid = createEmptyGrid(type === 'okul' ? 10 : 8);
             if (type === 'okul') setSchoolGrid(newGrid);
             else if (type === 'dersane') setDershaneGrid(newGrid);
             else if (type === 'ozel_ders') setOzelDersGrid(newGrid);
             else if (type === 'etut') setEtutGrid(newGrid);
             setSubjectPickerVisible(false);
          }
        }
      ]
    );
  };

  const clearQuota = (type: string) => {
     let setter: any;
     if (type === 'okul') setter = setSchoolQuota;
     else if (type === 'dersane') setter = setDershaneQuota;
     else if (type === 'ozel_ders') setter = setOzelDersQuota;
     else if (type === 'etut') setter = setEtutQuota;
     else return;

     Alert.alert(
        "Kontenjanları Temizle",
        "Bu liste tamamen silinecek. Onaylıyor musun?",
        [
           { text: "İptal", style: "cancel" },
           { text: "Sil", style: "destructive", onPress: () => { setter([]); setSubjectPickerVisible(false); } }
        ]
     );
  };

  const handleDistribute = (type: string, quota: any[], grid: GridRow[], setGrid: any, isOkul: boolean = false) => {
     const newGrid = [...grid];
     newGrid.forEach(row => row.days = ['', '', '', '', '', '', '']); // clear cells
     
     const maxDays = isOkul ? 5 : 7;
     const maxHoursPerDay = isOkul ? 8 : grid.length;

     let bag: string[] = [];
     quota.forEach(q => {
        const hs = parseInt(q.hours) || 0;
        for(let i=0; i<hs; i++) bag.push(q.name.trim());
     });

     let bIdx = 0;
     for(let rowIdx = 0; rowIdx < maxHoursPerDay; rowIdx++) {
         for(let dayIdx = 0; dayIdx < maxDays; dayIdx++) {
             if (rowIdx < newGrid.length && bIdx < bag.length) {
                 newGrid[rowIdx].days[dayIdx] = bag[bIdx];
                 bIdx++;
             }
         }
     }
     
     if (bIdx < bag.length) {
         Alert.alert('Dikkat', `Program kapasitesi doldu! Kalan ${bag.length - bIdx} saatlik ders tabloya sığmadı.`);
     } else {
         Alert.alert('Tamamlandı', 'Dersler programa otomatik olarak dağıtıldı!');
     }
     setGrid(newGrid);
  };

  const renderScheduleTable = ({ title, data, type, icon, colorClass, bgColorClass }: any) => {
    return (
      <View className="mb-10">
        <View className="flex-row items-center justify-between mb-2 px-6">
          <View className="flex-row items-center flex-1">
            <View className={`w-10 h-10 rounded-full items-center justify-center ${bgColorClass} mr-3`}>
              <Text className="text-xl">{icon}</Text>
            </View>
            <Text className={`text-2xl font-black ${colorClass}`} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
          </View>
        </View>

        {type === 'okul' && (
          <View className="flex-row px-6 mb-4 mt-1">
            <View className="flex-row bg-amber-50 rounded-xl border border-amber-100/80 overflow-hidden shadow-sm">
               <TouchableOpacity 
                  onPress={() => setLunchBreakIndex(prev => prev >= 7 ? 3 : prev + 1)} 
                  className="px-3 py-2 border-r border-amber-100/80 items-center justify-center active:bg-amber-100"
               >
                  <Text className="text-[11px] font-black text-amber-600 uppercase">🍔 Öğle Arası: {lunchBreakIndex + 1}. Ders</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                  onPress={() => setLunchBreakDuration(prev => prev >= 90 ? 30 : prev + 5)}
                  className="px-3 py-2 items-center justify-center active:bg-amber-100"
               >
                  <Text className="text-[11px] font-black text-amber-500 uppercase">⏱️ Süre: {lunchBreakDuration} dk</Text>
               </TouchableOpacity>
            </View>
          </View>
        )}

        <View className="border-y border-gray-200 bg-white shadow-sm flex-row">
          
          {/* Sabit Sol Sütun (Sıra + Saatler) */}
          <View className="w-28 border-r border-gray-200 bg-gray-50/50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
            {/* Header */}
            <View className="h-12 flex-row border-b border-gray-200 bg-gray-100">
               <View className="w-8 justify-center items-center border-r border-gray-200/50">
                  <Text className="font-bold text-gray-500 text-[10px]">NO</Text>
               </View>
               <View className="flex-1 justify-center items-center">
                  <Text className="font-bold text-gray-700 text-xs">SAAT</Text>
               </View>
            </View>
            
            {/* Rows */}
            {data.map((row: GridRow, idx: number) => (
              <View key={`time-col-${row.id}`}>
                <View className="h-20 flex-row border-b border-gray-100">
                  {/* Sıra Numarası */}
                  <View className="w-8 justify-center items-center bg-gray-100/30 border-r border-gray-100/50">
                     <Text className="font-black text-gray-400 text-base">{idx + 1}</Text>
                  </View>

                  {/* Saat Seçiciler */}
                  <View className="flex-1 justify-center items-center p-1 px-1.5">
                    <TouchableOpacity 
                      onPress={() => showTimePicker(type, idx, 'start', row.start)}
                      className="bg-white border border-gray-200 rounded-md w-full p-1 mb-1 items-center justify-center flex-1"
                    >
                      <Text className={`text-xs font-bold ${row.start ? 'text-gray-800' : 'text-gray-300'}`}>
                        {row.start || "Bşl"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => showTimePicker(type, idx, 'end', row.end)}
                      className="bg-white border border-gray-200 rounded-md w-full p-1 flex items-center justify-center flex-1"
                    >
                      <Text className={`text-xs font-bold ${row.end ? 'text-gray-500' : 'text-gray-300'}`}>
                        {row.end || "Bit"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Dinamik Öğle Arası (Sol Taraftaki Saat Kutusu) */}
                {(type === 'okul' && idx === lunchBreakIndex) && (
                  <View className="h-8 bg-amber-50 justify-center items-center border-b border-amber-100">
                     <Text className="text-[9px] font-black text-amber-500 tracking-wider">MOLA</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Sağa Kaydırılabilir Günler Sütunları */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
            <View>
              {/* Header Row */}
              <View className="flex-row h-12 border-b border-gray-200 bg-white">
                {DAYS.map((day, idx) => (
                  <View key={`header-${idx}`} className={`w-32 justify-center items-center border-r border-gray-100 ${idx === 5 || idx === 6 ? 'bg-orange-50/30' : ''}`}>
                    <Text className="font-bold text-gray-700 text-sm">{day}</Text>
                  </View>
                ))}
              </View>

              {/* Data Rows */}
              {data.map((row: GridRow, rowIdx: number) => (
                <View key={`row-col-${row.id}`}>
                  <View className="flex-row h-20 border-b border-gray-100">
                    {row.days.map((cellText, colIdx) => (
                      <View key={`cell-${rowIdx}-${colIdx}`} className={`w-32 p-1.5 justify-center border-r border-gray-100 ${colIdx === 5 || colIdx === 6 ? 'bg-orange-50/30' : ''}`}>
                        <TouchableOpacity
                          onPress={() => handleCellPress(type, rowIdx, colIdx, cellText)}
                          onLongPress={() => pickupSubject(type, rowIdx, colIdx, cellText)}
                          delayLongPress={300}
                          className={`flex-1 rounded-xl p-2 justify-center border ${floatingSubject ? (cellText ? 'bg-indigo-50 border-orange-200 border-dashed' : 'bg-orange-50/50 border-orange-400 border-dashed') : (cellText ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50/50 border-transparent')}`}
                        >
                          <Text 
                            className={`text-center text-sm font-semibold ${cellText ? 'text-indigo-900' : 'text-gray-400'}`}
                            numberOfLines={2}
                            adjustsFontSizeToFit
                          >
                            {cellText || (floatingSubject ? "Buraya Bırak" : "Ders Seç")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  
                  {/* Dinamik Öğle Arası (Sağ Taraftaki Tablo Üzerinden Geçen Şerit) */}
                  {(type === 'okul' && rowIdx === lunchBreakIndex) && (
                    <View className="h-8 bg-amber-50/50 flex-row border-b border-amber-100 items-center pl-8">
                       <Text className="text-[11px] font-black text-amber-500 uppercase tracking-widest">🍱 {lunchBreakDuration} Dakika Öğle Arası (Beslenme ve Dinlenme Molası) 🍔</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>

        </View>
      </View>
    );
  };

  const renderQuotaList = (type: string, grid: GridRow[], setGrid: any, quota: any[], setQuota: any, title: string, cardBg: string, titleColor: string, isOkul?: boolean) => {
    const handleUpdate = (id: string, field: string, value: string) => updateQuotaCell(type, id, field, value);
    const handleAdd = () => setQuota([...quota, { id: Math.random().toString(), name: '', hours: '2' }]);

    return (
      <View className="mb-6 px-6">
        <View className={`p-5 rounded-3xl border shadow-sm ${cardBg}`}>
           <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                 <Text className={`text-lg font-extrabold ${titleColor}`}>{title}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDistribute(type, quota, grid, setGrid, isOkul)} className="bg-indigo-600 px-3 py-2 rounded-xl shadow-sm">
                <Text className="text-white font-extrabold text-xs">✨ Dağıt</Text>
              </TouchableOpacity>
           </View>
           {isOkul && <Text className="text-gray-500 font-medium mb-4 text-[11px] leading-5">Bilgi: Program tablosu hafta içi 5 gün üzerinden maksimum 40 saatlik (5gün x 8saat) boş hücre destekler. Oluşturduğunuz kota listesi hücrelere sırasıyla yerleştirilir.</Text>}
           
           {/* IF UNLOCKED, show warning */}
           {(isOkul && !isSchoolQuotaLocked) && (
              <View className="mb-4 bg-orange-50 border border-orange-200 p-3 rounded-xl flex-row items-center shadow-sm shadow-orange-50/50">
                <Text className="text-xl mr-2">⚠️</Text>
                <Text className="text-[10px] flex-1 font-bold text-orange-800 leading-4">DİKKAT: Programı kaydettiğinizde bu liste Notlar sayfasıyla eşleşecek ve sonradan kolayca değiştirilememesi için <Text className="font-extrabold text-orange-900 underline">kilitlenecektir</Text>.</Text>
              </View>
           )}

           {quota.length === 0 ? (
             <Text className="text-gray-400 font-semibold italic text-xs py-2">Henüz ders saati yapılandırmadınız.</Text>
           ) : (
             <View className="flex-col">
               {quota.map((q: any) => (
                 <View key={q.id} className={`flex-row items-center mb-2 px-3 py-2 rounded-xl border shadow-sm ${isOkul && isSchoolQuotaLocked ? 'bg-gray-50 border-gray-200 opacity-80' : 'bg-white border-gray-100 shadow-gray-50'}`}>
                    <TouchableOpacity disabled={isOkul && isSchoolQuotaLocked} onPress={() => openSubjectPickerForQuota(type, q.id)} className="flex-1 pr-2">
                       <Text className={`font-bold text-[11px] ${q.name ? 'text-gray-800' : 'text-gray-400'}`} numberOfLines={2}>
                           {q.name || "Ders Seç (Satıra tıkla)"}
                       </Text>
                    </TouchableOpacity>
                    
                    <View className={`flex-row items-center border rounded-xl h-9 px-1 ${isOkul && isSchoolQuotaLocked ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-200'}`}>
                       <TextInput 
                          editable={!(isOkul && isSchoolQuotaLocked)}
                          value={q.hours} onChangeText={(v) => handleUpdate(q.id, 'hours', v)}
                          keyboardType="numeric" maxLength={2} className={`w-10 text-center font-black h-full text-base ${isOkul && isSchoolQuotaLocked ? 'text-gray-500' : 'text-indigo-700'}`}
                       />
                       <Text className="text-[10px] text-gray-500 font-extrabold pr-2 pl-1">Saat</Text>
                    </View>
                 </View>
               ))}
             </View>
           )}
           
           {/* Render ADD button ONLY if NOT locked */}
           {!(isOkul && isSchoolQuotaLocked) && (
               <TouchableOpacity onPress={handleAdd} className="mt-2 py-3 border-2 border-dashed border-indigo-200 rounded-xl items-center bg-indigo-50/50 active:bg-indigo-100">
                  <Text className="text-indigo-600 font-extrabold text-xs">+ Yeni Ders Kotası Ekle</Text>
               </TouchableOpacity>
           )}

           {/* IF LOCKED, show the lock widget (below the list) */}
           {(isOkul && isSchoolQuotaLocked) && (
             <View className="items-center mt-4 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-50">
                <Text className="text-3xl mb-2">🔒</Text>
                <Text className="text-gray-800 font-extrabold text-sm mb-1 text-center px-4">Liste Kullanıma Açık, Ancak Düzenlemeye Kilitli</Text>
                <Text className="text-gray-500 font-medium text-[11px] text-center px-6 leading-5 mb-4">
                   Okul programı saatleri "Notlar" (Grades) modülü ile doğrudan senkronizedir. Saatlerde oynama yapmak önceden girdiğiniz not yapılandırmalarını bozabilir.
                </Text>
                <TouchableOpacity onPress={() => setUnlockModalVisible(true)} className="bg-gray-100 border border-gray-200 px-6 py-2.5 rounded-xl active:bg-gray-200">
                    <Text className="text-gray-700 font-black text-xs">Kilidi Aç ve Düzenle</Text>
                </TouchableOpacity>
             </View>
           )}
           
           <View className="mt-4 pt-4 border-t border-gray-200/60 flex-row justify-between items-center">
              <Text className="font-extrabold text-gray-600 text-xs">Haftalık Toplam Ders Kontenjanı:</Text>
              <View className="bg-gray-800 px-3 py-1.5 rounded-lg shadow-sm">
                 <Text className="font-black text-white text-[11px]">{quota.reduce((acc: number, q: any) => acc + (parseInt(q.hours) || 0), 0)} Saat</Text>
              </View>
           </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white shadow-sm z-10 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full mr-3">
          <Text className="text-lg">🔙</Text>
        </TouchableOpacity>
        <Text className="text-lg flex-1 font-extrabold text-gray-800" numberOfLines={1}>Sınıf Listem & Program</Text>
        
        <View className="flex-row items-center">
          <TouchableOpacity onPress={promptImagePicker} className="items-center justify-center w-10 h-10 bg-gray-100 rounded-full active:bg-gray-200 mr-2">
            <Text className="text-xl">🤖</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleSave} 
            disabled={isSaving || isLoading} 
            className={`items-center justify-center w-10 h-10 rounded-full shadow-sm ${isSaving ? 'bg-indigo-300' : 'bg-indigo-600'}`}
          >
            {isSaving ? <ActivityIndicator color="white" size="small" /> : <Text className="text-lg">💾</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {floatingSubject && (
        <View className="absolute top-[85px] left-4 right-4 bg-orange-500 rounded-3xl shadow-2xl p-4 px-6 flex-row justify-between items-center z-50 shadow-orange-500/50">
          <Text className="text-white font-extrabold text-sm flex-1 leading-5">
            📦 "{floatingSubject.name}" dersi havada!{"\n"}Yerine koymak istediğin kutuya tıkla.
          </Text>
          <TouchableOpacity onPress={cancelFloating} className="bg-white/20 px-4 py-3 rounded-xl ml-3 border border-white/30">
             <Text className="text-white font-black text-xs">Vazgeç</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-gray-500 mt-4 font-bold">Program Yükleniyor...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 pt-6" contentContainerStyle={{ paddingBottom: 150 }}>
          
          {renderScheduleTable({ title: "Okul Programı", data: schoolGrid, type: "okul", icon: "🏫", colorClass: "text-blue-900", bgColorClass: "bg-blue-100" })}
          {renderScheduleTable({ title: "Dershane Programı", data: dershaneGrid, type: "dersane", icon: "🏢", colorClass: "text-amber-900", bgColorClass: "bg-amber-100" })}
          {renderScheduleTable({ title: "Özel Öğretmen Dersleri", data: ozelDersGrid, type: "ozel_ders", icon: "👨‍🏫", colorClass: "text-emerald-900", bgColorClass: "bg-emerald-100" })}
          {renderScheduleTable({ title: "Etüt Dersleri", data: etutGrid, type: "etut", icon: "📚", colorClass: "text-purple-900", bgColorClass: "bg-purple-100" })}
          
          <View className="mb-4 mt-6 items-center">
             <Text className="text-gray-400 font-extrabold uppercase tracking-widest text-xs">- PROGRAM AKILLI DAĞITIM ASİSTANI -</Text>
          </View>

          {renderQuotaList('okul', schoolGrid, setSchoolGrid, schoolQuota, setSchoolQuota, "Okul Programı Saatleri", "bg-blue-50 border-blue-100", "text-blue-900", true)}
          {renderQuotaList('dersane', dershaneGrid, setDershaneGrid, dershaneQuota, setDershaneQuota, "Dershane Saatleri", "bg-amber-50 border-amber-100", "text-amber-900")}
          {renderQuotaList('ozel_ders', ozelDersGrid, setOzelDersGrid, ozelDersQuota, setOzelDersQuota, "Özel Öğretmen Saatleri", "bg-emerald-50 border-emerald-100", "text-emerald-900")}
          {renderQuotaList('etut', etutGrid, setEtutGrid, etutQuota, setEtutQuota, "Etüt Saatleri", "bg-purple-50 border-purple-100", "text-purple-900")}
          
        </ScrollView>
      )}

      {/* Floating Save Button Removed by User Request */}

      {/* Global Loading Overlay for AI */}
      {isScanning && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center z-50">
          <View className="bg-white p-8 rounded-3xl items-center shadow-2xl">
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text className="text-indigo-600 font-bold text-lg mt-4">Yapay Zeka Analiz Ediyor...</Text>
            <Text className="text-gray-500 text-sm mt-2 text-center">Bu işlem birkaç saniye sürebilir,{'\n'}lütfen bekle.</Text>
          </View>
        </View>
      )}

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="time"
        date={pickerMeta?.date || new Date()}
        onConfirm={handleConfirmDate}
        onCancel={hideDatePicker}
        cancelTextIOS="İptal"
        confirmTextIOS="Onayla"
        minuteInterval={5}
        is24Hour={true}
        display="spinner"
      />

      {/* Subject Picker Modal */}
      <Modal visible={isSubjectPickerVisible} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl h-[80%] p-6 pt-5 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-extrabold text-gray-800">Ders Seçin</Text>
              <TouchableOpacity onPress={() => setSubjectPickerVisible(false)} className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                <Text className="text-lg">❌</Text>
              </TouchableOpacity>
            </View>
            
            {/* Custom Subject Input */}
            <View className="flex-row items-center border border-gray-200 rounded-2xl px-4 py-2 mb-6 bg-gray-50 shadow-sm">
               <TextInput 
                  placeholder="Listede yoksa buraya yazın..." 
                  className="flex-1 font-bold text-gray-700 h-12 text-base" 
                  value={customSubject}
                  onChangeText={setCustomSubject}
               />
               <TouchableOpacity 
                 disabled={!customSubject.trim()} 
                 onPress={submitCustomSubject} 
                 className={`ml-2 px-5 py-3 rounded-xl ${customSubject.trim() ? 'bg-indigo-600' : 'bg-gray-300'}`}
               >
                  <Text className="text-white font-extrabold">Ekle</Text>
               </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
               {subjectPickerTargetType === 'grid' && subjectPickerMeta && (
                 <>
                   <TouchableOpacity onPress={() => handleSelectSubject('')} className="py-4 border-b border-gray-100 mb-2 flex-row justify-between items-center bg-orange-50 px-4 rounded-2xl">
                      <Text className="text-orange-600 font-extrabold text-lg">🗑️ Sadece Hücreyi Temizle</Text>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => clearGrid(subjectPickerMeta.type)} className="py-4 border-b border-gray-100 mb-2 flex-row justify-between items-center bg-red-100 px-4 rounded-2xl border border-red-200">
                      <Text className="text-red-600 font-black text-lg">⚠️ Tüm Tabloyu Sıfırla</Text>
                   </TouchableOpacity>
                 </>
               )}
               {subjectPickerTargetType === 'quota' && quotaTargetMeta && (
                 <>
                   <TouchableOpacity onPress={removeQuotaRow} className="py-4 border-b border-gray-100 mb-2 flex-row justify-between items-center bg-orange-50 px-4 rounded-2xl border border-orange-200 shadow-sm">
                      <Text className="text-orange-600 font-extrabold text-lg">🗑️ Bu Dersi Listeden Sil</Text>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => clearQuota(quotaTargetMeta.type)} className="py-4 border-b border-gray-100 mb-2 flex-row justify-between items-center bg-red-100 px-4 rounded-2xl border border-red-200 shadow-sm">
                      <Text className="text-red-600 font-black text-lg">⚠️ Tüm Listeyi Sıfırla</Text>
                   </TouchableOpacity>
                 </>
               )}
               
               <Text className="text-gray-400 font-bold mb-2 mt-4 ml-2">TÜM DERSLER {savedCustomSubjects.length > 0 && "(Özel Dersler Dahil)"}</Text>
               {allSubjects.map((subItem, idx) => {
                 const isCustom = savedCustomSubjects.includes(subItem);
                 return (
                   <View key={idx} className="border-b border-gray-100 flex-row items-center bg-white">
                     <TouchableOpacity 
                        className="flex-1 py-4 px-2 active:bg-gray-50"
                        onPress={() => handleSelectSubject(subItem)}
                     >
                        <Text className="text-gray-800 font-extrabold text-lg">{subItem}</Text>
                     </TouchableOpacity>
                     {isCustom && (
                        <TouchableOpacity onPress={() => removeCustomSubject(subItem)} className="p-4 bg-red-50 rounded-l-xl">
                           <Text className="text-base text-red-500">🗑️ Sil</Text>
                        </TouchableOpacity>
                     )}
                   </View>
                 );
               })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Unlock Security Modal */}
      <Modal visible={unlockModalVisible} animationType="fade" transparent={true}>
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white rounded-3xl p-6 shadow-2xl w-full">
            <View className="items-center mb-4">
              <Text className="text-5xl mb-2">⚠️</Text>
              <Text className="text-xl font-black text-red-600 text-center mb-2">DİKKAT!</Text>
              <Text className="text-gray-600 text-sm font-medium text-center leading-5 px-2">
                 Okul saatlerinde yapacağınız değişiklikler Notlar sayfanızdaki ders saatlerini <Text className="font-extrabold text-red-500">ve girilmiş olabilen not sınırlarını</Text> değiştirebilir/etkileyebilir.
              </Text>
            </View>
            
            <View className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6">
              <Text className="text-xs text-red-800 font-bold mb-2 text-center">İşleme devam etmek için kutuya büyük harflerle:</Text>
              <Text className="text-sm font-black text-red-600 text-center mb-3 tracking-widest">"ONAYLIYORUM"</Text>
              <TextInput
                 className="bg-white border text-center font-extrabold text-gray-800 tracking-widest h-12 border-red-200 rounded-lg text-base"
                 placeholder="ONAYLIYORUM"
                 value={unlockInput}
                 onChangeText={setUnlockInput}
                 autoCapitalize="characters"
              />
            </View>
            
            <View className="flex-row space-x-3">
              <TouchableOpacity onPress={() => { setUnlockModalVisible(false); setUnlockInput(''); }} className="flex-1 bg-gray-100 py-3 rounded-xl border border-gray-200 active:bg-gray-200 pl-4">
                 <Text className="text-gray-600 font-black text-center text-sm">Vazgeç</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                disabled={unlockInput !== 'ONAYLIYORUM'}
                onPress={() => {
                   setIsSchoolQuotaLocked(false);
                   setUnlockModalVisible(false);
                   setUnlockInput('');
                }} 
                className={`flex-1 py-3 rounded-xl shadow-sm ${unlockInput === 'ONAYLIYORUM' ? 'bg-red-600' : 'bg-red-300'}`}
              >
                 <Text className="text-white font-black text-center text-sm">Kilidi Aç</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Onboarding Curriculum Automation Modal */}
      <Modal visible={showOnboardingModal} animationType="slide" transparent={true}>
        <View className="flex-1 justify-center items-center bg-black/60 px-4">
          <View className="bg-white rounded-3xl p-6 shadow-2xl w-full max-h-[85%]">
             <View className="items-center mb-6">
                <Text className="text-4xl mb-2">🏫</Text>
                <Text className="text-xl font-black text-indigo-900 text-center mb-2">Okul Programı Sihirbazı</Text>
                <Text className="text-gray-500 text-xs font-medium text-center">MEB müfredatına uygun ders saatlerinizi otomatik olarak oluşturmak için lütfen sınıf çeşidinizi seçin.</Text>
             </View>

             <ScrollView showsVerticalScrollIndicator={false} className="w-full">
                <InlineDropdown 
                   label="Öğretim Yılı"
                   value={onboardYear}
                   options={ACADEMIC_YEARS.map(y => ({ label: y, value: y }))}
                   onSelect={setOnboardYear}
                />

                <InlineDropdown 
                   label="Kaçıncı Sınıfsın?"
                   value={onboardGrade}
                   options={GRADES.map(g => ({ label: g.label, value: g.id }))}
                   onSelect={setOnboardGrade}
                />

                {(onboardGrade === '11' || onboardGrade === '12') && (
                   <>
                      <InlineDropdown 
                         label="Okul Türün Nedir?"
                         value={isAnadoluTrack ? 'anadolu' : 'meslek'}
                         options={[
                           { label: 'Anadolu / Genel Lise', value: 'anadolu' },
                           { label: 'Mesleki / Teknik Lise', value: 'meslek' }
                         ]}
                         onSelect={(v: string) => setIsAnadoluTrack(v === 'anadolu')}
                      />

                      {isAnadoluTrack ? (
                         <InlineDropdown 
                            label="Hangi Alandasın?"
                            value={onboardTrack}
                            options={[
                               { label: '- Alan Seçiniz -', value: '' },
                               ...TRACKS_ANADOLU.map(t => ({ label: t.label, value: t.id }))
                            ]}
                            onSelect={setOnboardTrack}
                         />
                      ) : (
                         <View className="mb-4 bg-orange-50 border border-orange-100 p-3 rounded-xl">
                            <Text className="text-orange-800 text-xs font-bold mb-1">Meslek Lisesi Bilgisi</Text>
                            <Text className="text-orange-600 text-[10px] leading-4">Meslek liselerinde MEB ortak zorunlu dersleri otomatik atanacaktır. Kendi meslek alanına (Bilişim, Sağlık, vb.) ait "Mesleki Uygulama" saatlerini programı oluşturduktan sonra Düzenle menüsünden ekleyebilirsin.</Text>
                         </View>
                      )}
                   </>
                )}
             </ScrollView>

             <TouchableOpacity onPress={handleAutoPopulateCurriculum} className="w-full bg-indigo-600 py-4 rounded-xl items-center shadow-lg shadow-indigo-200 mt-4">
                <Text className="text-white font-black text-base">Zorunlu MEB Saatlerimi Yükle</Text>
             </TouchableOpacity>
             <TouchableOpacity onPress={() => setShowOnboardingModal(false)} className="w-full py-3 mt-2 rounded-xl items-center">
                <Text className="text-gray-400 font-bold text-sm">İptal Et (Ben Kendim Yazacağım)</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
