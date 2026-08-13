export interface ParsedSchedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  title: string;
  schedule_type: string;
}

/**
 * PRODUCTION VERSION (Gemini AI API)
 * This function is ready to be used when you go to production.
 * You just need to add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.
 */
export const scanScheduleImageGemini = async (base64Image: string): Promise<ParsedSchedule[]> => {
  const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!API_KEY) {
    throw new Error('Gemini API Key is missing. Please add it to .env');
  }

  const prompt = `
    Sen bir ders programı okuyucususun. Gönderilen fotoğraftaki haftalık ders programını incele.
    Bulduğun her bir ders için aşağıdaki JSON dizisini döndür:
    [
      {
        "day_of_week": 1, // 1:Pzt, 2:Sal, 3:Çar, 4:Per, 5:Cum, 6:Cmt, 7:Paz
        "start_time": "09:00:00",
        "end_time": "09:40:00",
        "title": "Matematik",
        "schedule_type": "okul" // okul, dersane, ozel_ders, etut
      }
    ]
    Eğer ders adından türü anlaşılmıyorsa "okul" olarak işaretle.
    Sadece JSON çıktısı ver, başka hiçbir açıklama yapma.
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    let textResult = data.candidates[0].content.parts[0].text;
    
    // Clean markdown code blocks if AI returned them
    textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedData: ParsedSchedule[] = JSON.parse(textResult);
    return parsedData;

  } catch (error) {
    console.error("AI Parse Error:", error);
    throw new Error('Yapay zeka ders programını okurken bir sorun yaşadı.');
  }
};

/**
 * DEVELOPMENT VERSION (Mock)
 * This function simulates a 3-second API call and returns fake parsed data.
 */
export const scanScheduleImageMock = async (base64Image: string): Promise<ParsedSchedule[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          day_of_week: 1,
          start_time: '08:30:00',
          end_time: '09:10:00',
          title: 'Türk Edebiyatı',
          schedule_type: 'okul'
        },
        {
          day_of_week: 1,
          start_time: '09:20:00',
          end_time: '10:00:00',
          title: 'Tarih',
          schedule_type: 'okul'
        },
        {
          day_of_week: 2,
          start_time: '14:00:00',
          end_time: '15:30:00',
          title: 'Fizik Özel Ders',
          schedule_type: 'ozel_ders'
        },
        {
          day_of_week: 3,
          start_time: '17:00:00',
          end_time: '18:30:00',
          title: 'Matematik Etüt',
          schedule_type: 'etut'
        }
      ]);
    }, 3000); // Simulate network latency
  });
};

/**
 * MAIN FUNCTION EXPORT
 * Toggle between Mock and Gemini here based on environment or preferences.
 */
export const scanScheduleImage = scanScheduleImageMock; // Change to scanScheduleImageGemini for production
