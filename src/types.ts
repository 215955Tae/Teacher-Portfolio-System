export type AwardLevel =
  | 'ระดับชาติ'
  | 'ระดับภาค'
  | 'ระดับเขตพื้นที่'
  | 'ระดับกลุ่มโรงเรียน'
  | 'ระดับโรงเรียน';

export type SubjectDepartment =
  | '1. ภาษาไทย'
  | '2. คณิตศาสตร์'
  | '3. วิทยาศาสตร์และเทคโนโลยี'
  | '4. สังคมศึกษา ศาสนา และวัฒนธรรม'
  | '5. สุขศึกษาและพลศึกษา'
  | '6. ศิลปะ'
  | '7. การงานอาชีพ'
  | '8. ภาษาต่างประเทศ'
  | '9. แนะแนว';

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  base64?: string;
  url?: string;
  originalUrl?: string;
}

export interface ActivityRecord {
  id: string;
  academicYear: string; // e.g. "2568", "2567", "2566"
  awardLevel: AwardLevel;
  department: SubjectDepartment;
  awardName: string;
  awardDate: string; // YYYY-MM-DD or Thai date
  organizer: string;
  teacherName: string;
  studentName: string;
  objective: string;
  additionalDetails: string;
  outcomes: string;
  photos: FileAttachment[]; // 1-3 images
  certificates: FileAttachment[]; // เกียรติบัตร (ไฟล์ภาพ หรือ PDF)
  documents: FileAttachment[]; // PDF or docs เพิ่มเติม
  folderUrl?: string; // ลิงก์โฟลเดอร์ Google Drive ของกลุ่มสาระ/ผู้อัปโหลด
  createdAt: string;
  syncStatus?: 'synced' | 'local_only' | 'pending';
}

export interface FilterState {
  academicYear: string;
  awardLevel: string;
  department: string;
  keyword: string; // Search teacher / student / award name
}
