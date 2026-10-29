import React, { useState } from 'react';
import {
  Upload,
  Image as ImageIcon,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Award,
  Layers,
  School,
  User,
  GraduationCap,
  Sparkles,
  Save,
  ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ActivityRecord,
  AwardLevel,
  SubjectDepartment,
  FileAttachment,
} from '../types';
import {
  DEPARTMENTS,
  AWARD_LEVELS,
  ACADEMIC_YEARS,
} from '../data/initialData';
import {
  fileToBase64,
  compressImageFile,
  submitActivityToAppsScript,
  UploadProgressStatus,
  APPS_SCRIPT_CONFIG,
} from '../services/appsScriptService';

interface ActivityFormProps {
  onSuccess: (newRecord: ActivityRecord) => void;
  onCancel: () => void;
}

export const ActivityForm: React.FC<ActivityFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  // Form State
  const [academicYear, setAcademicYear] = useState<string>('2568');
  const [awardLevel, setAwardLevel] = useState<AwardLevel>('ระดับชาติ');
  const [department, setDepartment] = useState<SubjectDepartment>(
    '3. วิทยาศาสตร์และเทคโนโลยี'
  );
  const [awardName, setAwardName] = useState<string>('');
  const [awardDate, setAwardDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [organizer, setOrganizer] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('-');
  const [objective, setObjective] = useState<string>('');
  const [additionalDetails, setAdditionalDetails] = useState<string>('');
  const [outcomes, setOutcomes] = useState<string>('');

  // Files State (1-3 photos, certificates, .pdf docs)
  const [photos, setPhotos] = useState<FileAttachment[]>([]);
  const [certificates, setCertificates] = useState<FileAttachment[]>([]);
  const [documents, setDocuments] = useState<FileAttachment[]>([]);

  // Submission & Progress State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [progress, setProgress] = useState<UploadProgressStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Handle Photo Pick (1-3 photos)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileList = Array.from(e.target.files);

    if (photos.length + fileList.length > 3) {
      alert('สามารถแนบภาพถ่ายกิจกรรมได้ไม่เกิน 3 ภาพต่อกิจกรรม');
      return;
    }

    const newPhotos: FileAttachment[] = [];
    for (const file of fileList) {
      // Validate image
      if (!file.type.startsWith('image/')) {
        alert(`ไฟล์ "${file.name}" ไม่ใช่ไฟล์รูปภาพ`);
        continue;
      }
      try {
        const base64 = await compressImageFile(file);
        newPhotos.push({
          name: file.name,
          type: 'image/jpeg',
          size: file.size,
          base64: base64,
          url: `data:image/jpeg;base64,${base64}`,
        });
      } catch (err) {
        console.error('Error reading image', err);
      }
    }

    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 3));
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Certificate Pick (เกียรติบัตร - รองรับทั้งรูปภาพและ PDF)
  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileList = Array.from(e.target.files);

    const newCerts: FileAttachment[] = [];
    for (const file of fileList) {
      try {
        const isImage = file.type.startsWith('image/');
        const base64 = isImage ? await compressImageFile(file) : await fileToBase64(file);
        newCerts.push({
          name: file.name,
          type: isImage ? 'image/jpeg' : (file.type || 'application/pdf'),
          size: file.size,
          base64: base64,
          url: isImage ? `data:image/jpeg;base64,${base64}` : undefined,
        });
      } catch (err) {
        console.error('Error reading certificate file', err);
      }
    }

    setCertificates((prev) => [...prev, ...newCerts]);
    e.target.value = '';
  };

  const removeCertificate = (index: number) => {
    setCertificates((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Document (.pdf) Pick
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileList = Array.from(e.target.files);

    const newDocs: FileAttachment[] = [];
    for (const file of fileList) {
      try {
        const base64 = await fileToBase64(file);
        newDocs.push({
          name: file.name,
          type: file.type || 'application/pdf',
          size: file.size,
          base64: base64,
        });
      } catch (err) {
        console.error('Error reading document', err);
      }
    }

    setDocuments((prev) => [...prev, ...newDocs]);
    e.target.value = '';
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!academicYear.trim()) {
      setErrorMessage('กรุณาระบุปีการศึกษา (เช่น 2568, 2569)');
      return;
    }
    if (!awardName.trim()) {
      setErrorMessage('กรุณาระบุชื่อรางวัลหรือชื่อกิจกรรม');
      return;
    }
    if (!awardDate) {
      setErrorMessage('กรุณาระบุวันที่ได้รับรางวัล');
      return;
    }
    if (!teacherName.trim() && (!studentName.trim() || studentName.trim() === '-')) {
      setErrorMessage('กรุณาระบุชื่อครู หรือชื่อนักเรียนผู้รับรางวัลอย่างน้อย 1 ช่อง');
      return;
    }

    setIsSubmitting(true);

    const newRecordId = `PKW-${academicYear}-${Date.now().toString().slice(-4)}`;

    const newRecord: ActivityRecord = {
      id: newRecordId,
      academicYear,
      awardLevel,
      department,
      awardName: awardName.trim(),
      awardDate,
      organizer: organizer.trim() || 'โรงเรียนพังโคนวิทยาคม',
      teacherName: teacherName.trim() || '-',
      studentName: studentName.trim() || '-',
      objective: objective.trim(),
      additionalDetails: additionalDetails.trim(),
      outcomes: outcomes.trim(),
      photos,
      certificates,
      documents,
      createdAt: new Date().toISOString(),
      syncStatus: 'pending',
    };

    try {
      const result = await submitActivityToAppsScript(newRecord, (p) => {
        setProgress(p);
      });

      setSavedSuccess(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        onSuccess(result.record);
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header bar */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="ย้อนกลับ"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600"></span>
              บันทึกข้อมูลกิจกรรมและผลงาน
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ระบบบันทึกรายงานผลการจัดกิจกรรม กลุ่มบริหารงานบุคคล โรงเรียนพังโคนวิทยาคม
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>เชื่อมต่อ Google Apps Script อัตโนมัติ</span>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: ข้อมูลพื้นฐานรางวัลและกลุ่มสาระ */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 space-y-5">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 pb-3 border-b border-slate-100">
            <Award className="w-4 h-4 text-red-600" />
            1. ข้อมูลผลงานและกลุ่มสาระการเรียนรู้
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* ปีการศึกษา (กรอกข้อมูลปีได้เอง) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ปีการศึกษา <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="กรอกปีการศึกษา เช่น 2568, 2569"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400">เลือกด่วน:</span>
                {['2568', '2569', '2570', '2567'].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setAcademicYear(yr)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                      academicYear === yr
                        ? 'bg-red-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            {/* ระดับรางวัล */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ระดับรางวัล <span className="text-red-500">*</span>
              </label>
              <select
                value={awardLevel}
                onChange={(e) => setAwardLevel(e.target.value as AwardLevel)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              >
                {AWARD_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            {/* วันที่ได้รับรางวัล */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                วันที่ได้รับรางวัล / ประกาศผล <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={awardDate}
                onChange={(e) => setAwardDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* กลุ่มสาระการเรียนรู้ (8 กลุ่มสาระ) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                กลุ่มสาระการเรียนรู้ <span className="text-red-500">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as SubjectDepartment)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* หน่วยงานที่จัด */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                หน่วยงานที่จัด / สังกัดผู้มอบ
              </label>
              <input
                type="text"
                placeholder="เช่น สพฐ., สพม.สกลนคร, กระทรวงศึกษาธิการ, คุรุสภา"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* ชื่อรางวัล */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ชื่อรางวัล / ชื่อผลงานกิจกรรม <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น รางวัลชนะเลิศ เหรียญทอง นวัตกรรมการเรียนรู้ดิจิทัล..."
              value={awardName}
              onChange={(e) => setAwardName(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Section 2: ผู้ได้รับรางวัล */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 space-y-5">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-4 h-4 text-blue-600" />
            2. ข้อมูลครูและนักเรียนผู้รับรางวัล
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ครูผู้รับรางวัล / ครูที่ปรึกษา
              </label>
              <input
                type="text"
                placeholder="เช่น ครูสมชาย พรหมสิริ (ใส่ - หากไม่มี)"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                นักเรียนผู้รับรางวัล
              </label>
              <input
                type="text"
                placeholder="เช่น ด.ช.เอกชัย ใจดี, นายวัชระ สมสุข (ใส่ - หากไม่มี)"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 3: รายละเอียด วัตถุประสงค์ และผลลัพธ์ */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 space-y-5">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="w-4 h-4 text-purple-600" />
            3. วัตถุประสงค์และผลสัมฤทธิ์ของกิจกรรม
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              วัตถุประสงค์ของกิจกรรม
            </label>
            <textarea
              rows={2}
              placeholder="เพื่อพัฒนาศักยภาพผู้เรียน ส่งเสริมทักษะความคิดสร้างสรรค์..."
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                รายละเอียดเพิ่มเติม
              </label>
              <textarea
                rows={3}
                placeholder="รูปแบบการแข่งขัน สถานที่แข่งขัน เกณฑ์การตัดสิน..."
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ผลลัพธ์ที่เกิด / ผลการประเมิน
              </label>
              <textarea
                rows={3}
                placeholder="ได้รับโล่รางวัล เกียรติบัตรระดับชาติ เผยแพร่นวัตกรรม..."
                value={outcomes}
                onChange={(e) => setOutcomes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 4: แนบไฟล์หลักฐาน (ภาพ 1-3 รูป และไฟล์ PDF) */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              4. แนบไฟล์หลักฐานและภาพถ่ายกิจกรรม
            </h3>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
              Activities ➔ 1.ปีการศึกษา ➔ 2.กลุ่มสาระ ➔ 3.ชื่อครู ➔ 4.ผลงาน (ภาพถ่ายกิจกรรม, เกียรติบัตร, ไฟล์เอกสารเพิ่มเติม)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            ระบบจะสร้างหรือใช้โฟลเดอร์ตามข้อมูลที่กรอกเข้ามาใน Google Drive ID: <code className="font-mono text-slate-700 font-bold">1AcKRJm0FwiSNYYr2TaEGY34t74n9S-Ym</code> (Activities ➔ 1.ผลงานปี {academicYear} ➔ 2.กลุ่มสาระ ➔ 3.ชื่อครู ➔ 4.ผลงาน) และใช้อันเดิมเสมอหากมีอยู่แล้ว ไม่สร้างโฟลเดอร์ซ้ำซ้อน
          </div>

          {/* อัปโหลดภาพถ่ายกิจกรรม (1-3 รูปต่อกิจกรรม) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-pink-500" />
                <span>ภาพถ่ายกิจกรรม (1–3 รูปต่อกิจกรรม)</span>
              </label>
              <span className="text-xs font-semibold text-slate-500">
                เลือกแล้ว {photos.length}/3 รูป
              </span>
            </div>

            {/* Thumbnail Previews */}
            {photos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {photos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-36"
                  >
                    <img
                      src={photo.url || `data:${photo.type};base64,${photo.base64}`}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                        title="ลบรูปนี้"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-2 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded-sm truncate max-w-[150px]">
                      {photo.name}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Area for Photos */}
            {photos.length < 3 && (
              <label className="border-2 border-dashed border-slate-300 hover:border-red-400 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-50/50 hover:bg-red-50/20">
                <ImageIcon className="w-8 h-8 text-slate-400" />
                <div className="text-center">
                  <span className="text-sm font-bold text-red-600 hover:underline">
                    คลิกเพื่อเลือกภาพถ่ายกิจกรรม
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    รองรับไฟล์ JPG, PNG, WEBP (สูงสุด 3 ภาพ)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* ข้อมูลเกียรติบัตร (ก่อนเอกสารเพิ่มเติม) */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>ไฟล์เกียรติบัตร / วุฒิบัตร (Certificate)</span>
              </label>
              <span className="text-xs font-semibold text-slate-500">
                {certificates.length} ไฟล์
              </span>
            </div>

            {/* Certificate Previews / List */}
            {certificates.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {certificates.map((cert, idx) => {
                  const isImage = cert.type.startsWith('image/');
                  return (
                    <div
                      key={idx}
                      className="relative p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {isImage && cert.url ? (
                          <img
                            src={cert.url}
                            alt={cert.name}
                            className="w-10 h-10 object-cover rounded-md border border-amber-300 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-bold text-slate-900 truncate">{cert.name}</p>
                          <p className="text-[10px] text-amber-700 font-medium">
                            {isImage ? 'ไฟล์ภาพเกียรติบัตร' : 'เอกสาร PDF'} · {Math.round(cert.size / 1024)} KB
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeCertificate(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors shrink-0"
                        title="ลบไฟล์นี้"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Upload Area for Certificate */}
            <label className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-amber-50/20 hover:bg-amber-50/50">
              <Award className="w-8 h-8 text-amber-500" />
              <div className="text-center">
                <span className="text-sm font-bold text-amber-700 hover:underline">
                  คลิกเพื่อแนบไฟล์เกียรติบัตร (ไฟล์ภาพ หรือ .PDF)
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  รองรับภาพถ่ายเกียรติบัตร (JPG, PNG) หรือไฟล์เกียรติบัตร PDF
                </p>
              </div>
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleCertificateUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* รองรับไฟล์เอกสารเพิ่มเติม เช่น คำสั่ง, รายงาน .pdf */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>ไฟล์เอกสารเพิ่มเติม (เช่น คำสั่ง, เล่มรายงาน, แบบประเมิน .PDF)</span>
              </label>
              <span className="text-xs font-semibold text-slate-500">
                {documents.length} ไฟล์
              </span>
            </div>

            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">
                        {doc.name}
                      </span>
                      <span className="text-slate-400 shrink-0">
                        ({Math.round(doc.size / 1024)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(idx)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20">
              <FileText className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-semibold text-slate-700">
                แนบเอกสาร PDF (เช่น สำเนาเกียรติบัตร / เล่มรายงาน)
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                multiple
                onChange={handleDocumentUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Progress & Error Feedback Box */}
        {progress && (
          <div
            className={`rounded-xl p-4 border flex items-center gap-3 transition-all ${
              progress.status === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : progress.status === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'bg-blue-50 border-blue-300 text-blue-800'
            }`}
          >
            {progress.status === 'uploading' || progress.status === 'preparing' ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 shrink-0" />
            ) : progress.status === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <div className="text-xs font-medium">
              <p className="font-bold">{progress.message}</p>
              {progress.details && <p className="text-[11px] opacity-80">{progress.details}</p>}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl p-4 bg-rose-50 border border-rose-300 text-rose-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-xs font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Submit Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors disabled:opacity-50"
          >
            ยกเลิก
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-98 rounded-xl shadow-lg shadow-red-900/30 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>กำลังบันทึกข้อมูลและอัปโหลดไฟล์...</span>
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span>บันทึกสำเร็จเรียบร้อย!</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>บันทึกข้อมูลลงระบบ</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
