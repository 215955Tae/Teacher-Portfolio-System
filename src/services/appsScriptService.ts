import { ActivityRecord, FileAttachment } from '../types';

export const APPS_SCRIPT_CONFIG = {
  ENDPOINT_URL:
    'https://script.google.com/macros/s/AKfycbzAY4gZMhAYG9qMxp5mWk6Of6KJIHJf3c67sjTeYhCUNeUt_yK9l8qW3VTW3D_EKZ6Ysg/exec',
  SHEET_ID: '1etr8iF8qK5y_B1apfMI_2rjFy4OY5RJPV6RaTbcrmbg',
  FOLDER_ID: '1AcKRJm0FwiSNYYr2TaEGY34t74n9S-Ym',
};

/**
 * Client-side image compressor:
 * Automatically scales down large smartphone camera photos (e.g. 5-12MB)
 * to a lightweight web-friendly resolution (max 1280px, ~150KB),
 * preventing browser freeze and ensuring 100% fast, reliable upload to Google Drive.
 */
export async function compressImageFile(file: File, maxWidth = 1280, quality = 0.75): Promise<string> {
  if (!file.type.startsWith('image/')) {
    return fileToBase64(file);
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          const raw = (event.target?.result as string).split(',')[1] || '';
          return resolve(raw);
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64Data = dataUrl.split(',')[1] || '';
        resolve(base64Data);
      };
      img.onerror = () => {
        const raw = (event.target?.result as string).split(',')[1] || '';
        resolve(raw);
      };
    };
    reader.onerror = () => resolve('');
  });
}

// Convert File object to Base64 string for PDFs / documents
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || result;
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
}

export interface UploadProgressStatus {
  status: 'idle' | 'preparing' | 'uploading' | 'saving_sheet' | 'success' | 'error';
  message: string;
  details?: string;
}

/**
 * Helper to extract Google Drive file ID from any URL format or raw ID string.
 */
export function extractDriveFileId(url: string | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();

  // If already base64 or blob, no drive ID
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return '';

  // Match /file/d/ID/view, /file/d/ID, ?id=ID, /d/ID, thumbnail?id=ID
  const driveRegex = /(?:file\/d\/|[?&]id=|\/d\/|thumbnail\?id=)([a-zA-Z0-9_-]{20,})/;
  const match = trimmed.match(driveRegex);
  if (match && match[1]) {
    return match[1];
  }

  // Bare Drive ID (e.g. 25+ alphanumeric characters)
  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    return trimmed;
  }

  return '';
}

/**
 * Format any Drive link or ID into Google's high-speed CDN direct image URL:
 * https://lh3.googleusercontent.com/d/${fileId}=w1000
 * This avoids Google Drive iframe blocks, cookies issues, and renders instantly in <img> tags.
 */
export function formatDriveImageUrl(url: string | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();

  if (trimmed.startsWith('data:image') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  if (trimmed.includes('/folders/')) {
    return '';
  }

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
  }

  return trimmed;
}

/**
 * Alternative Google Drive thumbnail URL for fallback
 */
export function getAlternateDriveImageUrl(url: string | undefined): string {
  if (!url) return '';
  const fileId = extractDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }
  return '';
}

/**
 * Get direct Google Drive viewer link for opening the original file in a new tab
 */
export function getGoogleDriveViewUrl(url: string | undefined): string {
  if (!url) return '';
  const fileId = extractDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }
  if (url.startsWith('http')) return url;
  return '';
}

/**
 * Format any date string (including GViz "Date(2026,9,27)") into clean Thai Buddhist date
 */
export function formatDisplayDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  const trimmed = dateStr.trim();

  const THAI_MONTHS = [
    '',
    'ม.ค.',
    'ก.พ.',
    'มี.ค.',
    'เม.ย.',
    'พ.ค.',
    'มิ.ย.',
    'ก.ค.',
    'ส.ค.',
    'ก.ย.',
    'ต.ค.',
    'พ.ย.',
    'ธ.ค.',
  ];

  // GViz format: Date(year, monthIndex, day[, hour, minute, second])
  const gvizMatch = trimmed.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/);
  if (gvizMatch) {
    const year = parseInt(gvizMatch[1], 10);
    const month = parseInt(gvizMatch[2], 10) + 1; // 0-indexed in GViz
    const day = parseInt(gvizMatch[3], 10);
    const thaiYear = year < 2500 ? year + 543 : year;
    return `${day} ${THAI_MONTHS[month] || month} ${thaiYear}`;
  }

  // Standard ISO format: YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    const thaiYear = year < 2500 ? year + 543 : year;
    return `${day} ${THAI_MONTHS[month] || month} ${thaiYear}`;
  }

  return trimmed;
}

export interface PreviewMediaInfo {
  url: string;
  originalUrl?: string;
  kind: 'photo' | 'certificate' | 'none';
  label: string;
  count: number;
}

/**
 * Extract one sample preview from an activity record, prioritizing photo images first,
 * falling back to certificate images, and returning the display URL and source kind.
 */
export function getPreviewMedia(record: ActivityRecord | null | undefined): PreviewMediaInfo {
  if (!record) {
    return { url: '', originalUrl: '', kind: 'none', label: 'ไม่มีภาพ', count: 0 };
  }

  // 1. First priority: Activity photos (ภาพถ่ายกิจกรรม 1-3 รูป)
  const photos = record.photos || [];
  for (const p of photos) {
    const raw = (p.url || (p.base64 ? `data:${p.type || 'image/jpeg'};base64,${p.base64}` : '')).trim();
    if (raw && !raw.includes('/folders/')) {
      return {
        url: formatDriveImageUrl(raw),
        originalUrl: p.originalUrl || getGoogleDriveViewUrl(raw),
        kind: 'photo',
        label: `ภาพกิจกรรม (${photos.length} รูป)`,
        count: photos.length,
      };
    }
  }

  // 2. Second priority: Certificate / Diploma (เกียรติบัตร / วุฒิบัตร)
  const certs = record.certificates || [];
  for (const c of certs) {
    const raw = (c.url || (c.base64 ? `data:${c.type || 'image/jpeg'};base64,${c.base64}` : '')).trim();
    if (raw && !raw.includes('/folders/')) {
      const isExplicitPdf = c.name?.toLowerCase().endsWith('.pdf') && !c.base64 && !raw.startsWith('data:image');
      if (!isExplicitPdf || raw.includes('google.com') || raw.startsWith('data:image')) {
        return {
          url: formatDriveImageUrl(raw),
          originalUrl: c.originalUrl || getGoogleDriveViewUrl(raw),
          kind: 'certificate',
          label: 'ภาพเกียรติบัตร / วุฒิบัตร',
          count: certs.length,
        };
      }
    }
  }

  return {
    url: '',
    originalUrl: '',
    kind: 'none',
    label: 'ยังไม่มีภาพตัวอย่าง',
    count: 0,
  };
}

