import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// Configure Locales for Turkish
LocaleConfig.locales['tr'] = {
  monthNames: ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'],
  monthNamesShort: ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'],
  dayNames: ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'],
  dayNamesShort: ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'],
  today: 'Bugün'
};
LocaleConfig.defaultLocale = 'tr';

const getCalendarMarks = (selectedDate: Date, holidays: string[]) => {
  const marks: any = {};
  const year = selectedDate.getFullYear();
  [year - 1, year, year + 1].forEach(y => {
     for (let m = 0; m < 12; m++) {
        const dInM = new Date(y, m + 1, 0).getDate();
        for (let d = 1; d <= dInM; d++) {
           const dt = new Date(y, m, d);
           const dayOfWeek = dt.getDay();
           const dd = d.toString().padStart(2, '0');
           const mm = (m + 1).toString().padStart(2, '0');
           const dStr = `${y}-${mm}-${dd}`;
           const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
           const isHoliday = holidays.includes(`${dd}-${mm}`);
           if (isWeekend || isHoliday) {
              marks[dStr] = { disabled: true, disableTouchEvent: true, disabledTextColor: '#f87171' };
           }
        }
     }
  });
  const selMM = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
  const selDD = selectedDate.getDate().toString().padStart(2, '0');
  const selStr = `${selectedDate.getFullYear()}-${selMM}-${selDD}`;
  marks[selStr] = { ...marks[selStr], selected: true, selectedColor: '#4f46e5', selectedTextColor: '#ffffff' };
  return marks;
};
const STATUS_OPTIONS = [
  { id: 'yok', label: '❌ Mazeretsiz (Yok Yazıldı)', type: 'mazeretsiz', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  { id: 'gec', label: '⏱️ Geç Kaldı (Kurul/Yok Sayılır)', type: 'mazeretsiz', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'rapor', label: '📄 Raporlu (Mazeretli)', type: 'mazeretli', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'izin', label: '👨‍👩‍👧 Veli İzinli (Mazeretli)', type: 'mazeretli', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  { id: 'faaliyet', label: '🏀 Okul Faaliyeti (Yok Sayılmaz)', type: 'present', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
];

export function AttendanceScreen({ navigation, route }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isFormVisible, setFormVisible] = useState(false);
  
  // Form State
  const [formDate, setFormDate] = useState<Date>(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [formStatus, setFormStatus] = useState<string>('yok'); // default
  const [formScope, setFormScope] = useState<'tam_gun'|'yarim_gun'|'belirli'>('tam_gun');
  const [selectedPeriods, setSelectedPeriods] = useState<number[]>([]);

  const [resolvedUserId, setResolvedUserId] = useState<string>('default');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let uId = user?.id || 'default';
      if (route.params?.studentId) uId = route.params.studentId;
      setResolvedUserId(uId);

      const stored = await AsyncStorage.getItem(`@att_logs_${uId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.sort((a: any, b: any) => b.dateObj - a.dateObj); // newest first
        setLogs(parsed);
      }
    } catch (e) {}
  };

  const saveLogs = async (newLogs: any[]) => {
    try {
      await AsyncStorage.setItem(`@att_logs_${resolvedUserId}`, JSON.stringify(newLogs));
      setLogs(newLogs);
    } catch (e) {}
  };

  const OFFICIAL_HOLIDAYS = [
    '01-01', // Yılbaşı
    '23-04', // Ulusal Egemenlik ve Çocuk Bayramı
    '01-05', // Emek ve Dayanışma Günü
    '19-05', // Atatürk'ü Anma, Gençlik ve Spor Bayramı
    '15-07', // Demokrasi ve Milli Birlik Günü
    '30-08', // Zafer Bayramı
    '29-10', // Cumhuriyet Bayramı
  ];

  const SCHOOL_BREAKS = [
    { start: '2025-06-21', end: '2025-09-07', name: 'Yaz Tatili' },
    { start: '2025-11-10', end: '2025-11-14', name: '1. Dönem Ara Tatili' },
    { start: '2026-01-19', end: '2026-01-30', name: 'Yarıyıl (15) Tatili' },
    { start: '2026-04-13', end: '2026-04-17', name: '2. Dönem Ara Tatili' },
    { start: '2026-06-19', end: '2026-09-12', name: 'Yaz Tatili' },
    { start: '2026-11-16', end: '2026-11-20', name: '1. Dönem Ara Tatili' },
    { start: '2027-01-25', end: '2027-02-05', name: 'Yarıyıl (15) Tatili' },
    { start: '2027-04-12', end: '2027-04-16', name: '2. Dönem Ara Tatili' },
  ];

  const handleSaveForm = () => {
    // 1. Hafta Sonu Kontrolü
    const dayOfWeek = formDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      Alert.alert('Geçersiz Tarih', 'Hafta sonu (Cumartesi/Pazar) için devamsızlık girilemez.');
      return;
    }

    // 2. Resmi Tatil Kontrolü
    const dd = formDate.getDate().toString().padStart(2, '0');
    const mm = (formDate.getMonth() + 1).toString().padStart(2, '0');
    if (OFFICIAL_HOLIDAYS.includes(`${dd}-${mm}`)) {
      Alert.alert('Resmi Tatil', 'Seçilen tarih bir resmi tatil günüdür (MEB Tatili). Devamsızlık girilemez.');
      return;
    }

    // 3. Okul Tatilleri Kontrolü (Yaz, Yarıyıl, Ara Tatiller)
    const dateToCheck = formDate.getTime();
    let isBreak = false;
    let breakName = '';

    for (let b of SCHOOL_BREAKS) {
      const sDate = new Date(b.start).getTime();
      const eDate = new Date(b.end).getTime() + (24 * 60 * 60 * 1000) - 1; // End of day
      if (dateToCheck >= sDate && dateToCheck <= eDate) {
        isBreak = true;
        breakName = b.name;
        break;
      }
    }

    if (isBreak) {
      Alert.alert('Eğitim Dışı Dönem', `Seçilen tarih planlı ${breakName} dönemine denk gelmektedir. Bu tarihe devamsızlık girilemez.`);
      return;
    }

    if (formScope === 'belirli' && selectedPeriods.length === 0) {
      Alert.alert('Hata', 'Lütfen en az bir ders saati seçin.');
      return;
    }

    const newDateStr = formDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });

    // 3. Mükerrer / Çakışma Kontrolü
    const sameDateLogs = logs.filter(l => l.dateStr === newDateStr);
    let hasConflict = false;

    sameDateLogs.forEach(existing => {
      // Birbiriyle tamamen veya kısmen çakışan durumlar:
      if (existing.scope === 'tam_gun' || formScope === 'tam_gun') hasConflict = true;
      else if (existing.scope === 'yarim_gun' && formScope === 'yarim_gun') hasConflict = true;
      else if (existing.scope === 'belirli' && formScope === 'belirli') {
         const intersection = existing.periods.filter((p: number) => selectedPeriods.includes(p));
         if (intersection.length > 0) hasConflict = true;
      }
      else hasConflict = true; // yarım ve belirli durumları birbirini bozarsa
    });

    if (hasConflict) {
      Alert.alert('Çakışan Kayıt', 'Bu tarih ve saat(ler) için zaten bir devamsızlık kaydı mevcut. Lütfen önceki kaydı silin veya çakışmayan ders saatleri seçin.');
      return;
    }

    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      dateObj: formDate.getTime(),
      dateStr: newDateStr,
      statusId: formStatus,
      scope: formScope,
      periods: formScope === 'belirli' ? [...selectedPeriods].sort((a,b)=>a-b) : [],
    };

    const updated = [newLog, ...logs].sort((a, b) => b.dateObj - a.dateObj);
    saveLogs(updated);
    setFormVisible(false);
    resetForm();
  };

  const handleDeleteLog = (id: string) => {
    Alert.alert('Kaydı Sil', 'Bu devamsızlık kaydı silinecek, emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => {
          const updated = logs.filter(l => l.id !== id);
          saveLogs(updated);
      }}
    ]);
  };

  const resetForm = () => {
    setFormDate(new Date());
    setFormStatus('yok');
    setFormScope('tam_gun');
    setSelectedPeriods([]);
  };

  const togglePeriod = (p: number) => {
    if (selectedPeriods.includes(p)) setSelectedPeriods(selectedPeriods.filter(x => x !== p));
    else setSelectedPeriods([...selectedPeriods, p]);
  };

  // Calculations
  let mazeretsizSaat = 0;
  let mazeretliSaat = 0;

  logs.forEach(log => {
      const st = STATUS_OPTIONS.find(o => o.id === log.statusId);
      if (!st || st.type === 'present') return;
      
      let hours = 0;
      if (log.scope === 'tam_gun') hours = 8;
      else if (log.scope === 'yarim_gun') hours = 4;
      else hours = log.periods.length;

      if (st.type === 'mazeretsiz') mazeretsizSaat += hours;
      if (st.type === 'mazeretli') mazeretliSaat += hours;
  });

  const mazeretsizGun = +(mazeretsizSaat / 8).toFixed(2);
  const mazeretliGun = +(mazeretliSaat / 8).toFixed(2);
  const totalD = +(mazeretsizGun + mazeretliGun).toFixed(2);

  const canGetCert = mazeretsizGun <= 5.0;
  const canPass = totalD <= 30.0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100 z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full">
          <Text className="text-lg">🔙</Text>
        </TouchableOpacity>
        <Text className="text-xl font-black text-gray-800">Devamsızlık Takip</Text>
        <TouchableOpacity onPress={() => setFormVisible(true)} className="w-10 h-10 items-center justify-center bg-indigo-50 rounded-full">
          <Text className="text-lg text-indigo-600 font-bold">➕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Analysis Card */}
        <View className="bg-white p-5 rounded-3xl mb-6 border border-gray-100 shadow-sm">
           <Text className="text-base font-extrabold text-gray-600 mb-4">MEB Kriter Grafiği</Text>
           
           <View className="flex-row justify-between mb-4">
              <View className="items-center bg-rose-50 p-3 rounded-2xl flex-1 mr-2 border border-rose-100">
                 <Text className="text-rose-800 text-[11px] font-bold mb-1">Mazeretsiz (Özürsüz)</Text>
                 <Text className="text-rose-600 text-3xl font-black">{mazeretsizGun}</Text>
                 <Text className="text-rose-700/50 text-[10px] font-bold uppercase mt-1">Gün</Text>
              </View>
              <View className="items-center bg-blue-50 p-3 rounded-2xl flex-1 ml-2 border border-blue-100">
                 <Text className="text-blue-800 text-[11px] font-bold mb-1">Mazeretli (Özürlü/Rapor)</Text>
                 <Text className="text-blue-600 text-3xl font-black">{mazeretliGun}</Text>
                 <Text className="text-blue-700/50 text-[10px] font-bold uppercase mt-1">Gün</Text>
              </View>
           </View>
           
           <View className={`p-4 rounded-2xl border ${canGetCert ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <Text className={`font-black text-sm ${canGetCert ? 'text-emerald-700' : 'text-rose-700'}`}>
                {canGetCert ? '🏆 Takdir ve Teşekkür Belgesi Alabilir' : '⚠️ Özürsüz devamsızlık 5 günü aştığı için Belge Alamaz!'}
              </Text>
              <Text className={`font-bold text-[11px] mt-2 ${canPass ? 'text-emerald-600' : 'text-rose-600'}`}>
                {canPass ? `Toplam Devamsızlık: ${totalD} Gün (Limit: 30 Gün)` : `❌ Limit Aşıldı! (${totalD} / 30 Gün. Sınıfta Kalma Riski Var!)`}
              </Text>
           </View>
        </View>

        <View className="flex-row justify-between items-center mb-4">
           <Text className="text-lg font-black text-slate-800">Geçmiş Kayıtlar</Text>
           <TouchableOpacity onPress={() => setFormVisible(true)} className="bg-indigo-600 px-4 py-2 rounded-xl shadow-sm shadow-indigo-600/30">
              <Text className="text-white font-extrabold text-xs">+ Yeni Kayıt</Text>
           </TouchableOpacity>
        </View>

        {/* History List */}
        {logs.length === 0 ? (
           <View className="items-center justify-center p-10 bg-slate-50 border border-dashed border-slate-200 rounded-3xl mt-4">
              <Text className="text-4xl mb-4">🗓️</Text>
              <Text className="text-slate-500 font-bold text-center">Henüz devamsızlık kaydı yok.</Text>
           </View>
        ) : (
           logs.map((log) => {
              const st = STATUS_OPTIONS.find(o => o.id === log.statusId) || STATUS_OPTIONS[0];
              const scopeText = log.scope === 'tam_gun' ? 'Tüm Gün' : (log.scope === 'yarim_gun' ? 'Yarım Gün' : `${log.periods.join(', ')}. Dersler`);
              
              return (
                 <View key={log.id} className="bg-white p-4 rounded-2xl mb-3 border border-slate-100 flex-row items-center justify-between shadow-sm">
                    <View className="flex-1">
                       <Text className="font-extrabold text-slate-800 text-sm mb-1">{log.dateStr}</Text>
                       <View className="flex-row items-center">
                          <View className={`px-2 py-1 rounded-md border ${st.bg} ${st.border} mr-2`}>
                            <Text className={`${st.color} font-black text-[10px]`}>{st.label.split(' ')[1]} {st.label.split(' ')[2]}</Text>
                          </View>
                          <Text className="text-slate-500 font-bold text-xs">⏰ {scopeText}</Text>
                       </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteLog(log.id)} className="w-10 h-10 items-center justify-center bg-rose-50 rounded-xl ml-2">
                       <Text className="text-rose-500 text-xs">🗑️</Text>
                    </TouchableOpacity>
                 </View>
              );
           })
        )}
      </ScrollView>

      {/* Add New Absence Form Modal */}
      <Modal visible={isFormVisible} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/60">
           <View className="bg-white rounded-t-3xl p-6 pb-12 min-h-[85%]">
              
              <View className="flex-row justify-between items-center mb-6">
                 <Text className="text-2xl font-black text-slate-800">Yeni Girdi</Text>
                 <TouchableOpacity onPress={() => setFormVisible(false)} className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center">
                    <Text className="text-slate-500">❌</Text>
                 </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Date Selection */}
                  <Text className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Kayıt Tarihi</Text>
                  <TouchableOpacity 
                     onPress={() => setDatePickerVisibility(true)}
                     className="flex-row items-center bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6"
                  >
                     <Text className="text-xl mr-3">📅</Text>
                  {isDatePickerVisible && (
                    <View className="mb-6 rounded-2xl overflow-hidden border border-slate-200">
                       <Calendar
                           current={formDate.toISOString().split('T')[0]}
                           firstDay={1}
                           onDayPress={(day: any) => {
                              const [y, m, d] = day.dateString.split('-');
                              setFormDate(new Date(parseInt(y), parseInt(m)-1, parseInt(d)));
                              setDatePickerVisibility(false);
                           }}
                           markedDates={getCalendarMarks(formDate, OFFICIAL_HOLIDAYS)}
                           theme={{
                              textSectionTitleColor: '#4f46e5',
                              selectedDayBackgroundColor: '#4f46e5',
                              todayTextColor: '#4f46e5',
                              arrowColor: '#4f46e5',
                              monthTextColor: '#1e293b',
                              textMonthFontWeight: 'bold',
                           }}
                       />
                       <TouchableOpacity onPress={() => setDatePickerVisibility(false)} className="bg-slate-100 p-3 items-center">
                          <Text className="text-slate-500 font-bold">Kapat</Text>
                       </TouchableOpacity>
                    </View>
                  )}

                  {/* Reason Selection */}
                  <Text className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Gerekçe / Durum</Text>
                  <View className="mb-6">
                     {STATUS_OPTIONS.map(opt => (
                        <TouchableOpacity 
                           key={opt.id} 
                           onPress={() => setFormStatus(opt.id)}
                           className={`p-4 rounded-2xl border mb-2 flex-row items-center justify-between ${formStatus === opt.id ? `${opt.bg} ${opt.border}` : 'bg-white border-slate-100'}`}
                        >
                           <Text className={`font-bold ${formStatus === opt.id ? opt.color : 'text-slate-600'}`}>{opt.label}</Text>
                           {formStatus === opt.id && <View className="w-4 h-4 rounded-full bg-slate-800" />}
                        </TouchableOpacity>
                     ))}
                  </View>

                  {/* Scope Selection */}
                  <Text className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Devamsızlık Süresi</Text>
                  <View className="flex-row bg-slate-100 p-1 rounded-2xl mb-4">
                     <TouchableOpacity onPress={() => setFormScope('tam_gun')} className={`flex-1 p-3 items-center rounded-xl ${formScope === 'tam_gun' ? 'bg-white shadow-sm' : ''}`}>
                        <Text className={`font-bold text-xs ${formScope === 'tam_gun' ? 'text-indigo-600' : 'text-slate-500'}`}>Tüm Gün</Text>
                     </TouchableOpacity>
                     <TouchableOpacity onPress={() => setFormScope('yarim_gun')} className={`flex-1 p-3 items-center rounded-xl ${formScope === 'yarim_gun' ? 'bg-white shadow-sm' : ''}`}>
                        <Text className={`font-bold text-xs ${formScope === 'yarim_gun' ? 'text-indigo-600' : 'text-slate-500'}`}>Yarım Gün</Text>
                     </TouchableOpacity>
                     <TouchableOpacity onPress={() => setFormScope('belirli')} className={`flex-1 p-3 items-center rounded-xl ${formScope === 'belirli' ? 'bg-white shadow-sm' : ''}`}>
                        <Text className={`font-bold text-xs ${formScope === 'belirli' ? 'text-indigo-600' : 'text-slate-500'}`}>Kısmi</Text>
                     </TouchableOpacity>
                  </View>

                  {/* Specific Periods Selector */}
                  {formScope === 'belirli' && (
                     <View className="mb-6">
                        <Text className="text-[10px] font-bold text-indigo-400 mb-2">Hangi derslere katılmadı?</Text>
                        <View className="flex-row flex-wrap justify-between">
                           {[1,2,3,4,5,6,7,8].map(p => {
                              const isSelected = selectedPeriods.includes(p);
                              return (
                                 <TouchableOpacity 
                                    key={p} 
                                    onPress={() => togglePeriod(p)}
                                    className={`w-[22%] aspect-square items-center justify-center rounded-2xl mb-2 border ${isSelected ? 'bg-indigo-600 border-indigo-700' : 'bg-white border-slate-200'}`}
                                 >
                                    <Text className={`font-black text-lg ${isSelected ? 'text-white' : 'text-slate-400'}`}>{p}</Text>
                                 </TouchableOpacity>
                              );
                           })}
                        </View>
                     </View>
                  )}

                  {/* Save Button */}
                  <TouchableOpacity onPress={handleSaveForm} className="bg-slate-900 p-5 rounded-2xl items-center mt-2 shadow-lg shadow-black/30">
                     <Text className="text-white font-black text-base">KAYDET</Text>
                  </TouchableOpacity>

              </ScrollView>
           </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
