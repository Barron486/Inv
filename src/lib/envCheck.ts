export function checkEnvironmentVariables() {
  const issues: string[] = [];
  
  // 檢查 Google Cloud 認證
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    issues.push('缺少 Google Cloud 認證配置。請設置 GOOGLE_APPLICATION_CREDENTIALS 或 GOOGLE_APPLICATION_CREDENTIALS_JSON 環境變量。');
  }
  
  // 檢查 Sheets 配置（可選）
  if (!process.env.SHEETS_SPREADSHEET_ID) {
    issues.push('未設置 SHEETS_SPREADSHEET_ID，Google Sheets 匯出功能將被禁用。');
  }
  
  return {
    hasIssues: issues.length > 0,
    issues
  };
}

export function getEnvironmentStatus() {
  const { hasIssues, issues } = checkEnvironmentVariables();
  
  return {
    googleVision: !!process.env.GOOGLE_APPLICATION_CREDENTIALS || !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
    sheetsExport: !!process.env.SHEETS_SPREADSHEET_ID,
    einvApi: !!process.env.EINV_BASE_URL,
    hasIssues,
    issues
  };
}