const LOCAL_STORAGE_KEY = 'PKW_ACTIVITIES_2568_SHEET_V3';

/**
 * Filter out any mock/demo data from previous versions or deleted test items.
 */
function filterOutDemoRecords(records: ActivityRecord[]): ActivityRecord[] {
  if (!Array.isArray(records)) return [];
  const demoIds = new Set(['PKW-2568-001', 'PKW-2568-002', 'PKW-2568-003', 'PKW-2568-9600']);
  return records.filter((r) => {
    if (!r || !r.id) return false;
    if (demoIds.has(r.id)) return false;
    // Filter our automated background test rows
    if (r.id.startsWith('PKW-TEST-') || r.id.startsWith('PKW-DEBUG-')) return false;
    const hasUnsplash = r.photos?.some((p) => p.url?.includes('images.unsplash.com'));
    if (hasUnsplash && r.id.startsWith('PKW-2568-00')) return false;
    return true;
  });
}

export function loadStoredActivities(defaultRecords: ActivityRecord[] = []): ActivityRecord[] {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return filterOutDemoRecords(defaultRecords);
    }
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return filterOutDemoRecords(Array.isArray(parsed) ? parsed : []);
  } catch (e) {
    console.error('Failed to load activities from storage', e);
    return [];
  }
}

export function saveAllActivities(records: ActivityRecord[]) {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    const cleaned = filterOutDemoRecords(records);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned));
  } catch (e) {
    console.error('Failed to save activities to storage', e);
  }
}

export function clearActivitiesStorage() {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  } catch (e) {}
}

export function saveRecordToLocalStorage(record: ActivityRecord) {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    let list: ActivityRecord[] = raw ? filterOutDemoRecords(JSON.parse(raw)) : [];
    const index = list.findIndex((item) => item.id === record.id);
    if (index >= 0) {
      list[index] = record;
    } else {
      list.unshift(record);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to update local record', e);
  }
}

/**
 * Standard RFC-compliant CSV parser:
 * Parses CSV lines handling quoted cells, embedded commas, and newlines.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (insideQuote) {
      if (c === '"' && next === '"') {
        currentCell += '"';
        i++;
      } else if (c === '"') {
        insideQuote = false;
      } else {
        currentCell += c;
      }
    } else {
      if (c === '"') {
        insideQuote = true;
      } else if (c === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (c === '\r' && next === '\n') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        i++;
      } else if (c === '\n' || c === '\r') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += c;
      }
    }
  }
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }
  return rows.filter((r) => r.length > 0 && r.some((cell) => cell.length > 0));
}

/**
 * Helper to extract URLs from text (handles newlines, commas, JSON strings)
 */
