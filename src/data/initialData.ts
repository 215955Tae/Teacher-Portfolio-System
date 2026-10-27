import { ActivityRecord } from '../types';

export const INITIAL_RECORDS: ActivityRecord[] = [];

export const DEPARTMENTS: { id: string; name: string }[] = [
  { id: '1', name: '1. ภาษาไทย' },
  { id: '2', name: '2. คณิตศาสตร์' },
  { id: '3', name: '3. วิทยาศาสตร์และเทคโนโลยี' },
  { id: '4', name: '4. สังคมศึกษา ศาสนา และวัฒนธรรม' },
  { id: '5', name: '5. สุขศึกษาและพลศึกษา' },
  { id: '6', name: '6. ศิลปะ' },
  { id: '7', name: '7. การงานอาชีพ' },
  { id: '8', name: '8. ภาษาต่างประเทศ' },
  { id: '9', name: '9. แนะแนว' },
];

export const AWARD_LEVELS = [
  'ระดับชาติ',
  'ระดับภาค',
  'ระดับเขตพื้นที่',
  'ระดับกลุ่มโรงเรียน',
  'ระดับโรงเรียน',
] as const;

export const ACADEMIC_YEARS = ['2568', '2567', '2566', '2565'] as const;
