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
  
  console.log('Converting to JSON...');
  // We don't know the exact headers, so we'll output an array of arrays to see what the columns are
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log(`Successfully read ${data.length} rows.`);
  
  // Write the first 5 rows to a debug file and print them to console so we can figure out the structure
  const debugRows = data.slice(0, 5);
  console.log('First 5 rows for structure inspection:');
  console.log(JSON.stringify(debugRows, null, 2));

} catch (error) {
  console.error('Error processing excel file:', error);
}