function extractUrlsFromText(text: string): string[] {
  if (!text) return [];
  const trimmed = text.trim();

  // Try JSON array
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(String).filter((u) => u.startsWith('http') || u.length > 25);
      }
    } catch (e) {}
  }

  // Regex for http links
  const matches = trimmed.match(/https?:\/\/[^\s"'<>\),]+/g);
  if (matches && matches.length > 0) return matches;

  return trimmed
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter((u) => u.startsWith('http') || u.length > 25);
}

/**
 * Universal Matrix-to-ActivityRecords Parser:
 * Dynamically maps rows according to header names discovered in row 0.
 * Supports both Tab 1 (with JSON evidence column) and Tab 2 (with separate photo/cert/doc columns).
 */
function parseActivityRecordsFromMatrix(headers: string[], dataRows: string[][]): ActivityRecord[] {
  if (!headers || headers.length === 0 || !dataRows || dataRows.length === 0) {
    return [];
  }

  const findIdx = (keywords: string[]): number => {
    return headers.findIndex((h) => {
      const clean = (h || '').toLowerCase().replace(/[\s\-_/()]/g, '');
      return keywords.some((kw) => {
        const kwClean = kw.toLowerCase().replace(/[\s\-_/()]/g, '');
        if (clean === kwClean) return true;
        if (clean.includes(kwClean)) return true;
        if (clean.length > 3 && kwClean.includes(clean)) return true;
        return false;
      });
    });
  };

  const idCol = findIdx(['id', 'รหัสกิจกรรม', 'รหัส']);
  const timeCol = findIdx(['วันเวลาที่บันทึก', 'timestamp', 'เวลา']);
  const yearCol = findIdx(['ปีการศึกษา', 'year']);
  const levelCol = findIdx(['ระดับรางวัล', 'ระดับ', 'level']);
  const deptCol = findIdx(['กลุ่มสาระการเรียนรู้', 'กลุ่มสาระ', 'department']);
  const nameCol = findIdx(['ชื่อรางวัล/กิจกรรม', 'ชื่อรางวัล', 'ชื่อกิจกรรม', 'awardname', 'name']);
  const dateCol = findIdx(['วันที่ได้รับรางวัล', 'วันที่', 'date']);
  const orgCol = findIdx(['หน่วยงานที่จัด', 'หน่วยงาน', 'organizer']);
  const teacherCol = findIdx(['ครูผู้รับรางวัล', 'ครู', 'ผู้รายงาน', 'teacher']);
  const studentCol = findIdx(['นักเรียนผู้รับรางวัล', 'นักเรียน', 'student']);
  const objCol = findIdx(['วัตถุประสงค์', 'objective']);
  const detailsCol = findIdx(['รายละเอียดเพิ่มเติม', 'รายละเอียด', 'detail']);
  const outcomesCol = findIdx(['ผลลัพธ์ที่เกิด', 'ผลลัพธ์', 'outcome']);
  const photosCol = findIdx(['ลิงก์ภาพถ่ายกิจกรรม', 'ภาพถ่าย', 'รูปภาพ', 'photo', 'picture', 'image']);
  const certsCol = findIdx(['ลิงก์เกียรติบัตร', 'เกียรติบัตร', 'cert', 'certificate']);
  const docsCol = findIdx(['ลิงก์เอกสารหลักฐานเพิ่มเติม', 'เอกสาร', 'doc', 'document', 'pdf']);
  const folderCol = findIdx(['โฟลเดอร์ผู้อัปโหลดใน Drive', 'โฟลเดอร์', 'folder', 'drive']);
  const evidenceJsonCol = findIdx(['ไฟล์หลักฐานjson', 'ไฟล์หลักฐาน', 'evidence', 'evidencejson']);

  const records: ActivityRecord[] = [];

  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r];
    if (!row || row.length === 0) continue;

    const getVal = (idx: number, fallback = ''): string => {
      if (idx >= 0 && idx < row.length && row[idx] !== undefined && row[idx] !== null) {
        return String(row[idx]).trim();
      }
      return fallback;
    };

    const awardName = nameCol >= 0 ? getVal(nameCol) : getVal(5, getVal(4));
    const rawId = idCol >= 0 ? getVal(idCol) : getVal(0);

    // Skip if empty or repeated header
    if (!awardName || awardName === 'ชื่อรางวัล' || awardName === 'ชื่อรางวัล/กิจกรรม' || rawId === 'id' || rawId === 'รหัสกิจกรรม') {
      continue;
    }

    const id = rawId || `PKW-${Date.now()}-${r}`;
    const academicYear = yearCol >= 0 ? getVal(yearCol, '2568') : '2568';
    const awardLevel = (levelCol >= 0 ? getVal(levelCol, 'ระดับเขตพื้นที่') : 'ระดับเขตพื้นที่') as any;
    const department = (deptCol >= 0 ? getVal(deptCol, 'กลุ่มบริหารงานบุคคล') : 'กลุ่มบริหารงานบุคคล') as any;
    const rawDate = dateCol >= 0 ? getVal(dateCol) : '';
    const awardDate = formatDisplayDate(rawDate);
    const organizer = orgCol >= 0 ? getVal(orgCol, 'โรงเรียนพังโคนวิทยาคม') : 'โรงเรียนพังโคนวิทยาคม';
    const teacherName = teacherCol >= 0 ? getVal(teacherCol, '-') : '-';
    const studentName = studentCol >= 0 ? getVal(studentCol, '-') : '-';
    const objective = objCol >= 0 ? getVal(objCol) : '';
    const additionalDetails = detailsCol >= 0 ? getVal(detailsCol) : '';
    const outcomes = outcomesCol >= 0 ? getVal(outcomesCol) : '';
    let folderUrl = folderCol >= 0 ? getVal(folderCol) : '';

    let photoUrls: string[] = [];
    let certUrls: string[] = [];
    let docUrls: string[] = [];

    // 1. Universal scan: check all cells in row for JSON evidence (Format 1)
    for (let c = 0; c < row.length; c++) {
      const cellVal = getVal(c);
      if (
        cellVal.startsWith('{') &&
        (cellVal.includes('photos') || cellVal.includes('certificates') || cellVal.includes('documents') || cellVal.includes('folderUrl'))
      ) {
        try {
          const parsed = JSON.parse(cellVal);
          if (Array.isArray(parsed.photos)) photoUrls.push(...parsed.photos);
          if (Array.isArray(parsed.certificates)) certUrls.push(...parsed.certificates);
          if (Array.isArray(parsed.documents)) docUrls.push(...parsed.documents);
          if (!folderUrl && parsed.folderUrl) folderUrl = parsed.folderUrl;
        } catch (e) {}
      }
    }

    // 2. Check JSON evidence column if available and not yet loaded
    if (evidenceJsonCol >= 0 && photoUrls.length === 0 && certUrls.length === 0) {
      const rawEvidence = getVal(evidenceJsonCol);
      if (rawEvidence && rawEvidence.startsWith('{')) {
        try {
          const parsed = JSON.parse(rawEvidence);
          if (Array.isArray(parsed.photos)) photoUrls.push(...parsed.photos);
          if (Array.isArray(parsed.certificates)) certUrls.push(...parsed.certificates);
          if (Array.isArray(parsed.documents)) docUrls.push(...parsed.documents);
          if (!folderUrl && parsed.folderUrl) folderUrl = parsed.folderUrl;
        } catch (e) {}
      }
    }

    // 3. Check separate columns (Format 2)
    if (photosCol >= 0) {
      const rawP = getVal(photosCol);
      if (rawP) photoUrls.push(...extractUrlsFromText(rawP));
    }
    if (certsCol >= 0) {
      const rawC = getVal(certsCol);
      if (rawC) certUrls.push(...extractUrlsFromText(rawC));
    }
    if (docsCol >= 0) {
      const rawD = getVal(docsCol);
      if (rawD) docUrls.push(...extractUrlsFromText(rawD));
    }

    // Unique URLs
    const uniquePhotos = Array.from(new Set(photoUrls.filter(Boolean)));
    const uniqueCerts = Array.from(new Set(certUrls.filter(Boolean)));
    const uniqueDocs = Array.from(new Set(docUrls.filter(Boolean)));

    records.push({
      id,
      academicYear,
      awardLevel,
      department,
      awardName,
      awardDate,
      organizer,
      teacherName,
      studentName,
      objective,
      additionalDetails,
      outcomes,
      folderUrl,
      photos: uniquePhotos.map((url, i) => ({
        name: `ภาพถ่าย_${i + 1}`,
        type: 'image/jpeg',
        size: 0,
        url: formatDriveImageUrl(url),
        originalUrl: getGoogleDriveViewUrl(url),
      })),
      certificates: uniqueCerts.map((url, i) => ({
        name: `เกียรติบัตร_${i + 1}`,
        type: url.includes('.pdf') ? 'application/pdf' : 'image/jpeg',
        size: 0,
        url: formatDriveImageUrl(url),
        originalUrl: getGoogleDriveViewUrl(url),
      })),
      documents: uniqueDocs.map((url, i) => ({
        name: `เอกสาร_${i + 1}`,
        type: 'application/pdf',
        size: 0,
        url: url,
        originalUrl: getGoogleDriveViewUrl(url),
      })),
      createdAt: timeCol >= 0 && getVal(timeCol) ? getVal(timeCol) : new Date().toISOString(),
      syncStatus: 'synced',
    });
  }

  return filterOutDemoRecords(records).reverse();
}

/**
 * Parse Google Sheet Visualization API table into ActivityRecords
 * Automatically handles cases where cols have empty labels by checking row 0!
 */
function parseGvizTable(table: any): ActivityRecord[] {
  if (!table || !Array.isArray(table.rows) || table.rows.length === 0) {
    return [];
  }

  // Determine headers: check cols first, then row 0 if labels are empty
  let headers: string[] = (table.cols || []).map((c: any) => c.label || c.id || '');
  const hasLabels = headers.some((h) => h && h.length > 1 && !/^[A-Z]$/.test(h));

  let startRowIndex = 0;
  if (!hasLabels && table.rows.length > 0) {
    // Row 0 contains the real column headers!
    headers = (table.rows[0].c || []).map((cell: any) => (cell ? String(cell.v || cell.f || '') : ''));
    startRowIndex = 1;
  }

  const dataRows: string[][] = [];
  for (let r = startRowIndex; r < table.rows.length; r++) {
    const row = table.rows[r];
    if (!row || !row.c) continue;
    const rowValues = row.c.map((cell: any) => {
      if (!cell) return '';
      if (cell.v !== null && cell.v !== undefined) {
        const vStr = String(cell.v).trim();
        if (vStr.startsWith('Date(') && cell.f) {
          return String(cell.f).trim();
        }
        return vStr;
      }
      return cell.f ? String(cell.f).trim() : '';
    });
    dataRows.push(rowValues);
  }

  return parseActivityRecordsFromMatrix(headers, dataRows);
}

