import React, { useState } from 'react';
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

interface ActivityDetailModalProps {
  record: ActivityRecord | null;
  onClose: () => void;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  record,
  onClose,
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (!record) return null;

  const photos = record.photos || [];
  const certificates = record.certificates || [];
  const documents = record.documents || [];

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
          {/* Photo Showcase Gallery */}
          {photos.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-pink-500" />
                <span>ภาพถ่ายกิจกรรม ({photos.length} รูป)</span>
              </h3>

              <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center group">
                <ActivityImage
                  src={
                    photos[activePhotoIdx].url ||
                    (photos[activePhotoIdx].base64
                      ? `data:${photos[activePhotoIdx].type};base64,${photos[activePhotoIdx].base64}`
                      : '')
                  }
                  originalUrl={photos[activePhotoIdx].originalUrl}
                  alt={photos[activePhotoIdx].name}
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
                  {photos[activePhotoIdx].name} ({activePhotoIdx + 1}/{photos.length})
                </span>
              </div>

              {/* Thumbnails row */}
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
                <span className="font-mono">{record.awardDate}</span>
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

          {/* Certificates (เกียรติบัตร) */}
          {certificates.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>เกียรติบัตร / วุฒิบัตร ({certificates.length} รายการ)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {certificates.map((cert, idx) => {
                  const isImage = cert.type.startsWith('image/');
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {isImage && (cert.url || cert.base64) ? (
                          <div className="w-10 h-10 rounded-md overflow-hidden border border-amber-300 shrink-0">
                            <ActivityImage
                              src={cert.url || (cert.base64 ? `data:${cert.type};base64,${cert.base64}` : '')}
                              originalUrl={cert.originalUrl}
                              alt={cert.name}
                              className="w-full h-full object-cover"
                              containerClassName="w-full h-full"
                              fallbackTitle=""
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5" />
                          </div>
                        )}
                        <div className="truncate">
                          <span className="font-bold text-slate-900 truncate block">
                            {cert.name}
                          </span>
                          <span className="text-[10px] text-amber-700 font-medium">
                            {isImage ? 'ไฟล์ภาพเกียรติบัตร' : 'เอกสาร PDF'} {cert.size ? `· ${Math.round(cert.size / 1024)} KB` : ''}
                          </span>
                        </div>
                      </div>

                      {cert.url ? (
                        <a
                          href={cert.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-amber-800 hover:text-amber-950 font-bold bg-white border border-amber-300 px-2.5 py-1 rounded-md text-[11px] shrink-0 hover:bg-amber-100/50 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>เปิดดู</span>
                        </a>
                      ) : (
                        <span className="text-amber-700 font-medium text-[11px] shrink-0">แนบในระบบ</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
          {record.folderUrl && (
            <div className="pt-2 border-t border-slate-100">
              <a
                href={record.folderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg bg-amber-50 hover:bg-amber-100/90 border border-amber-200 text-xs text-amber-900 transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-semibold truncate">
                    เปิดโฟลเดอร์ Google Drive ({record.department} ➔ {record.teacherName || 'ผู้รายงาน'})
                  </span>
                </div>
                <div className="flex items-center gap-1 font-bold text-amber-700 shrink-0">
                  <span>เปิดโฟลเดอร์</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </a>
            </div>
          )}
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
