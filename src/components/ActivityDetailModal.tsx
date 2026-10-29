import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  Calendar,
  Building2,
  User,
  GraduationCap,
  Target,
  FileCheck2,
  Image as ImageIcon,
  FileText,
  Download,
  ExternalLink,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Award,
  Folder,
} from 'lucide-react';
import { ActivityImage } from './ActivityImage';
import { ActivityRecord, AwardLevel } from '../types';
import {
  compressImageFile,
  fileToBase64,
  submitActivityToAppsScript,
  saveRecordToLocalStorage,
  APPS_SCRIPT_CONFIG,
  formatDisplayDate,
} from '../services/appsScriptService';

interface ActivityDetailModalProps {
  record: ActivityRecord | null;
  onClose: () => void;
  onUpdateRecord?: (record: ActivityRecord) => void;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  record,
  onClose,
  onUpdateRecord,
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [activeCertIdx, setActiveCertIdx] = useState(0);
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | 'certificates'>('photos');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const photos = record?.photos || [];
  const certificates = record?.certificates || [];
  const documents = record?.documents || [];

  useEffect(() => {
    setActivePhotoIdx(0);
    setActiveCertIdx(0);
    if ((record?.certificates?.length || 0) > 0 && (record?.photos?.length || 0) === 0) {
      setActiveMediaTab('certificates');
    } else {
      setActiveMediaTab('photos');
    }
  }, [record?.id, record?.photos?.length, record?.certificates?.length]);