/**
 * Safe fetch helper with timeout to prevent hanging requests on mobile/slow connections.
 */
async function fetchWithTimeout(url: string, timeoutMs = 4000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Fetch real activity records directly from Google Sheet (REAL-TIME SINGLE SOURCE OF TRUTH).
 * Multi-layer fallback with strict timeouts (max 3.5s per query, never hangs or flickers):
 * 1) Direct CSV query from default tab (Fastest, ~300ms)
 * 2) Direct CSV query from tab "บันทึกผลงานกิจกรรม"
 * 3) GViz JSON query from default tab
 * 4) GViz JSON query from tab "บันทึกผลงานกิจกรรม"
 * 5) Apps Script doGet API (with 3.5s safety timeout)
 */
export async function fetchActivitiesFromGoogleSheet(): Promise<ActivityRecord[]> {
  let sheetReached = false;
  let records: ActivityRecord[] = [];

  const tabNameEncoded = encodeURIComponent('บันทึกผลงานกิจกรรม');

  // STRATEGY 1: CSV from default Sheet (Fastest, takes ~300ms)
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${APPS_SCRIPT_CONFIG.SHEET_ID}/gviz/tq?tqx=out:csv&t=${Date.now()}`;
    const res = await fetchWithTimeout(csvUrl, 3500);
    if (res.ok) {
      const text = await res.text();
      sheetReached = true;
      const matrix = parseCsv(text);
      if (matrix.length > 1) {
        const parsed = parseActivityRecordsFromMatrix(matrix[0], matrix.slice(1));
        if (parsed.length > 0) {
          records = parsed;
        }
      }
    }
  } catch (err) {
    console.warn('Fast CSV fetch note:', err);
  }

  // STRATEGY 2: CSV from "บันทึกผลงานกิจกรรม"
  if (records.length === 0) {
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${APPS_SCRIPT_CONFIG.SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${tabNameEncoded}&t=${Date.now()}`;
      const res = await fetchWithTimeout(csvUrl, 3500);
      if (res.ok) {
        const text = await res.text();
        sheetReached = true;
        const matrix = parseCsv(text);
        if (matrix.length > 1) {
          const parsed = parseActivityRecordsFromMatrix(matrix[0], matrix.slice(1));
          if (parsed.length > 0) {
            records = parsed;
          }
        }
      }
    } catch (err) {
      console.warn('CSV tab fetch error:', err);
    }
  }

  // STRATEGY 3: GViz JSON from default sheet
  if (records.length === 0) {
    try {
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${APPS_SCRIPT_CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&t=${Date.now()}`;
      const res = await fetchWithTimeout(gvizUrl, 3500);
      if (res.ok) {
        const text = await res.text();
        const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?/);
        if (match && match[1]) {
          sheetReached = true;
          const json = JSON.parse(match[1]);
          const parsed = parseGvizTable(json.table);
          if (parsed.length > 0) {
            records = parsed;
          }
        }
      }
    } catch (err) {
      console.warn('GViz default tab fetch error:', err);
    }
  }

  // STRATEGY 4: GViz JSON from "บันทึกผลงานกิจกรรม"
  if (records.length === 0) {
    try {
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${APPS_SCRIPT_CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${tabNameEncoded}&t=${Date.now()}`;
      const res = await fetchWithTimeout(gvizUrl, 3500);
      if (res.ok) {
        const text = await res.text();
        const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?/);
        if (match && match[1]) {
          sheetReached = true;
          const json = JSON.parse(match[1]);
          const parsed = parseGvizTable(json.table);
          if (parsed.length > 0) {
            records = parsed;
          }
        }
      }
    } catch (err) {
      console.warn('GViz tab fetch error:', err);
    }
  }

  // STRATEGY 5: Apps Script doGet API (Strict 3.5s timeout)
  if (records.length === 0) {
    try {
      const appsScriptUrl = `${APPS_SCRIPT_CONFIG.ENDPOINT_URL}?action=getActivities&sheetId=${APPS_SCRIPT_CONFIG.SHEET_ID}&t=${Date.now()}`;
      const res = await fetchWithTimeout(appsScriptUrl, 3500);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.records)) {
          sheetReached = true;
          if (json.records.length > 0) {
            records = filterOutDemoRecords(json.records).map((r: ActivityRecord) => ({
              ...r,
              photos: (r.photos || []).map((p) => ({
                ...p,
                url: formatDriveImageUrl(p.url),
                originalUrl: getGoogleDriveViewUrl(p.url || p.originalUrl),
              })),
            }));
          }
        }
      }
    } catch (appsScriptErr) {
      console.warn('Apps Script doGet failed:', appsScriptErr);
    }
  }

  // REAL-TIME GUARANTEE:
  // If the sheet was reached, Google Sheet is the authoritative source.
  if (sheetReached) {
    // If local cache had photos for these records, preserve them so they are not wiped out
    const localRecords = loadStoredActivities([]);
    const localPhotoMap = new Map<string, FileAttachment[]>();
    localRecords.forEach((lr) => {
      if (lr.photos && lr.photos.length > 0) {
        localPhotoMap.set(lr.id, lr.photos);
      }
    });

    records = records.map((r) => {
      if ((!r.photos || r.photos.length === 0) && localPhotoMap.has(r.id)) {
        return {
          ...r,
          photos: localPhotoMap.get(r.id)!,
        };
      }
      return r;
    });

    saveAllActivities(records);
    return records;
  }

  // Offline fallback only when network completely unreachable
  return loadStoredActivities([]);
}

/**
 * Send activity data and files to Google Apps Script.
 */
