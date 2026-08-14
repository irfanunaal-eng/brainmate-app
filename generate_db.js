const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'screens', 'Kopya 3000wordsenglish.xlsx');
const outputPath = path.join(__dirname, 'assets', 'vocabulary.json');

try {
  console.log('Loading Excel file...');
  const workbook = xlsx.readFile(inputPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // parse with header: 1 to get arrays
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  // Data format: [level, kelime, anlami, örnek cümle]
  // We want: Record<string, {en: string, tr: string, sentence: string}[]>
  const results = {
    'A1': [],
    'A2': [],
    'B1': [],
    'B2': [],
    'C1': []
  };

  // skip the first row (headers)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;

    let rawLevel = (row[0] || '').toString().trim().toUpperCase();
    
    // Normalize A1.1 or A1.2 if it exists, otherwise just match the prefix
    const match = rawLevel.match(/^(A1|A2|B1|B2|C1)/);
    let level = match ? match[1] : 'A1'; // Fallback to A1

    const word = (row[1] || '').toString().trim();
    // Some meanings have long descriptions, we only take the primary logic or leave it
    let meaning = (row[2] || '').toString().trim();
    
    // Some meanings have semicolons or 'zf;' which we can leave raw, or clean heavily
    const sentence = (row[3] || '').toString().trim();

    if (word) {
       // if meaning contains semicolons or commas, we can just take the first part to keep the game UI clean,
       // but since it's a game option, we want a clean single word as translation where possible. 
       // For now, let's keep it full but in the game we will render it beautifully.
       // Actually let's try to extract the first clean word. e.g "okul, mektep" -> "okul"
       let shortMeaning = meaning.split(/[,;\.]/)[0].replace(/^(zf|s|f|ed|isim|sıfat)\s*?[:;-]*\s*?/i, '').trim();
       if (!shortMeaning) shortMeaning = meaning;

       results[level].push({
         en: word,
         trRaw: meaning,
         tr: shortMeaning.charAt(0).toUpperCase() + shortMeaning.slice(1),
         sentence: sentence
       });
    }
  }
  
  console.log(`Writing to ${outputPath}...`);
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log('Done! Generated database.');

} catch (error) {
  console.error('Error processing excel file:', error);
}
