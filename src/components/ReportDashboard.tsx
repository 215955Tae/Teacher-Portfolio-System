import React, { useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Award,
  Users,
  GraduationCap,
  Calendar,
  Sparkles,
  School,
  CheckCircle2,
} from 'lucide-react';
import { ActivityRecord } from '../types';

interface ReportDashboardProps {
  records: ActivityRecord[];
  onSelectRecord: (record: ActivityRecord) => void;
}

export const ReportDashboard: React.FC<ReportDashboardProps> = ({
  records,
  onSelectRecord,
}) => {
  // Aggregate metrics
  const total = records.length;

  const teachersCount = records.filter(
    (r) => r.teacherName && r.teacherName.trim() !== '-' && r.teacherName.trim() !== ''
  ).length;

  const studentsCount = records.filter(
    (r) => r.studentName && r.studentName.trim() !== '-' && r.studentName.trim() !== ''
  ).length;

  const nationalCount = records.filter((r) => r.awardLevel === 'ระดับชาติ').length;
  const regionalCount = records.filter((r) => r.awardLevel === 'ระดับภาค').length;
  const areaCount = records.filter((r) => r.awardLevel === 'ระดับเขตพื้นที่').length;
  const clusterCount = records.filter((r) => r.awardLevel === 'ระดับกลุ่มโรงเรียน').length;
  const schoolLevelCount = records.filter((r) => r.awardLevel === 'ระดับโรงเรียน').length;

  // Export HTML Report Generator
  const handleExportHTML = () => {
    const tableRows = records
      .map(
        (rec, index) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 12px; text-align: center; font-weight: bold; color: #4b5563;">${index + 1}</td>
          <td style="padding: 10px 12px; font-weight: 600; color: #111827;">${rec.awardName}<br/><span style="font-size: 11px; color: #6b7280;">${rec.department} · ${rec.organizer}</span></td>
          <td style="padding: 10px 12px; text-align: center;"><span style="background: #eef2ff; color: #4338ca; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold;">${rec.awardLevel}</span></td>
          <td style="padding: 10px 12px; color: #374151;">${rec.teacherName || '-'}</td>
          <td style="padding: 10px 12px; color: #374151;">${rec.studentName || '-'}</td>
          <td style="padding: 10px 12px; text-align: center; font-weight: bold; color: #1f2937;">${rec.academicYear}</td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>รายงานสรุปผลการจัดกิจกรรมและรางวัล - โรงเรียนพังโคนวิทยาคม</title>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Prompt', sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 30px; }
    .report-container { max-width: 960px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { text-align: center; border-bottom: 2px solid #ef4444; padding-bottom: 20px; margin-bottom: 24px; }
    .header h1 { font-size: 22px; color: #0f172a; margin: 0 0 6px 0; }
    .header h2 { font-size: 16px; color: #dc2626; margin: 0 0 8px 0; }
    .header p { font-size: 12px; color: #64748b; margin: 0; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .card-purple { background: linear-gradient(135deg, #f472b6, #8b5cf6); color: white; padding: 20px; border-radius: 12px; }
    .card-cyan { background: linear-gradient(135deg, #06b6d4, #10b981); color: white; padding: 20px; border-radius: 12px; }
    .card-title { font-size: 14px; font-weight: bold; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.95; }
    .metric-item { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; }
    .metric-value { font-weight: bold; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
    th { background: #f1f5f9; color: #334155; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #cbd5e1; }
    .footer-sign { display: grid; grid-template-columns: 1fr 1fr; margin-top: 50px; text-align: center; font-size: 13px; color: #475569; }
    .sign-line { margin-top: 60px; border-top: 1px dotted #94a3b8; width: 220px; margin-left: auto; margin-right: auto; padding-top: 6px; }
    @media print { body { background: white; padding: 0; } .report-container { box-shadow: none; border-radius: 0; padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="header">
      <h1>โรงเรียนพังโคนวิทยาคม</h1>
      <h2>รายงานสรุปผลการจัดกิจกรรมและบันทึกผลงานรางวัล ปีการศึกษา 2568</h2>
      <p>สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสกลนคร · ออกรายงาน ณ วันที่ ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <div class="summary-grid">
      <div class="card-purple">
        <div class="card-title">สรุปผลรวมบุคลากรและผลงาน</div>
        <div class="metric-item"><span>• ผลงานทั้งหมด:</span><span class="metric-value">${total} รายการ</span></div>
        <div class="metric-item"><span>• ครูที่เข้าร่วม:</span><span class="metric-value">${teachersCount} ท่าน</span></div>
        <div class="metric-item"><span>• นักเรียนที่เข้าร่วม:</span><span class="metric-value">${studentsCount} คน</span></div>
      </div>
      <div class="card-cyan">
        <div class="card-title">รางวัลจำแนกตามระดับ</div>
        <div class="metric-item"><span>• ระดับชาติ:</span><span class="metric-value">${nationalCount} รางวัล</span></div>
        <div class="metric-item"><span>• ระดับภาค:</span><span class="metric-value">${regionalCount} รางวัล</span></div>
        <div class="metric-item"><span>• ระดับเขตพื้นที่:</span><span class="metric-value">${areaCount} รางวัล</span></div>
      </div>
    </div>

    <h3 style="font-size: 15px; margin: 20px 0 10px 0; color: #1e293b;">ตารางสรุปรายการรางวัลและผลงานกิจกรรม</h3>
    <table>
      <thead>
        <tr>
          <th style="text-align: center; width: 50px;">ลำดับ</th>
          <th>ชื่อรางวัล / กิจกรรม</th>
          <th style="text-align: center; width: 110px;">ระดับ</th>
          <th>ครู</th>
          <th>นักเรียน</th>
          <th style="text-align: center; width: 90px;">ปีการศึกษา</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <div class="footer-sign">
      <div>
        <p>ผู้รายงานข้อมูล</p>
        <div class="sign-line">(...................................................)</div>
        <p style="font-size: 11px; margin-top: 4px;">ครูผู้รับผิดชอบงานกิจกรรม</p>
      </div>
      <div>
        <p>ผู้รับรองข้อมูล</p>
        <div class="sign-line">(...................................................)</div>
        <p style="font-size: 11px; margin-top: 4px;">ผู้อำนวยการโรงเรียนพังโคนวิทยาคม</p>
      </div>
    </div>
  </div>

  <div style="text-align: center; margin-top: 30px;" class="no-print">
    <button onclick="window.print()" style="background: #ef4444; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: inherit;">
      พิมพ์รายงาน (Print / Save as PDF)
    </button>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานสรุปผลงาน_โรงเรียนพังโคนวิทยาคม_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header Card: "📊 รายงานสรุป" ตัวอักษรเด่น อ่านง่าย + ปุ่มมุมขวาบน: "ส่งออกรายงาน HTML" 📄 */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <span>รายงานสรุป</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            รายงานสรุปผลการจัดกิจกรรมและบันทึกภาพกิจกรรม กลุ่มบริหารงานบุคคล โรงเรียนพังโคนวิทยาคม
          </p>
        </div>

        {/* ปุ่มมุมขวาบน: "ส่งออกรายงาน HTML" พร้อมไอคอนไฟล์ 📄 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์</span>
          </button>

          <button
            onClick={handleExportHTML}
            className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-95 rounded-xl shadow-md shadow-red-950 transition-all hover:scale-105 cursor-pointer whitespace-nowrap"
          >
            <span className="text-base">📄</span>
            <span>ส่งออกรายงาน HTML</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          Infographic Summary Boxes:
          1. กล่องสรุปผลรวม (ใช้พื้นหลังไล่สีชมพู–ม่วง มุมโค้งมน) แสดงข้อมูล:
             • ผลงานทั้งหมด: 3
             • ครูที่เข้าร่วม: 2
             • นักเรียนที่เข้าร่วม: 0
          2. กล่องรางวัลตามระดับ (ใช้พื้นหลังไล่สีฟ้า–เขียว มุมโค้งมน) แสดงข้อมูล:
             • ระดับชาติ: 2
             • ระดับภาค: 0
             • ระดับเขตพื้นที่: 1
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* กล่องสรุปผลรวม (ชมพู–ม่วง) */}
        <div className="rounded-xl p-6 sm:p-7 bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/20">
              <span className="text-xs font-extrabold uppercase tracking-wider text-pink-100">
                สรุปผลรวมผู้เข้าร่วมและผลงาน
              </span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between bg-black/10 backdrop-blur-xs px-4 py-2.5 rounded-lg border border-white/10">
                <span className="text-sm font-semibold text-white/95">• ผลงานทั้งหมด:</span>
                <span className="text-2xl font-black font-mono tabular-nums text-white">
                  {total}
                </span>
              </div>

              <div className="flex items-center justify-between bg-black/10 backdrop-blur-xs px-4 py-2.5 rounded-lg border border-white/10">
                <span className="text-sm font-semibold text-white/95">• ครูที่เข้าร่วม:</span>
                <span className="text-2xl font-black font-mono tabular-nums text-white">
                  {teachersCount}
                </span>
              </div>

              <div className="flex items-center justify-between bg-black/10 backdrop-blur-xs px-4 py-2.5 rounded-lg border border-white/10">
                <span className="text-sm font-semibold text-white/95">• นักเรียนที่เข้าร่วม:</span>
                <span className="text-2xl font-black font-mono tabular-nums text-white">
                  {studentsCount}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 text-[11px] text-pink-100 font-medium">
            ปีการศึกษา 2568 · โรงเรียนพังโคนวิทยาคม
          </div>
        </div>

        {/* กล่องรางวัลตามระดับ (ฟ้า–เขียว) */}
        <div className="rounded-xl p-6 sm:p-7 bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-600 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/20">
              <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-100">
                รางวัลจำแนกตามระดับ
              </span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Award className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between bg-black/10 backdrop-blur-xs px-4 py-2.5 rounded-lg border border-white/10">
                <span className="text-sm font-semibold text-white/95">• ระดับชาติ:</span>
                <span className="text-2xl font-black font-mono tabular-nums text-white">
                  {nationalCount}
                </span>
              </div>

              <div className="flex items-center justify-between bg-black/10 backdrop-blur-xs px-4 py-2.5 rounded-lg border border-white/10">
                <span className="text-sm font-semibold text-white/95">• ระดับภาค:</span>
                <span className="text-2xl font-black font-mono tabular-nums text-white">
                  {regionalCount}
                </span>
              </div>

              <div className="flex items-center justify-between bg-black/10 backdrop-blur-xs px-4 py-2.5 rounded-lg border border-white/10">
                <span className="text-sm font-semibold text-white/95">• ระดับเขตพื้นที่:</span>
                <span className="text-2xl font-black font-mono tabular-nums text-white">
                  {areaCount}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 text-[11px] text-cyan-100 font-medium flex items-center justify-between">
            <span>ระดับกลุ่มโรงเรียน ({clusterCount}) · ระดับโรงเรียน ({schoolLevelCount})</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ด้านล่างมีตารางสรุปรายการรางวัล (พื้นหลังสีขาว มุมโค้งมน)
          หัวตาราง: ▸ ลำดับ ▸ ชื่อรางวัล ▸ ระดับ ▸ ครู ▸ นักเรียน ▸ ปีการศึกษา
         ========================================================================= */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <span>ตารางสรุปรายการรางวัลทั้งหมด</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            รวม {records.length} รายการ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 text-xs font-bold border-b border-slate-200">
                <th className="py-3 px-4 text-center w-16">▸ ลำดับ</th>
                <th className="py-3 px-4">▸ ชื่อรางวัล</th>
                <th className="py-3 px-4 text-center">▸ ระดับ</th>
                <th className="py-3 px-4">▸ ครู</th>
                <th className="py-3 px-4">▸ นักเรียน</th>
                <th className="py-3 px-4 text-center w-28">▸ ปีการศึกษา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {records.map((item, idx) => {
                const getLevelBadge = (level: string) => {
                  switch (level) {
                    case 'ระดับชาติ':
                      return 'bg-emerald-100 text-emerald-800';
                    case 'ระดับภาค':
                      return 'bg-amber-100 text-amber-800';
                    case 'ระดับเขตพื้นที่':
                      return 'bg-purple-100 text-purple-800';
                    default:
                      return 'bg-slate-100 text-slate-700';
                  }
                };

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectRecord(item)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 text-center font-bold text-slate-500 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 hover:text-purple-700 transition-colors">
                        {item.awardName}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {item.department} · {item.organizer}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${getLevelBadge(
                          item.awardLevel
                        )}`}
                      >
                        {item.awardLevel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {item.teacherName && item.teacherName !== '-' ? (
                        <span className="font-semibold text-slate-900">{item.teacherName}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {item.studentName && item.studentName !== '-' ? (
                        <span className="font-semibold text-slate-900">{item.studentName}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800 font-mono">
                      {item.academicYear}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>คลิกแถวเพื่อดูรายละเอียดและภาพถ่ายกิจกรรม</span>
          <span className="font-semibold text-slate-700">โรงเรียนพังโคนวิทยาคม</span>
        </div>
      </div>
    </div>
  );
};