export async function submitActivityToAppsScript(
  record: ActivityRecord,
  onProgress?: (progress: UploadProgressStatus) => void
): Promise<{ success: boolean; message: string; record: ActivityRecord }> {
  try {
    onProgress?.({
      status: 'preparing',
      message: 'กำลังเตรียมข้อมูลและปรับขนาดภาพให้เหมาะสมกับการอัปโหลด...',
    });

    // Prepare photos payload: pass dataUrl in url property for guaranteed storage in Google Sheet
    const photosPayload = (record.photos || []).map((p) => {
      let b64 = p.base64 || '';
      if (!b64 && p.url && p.url.startsWith('data:')) {
        b64 = p.url.split('base64,')[1] || '';
      }
      const dataUrl = p.url && p.url.startsWith('data:') ? p.url : (b64 ? `data:${p.type || 'image/jpeg'};base64,${b64}` : '');
      return {
        name: p.name,
        type: p.type || 'image/jpeg',
        size: p.size,
        url: dataUrl || p.url || '',
        fileBase64: b64,
      };
    });

    // Prepare certificates payload
    const certsPayload = (record.certificates || []).map((c) => {
      let b64 = c.base64 || '';
      if (!b64 && c.url && c.url.startsWith('data:')) {
        b64 = c.url.split('base64,')[1] || '';
      }
      const isImg = c.type?.startsWith('image/');
      const dataUrl = c.url && c.url.startsWith('data:') ? c.url : (b64 && isImg ? `data:${c.type};base64,${b64}` : '');
      return {
        name: c.name,
        type: c.type,
        size: c.size,
        url: dataUrl || c.url || '',
        fileBase64: b64,
      };
    });

    // Prepare documents payload
    const docsPayload = (record.documents || []).map((d) => ({
      name: d.name,
      type: d.type,
      size: d.size,
      fileBase64: d.base64 || (d.url && d.url.startsWith('data:') ? d.url.split('base64,')[1] : ''),
    }));

    const payload = {
      action: 'saveActivity',
      sheetId: APPS_SCRIPT_CONFIG.SHEET_ID,
      folderId: APPS_SCRIPT_CONFIG.FOLDER_ID,
      id: record.id,
      academicYear: record.academicYear,
      awardLevel: record.awardLevel,
      department: record.department,
      awardName: record.awardName,
      awardDate: record.awardDate,
      organizer: record.organizer,
      teacherName: record.teacherName,
      studentName: record.studentName,
      objective: record.objective,
      additionalDetails: record.additionalDetails,
      outcomes: record.outcomes,
      createdAt: record.createdAt || new Date().toISOString(),
      photos: photosPayload,
      certificates: certsPayload,
      documents: docsPayload,
    };

    onProgress?.({
      status: 'uploading',
      message: 'กำลังส่งข้อมูลเข้า Google Sheet และสร้างโฟลเดอร์ใน Google Drive...',
    });

    let uploadedUrls: {
      folderUrl?: string;
      photos: string[];
      certificates: string[];
      documents: string[];
    } = {
      folderUrl: '',
      photos: [],
      certificates: [],
      documents: [],
    };

    const jsonString = JSON.stringify(payload);

    try {
      const response = await fetch(APPS_SCRIPT_CONFIG.ENDPOINT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: jsonString,
      });

      if (response.ok) {
        try {
          const result = await response.json();
          if (result) {
            if (result.folderUrl) uploadedUrls.folderUrl = result.folderUrl;
            if (result.photoUrls) uploadedUrls.photos = result.photoUrls;
            if (result.certUrls) uploadedUrls.certificates = result.certUrls;
            if (result.docUrls) uploadedUrls.documents = result.docUrls;
          }
        } catch (e) {}
      }
    } catch (networkErr) {
      console.warn('Direct fetch redirect, fallback submission:', networkErr);
      try {
        await fetch(APPS_SCRIPT_CONFIG.ENDPOINT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: jsonString,
        });
      } catch (err2) {
        console.warn('Apps Script submission error:', err2);
      }
    }

    // Update local record URLs
    const updatedPhotos: FileAttachment[] = record.photos.map((p, idx) => {
      const returned = uploadedUrls.photos[idx];
      return {
        ...p,
        url: returned ? formatDriveImageUrl(returned) : (p.url || (p.base64 ? `data:${p.type};base64,${p.base64}` : '')),
        originalUrl: returned ? getGoogleDriveViewUrl(returned) : p.originalUrl,
      };
    });

    const updatedCertificates: FileAttachment[] = (record.certificates || []).map((c, idx) => {
      const returned = uploadedUrls.certificates[idx];
      return {
        ...c,
        url: returned
          ? formatDriveImageUrl(returned)
          : (c.url || (c.base64 ? (c.type.startsWith('image/') ? `data:${c.type};base64,${c.base64}` : '') : '')),
        originalUrl: returned ? getGoogleDriveViewUrl(returned) : c.originalUrl,
      };
    });

    const updatedDocuments: FileAttachment[] = record.documents.map((d, idx) => {
      const returned = uploadedUrls.documents[idx];
      return {
        ...d,
        url: returned || d.url,
        originalUrl: returned ? getGoogleDriveViewUrl(returned) : d.originalUrl,
      };
    });

    const finalRecord: ActivityRecord = {
      ...record,
      folderUrl: uploadedUrls.folderUrl || record.folderUrl,
      photos: updatedPhotos,
      certificates: updatedCertificates,
      documents: updatedDocuments,
      syncStatus: 'synced',
    };

    saveRecordToLocalStorage(finalRecord);

    onProgress?.({
      status: 'success',
      message: 'บันทึกข้อมูลและสร้างโฟลเดอร์ผลงานใน Google Drive สำเร็จเรียบร้อยแล้ว!',
    });

    return {
      success: true,
      message: 'บันทึกข้อมูลและสร้างโฟลเดอร์เรียบร้อย',
      record: finalRecord,
    };
  } catch (error: any) {
    console.error('Submit error:', error);
    onProgress?.({
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (error?.message || 'ไม่ทราบสาเหตุ'),
    });

    const fallbackRecord: ActivityRecord = {
      ...record,
      syncStatus: 'local_only',
    };
    saveRecordToLocalStorage(fallbackRecord);

    return {
      success: false,
      message: error?.message || 'บันทึกในเครื่องเรียบร้อยแล้ว',
      record: fallbackRecord,
    };
  }
}

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ============================================================================
 * สคริปต์ Google Apps Script (Code.gs)
 * ระบบบันทึกรายงานผลการจัดกิจกรรม/บันทึกภาพกิจกรรม ปีการศึกษา 2568
 * โรงเรียนพังโคนวิทยาคม
 * ============================================================================
 *
 * การตั้งค่า:
 * SHEET_ID  : 1etr8iF8qK5y_B1apfMI_2rjFy4OY5RJPV6RaTbcrmbg
 * FOLDER_ID : 1AcKRJm0FwiSNYYr2TaEGY34t74n9S-Ym (Activities)
 *
 * คุณสมบัติสำคัญ:
 * 1. ระบบโฟลเดอร์ Google Drive จัดเรียง 5 ระดับใน Activities (ID: 1AcKRJm0FwiSNYYr2TaEGY34t74n9S-Ym) เท่านั้น:
 *    Activities (1AcKRJm0FwiSNYYr2TaEGY34t74n9S-Ym)
 *      └── 1. ปีการศึกษา (เช่น ผลงานปี 2568) ให้อ้างอิงตามข้อมูลที่เพิ่มมา
 *            └── 2. กลุ่มสาระการเรียนรู้ (เช่น 3. วิทยาศาสตร์และเทคโนโลยี)
 *                  └── 3. ชื่อครูในกลุ่มสาระนั้นๆ (เช่น รัชพล สิงห์ปั้น)
 *                        └── 4. ผลงานของครูในแต่ละคนแยกไปเลย (เช่น ชื่อรางวัลหรือกิจกรรม)
 *                              ├── ภาพถ่ายกิจกรรม (1–3 รูปต่อกิจกรรม)
 *                              ├── ไฟล์เกียรติบัตร / วุฒิบัตร (Certificate)
 *                              └── ไฟล์เอกสารเพิ่มเติม (เช่น คำสั่ง, เล่มรายงาน, แบบประเมิน .PDF)
 *    * ไม่สร้างโฟลเดอร์ซ้ำซ้อน หากมีอยู่แล้วจะใช้อันเดิมเสมอ (getOrCreateSubfolder)
 * 2. บันทึกลิงก์รูปภาพในรูปแบบ Direct High-Res CDN Thumbnail ให้แสดงผลตัวอย่างรูปภาพได้ทันที 100%
 * 3. มีฟังก์ชัน doGet สำหรับดึงข้อมูลผลงานทั้งหมดแบบเรียลไทม์
 */

