import { read, utils } from 'xlsx';
import { Participant } from '../types';

export const parseExcelFile = async (file: File): Promise<Participant[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        
        // Assume first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = utils.sheet_to_json(worksheet, { header: 1 });
        
        // Basic validation: Expect Header Row or just data
        // We assume columns: [ID, Name, Department]
        
        // Skip header row if it looks like a header (contains "ID" or "Name")
        const startIndex = (jsonData[0] as any[]).some(cell => 
          typeof cell === 'string' && ['id', 'name', '姓名', '工号'].includes(cell.toLowerCase())
        ) ? 1 : 0;

        const participants: Participant[] = [];
        
        for (let i = startIndex; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length < 2) continue;

          // Robust mapping
          const id = row[0]?.toString().trim() || Math.random().toString(36).substr(2, 9);
          const name = row[1]?.toString().trim();
          const department = row[2]?.toString().trim() || 'General';

          if (name) {
            participants.push({
              id,
              name,
              department
            });
          }
        }
        resolve(participants);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
