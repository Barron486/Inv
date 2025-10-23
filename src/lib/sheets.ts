import { google } from 'googleapis';

export async function appendRowsToSheet(rows: (string | number)[][], sheetRange = 'Sheet1!A1') {
  const spreadsheetId = process.env.SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error('Missing SHEETS_SPREADSHEET_ID');

  const auth = await google.auth.getClient({ scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: sheetRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rows }
  });

  return res.data.updates;
}


