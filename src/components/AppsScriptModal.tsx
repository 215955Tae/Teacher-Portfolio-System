import React, { useState } from 'react';
import { X, Copy, Check, Code2, ExternalLink, HelpCircle, FileSpreadsheet, Folder } from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE, APPS_SCRIPT_CONFIG } from '../services/appsScriptService';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh] text-slate-200">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>โค้ด Google Apps Script (Code.gs)</span>
                <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-md font-mono">
                  v2568 (โครงสร้าง 5 ระดับใน Activities)
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Activities (1AcKRJm0FwiSNYYr2TaEGY34t74n9S-Ym) ➔ 1.ปีการศึกษา ➔ 2.กลุ่มสาระ ➔ 3.ชื่อครู ➔ 4.ผลงาน (ภาพถ่ายกิจกรรม, เกียรติบัตร, ไฟล์เอกสารเพิ่มเติม)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด GS'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration summary */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center justify-between gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2 truncate">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">SHEET_ID (Google Sheet):</span>
                <span className="font-mono text-slate-200 select-all font-semibold text-[11px] truncate block">
                  {APPS_SCRIPT_CONFIG.SHEET_ID}
                </span>
              </div>
            </div>
            <a
              href={`https://docs.google.com/spreadsheets/d/${APPS_SCRIPT_CONFIG.SHEET_ID}/edit`}
              target="_blank"
              rel="noreferrer"
              className="p-1 rounded bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition-colors shrink-0"
              title="เปิด Google Sheets ในแท็บใหม่"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="flex items-center justify-between gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2 truncate">
              <Folder className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">FOLDER_ID (Google Drive):</span>
                <span className="font-mono text-slate-200 select-all font-semibold text-[11px] truncate block">
                  {APPS_SCRIPT_CONFIG.FOLDER_ID}
                </span>
              </div>
            </div>
            <a
              href={`https://drive.google.com/drive/folders/${APPS_SCRIPT_CONFIG.FOLDER_ID}`}
              target="_blank"
              rel="noreferrer"
              className="p-1 rounded bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white transition-colors shrink-0"
              title="เปิด Google Drive Folder ในแท็บใหม่"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="flex items-center justify-between gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2 truncate">
              <Code2 className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">Web App URL (Active):</span>
                <span className="font-mono text-slate-200 select-all font-semibold text-[11px] truncate block">
                  {APPS_SCRIPT_CONFIG.ENDPOINT_URL}
                </span>
              </div>
            </div>
            <a
              href={APPS_SCRIPT_CONFIG.ENDPOINT_URL}
              target="_blank"
              rel="noreferrer"
              className="p-1 rounded bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors shrink-0"
              title="เปิด Apps Script Web App URL"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 font-mono text-xs leading-relaxed text-slate-300">
          <pre className="whitespace-pre-wrap select-all">
            <code>{GOOGLE_APPS_SCRIPT_CODE}</code>
          </pre>
        </div>

        {/* Setup guide footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 space-y-3">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 font-bold">ขั้นตอนอัปเดตสคริปต์ให้ทำงานจริง (สำคัญมาก):</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-1.5">
              <span className="text-emerald-400 font-bold block">กรณีที่ 1: อัปเดตในโครงการ Apps Script เดิม (แนะนำ)</span>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed">
                <li>วางโค้ดที่คัดลอกลงในไฟล์ <strong>Code.gs</strong> แทนที่ของเดิมทั้งหมด แล้วกด <strong>บันทึก (Save)</strong></li>
                <li>คลิกปุ่มสีน้ำเงิน <strong>"ทำให้ใช้งานได้" (Deploy)</strong> ด้านบนขวา</li>
                <li>เลือก <strong>"จัดการการทำให้ใช้งานได้" (Manage deployments)</strong></li>
                <li>คลิกไอคอน <strong>ดินสอ (แก้ไข / Edit)</strong> ด้านขวาบนของหน้าต่าง</li>
                <li>ที่ช่อง <strong>เวอร์ชัน (Version)</strong> คลิกเลือก <strong>"เวอร์ชันใหม่" (New version)</strong> เสมอ!</li>
                <li>กดปุ่ม <strong>"ทำให้ใช้งานได้" (Deploy)</strong> ด้านล่างขวา เป็นอันเสร็จสิ้น</li>
              </ol>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-1.5">
              <span className="text-blue-400 font-bold block">ข้อสังเกตและฟังก์ชันเสริม:</span>
              <ul className="list-disc list-inside space-y-1 text-slate-300 leading-relaxed">
                <li className="text-amber-200">
                  <strong>⚠️ เหตุผลที่โฟลเดอร์ปีไม่ขึ้นก่อนหน้านี้:</strong> หากกดแค่ปุ่ม "บันทึก" (Save) ใน Apps Script แต่ไม่ได้กด Deploy เวอร์ชันใหม่ Google จะยังคงรันโค้ดเก่าอยู่
                </li>
                <li>
                  <strong>โครงสร้าง 5 ระดับ:</strong> Activities ➔ 1.ผลงานปี... ➔ 2.กลุ่มสาระ ➔ 3.ชื่อครู ➔ 4.ผลงาน (ภาพถ่าย, เกียรติบัตร, เอกสาร)
                </li>
                <li>
                  <strong>ฟังก์ชันจัดระเบียบ:</strong> ใน Apps Script มีฟังก์ชัน <code className="text-emerald-300 font-mono">organizeExistingFoldersToYear()</code> สามารถกด "เรียกใช้ (Run)" เพื่อย้ายโฟลเดอร์เดิมที่ตกหล่นเข้าสู่โฟลเดอร์ปีได้ทันที
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