  if (!record) return null;

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !record) return;
    const file = e.target.files[0];
    setIsUploadingPhoto(true);
    try {
      const base64 = await compressImageFile(file);
      const dataUrl = `data:image/jpeg;base64,${base64}`;
      const newPhoto = {
        name: file.name,
        type: 'image/jpeg',
        size: file.size,
        base64: base64,
        url: dataUrl,
      };
      const updatedPhotos = [...(record.photos || []), newPhoto].slice(0, 3);
      const updatedRecord: ActivityRecord = {
        ...record,
        photos: updatedPhotos,
      };
      onUpdateRecord?.(updatedRecord);
      saveRecordToLocalStorage(updatedRecord);
      submitActivityToAppsScript(updatedRecord);
      setActivePhotoIdx(updatedPhotos.length - 1);
    } catch (err) {
      console.error('Add photo in modal error:', err);
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleAddCertificate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !record) return;
    const file = e.target.files[0];
    setIsUploadingPhoto(true);
    try {
      const isImg = file.type.startsWith('image/');
      const base64 = isImg ? await compressImageFile(file) : await fileToBase64(file);
      const dataUrl = isImg ? `data:image/jpeg;base64,${base64}` : undefined;
      const newCert = {
        name: file.name,
        type: isImg ? 'image/jpeg' : (file.type || 'application/pdf'),
        size: file.size,
        base64: base64,
        url: dataUrl,
      };
      const updatedRecord: ActivityRecord = {
        ...record,
        certificates: [...(record.certificates || []), newCert],
      };
      onUpdateRecord?.(updatedRecord);
      saveRecordToLocalStorage(updatedRecord);
      submitActivityToAppsScript(updatedRecord);
    } catch (err) {
      console.error('Add certificate in modal error:', err);
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const getBadgeStyle = (level: AwardLevel) => {
    switch (level) {
      case 'ระดับชาติ':
        return 'bg-emerald-600 text-white';
      case 'ระดับภาค':
        return 'bg-amber-600 text-white';
      case 'ระดับเขตพื้นที่':
        return 'bg-purple-600 text-white';
      case 'ระดับกลุ่มโรงเรียน':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-slate-700 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-3 py-0.5 rounded-full ${getBadgeStyle(
                  record.awardLevel
                )}`}
              >
                {record.awardLevel}
              </span>
              <span className="text-xs text-slate-300 font-mono">
                ปีการศึกษา {record.academicYear}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300">
                รหัส: {record.id}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold leading-snug text-white">
              {record.awardName}
            </h2>
            <p className="text-xs text-slate-300">
              {record.department} · {record.organizer}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Showcase: Switcher between Photos and Certificates */}
          {photos.length > 0 || certificates.length > 0 ? (
            <div className="space-y-3">
              {/* Media Mode Header / Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 gap-2">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  {photos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab('photos')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeMediaTab === 'photos'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-pink-500" />
                      <span>ภาพถ่ายกิจกรรม ({photos.length})</span>
                    </button>
                  )}

                  {certificates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab('certificates')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeMediaTab === 'certificates'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-amber-800 hover:text-amber-950'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5 text-amber-200" />
                      <span>ไฟล์เกียรติบัตร / วุฒิบัตร ({certificates.length})</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {photos.length < 3 && (
                    <label className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{isUploadingPhoto ? 'กำลังอัปโหลด...' : '+ เพิ่มรูปถ่าย'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingPhoto}
                        onChange={handleAddPhoto}
                      />
                    </label>
                  )}

                  <label className="text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md transition-colors">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isUploadingPhoto ? 'กำลังอัปโหลด...' : '+ แนบเกียรติบัตร'}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      disabled={isUploadingPhoto}
                      onChange={handleAddCertificate}
                    />
                  </label>
                </div>
              </div>

              {/* ACTIVE TAB: PHOTOS */}
              {activeMediaTab === 'photos' && photos.length > 0 && (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center group">
                    <ActivityImage
                      src={
                        photos[activePhotoIdx]?.url ||
                        (photos[activePhotoIdx]?.base64
                          ? `data:${photos[activePhotoIdx].type};base64,${photos[activePhotoIdx].base64}`
                          : '')
                      }
                      originalUrl={photos[activePhotoIdx]?.originalUrl}
                      alt={photos[activePhotoIdx]?.name || record.awardName}
                      className="w-full h-full object-contain"
                      containerClassName="w-full h-full flex items-center justify-center bg-slate-950"
                      showOpenButton={true}
                      fallbackTitle="ภาพถ่ายกิจกรรม"
                    />

                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={() =>
                            setActivePhotoIdx((prev) =>
                              prev === 0 ? photos.length - 1 : prev - 1
                            )
                          }
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors z-20 cursor-pointer"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() =>
                            setActivePhotoIdx((prev) =>
                              prev === photos.length - 1 ? 0 : prev + 1
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors z-20 cursor-pointer"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    <span className="absolute bottom-2 left-3 bg-black/70 text-white text-xs px-2.5 py-1 rounded-md backdrop-blur-xs font-medium z-20 pointer-events-none">
                      {photos[activePhotoIdx]?.name || 'ภาพกิจกรรม'} ({activePhotoIdx + 1}/{photos.length})
                    </span>
                  </div>

                  {photos.length > 1 && (
                    <div className="flex gap-2">
                      {photos.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActivePhotoIdx(idx)}
                          className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                            activePhotoIdx === idx
                              ? 'border-red-600 scale-105'
                              : 'border-slate-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <ActivityImage
                            src={p.url || (p.base64 ? `data:${p.type};base64,${p.base64}` : '')}
                            originalUrl={p.originalUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            containerClassName="w-full h-full"
                            fallbackTitle=""
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ACTIVE TAB: CERTIFICATES */}
              {activeMediaTab === 'certificates' && certificates.length > 0 && (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center group border border-amber-300">
                    <ActivityImage
                      src={
                        certificates[activeCertIdx]?.url ||
                        (certificates[activeCertIdx]?.base64
                          ? `data:${certificates[activeCertIdx].type};base64,${certificates[activeCertIdx].base64}`
                          : '')
                      }
                      originalUrl={certificates[activeCertIdx]?.originalUrl}
                      alt={certificates[activeCertIdx]?.name || 'เกียรติบัตร'}
                      className="w-full h-full object-contain"
                      containerClassName="w-full h-full flex items-center justify-center bg-slate-900"
                      showOpenButton={true}
                      fallbackTitle="เกียรติบัตร / วุฒิบัตร"
                    />

                    {certificates.length > 1 && (
                      <>
                        <button
                          onClick={() =>
                            setActiveCertIdx((prev) =>
                              prev === 0 ? certificates.length - 1 : prev - 1
                            )
                          }
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors z-20 cursor-pointer"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() =>
                            setActiveCertIdx((prev) =>
                              prev === certificates.length - 1 ? 0 : prev + 1
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors z-20 cursor-pointer"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    <span className="absolute bottom-2 left-3 bg-amber-900/90 text-amber-100 text-xs px-2.5 py-1 rounded-md backdrop-blur-xs font-medium z-20 pointer-events-none flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-300" />
                      <span>{certificates[activeCertIdx]?.name || 'เกียรติบัตร'} ({activeCertIdx + 1}/{certificates.length})</span>
                    </span>
                  </div>

                  {certificates.length > 1 && (
                    <div className="flex gap-2">
                      {certificates.map((c, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveCertIdx(idx)}
                          className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                            activeCertIdx === idx
                              ? 'border-amber-500 scale-105'
                              : 'border-slate-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <ActivityImage
                            src={c.url || (c.base64 ? `data:${c.type};base64,${c.base64}` : '')}
                            originalUrl={c.originalUrl}
                            alt={c.name}
                            className="w-full h-full object-cover"
                            containerClassName="w-full h-full"
                            fallbackTitle="เกียรติบัตร"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Upload area when record currently has no photos or certificates */
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">ยังไม่มีภาพถ่ายกิจกรรมหรือเกียรติบัตรสำหรับผลงานนี้</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  ท่านสามารถแนบภาพถ่ายกิจกรรม (1-3 รูป) หรือไฟล์เกียรติบัตร เพื่อแสดงตัวอย่างบนการ์ดผลงานและบันทึกลงระบบได้ทันที
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-1">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-colors">
                  <ImageIcon className="w-4 h-4" />
                  <span>{isUploadingPhoto ? 'กำลังบันทึกภาพ...' : '+ แนบภาพถ่ายกิจกรรม'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingPhoto}
                    onChange={handleAddPhoto}
                  />
                </label>

                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-colors">
                  <Award className="w-4 h-4" />
                  <span>{isUploadingPhoto ? 'กำลังบันทึก...' : '+ แนบเกียรติบัตร'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    disabled={isUploadingPhoto}
                    onChange={handleAddCertificate}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm">
            <div className="space-y-1">
              <span className="text-slate-500 text-xs block">ครูผู้รับรางวัล / ที่ปรึกษา:</span>
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{record.teacherName || '-'}</span>
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 text-xs block">นักเรียนผู้รับรางวัล:</span>
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{record.studentName || '-'}</span>
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 text-xs block">หน่วยงานที่จัด:</span>
              <p className="font-medium text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>{record.organizer}</span>
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 text-xs block">วันที่ได้รับรางวัล:</span>
              <p className="font-medium text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-mono">{formatDisplayDate(record.awardDate)}</span>
              </p>
            </div>
          </div>

          {/* Objective & Results */}
          <div className="space-y-4">
            {record.objective && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-red-600" />
                  <span>วัตถุประสงค์ของกิจกรรม</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-200 leading-relaxed">
                  {record.objective}
                </p>
              </div>
            )}

            {record.additionalDetails && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>รายละเอียดเพิ่มเติม</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-200 leading-relaxed">
                  {record.additionalDetails}
                </p>
              </div>
            )}

            {record.outcomes && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <span>ผลลัพธ์ที่เกิด</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 bg-emerald-50/60 p-3.5 rounded-lg border border-emerald-200 leading-relaxed">
                  {record.outcomes}
                </p>
              </div>
            )}
          </div>

          {/* Certificates (ไฟล์เกียรติบัตร / วุฒิบัตร) */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                <span>ไฟล์เกียรติบัตร / วุฒิบัตร (Certificate) ({certificates.length} รายการ)</span>
              </h4>

              <label className="text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md transition-colors border border-amber-200">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>{isUploadingPhoto ? 'กำลังบันทึก...' : '+ แนบเกียรติบัตรเพิ่ม'}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  disabled={isUploadingPhoto}
                  onChange={handleAddCertificate}
                />
              </label>
            </div>

            {certificates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {certificates.map((cert, idx) => {
                  const isImage = cert.type.startsWith('image/');
                  return (
                    <div
                      key={idx}
                      className="group/card p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-2.5"
                    >
                      <div className="flex items-start gap-3">
                        {isImage && (cert.url || cert.base64) ? (
                          <div
                            onClick={() => {
                              setActiveMediaTab('certificates');
                              setActiveCertIdx(idx);
                            }}
                            className="w-16 h-14 rounded-lg overflow-hidden border border-amber-300 shrink-0 cursor-pointer group-hover/card:scale-105 transition-transform bg-slate-900"
                            title="คลิกเพื่อดูภาพขยายด้านบน"
                          >
                            <ActivityImage
                              src={cert.url || (cert.base64 ? `data:${cert.type};base64,${cert.base64}` : '')}
                              originalUrl={cert.originalUrl}
                              alt={cert.name}
                              className="w-full h-full object-cover"
                              containerClassName="w-full h-full"
                              fallbackTitle="เกียรติบัตร"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <Award className="w-6 h-6" />
                          </div>
                        )}
                        <div className="truncate flex-1">
                          <span className="font-bold text-slate-900 truncate block text-xs">
                            {cert.name}
                          </span>
                          <span className="text-[10px] text-amber-800 font-semibold block mt-0.5">
                            {isImage ? 'ไฟล์ภาพเกียรติบัตร' : 'เอกสาร PDF'} {cert.size ? `· ${Math.round(cert.size / 1024)} KB` : ''}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            เกียรติบัตรลำดับที่ {idx + 1}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-amber-200/60">
                        {isImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMediaTab('certificates');
                              setActiveCertIdx(idx);
                            }}
                            className="text-amber-800 hover:text-amber-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <span>ดูรูปขยาย</span>
                          </button>
                        )}
                        {cert.url ? (
                          <a
                            href={cert.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-amber-900 font-bold bg-white hover:bg-amber-100/80 border border-amber-300 px-2.5 py-1 rounded-md text-[11px] ml-auto transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>เปิดดูไฟล์</span>
                          </a>
                        ) : (
                          <span className="text-amber-700 font-medium text-[11px] ml-auto">แนบในระบบ</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/40 text-center text-xs text-amber-800">
                ยังไม่มีไฟล์เกียรติบัตร / วุฒิบัตร สำหรับผลงานนี้ สามารถคลิกปุ่ม "+ แนบเกียรติบัตรเพิ่ม" ด้านบนได้
              </div>
            )}
          </div>

          {/* Documents attachments (.pdf) */}
          {documents.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>เอกสารหลักฐานเพิ่มเติม ({documents.length} รายการ)</span>
              </h4>
              <div className="space-y-2">
                {documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">
                        {doc.name}
                      </span>
                      {doc.size && (
                        <span className="text-slate-400">({Math.round(doc.size / 1024)} KB)</span>
                      )}
                    </div>

                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>เปิดไฟล์</span>
                      </a>
                    ) : (
                      <span className="text-slate-400">แนบในระบบ</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Google Drive Folder link for this submission */}
          <div className="pt-2 border-t border-slate-100">
            <a
              href={
                record.folderUrl ||
                `https://drive.google.com/drive/folders/${APPS_SCRIPT_CONFIG.FOLDER_ID}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 hover:bg-amber-100/90 border border-amber-200 text-xs text-amber-900 transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Folder className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="truncate text-left">
                  <span className="font-bold text-slate-900 block truncate">
                    เปิดโฟลเดอร์ Google Drive (Activities)
                  </span>
                  <span className="text-[11px] text-amber-800 font-mono block truncate">
                    1. {record.department} ➔ 2. {record.teacherName || 'ผู้รายงาน'} ➔ 3. {record.awardName || record.id} (รูปกิจกรรม, เกียรติบัตร, ไฟล์เอกสาร)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 font-bold text-amber-700 bg-white border border-amber-300 px-3 py-1.5 rounded-lg text-xs shrink-0 shadow-xs hover:bg-amber-50">
                <span>เปิด Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            โรงเรียนพังโคนวิทยาคม สพม.สกลนคร
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