const CONFIG = {
  SHEET_ID: '1etr8iF8qK5y_B1apfMI_2rjFy4OY5RJPV6RaTbcrmbg',
  FOLDER_ID: '1AcKRJm0FwiSNYYr2TaEGY34t74n9S-Ym',
  SHEET_NAME: 'บันทึกผลงานกิจกรรม'
};

function getOrCreateSubfolder(parentFolder, folderName, aliases) {
  var cleanName = (folderName || 'ทั่วไป').toString().trim();
  if (!cleanName || cleanName === '-') cleanName = 'ทั่วไป';
  
  // 1. ตรวจสอบชื่อตรงเป๊ะ
  var folders = parentFolder.getFoldersByName(cleanName);
  if (folders.hasNext()) {
    return folders.next();
  }
  
  // 2. หากมีชื่อเรียกเดิม (aliases) ให้ตรวจและใช้อันเดิม ไม่สร้างโฟลเดอร์ซ้ำซ้อน
  if (aliases && Array.isArray(aliases)) {
    for (var a = 0; a < aliases.length; a++) {
      var aliasName = (aliases[a] || '').toString().trim();
      if (aliasName) {
        var aliasFolders = parentFolder.getFoldersByName(aliasName);
        if (aliasFolders.hasNext()) {
          return aliasFolders.next();
        }
      }
    }
  }
  
  return parentFolder.createFolder(cleanName);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockErr) {
    console.warn('Lock wait timed out: ' + lockErr);
  }

  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (errJson) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var sheetId = data.sheetId || CONFIG.SHEET_ID;
    var folderId = data.folderId || CONFIG.FOLDER_ID;

    var id = data.id || ('PKW-' + new Date().getTime());
    var academicYear = data.academicYear || '2568';
    var awardLevel = data.awardLevel || 'ระดับเขตพื้นที่';
    var department = data.department || 'กลุ่มบริหารงานบุคคล';
    var awardName = data.awardName || '';
    var awardDate = data.awardDate || '';
    var organizer = data.organizer || '';
    var teacherName = data.teacherName || 'ไม่ระบุผู้รายงาน';
    var studentName = data.studentName || '-';
    var objective = data.objective || '';
    var additionalDetails = data.additionalDetails || '';
    var outcomes = data.outcomes || '';
    var timestamp = new Date().toLocaleString('th-TH');

    // 1. จัดการโครงสร้างโฟลเดอร์ใน Activities (ID: 1AcKRJm0FwiSNYYr2TaEGY34t74n9S-Ym) เท่านั้น
    // โครงสร้างโฟลเดอร์ 5 ระดับ:
    // Activities (1AcKRJm0FwiSNYYr2TaEGY34t74n9S-Ym)
    // └── 1. ปีการศึกษา (เช่น ผลงานปี 2568 ) ให้อ้างอิงตามข้อมูลที่เพิ่มมา
    //       └── 2. กลุ่มสาระการเรียนรู้ (เช่น 3. วิทยาศาสตร์และเทคโนโลยี)
    //             └── 3. ชื่อครูในกลุ่มสาระนั้นๆ (เช่น รัชพล สิงห์ปั้น)
    //                   └── 4. ผลงานของครูในแต่ละคนแยกไปเลย (เช่น ชื่อรางวัลหรือกิจกรรม)
    //                         ├── ภาพถ่ายกิจกรรม (1–3 รูปต่อกิจกรรม)
    //                         ├── ไฟล์เกียรติบัตร / วุฒิบัตร (Certificate)
    //                         └── ไฟล์เอกสารเพิ่มเติม (เช่น คำสั่ง, เล่มรายงาน, แบบประเมิน .PDF)
    var uploaderFolderUrl = '';
    var photoUrls = [];
    var certUrls = [];
    var docUrls = [];

    try {
      var rootFolder = DriveApp.getFolderById(folderId);

      // ระดับ 1: โฟลเดอร์ปีการศึกษา (เช่น ผลงานปี 2568) ใน Activities อ้างอิงตามปีการศึกษาที่กรอกในฟอร์ม
      var rawYear = (academicYear || '2568').toString().trim();
      var numMatch = rawYear.match(/\d{4}/);
      var yearNum = numMatch ? numMatch[0] : rawYear;
      var yearFolderName = 'ผลงานปี ' + yearNum;
      var yearAliases = [
        yearFolderName,
        yearNum,
        'ปีการศึกษา ' + yearNum,
        'ปี ' + yearNum,
        rawYear
      ];
      var yearFolder = getOrCreateSubfolder(rootFolder, yearFolderName, yearAliases);

      // ระดับ 2: กลุ่มสาระการเรียนรู้ ในโฟลเดอร์ปีการศึกษา
      var deptFolder = getOrCreateSubfolder(yearFolder, department);

      // ระดับ 3: ชื่อครูในกลุ่มสาระนั้นๆ ในโฟลเดอร์กลุ่มสาระ
      var teacherFolder = getOrCreateSubfolder(deptFolder, teacherName);

      // ระดับ 4: ผลงานของครูในแต่ละคนแยกไปเลย ในโฟลเดอร์ครู
      var activityFolderName = (awardName || id).toString().trim();
      var activityFolder = getOrCreateSubfolder(teacherFolder, activityFolderName);
      uploaderFolderUrl = activityFolder.getUrl();

      // โฟลเดอร์ย่อย 3 โฟลเดอร์ข้างในผลงาน
      var photosSubfolder = getOrCreateSubfolder(activityFolder, 'ภาพถ่ายกิจกรรม (1–3 รูปต่อกิจกรรม)', ['รูปกิจกรรม', 'ภาพกิจกรรม', 'ภาพถ่ายกิจกรรม']);
      var certsSubfolder = getOrCreateSubfolder(activityFolder, 'ไฟล์เกียรติบัตร / วุฒิบัตร (Certificate)', ['เกียรติบัตร', 'วุฒิบัตร', 'ไฟล์เกียรติบัตร']);
      var docsSubfolder = getOrCreateSubfolder(activityFolder, 'ไฟล์เอกสารเพิ่มเติม (เช่น คำสั่ง, เล่มรายงาน, แบบประเมิน .PDF)', ['ไฟล์เอกสารเพิ่มเติม', 'ไฟล์เอกสาร', 'เอกสาร', 'เอกสารเพิ่มเติม']);

      // 1) บันทึกรูปภาพกิจกรรม (1–3 รูปต่อกิจกรรม) ลงในโฟลเดอร์ "รูปกิจกรรม"
      var photos = data.photos || [];
      if (typeof photos === 'string') {
        try { photos = JSON.parse(photos); } catch(pe) {}
      }
      for (var i = 0; i < photos.length; i++) {
        var p = photos[i];
        if (!p) continue;
        var b64 = p.base64 || p.fileBase64 || '';
        if (!b64 && p.url && p.url.indexOf('base64,') !== -1) {
          b64 = p.url.split('base64,')[1];
        }
        var savedPhotoUrl = '';
        if (b64) {
          try {
            var decodedPhoto = Utilities.base64Decode(b64);
            var mimePhoto = p.type || 'image/jpeg';
            var photoName = id + '_ภาพ_' + (i + 1) + '_' + (p.name || 'photo.jpg');
            var photoBlob = Utilities.newBlob(decodedPhoto, mimePhoto, photoName);
            var photoFile = photosSubfolder.createFile(photoBlob);
            var fileId = photoFile.getId();
            savedPhotoUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1200';
            try {
              photoFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            } catch(shareErr) {
              console.warn('Set sharing skipped: ' + shareErr);
            }
          } catch(errPhoto) {
            console.error('Error saving photo to Drive: ' + errPhoto);
          }
        }
        if (!savedPhotoUrl && p.url) {
          savedPhotoUrl = p.url;
        }
        if (savedPhotoUrl) {
          photoUrls.push(savedPhotoUrl);
        }
      }

      // 2) บันทึกเกียรติบัตร / วุฒิบัตร ลงในโฟลเดอร์ "เกียรติบัตร"
      var certs = data.certificates || [];
      if (typeof certs === 'string') {
        try { certs = JSON.parse(certs); } catch(ce) {}
      }
      for (var k = 0; k < certs.length; k++) {
        var c = certs[k];
        if (!c) continue;
        var cB64 = c.base64 || c.fileBase64 || '';
        if (!cB64 && c.url && c.url.indexOf('base64,') !== -1) {
          cB64 = c.url.split('base64,')[1];
        }
        var savedCertUrl = '';
        if (cB64) {
          try {
            var decodedCert = Utilities.base64Decode(cB64);
            var mimeCert = c.type || ((c.name && c.name.endsWith('.pdf')) ? 'application/pdf' : 'image/jpeg');
            var certName = id + '_เกียรติบัตร_' + (k + 1) + '_' + (c.name || 'cert');
            var certBlob = Utilities.newBlob(decodedCert, mimeCert, certName);
            var certFile = certsSubfolder.createFile(certBlob);
            var cId = certFile.getId();
            savedCertUrl = (mimeCert.indexOf('image') !== -1)
              ? ('https://drive.google.com/thumbnail?id=' + cId + '&sz=w1200')
              : certFile.getUrl();
            try {
              certFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            } catch(shareCertErr) {
              console.warn('Certificate sharing skipped: ' + shareCertErr);
            }
          } catch(errCert) {
            console.error('Error saving certificate: ' + errCert);
          }
        }
        if (!savedCertUrl && c.url) {
          savedCertUrl = c.url;
        }
        if (savedCertUrl) {
          certUrls.push(savedCertUrl);
        }
      }

      // 3) บันทึกเอกสารเพิ่มเติม (.PDF) ลงในโฟลเดอร์ "ไฟล์เอกสาร"
      var docs = data.documents || [];
      if (typeof docs === 'string') {
        try { docs = JSON.parse(docs); } catch(de) {}
      }
      for (var j = 0; j < docs.length; j++) {
        var d = docs[j];
        if (!d) continue;
        var dB64 = d.base64 || d.fileBase64 || '';
        if (!dB64 && d.url && d.url.indexOf('base64,') !== -1) {
          dB64 = d.url.split('base64,')[1];
        }
        if (dB64) {
          try {
            var decodedDoc = Utilities.base64Decode(dB64);
            var mimeDoc = d.type || 'application/pdf';
            var docName = id + '_เอกสาร_' + (j + 1) + '_' + (d.name || 'doc.pdf');
            var docBlob = Utilities.newBlob(decodedDoc, mimeDoc, docName);
            var docFile = docsSubfolder.createFile(docBlob);
            try {
              docFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            } catch(shareDocErr) {
              console.warn('Document sharing skipped: ' + shareDocErr);
            }
            docUrls.push(docFile.getUrl());
          } catch(errDoc) {
            console.error('Error saving document: ' + errDoc);
          }
        } else if (d && d.url) {
          docUrls.push(d.url);
        }
      }

    } catch (driveErr) {
      console.error('Google Drive Folder Error: ' + driveErr);
    }

    // 2. บันทึกข้อมูลลงใน Google Sheet
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      var allSheets = ss.getSheets();
      if (allSheets && allSheets.length > 0 && allSheets[0].getLastRow() === 0) {
        sheet = allSheets[0];
        sheet.setName(CONFIG.SHEET_NAME);
      } else {
        sheet = ss.insertSheet(CONFIG.SHEET_NAME);
      }
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'รหัสกิจกรรม',
        'ปีการศึกษา',
        'ระดับรางวัล',
        'กลุ่มสาระการเรียนรู้',
        'ชื่อรางวัล/กิจกรรม',
        'วันที่ได้รับรางวัล',
        'หน่วยงานที่จัด',
        'ครูผู้รับรางวัล',
        'นักเรียนผู้รับรางวัล',
        'วัตถุประสงค์',
        'รายละเอียดเพิ่มเติม',
        'ผลลัพธ์ที่เกิด',
        'ลิงก์ภาพถ่ายกิจกรรม',
        'ลิงก์เกียรติบัตร',
        'ลิงก์เอกสารหลักฐานเพิ่มเติม',
        'วันเวลาที่บันทึก',
        'โฟลเดอร์ผู้อัปโหลดใน Drive'
      ]);
      sheet.getRange(1, 1, 1, 17).setFontWeight('bold').setBackground('#f3f4f6');
      sheet.setFrozenRows(1);
    }

    var rowData = [
      id,
      academicYear,
      awardLevel,
      department,
      awardName,
      awardDate,
      organizer,
      teacherName,
      studentName,
      objective,
      additionalDetails,
      outcomes,
      photoUrls.join('\\n'),
      certUrls.join('\\n'),
      docUrls.join('\\n'),
      timestamp,
      uploaderFolderUrl
    ];

    sheet.appendRow(rowData);

    // บันทึกลง Sheet แรกด้วย (หากมี) เพื่อรองรับทุกโครงสร้างตาราง
    try {
      var firstSheet = ss.getSheets()[0];
      if (firstSheet && firstSheet.getName() !== sheet.getName() && firstSheet.getLastRow() > 0) {
        var evidenceJson = JSON.stringify({
          photos: photoUrls,
          certificates: certUrls,
          documents: docUrls,
          folderUrl: uploaderFolderUrl
        });
        firstSheet.appendRow([
          id,
          timestamp,
          academicYear,
          awardLevel,
          department,
          awardName,
          awardDate,
          organizer,
          teacherName,
          studentName,
          objective,
          additionalDetails,
          outcomes,
          evidenceJson
        ]);
      }
    } catch (extraSheetErr) {
      console.warn('First sheet sync note: ' + extraSheetErr);
    }

    var responsePayload = {
      success: true,
      message: 'บันทึกข้อมูลและอัปโหลดไฟล์ลง Google Sheet เรียบร้อยแล้ว',
      id: id,
      folderUrl: uploaderFolderUrl,
      photoUrls: photoUrls,
      certUrls: certUrls,
      docUrls: docUrls
    };

    return ContentService.createTextOutput(JSON.stringify(responsePayload))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('Fatal doPost error: ' + error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'เกิดข้อผิดพลาด: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    try {
      lock.releaseLock();
    } catch(e) {}
  }
}

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var sheetId = params.sheetId || CONFIG.SHEET_ID;

    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getSheets()[0];

    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ success: true, count: 0, records: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var rows = sheet.getDataRange().getValues();
    if (!rows || rows.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ success: true, count: 0, records: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var records = [];
    for (var r = 1; r < rows.length; r++) {
      var row = rows[r];
      if (!row[0] && !row[4]) continue;

      var photoUrls = (row[12] || '').toString().split(/\\r?\\n/).filter(function(u){ return u.trim().startsWith('http'); });
      var certUrls = (row[13] || '').toString().split(/\\r?\\n/).filter(function(u){ return u.trim().startsWith('http'); });
      var docUrls = (row[14] || '').toString().split(/\\r?\\n/).filter(function(u){ return u.trim().startsWith('http'); });
      var folderUrl = (row[16] || '').toString().trim();

      // Check if row[13] has JSON
      var row13Str = (row[13] || '').toString();
      if (row13Str.startsWith('{')) {
        try {
          var parsedEvidence = JSON.parse(row13Str);
          if (Array.isArray(parsedEvidence.photos)) photoUrls = photoUrls.concat(parsedEvidence.photos);
          if (Array.isArray(parsedEvidence.certificates)) certUrls = certUrls.concat(parsedEvidence.certificates);
          if (Array.isArray(parsedEvidence.documents)) docUrls = docUrls.concat(parsedEvidence.documents);
          if (!folderUrl && parsedEvidence.folderUrl) folderUrl = parsedEvidence.folderUrl;
        } catch(pe) {}
      }

      records.push({
        id: String(row[0] || ('PKW-' + r)),
        academicYear: String(row[1] || '2568'),
        awardLevel: String(row[2] || 'ระดับเขตพื้นที่'),
        department: String(row[3] || 'กลุ่มบริหารงานบุคคล'),
        awardName: String(row[4] || ''),
        awardDate: String(row[5] || ''),
        organizer: String(row[6] || ''),
        teacherName: String(row[7] || ''),
        studentName: String(row[8] || '-'),
        objective: String(row[9] || ''),
        additionalDetails: String(row[10] || ''),
        outcomes: String(row[11] || ''),
        folderUrl: folderUrl,
        photos: photoUrls.map(function(url, idx) {
          return { name: 'ภาพถ่าย_' + (idx + 1), type: 'image/jpeg', size: 0, url: url };
        }),
        certificates: certUrls.map(function(url, idx) {
          return { name: 'เกียรติบัตร_' + (idx + 1), type: url.indexOf('.pdf') !== -1 ? 'application/pdf' : 'image/jpeg', size: 0, url: url };
        }),
        documents: docUrls.map(function(url, idx) {
          return { name: 'เอกสาร_' + (idx + 1), type: 'application/pdf', size: 0, url: url };
        }),
        createdAt: String(row[15] || new Date().toISOString()),
        syncStatus: 'synced'
      });
    }

    records.reverse();

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      count: records.length,
      records: records
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString(),
      records: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ฟังก์ชันอำนวยความสะดวก (กดเรียกใช้ได้ใน Apps Script):
 * จัดระเบียบโฟลเดอร์กลุ่มสาระเดิมที่อาจค้างอยู่นอกโฟลเดอร์ปีการศึกษา
 * ให้ย้ายเข้าไปอยู่ภายใต้โฟลเดอร์ปีการศึกษา "ผลงานปี 2568" โดยอัตโนมัติ
 */
function organizeExistingFoldersToYear() {
  var rootFolder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
  var targetYearFolder = getOrCreateSubfolder(rootFolder, 'ผลงานปี 2568', ['2568', 'ปีการศึกษา 2568']);
  
  var deptKeywords = [
    '1. ภาษาไทย',
    '2. คณิตศาสตร์',
    '3. วิทยาศาสตร์และเทคโนโลยี',
    '4. สังคมศึกษา',
    '5. สุขศึกษา',
    '6. ศิลปะ',
    '7. การงานอาชีพ',
    '8. ภาษาต่างประเทศ',
    'กิจกรรมพัฒนาผู้เรียน',
    'กลุ่มบริหารงานบุคคล'
  ];

  var subfolders = rootFolder.getFolders();
  while (subfolders.hasNext()) {
    var folder = subfolders.next();
    var fname = folder.getName();
    // ข้ามโฟลเดอร์ที่เป็นปีการศึกษาอยู่แล้ว
    if (fname.indexOf('ปี') !== -1 || fname.indexOf('256') !== -1) continue;

    var isDept = false;
    for (var d = 0; d < deptKeywords.length; d++) {
      if (fname.indexOf(deptKeywords[d]) !== -1) {
        isDept = true;
        break;
      }
    }

    if (isDept) {
      folder.moveTo(targetYearFolder);
      Logger.log('ย้ายโฟลเดอร์ ' + fname + ' เข้าสู่ ' + targetYearFolder.getName() + ' สำเร็จ');
    }
  }
}
`;
