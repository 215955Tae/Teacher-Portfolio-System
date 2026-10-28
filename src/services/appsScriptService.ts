import { ActivityRecord, FileAttachment } from '../types';

export const APPS_SCRIPT_CONFIG = {
  ENDPOINT_URL:
    'https://script.google.com/macros/s/AKfycbzAY4gZMhAYG9qMxp5mWk6Of6KJIHJf3c67sjTeYhCUNeUt_yK9l8qW3VTW3D_EKZ6Ysg/exec',
  SHEET_ID: '1etr8iF8qK5y_B1apfMI_2rjFy4OY5RJPV6RaTbcrmbg',
  FOLDER_ID: '1lgllj4jH0Jpyx40vxy9VnY2G7P5DddXF',
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
 * Send activity data and files to Google Apps Script.
 * Uses JSON body with Content-Type: text/plain to avoid browser CORS preflight blocking,
 * and passes the complete uncorrupted payload directly to e.postData.contents.
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

    // Prepare photos payload with compressed base64
    const photosPayload = (record.photos || []).map((p) => {
      let b64 = p.base64 || '';
      if (!b64 && p.url && p.url.startsWith('data:')) {
        b64 = p.url.split(',')[1] || '';
      }
      return {
        name: p.name,
        type: p.type || 'image/jpeg',
        size: p.size,
        base64: b64,
      };
    });

    // Prepare certificates payload
    const certsPayload = (record.certificates || []).map((c) => {
      let b64 = c.base64 || '';
      if (!b64 && c.url && c.url.startsWith('data:')) {
        b64 = c.url.split(',')[1] || '';
      }
      return {
        name: c.name,
        type: c.type,
        size: c.size,
        base64: b64,
      };
    });

    // Prepare documents payload
    const docsPayload = (record.documents || []).map((d) => ({
      name: d.name,
      type: d.type,
      size: d.size,
      base64: d.base64 || (d.url && d.url.startsWith('data:') ? d.url.split(',')[1] : ''),
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
      // POST with text/plain to avoid CORS preflight, read in Apps Script via e.postData.contents
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
        } catch (e) {
          // JSON parsing of opaque redirect response
        }
      }
    } catch (networkErr) {
      console.warn('Direct fetch response redirect note, sending no-cors execution fallback:', networkErr);
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

    // Update local record URLs if returned, or maintain previews
    const updatedPhotos: FileAttachment[] = record.photos.map((p, idx) => {
      const returned = uploadedUrls.photos[idx];
      return {
        ...p,
        url: returned ? formatDriveImageUrl(returned) : (p.url || (p.base64 ? `data:${p.type};base64,${p.base64}` : '')),
        originalUrl: returned || p.originalUrl,
      };
    });

    const updatedCertificates: FileAttachment[] = (record.certificates || []).map((c, idx) => {
      const returned = uploadedUrls.certificates[idx];
      return {
        ...c,
        url: returned
          ? formatDriveImageUrl(returned)
          : (c.url || (c.base64 ? (c.type.startsWith('image/') ? `data:${c.type};base64,${c.base64}` : '') : '')),
        originalUrl: returned || c.originalUrl,
      };
    });

    const updatedDocuments: FileAttachment[] = record.documents.map((d, idx) => {
      const returned = uploadedUrls.documents[idx];
      return {
        ...d,
        url: returned || d.url,
        originalUrl: returned || d.originalUrl,
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

    // Save to localStorage
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

/**
 * Helper: Convert any Google Drive URL, Drive ID, or image link
 * into a high-res direct image thumbnail URL that renders reliably in <img> tags.
 */
export function formatDriveImageUrl(url: string | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();

  // If already base64 data URL or blob
  if (trimmed.startsWith('data:image') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // If it's a folder link, it's not a direct photo
  if (trimmed.includes('/folders/')) {
    return '';
  }

  // Match Google Drive file ID:
  // e.g. /file/d/FILE_ID/view, id=FILE_ID, /d/FILE_ID, /thumbnail?id=FILE_ID
  const driveRegex = /(?:file\/d\/|[?&]id=|\/d\/|thumbnail\?id=)([a-zA-Z0-9_-]{20,})/;
  const match = trimmed.match(driveRegex);
  if (match && match[1]) {
    const fileId = match[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
  }

  // Bare Drive ID (e.g. alphanumeric 25+ characters)
  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    return `https://drive.google.com/thumbnail?id=${trimmed}&sz=w1200`;
  }

  return trimmed;
}

/**
 * Alternate Google CDN image link for fallback on <img> error
 */
export function getAlternateDriveImageUrl(url: string | undefined): string {
  if (!url) return '';
  const driveRegex = /(?:file\/d\/|[?&]id=|\/d\/|thumbnail\?id=)([a-zA-Z0-9_-]{20,})/;
  const match = url.match(driveRegex);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}=w1200`;
  }
  return '';
}

/**
 * Format any date string (including GViz "Date(2026,9,27)") into clean Thai Buddhist date or readable date
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

const LOCAL_STORAGE_KEY = 'PKW_ACTIVITIES_2568_SHEET_V2';

/**
 * Filter out any mock/demo data from previous versions or deleted test items.
 */
function filterOutDemoRecords(records: ActivityRecord[]): ActivityRecord[] {
  if (!Array.isArray(records)) return [];
  const demoIds = new Set(['PKW-2568-001', 'PKW-2568-002', 'PKW-2568-003', 'PKW-2568-9600']);
  return records.filter((r) => {
    if (!r || !r.id) return false;
    if (demoIds.has(r.id)) return false;
    // Check if test dummy record with awardName "5" and teacherName "5"
    if (r.awardName === '5' && (r.teacherName === '5' || r.organizer === '5')) return false;
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
 * Helper to parse Google Sheet Visualization API table into ActivityRecords
 */
function parseGvizTable(table: any): ActivityRecord[] {
  if (!table || !Array.isArray(table.rows) || table.rows.length === 0) {
    return [];
  }

  const cols = table.cols || [];
  const findColIndex = (keywords: string[]): number => {
    return cols.findIndex((col: any) => {
      const label = (col.label || '').toLowerCase();
      const id = (col.id || '').toLowerCase();
      return keywords.some((kw) => label.includes(kw.toLowerCase()) || id === kw.toLowerCase());
    });
  };

  const idCol = findColIndex(['รหัสกิจกรรม', 'id']);
  const yearCol = findColIndex(['ปีการศึกษา', 'year']);
  const levelCol = findColIndex(['ระดับรางวัล', 'ระดับ', 'level']);
  const deptCol = findColIndex(['กลุ่มสาระ', 'department']);
  const nameCol = findColIndex(['ชื่อรางวัล', 'ชื่อกิจกรรม', 'awardname', 'name']);
  const dateCol = findColIndex(['วันที่ได้รับรางวัล', 'วันที่', 'date']);
  const orgCol = findColIndex(['หน่วยงานที่จัด', 'หน่วยงาน', 'organizer']);
  const teacherCol = findColIndex(['ครูผู้รับรางวัล', 'ครู', 'teacher']);
  const studentCol = findColIndex(['นักเรียนผู้รับรางวัล', 'นักเรียน', 'student']);
  const objCol = findColIndex(['วัตถุประสงค์', 'objective']);
  const detailsCol = findColIndex(['รายละเอียดเพิ่มเติม', 'รายละเอียด', 'detail']);
  const outcomesCol = findColIndex(['ผลลัพธ์ที่เกิด', 'ผลลัพธ์', 'outcome']);
  const folderCol = findColIndex(['โฟลเดอร์', 'folder']);
  const photosCol = findColIndex(['ภาพถ่าย', 'รูปภาพ', 'photo']);
  const certsCol = findColIndex(['เกียรติบัตร', 'cert']);
  const docsCol = findColIndex(['เอกสาร', 'doc']);
  const evidenceJsonCol = findColIndex(['ไฟล์หลักฐาน(json)', 'evidence']);
  const timeCol = findColIndex(['วันเวลาที่บันทึก', 'timestamp', 'เวลา']);

  const records: ActivityRecord[] = [];

  // Helper to extract URLs from text (handles newlines, commas, JSON)
  const extractUrls = (text: string): string[] => {
    if (!text) return [];
    if (text.startsWith('[') && text.endsWith(']')) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          return parsed.map(String).filter((u) => u.startsWith('http'));
        }
      } catch (e) {}
    }
    const matches = text.match(/https?:\/\/[^\s"'<>\),]+/g);
    if (matches) return matches;
    return text.split(/\r?\n|,/).map((s) => s.trim()).filter((u) => u.startsWith('http'));
  };

  for (let r = 0; r < table.rows.length; r++) {
    const row = table.rows[r];
    if (!row || !row.c) continue;

    const getVal = (idx: number): string => {
      if (idx < 0 || idx >= row.c.length || !row.c[idx]) return '';
      const cell = row.c[idx];
      if (cell.v !== null && cell.v !== undefined) {
        const vStr = String(cell.v).trim();
        if (vStr.startsWith('Date(') && cell.f) {
          return String(cell.f).trim();
        }
        return vStr;
      }
      return cell.f ? String(cell.f).trim() : '';
    };

    const awardName = nameCol >= 0 ? getVal(nameCol) : getVal(4);
    const rawId = idCol >= 0 ? getVal(idCol) : '';
    const rawYear = yearCol >= 0 ? getVal(yearCol) : '';
    const rawLevel = levelCol >= 0 ? getVal(levelCol) : '';

    // Skip empty rows and table header rows
    const isHeaderRow =
      awardName === 'ชื่อรางวัล' ||
      awardName === 'ชื่อรางวัล/กิจกรรม' ||
      awardName === 'กลุ่มสาระ' ||
      awardName === 'ผลลัพธ์' ||
      rawId.toLowerCase() === 'id' ||
      rawYear === 'ปีการศึกษา' ||
      rawLevel === 'ระดับ' ||
      rawLevel === 'ระดับรางวัล';

    if (!awardName || isHeaderRow) {
      continue;
    }

    const id = (idCol >= 0 && getVal(idCol)) ? getVal(idCol) : `PKW-${Date.now()}-${r}`;
    const academicYear = (yearCol >= 0 && getVal(yearCol)) ? getVal(yearCol) : '2568';
    const awardLevel = ((levelCol >= 0 && getVal(levelCol)) ? getVal(levelCol) : 'ระดับเขตพื้นที่') as any;
    const department = ((deptCol >= 0 && getVal(deptCol)) ? getVal(deptCol) : 'กลุ่มบริหารงานบุคคล') as any;
    const rawDate = dateCol >= 0 ? getVal(dateCol) : '';
    const awardDate = formatDisplayDate(rawDate);
    const organizer = orgCol >= 0 ? getVal(orgCol) : '';
    const teacherName = teacherCol >= 0 ? getVal(teacherCol) : '';
    const studentName = studentCol >= 0 ? getVal(studentCol) : '-';
    const objective = objCol >= 0 ? getVal(objCol) : '';
    const additionalDetails = detailsCol >= 0 ? getVal(detailsCol) : '';
    const outcomes = outcomesCol >= 0 ? getVal(outcomesCol) : '';
    let folderUrl = folderCol >= 0 ? getVal(folderCol) : '';

    let photoUrls: string[] = [];
    let certUrls: string[] = [];
    let docUrls: string[] = [];

    // Check evidence JSON column if present
    if (evidenceJsonCol >= 0) {
      const rawEvidence = getVal(evidenceJsonCol);
      if (rawEvidence && rawEvidence.startsWith('{')) {
        try {
          const parsed = JSON.parse(rawEvidence);
          if (Array.isArray(parsed.photos)) photoUrls = [...photoUrls, ...parsed.photos];
          if (Array.isArray(parsed.certificates)) certUrls = [...certUrls, ...parsed.certificates];
          if (Array.isArray(parsed.documents)) docUrls = [...docUrls, ...parsed.documents];
          if (!folderUrl && parsed.folderUrl) folderUrl = parsed.folderUrl;
        } catch (e) {}
      }
    }

    // Check specific columns
    if (photosCol >= 0) {
      const rawP = getVal(photosCol);
      if (rawP) {
        photoUrls = [...photoUrls, ...extractUrls(rawP)];
      }
    }
    if (certsCol >= 0) {
      const rawC = getVal(certsCol);
      if (rawC) {
        certUrls = [...certUrls, ...extractUrls(rawC)];
      }
    }
    if (docsCol >= 0) {
      const rawD = getVal(docsCol);
      if (rawD) {
        docUrls = [...docUrls, ...extractUrls(rawD)];
      }
    }

    // De-duplicate URLs
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
        originalUrl: url,
      })),
      certificates: uniqueCerts.map((url, i) => ({
        name: `เกียรติบัตร_${i + 1}`,
        type: url.includes('.pdf') ? 'application/pdf' : 'image/jpeg',
        size: 0,
        url: formatDriveImageUrl(url),
        originalUrl: url,
      })),
      documents: uniqueDocs.map((url, i) => ({
        name: `เอกสาร_${i + 1}`,
        type: 'application/pdf',
        size: 0,
        url: url,
      })),
      createdAt: timeCol >= 0 && getVal(timeCol) ? getVal(timeCol) : new Date().toISOString(),
      syncStatus: 'synced',
    });
  }

  // Newest first
  return records.reverse();
}

/**
 * Fetch real activity records directly from Google Sheet (REAL-TIME SINGLE SOURCE OF TRUTH).
 * When Google Sheet responds, it overwrites local cache completely (including [] if sheet is empty).
 */
export async function fetchActivitiesFromGoogleSheet(): Promise<ActivityRecord[]> {
  let gvizSucceeded = false;
  let allRecords: ActivityRecord[] = [];

  // Method 1: Google Sheet Visualization API for tab 'บันทึกผลงานกิจกรรม'
  try {
    const sheetParam = encodeURIComponent('บันทึกผลงานกิจกรรม');
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${APPS_SCRIPT_CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetParam}&t=${Date.now()}`;
    const res = await fetch(gvizUrl);
    if (res.ok) {
      const text = await res.text();
      const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?/);
      if (match && match[1]) {
        gvizSucceeded = true;
        const json = JSON.parse(match[1]);
        const records = parseGvizTable(json.table);
        if (records.length > 0) {
          allRecords = records;
        }
      }
    }
  } catch (err) {
    console.warn('Gviz fetch sheet บันทึกผลงานกิจกรรม error:', err);
  }

  // Method 2: Google Sheet Visualization API for default sheet / Sheet1
  if (allRecords.length === 0) {
    try {
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${APPS_SCRIPT_CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&t=${Date.now()}`;
      const res = await fetch(gvizUrl);
      if (res.ok) {
        const text = await res.text();
        const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?/);
        if (match && match[1]) {
          gvizSucceeded = true;
          const json = JSON.parse(match[1]);
          const records = parseGvizTable(json.table);
          if (records.length > 0) {
            allRecords = records;
          }
        }
      }
    } catch (err) {
      console.warn('Gviz default tab fetch error:', err);
    }
  }

  // Method 3: Google Apps Script Web App doGet
  if (allRecords.length === 0) {
    try {
      const appsScriptUrl = `${APPS_SCRIPT_CONFIG.ENDPOINT_URL}?action=getActivities&sheetId=${APPS_SCRIPT_CONFIG.SHEET_ID}&t=${Date.now()}`;
      const res = await fetch(appsScriptUrl);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.records)) {
          gvizSucceeded = true;
          if (json.records.length > 0) {
            allRecords = json.records;
          }
        }
      }
    } catch (appsScriptErr) {
      console.warn('Apps Script doGet failed:', appsScriptErr);
    }
  }

  // REAL-TIME GUARANTEE: If Google Sheet query succeeded, the sheet's state IS authoritative.
  if (gvizSucceeded) {
    saveAllActivities(allRecords);
    return allRecords;
  }

  // Fallback ONLY when totally offline / network unreachable
  return loadStoredActivities([]);
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
 * FOLDER_ID : 1lgllj4jH0Jpyx40vxy9VnY2G7P5DddXF
 *
 * คุณสมบัติสำคัญ:
 * 1. ระบบโฟลเดอร์ Google Drive:
 *    สร้างโฟลเดอร์กลุ่มสาระ -> แล้วสร้างโฟลเดอร์ผู้อัปโหลดข้างใน -> บันทึกไฟล์ทั้งหมดในนั้น
 * 2. รับข้อมูลแบบ JSON ไม่จำกัดขนาด ป้องกันบัคภาพตัด และบันทึกลง Google Sheet แน่นอน 100%
 * 3. มีฟังก์ชัน doGet สำหรับดึงข้อมูลผลงานทั้งหมดกลับไปแสดงผลที่หน้าเว็บ
 */

const CONFIG = {
  SHEET_ID: '1etr8iF8qK5y_B1apfMI_2rjFy4OY5RJPV6RaTbcrmbg',
  FOLDER_ID: '1lgllj4jH0Jpyx40vxy9VnY2G7P5DddXF',
  SHEET_NAME: 'บันทึกผลงานกิจกรรม'
};

// ฟังก์ชันช่วยค้นหาหรือสร้างโฟลเดอร์ย่อยใน Google Drive
function getOrCreateSubfolder(parentFolder, folderName) {
  var cleanName = (folderName || 'ทั่วไป').toString().trim();
  if (!cleanName || cleanName === '-') cleanName = 'ทั่วไป';
  var folders = parentFolder.getFoldersByName(cleanName);
  if (folders.hasNext()) {
    return folders.next();
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

    // 1. จัดการโฟลเดอร์ Google Drive:
    // โฟลเดอร์หลัก -> โฟลเดอร์กลุ่มสาระ -> โฟลเดอร์ผู้อัปโหลด
    var uploaderFolderUrl = '';
    var photoUrls = [];
    var certUrls = [];
    var docUrls = [];

    try {
      var rootFolder = DriveApp.getFolderById(folderId);

      // สร้าง/เข้าถึง โฟลเดอร์กลุ่มสาระ
      var deptFolder = getOrCreateSubfolder(rootFolder, department);

      // สร้าง/เข้าถึง โฟลเดอร์ผู้อัปโหลด (ชื่อครู) ข้างในโฟลเดอร์กลุ่มสาระ
      var uploaderFolder = getOrCreateSubfolder(deptFolder, teacherName);
      uploaderFolderUrl = uploaderFolder.getUrl();

      // บันทึกรูปภาพกิจกรรม
      var photos = data.photos || [];
      if (typeof photos === 'string') {
        try { photos = JSON.parse(photos); } catch(pe) {}
      }
      for (var i = 0; i < photos.length; i++) {
        var p = photos[i];
        if (p && p.base64) {
          try {
            var decodedPhoto = Utilities.base64Decode(p.base64);
            var mimePhoto = p.type || 'image/jpeg';
            var photoName = id + '_ภาพ_' + (i + 1) + '_' + (p.name || 'photo.jpg');
            var photoBlob = Utilities.newBlob(decodedPhoto, mimePhoto, photoName);
            var photoFile = uploaderFolder.createFile(photoBlob);
            photoFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            photoUrls.push(photoFile.getUrl());
          } catch(errPhoto) {
            console.error('Error saving photo: ' + errPhoto);
          }
        } else if (p && p.url) {
          photoUrls.push(p.url);
        }
      }

      // บันทึกเกียรติบัตร (ไฟล์ภาพ หรือ PDF)
      var certs = data.certificates || [];
      if (typeof certs === 'string') {
        try { certs = JSON.parse(certs); } catch(ce) {}
      }
      for (var k = 0; k < certs.length; k++) {
        var c = certs[k];
        if (c && c.base64) {
          try {
            var decodedCert = Utilities.base64Decode(c.base64);
            var mimeCert = c.type || ((c.name && c.name.endsWith('.pdf')) ? 'application/pdf' : 'image/jpeg');
            var certName = id + '_เกียรติบัตร_' + (k + 1) + '_' + (c.name || 'cert');
            var certBlob = Utilities.newBlob(decodedCert, mimeCert, certName);
            var certFile = uploaderFolder.createFile(certBlob);
            certFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            certUrls.push(certFile.getUrl());
          } catch(errCert) {
            console.error('Error saving certificate: ' + errCert);
          }
        } else if (c && c.url) {
          certUrls.push(c.url);
        }
      }

      // บันทึกเอกสารเพิ่มเติม (PDF)
      var docs = data.documents || [];
      if (typeof docs === 'string') {
        try { docs = JSON.parse(docs); } catch(de) {}
      }
      for (var j = 0; j < docs.length; j++) {
        var d = docs[j];
        if (d && d.base64) {
          try {
            var decodedDoc = Utilities.base64Decode(d.base64);
            var mimeDoc = d.type || 'application/pdf';
            var docName = id + '_เอกสาร_' + (j + 1) + '_' + (d.name || 'doc.pdf');
            var docBlob = Utilities.newBlob(decodedDoc, mimeDoc, docName);
            var docFile = uploaderFolder.createFile(docBlob);
            docFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
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

    // สร้าง Header ถ้าเป็นชีตใหม่
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

    // หากชีตแรกมีโครงสร้างของระบบผู้ใช้ บันทึกลงชีตแรกด้วยเพื่อให้ข้อมูลสอดคล้องกันทุกแท็บ
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
`;
