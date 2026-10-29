import React, { useMemo, useState } from 'react';
import {
  Trophy,
  Award,
  Medal,
  Star,
  Users,
  GraduationCap,
  Image as ImageIcon,
  FileText,
  Clock,
  ArrowRight,
  PlusCircle,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Sparkles,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { ActivityImage } from './ActivityImage';
import { ActivityRecord, AwardLevel } from '../types';
import { getPreviewMedia, formatDisplayDate } from '../services/appsScriptService';

interface DashboardProps {
  records: ActivityRecord[];
  onNavigateToList: (filterLevel?: string) => void;
  onNavigateToTeachers?: () => void;
  onOpenAddModal: () => void;
  onSelectRecord: (record: ActivityRecord) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  records,
  onNavigateToList,
  onNavigateToTeachers,
  onOpenAddModal,
  onSelectRecord,
}) => {
  // Compute accurate statistics based on records
  const stats = useMemo(() => {
    const total = records.length;
    const national = records.filter((r) => r.awardLevel === 'ระดับชาติ').length;
    const regional = records.filter((r) => r.awardLevel === 'ระดับภาค').length;
    const area = records.filter((r) => r.awardLevel === 'ระดับเขตพื้นที่').length;

    // Unique or counting teachers & students
    const teachersCount = records.filter(
      (r) => r.teacherName && r.teacherName.trim() !== '-' && r.teacherName.trim() !== ''
    ).length;
    const studentsCount = records.filter(
      (r) => r.studentName && r.studentName.trim() !== '-' && r.studentName.trim() !== ''
    ).length;

    // Total photos and total documents
    const totalPhotos = records.reduce((acc, r) => acc + (r.photos?.length || 0), 0);
    const totalDocuments = records.reduce((acc, r) => acc + (r.documents?.length || 0), 0);

    return {
      total,
      national,
      regional,
      area,
      teachersCount,
      studentsCount,
      totalPhotos,
      totalDocuments,
    };
  }, [records]);

  // Chart 1: Levels count
  const levelCounts = useMemo(() => {
    const levels: { level: AwardLevel; label: string; count: number }[] = [
      { level: 'ระดับชาติ', label: 'ระดับชาติ', count: 0 },
      { level: 'ระดับภาค', label: 'ระดับภาค', count: 0 },
      { level: 'ระดับเขตพื้นที่', label: 'ระดับเขตพื้นที่', count: 0 },
      { level: 'ระดับกลุ่มโรงเรียน', label: 'ระดับกลุ่มโรงเรียน', count: 0 },
      { level: 'ระดับโรงเรียน', label: 'ระดับโรงเรียน', count: 0 },
    ];
    records.forEach((r) => {
      const target = levels.find((l) => l.level === r.awardLevel);
      if (target) target.count += 1;
    });
    return levels;
  }, [records]);

  // Chart 2: Department counts (8 departments)
  const departmentCounts = useMemo(() => {
    const depts = [
      { id: '1', label: '1. ภาษาไทย', short: 'ภาษาไทย', count: 0, color: '#3b82f6' },
      { id: '2', label: '2. คณิตศาสตร์', short: 'คณิตศาสตร์', count: 0, color: '#6366f1' },
      { id: '3', label: '3. วิทยาศาสตร์และเทคโนโลยี', short: 'วิทย์ฯ-เทคโนฯ', count: 0, color: '#06b6d4' },
      { id: '4', label: '4. สังคมศึกษา ศาสนา และวัฒนธรรม', short: 'สังคมศึกษาฯ', count: 0, color: '#f59e0b' },
      { id: '5', label: '5. สุขศึกษาและพลศึกษา', short: 'สุขศึกษา-พละ', count: 0, color: '#ef4444' },
      { id: '6', label: '6. ศิลปะ', short: 'ศิลปะ', count: 0, color: '#ec4899' },
      { id: '7', label: '7. การงานอาชีพ', short: 'การงานอาชีพ', count: 0, color: '#10b981' },
      { id: '8', label: '8. ภาษาต่างประเทศ', short: 'ภาษาต่างประเทศ', count: 0, color: '#8b5cf6' },
      { id: '9', label: '9. แนะแนว', short: 'แนะแนว', count: 0, color: '#06b6d4' },
    ];
    records.forEach((r) => {
      const match = depts.find((d) => r.department?.includes(d.id) || r.department === d.label);
      if (match) {
        match.count += 1;
      }
    });
    return depts;
  }, [records]);

  // Chart 4: Academic Year counts (dynamically collects years from records)
  const yearCounts = useMemo(() => {
    const yearSet = new Set(['2566', '2567', '2568']);
    records.forEach((r) => {
      if (r.academicYear && r.academicYear.trim()) {
        yearSet.add(r.academicYear.trim());
      }
    });
    const sortedYears = Array.from(yearSet).sort();
    return sortedYears.map((yr) => ({
      year: yr,
      count: records.filter((r) => r.academicYear?.trim() === yr).length,
    }));
  }, [records]);

  // Recent 5 activities
  const recentActivities = useMemo(() => {
    return [...records]
      .sort((a, b) => new Date(b.createdAt || b.awardDate).getTime() - new Date(a.createdAt || a.awardDate).getTime())
      .slice(0, 5);
  }, [records]);

  // 8 Specific Cards requested in requirement 2:
  // Left border colors: ม่วง, เขียว, ส้ม, น้ำเงิน, แดง, ฟ้า, ชมพู, เทอร์ควอยซ์
  const statCards = [
    {
      title: 'ผลงานทั้งหมด',
      value: stats.total,
      filter: undefined,
      borderColor: 'border-l-purple-600',
      valueColor: 'text-purple-600',
      iconBg: 'bg-purple-100 text-purple-600',
      icon: Trophy,
    },
    {
      title: 'รางวัลระดับชาติ',
      value: stats.national,
      filter: 'ระดับชาติ',
      borderColor: 'border-l-emerald-600',
      valueColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: Award,
    },
    {
      title: 'รางวัลระดับภาค',
      value: stats.regional,
      filter: 'ระดับภาค',
      borderColor: 'border-l-amber-500',
      valueColor: 'text-amber-600',
      iconBg: 'bg-amber-100 text-amber-600',
      icon: Medal,
    },
    {
      title: 'รางวัลระดับเขตพื้นที่',
      value: stats.area,
      filter: 'ระดับเขตพื้นที่',
      borderColor: 'border-l-blue-600',
      valueColor: 'text-blue-600',
      iconBg: 'bg-blue-100 text-blue-600',
      icon: Star,
    },
    {
      title: 'ครูที่ได้รับรางวัล',
      value: stats.teachersCount,
      filter: undefined,
      onAction: onNavigateToTeachers,
      borderColor: 'border-l-red-600',
      valueColor: 'text-red-600',
      iconBg: 'bg-red-100 text-red-600',
      icon: Users,
    },
    {
      title: 'นักเรียนที่ได้รับรางวัล',
      value: stats.studentsCount,
      filter: undefined,
      borderColor: 'border-l-sky-500',
      valueColor: 'text-sky-600',
      iconBg: 'bg-sky-100 text-sky-600',
      icon: GraduationCap,
    },
    {
      title: 'รูปภาพทั้งหมด',
      value: stats.totalPhotos,
      filter: undefined,
      borderColor: 'border-l-pink-500',
      valueColor: 'text-pink-600',
      iconBg: 'bg-pink-100 text-pink-600',
      icon: ImageIcon,
    },
    {
      title: 'เอกสารทั้งหมด',
      value: stats.totalDocuments,
      filter: undefined,
      borderColor: 'border-l-teal-500',
      valueColor: 'text-teal-600',
      iconBg: 'bg-teal-100 text-teal-600',
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              กลุ่มบริหารงานบุคคล · โรงเรียนพังโคนวิทยาคม
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              โรงเรียนพังโคนวิทยาคม
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              สรุปสถิติผลงาน รางวัลเชิดชูเกียรติครูและนักเรียน กลุ่มบริหารงานบุคคล
              บันทึกผลงานลงระบบ Google Sheet และ Google Drive อัตโนมัติ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onNavigateToTeachers && (
              <button
                onClick={onNavigateToTeachers}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-100 bg-emerald-700/80 hover:bg-emerald-600 active:bg-emerald-800 rounded-xl border border-emerald-500/40 shadow-sm transition-all hover:scale-[1.02] flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4 text-emerald-200" />
                <span>ผลงานครู (ประเมินขั้น)</span>
              </button>
            )}
            <button
              onClick={() => onNavigateToList()}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 rounded-xl border border-slate-700 transition-colors"
            >
              ดูผลงานทั้งหมด ({records.length})
            </button>
            <button
              onClick={onOpenAddModal}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-xl shadow-lg shadow-red-950 transition-all hover:scale-105 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>เพิ่มกิจกรรมใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: Dashboard แสดงสถิติผลงาน โดยใช้ Card Layout
          แต่ละการ์ดมีหัวข้อ, ตัวเลขใหญ่สีตามหมวด, ไอคอนวงกลมขวา, แถบสีซ้าย
          คลิกแล้วเข้าไปที่หน้า “บันทึกข้อมูลกิจกรรม” ทั้งหมด
          + ปุ่ม "เพิ่มกิจกรรมใหม่" (เอาไว้สุดท้าย) สีแดง และเด่นที่สุด
         ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>ภาพรวมสถิติผลงานและรางวัล</span>
            </h3>
            <p className="text-xs text-slate-400">
              คลิกการ์ดเพื่อดูรายการผลงานตามหมวดหมู่
            </p>
          </div>
        </div>

        {/* Responsive Grid: 4 cols desktop, 2 cols tablet, 1 col mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {statCards.map((card, idx) => {
            const IconComponent = card.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  if (card.onAction) {
                    card.onAction();
                  } else {
                    onNavigateToList(card.filter);
                  }
                }}
                className={`group relative text-left bg-white rounded-xl shadow-md p-5 border-l-4 ${card.borderColor} border-t border-r border-b border-slate-200/80 hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {card.title}
                    </p>
                    <p
                      className={`text-3xl font-extrabold ${card.valueColor} font-mono tabular-nums`}
                    >
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-full ${card.iconBg} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium group-hover:text-slate-900 transition-colors">
                  <span>ดูข้อมูลในระบบ</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}

          {/* ปุ่ม "เพิ่มกิจกรรมใหม่" (เอาไว้สุดท้าย) สีแดง และทำให้เด่นที่สุด */}
          <button
            onClick={onOpenAddModal}
            className="group relative sm:col-span-2 lg:col-span-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-xl shadow-xl p-6 border-2 border-red-400 hover:border-white transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white text-red-600 flex items-center justify-center shadow-lg shrink-0 group-hover:rotate-6 transition-transform">
                <PlusCircle className="w-8 h-8" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white mb-1 uppercase tracking-wider">
                  บันทึกข้อมูลด่วน
                </span>
                <h4 className="text-xl sm:text-2xl font-extrabold text-white">
                  + เพิ่มกิจกรรมและบันทึกภาพถ่ายใหม่
                </h4>
                <p className="text-xs sm:text-sm text-red-100">
                  กรอกรายละเอียด อัปโหลดภาพ 1-3 รูป และไฟล์ PDF พร้อมส่งตรงเข้า Google Sheet ทันที
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 bg-white text-red-600 font-bold px-6 py-3 rounded-xl shadow-md group-hover:bg-red-50 transition-colors">
              <span>เริ่มบันทึก</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: Section “สรุปผลงาน” โดยแสดงเป็นการ์ด (Card) 4 ใบ
          1. การ์ดที่ 1: กราฟแท่งแนวตั้ง (Bar Chart) "ผลงานตามระดับ"
          2. การ์ดที่ 2: กราฟแท่งแนวนอน (Horizontal Bar Chart) "ผลงานตามกลุ่มสาระ"
          3. การ์ดที่ 3: กราฟวงกลม (Pie Chart) "จำนวนครูและนักเรียน"
          4. การ์ดที่ 4: กราฟเส้น (Line Chart) "ผลงานรายปีการศึกษา"
          โทนสีหลัก: ฟ้า, ส้ม, ม่วง, แดง
         ========================================================================= */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span>สรุปผลงานเชิงสถิติ (Charts & Visual Analytics)</span>
          </h3>
          <p className="text-xs text-slate-400">
            จำแนกตามระดับรางวัล กลุ่มสาระ บุคลากร และเปรียบเทียบตามปีการศึกษา
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* การ์ดที่ 1: กราฟแท่งแนวตั้ง (Bar Chart) หัวข้อ "ผลงานตามระดับ" (โทนสี: ฟ้า) */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                ผลงานตามระดับ
              </h4>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                กราฟแท่งแนวตั้ง
              </span>
            </div>

            {/* Vertical Bar Chart SVG */}
            <div className="py-6">
              <div className="h-52 flex items-end justify-between gap-2 sm:gap-4 px-2 pt-6">
                {levelCounts.map((item, idx) => {
                  const maxCount = Math.max(...levelCounts.map((l) => l.count), 1);
                  const heightPercent = Math.max((item.count / maxCount) * 80, 8);
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center gap-2 group relative"
                    >
                      {/* Tooltip / Value on top */}
                      <span className="text-xs font-bold text-blue-700 font-mono tabular-nums">
                        {item.count}
                      </span>
                      {/* Bar */}
                      <div className="w-full max-w-[48px] bg-slate-100 rounded-t-lg h-36 flex items-end p-1">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-gradient-to-t from-blue-700 to-sky-400 rounded-t-md transition-all duration-500 group-hover:from-blue-600 group-hover:to-sky-300 shadow-sm"
                        ></div>
                      </div>
                      {/* Label below */}
                      <span className="text-[11px] font-medium text-slate-600 text-center truncate max-w-[65px] sm:max-w-[80px]" title={item.label}>
                        {item.label.replace('ระดับ', '')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>แกน X: ระดับรางวัล</span>
              <span className="font-mono tabular-nums font-semibold text-slate-700">
                รวม {records.length} รางวัล
              </span>
            </div>
          </div>

          {/* การ์ดที่ 2: กราฟแท่งแนวนอน (Horizontal Bar Chart) หัวข้อ "ผลงานตามกลุ่มสาระ" (โทนสี: ส้ม) */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                ผลงานตามกลุ่มสาระ
              </h4>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">
                กราฟแท่งแนวนอน (กลุ่มสาระฯ และแนะแนว)
              </span>
            </div>

            {/* Horizontal Bar Chart */}
            <div className="py-4 space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {departmentCounts.map((dept) => {
                const maxDept = Math.max(...departmentCounts.map((d) => d.count), 1);
                const widthPercent = Math.max((dept.count / maxDept) * 100, dept.count > 0 ? 12 : 3);
                return (
                  <div key={dept.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate max-w-[200px]" title={dept.label}>
                        {dept.short}
                      </span>
                      <span className="font-mono tabular-nums font-bold text-amber-700">
                        {dept.count} ผลงาน
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${widthPercent}%` }}
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-500"
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>กลุ่มสาระการเรียนรู้และกิจกรรมแนะแนว</span>
              <span className="text-slate-600 font-medium">โรงเรียนพังโคนวิทยาคม</span>
            </div>
          </div>

          {/* การ์ดที่ 3: กราฟวงกลม (Pie Chart) หัวข้อ "จำนวนครูและนักเรียน" (โทนสี: ม่วง) */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                จำนวนครูและนักเรียน
              </h4>
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md">
                กราฟวงกลม (Pie/Donut)
              </span>
            </div>

            {/* Modern Donut SVG Chart */}
            <div className="py-6 flex flex-col sm:flex-row items-center justify-center gap-6">
              {/* Donut Chart SVG */}
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="14"
                  />
                  {/* Teachers slice */}
                  {stats.teachersCount > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#8b5cf6"
                      strokeWidth="14"
                      strokeDasharray={`${
                        (stats.teachersCount /
                          Math.max(stats.teachersCount + stats.studentsCount, 1)) *
                        238.76
                      } 238.76`}
                      strokeDashoffset="0"
                      className="transition-all duration-500"
                    />
                  )}
                  {/* Students slice */}
                  {stats.studentsCount > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#06b6d4"
                      strokeWidth="14"
                      strokeDasharray={`${
                        (stats.studentsCount /
                          Math.max(stats.teachersCount + stats.studentsCount, 1)) *
                        238.76
                      } 238.76`}
                      strokeDashoffset={`-${
                        (stats.teachersCount /
                          Math.max(stats.teachersCount + stats.studentsCount, 1)) *
                        238.76
                      }`}
                      className="transition-all duration-500"
                    />
                  )}
                </svg>

                {/* Inner text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-slate-800 font-mono tabular-nums">
                    {stats.teachersCount + stats.studentsCount}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">รวมผู้รับรางวัล</span>
                </div>
              </div>

              {/* Legend with exact numbers */}
              <div className="space-y-3 w-full sm:w-auto">
                <div className="flex items-center justify-between gap-4 p-2.5 rounded-lg bg-purple-50/70 border border-purple-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-600"></span>
                    <span className="text-xs font-semibold text-slate-800">ครูที่ได้รับรางวัล</span>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-sm text-purple-700">
                    {stats.teachersCount} ท่าน
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 p-2.5 rounded-lg bg-cyan-50/70 border border-cyan-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
                    <span className="text-xs font-semibold text-slate-800">นักเรียนที่ได้รับรางวัล</span>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-sm text-cyan-700">
                    {stats.studentsCount} คน
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>สัดส่วนผู้รับรางวัล</span>
              <span className="font-semibold text-purple-700">
                {stats.teachersCount > 0 || stats.studentsCount > 0
                  ? `ครู ${Math.round(
                      (stats.teachersCount / Math.max(stats.teachersCount + stats.studentsCount, 1)) * 100
                    )}% / นักเรียน ${Math.round(
                      (stats.studentsCount / Math.max(stats.teachersCount + stats.studentsCount, 1)) * 100
                    )}%`
                  : 'ยังไม่มีข้อมูล'}
              </span>
            </div>
          </div>

          {/* การ์ดที่ 4: กราฟเส้น (Line Chart) หัวข้อ "ผลงานรายปีการศึกษา" (โทนสี: แดง) */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                ผลงานรายปีการศึกษา
              </h4>
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-md">
                กราฟเส้น (Line Chart)
              </span>
            </div>

            {/* Line Chart Area */}
            <div className="py-6">
              <div className="relative h-44 w-full flex items-end">
                {/* SVG Line & Area chart */}
                <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120">
                  <defs>
                    <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="10" x2="300" y2="10" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="50" x2="300" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="90" x2="300" y2="90" stroke="#f1f5f9" strokeWidth="1" />

                  {/* Dynamic Coordinates for any number of years */}
                  {(() => {
                    const maxVal = Math.max(...yearCounts.map((y) => y.count), 4);
                    const n = yearCounts.length;
                    const step = n > 1 ? 240 / (n - 1) : 0;
                    const pts = yearCounts.map((item, idx) => ({
                      x: n === 1 ? 150 : 30 + idx * step,
                      y: 100 - (item.count / maxVal) * 80,
                      count: item.count,
                      year: item.year,
                    }));

                    const pathD = pts.reduce(
                      (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
                      ''
                    );
                    const areaD =
                      pts.length > 1
                        ? `${pathD} L ${pts[pts.length - 1].x} 100 L ${pts[0].x} 100 Z`
                        : '';

                    return (
                      <>
                        {areaD && <path d={areaD} fill="url(#redGrad)" />}
                        <path d={pathD} fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
                        {pts.map((pt, i) => (
                          <g key={i}>
                            <circle cx={pt.x} cy={pt.y} r="5" fill="#dc2626" stroke="#ffffff" strokeWidth="2" />
                            <text
                              x={pt.x}
                              y={pt.y - 10}
                              textAnchor="middle"
                              className="text-[11px] font-bold fill-red-700 font-mono"
                            >
                              {pt.count}
                            </text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* X Axis Labels */}
              <div className="flex justify-between px-3 sm:px-6 text-xs font-semibold text-slate-600 mt-2 overflow-x-auto gap-2">
                {yearCounts.map((item) => (
                  <span
                    key={item.year}
                    className={item.year === '2568' ? 'text-red-600 font-bold shrink-0' : 'shrink-0'}
                  >
                    ปี {item.year}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>แกน X: ปีการศึกษา / แกน Y: จำนวนผลงาน</span>
              <span className="font-mono tabular-nums text-red-600 font-semibold">
                แนวโน้มเพิ่มขึ้น
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: Section “ผลงานล่าสุด” ในรูปแบบรายการ (List Item)
          ไอคอนถ้วยรางวัลวงกลมสีม่วงทางซ้าย, ชื่อผลงาน, รายละเอียดเล็ก ๆ, 
          วันที่ประกาศผลงาน, Badge ด้านขวา (เช่น "ระดับชาติ" สีเขียว, "ระดับเขตพื้นที่" สีม่วง)
          หัวข้อ "ผลงานล่าสุด" พร้อมไอคอนนาฬิกา + ลิงก์ "ดูทั้งหมด →" ด้านขวา
         ========================================================================= */}
      <section className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">ผลงานล่าสุด</h3>
              <p className="text-xs text-slate-500">
                รายการรางวัลและกิจกรรมที่ได้รับการบันทึกในระบบล่าสุด
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToList()}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <span>ดูทั้งหมด</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 mt-2">
          {recentActivities.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              ยังไม่มีข้อมูลกิจกรรม
            </div>
          ) : (
            recentActivities.map((act) => {
              const getBadgeColor = (lvl: AwardLevel) => {
                switch (lvl) {
                  case 'ระดับชาติ':
                    return 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  case 'ระดับภาค':
                    return 'bg-amber-100 text-amber-800 border-amber-300';
                  case 'ระดับเขตพื้นที่':
                    return 'bg-purple-100 text-purple-800 border-purple-300';
                  case 'ระดับกลุ่มโรงเรียน':
                    return 'bg-blue-100 text-blue-800 border-blue-300';
                  default:
                    return 'bg-slate-100 text-slate-800 border-slate-300';
                }
              };

              return (
                <div
                  key={act.id}
                  onClick={() => onSelectRecord(act)}
                  className="group py-4 px-3 -mx-3 rounded-lg hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-start gap-3.5">
                    {/* ภาพตัวอย่างผลงาน หรือ ไอคอนถ้วยรางวัล (ยึดภาพกิจกรรมเป็นหลัก และรองรับเกียรติบัตร) */}
                    {(() => {
                      const preview = getPreviewMedia(act);
                      if (preview.kind !== 'none') {
                        return (
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 mt-0.5 group-hover:scale-105 transition-transform bg-slate-100 relative">
                            <ActivityImage
                              src={preview.url}
                              originalUrl={preview.originalUrl}
                              alt={act.awardName}
                              containerClassName="w-full h-full"
                              className="w-full h-full object-cover"
                              fallbackTitle=""
                            />
                            {preview.kind === 'certificate' && (
                              <div className="absolute top-0.5 right-0.5 bg-amber-600/90 text-white rounded-full p-0.5 shadow-xs">
                                <Award className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div className="w-11 h-11 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                          <Trophy className="w-5 h-5" />
                        </div>
                      );
                    })()}

                    <div className="space-y-0.5">
                      {/* ชื่อผลงาน (ข้อความหลัก) */}
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                        {act.awardName}
                      </h4>

                      {/* รายละเอียดเล็ก ๆ (ระดับ + ชื่อผู้รับ) */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="font-medium text-slate-700">
                          {act.department}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span>
                          ผู้รับ:{' '}
                          <span className="font-semibold text-slate-800">
                            {act.teacherName || act.studentName || '-'}
                          </span>
                        </span>
                        {act.photos?.length > 0 && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-indigo-600 font-medium flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              {act.photos.length} ภาพ
                            </span>
                          </>
                        )}
                        {act.certificates && act.certificates.length > 0 && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-amber-600 font-medium flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              เกียรติบัตร
                            </span>
                          </>
                        )}
                      </div>

                      {/* วันที่ประกาศผลงาน (ข้อความเล็กด้านล่าง) */}
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>วันที่ประกาศผล/ได้รับรางวัล: {formatDisplayDate(act.awardDate)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Badge ด้านขวา (เช่น "ระดับชาติ" สีเขียว, "ระดับเขตพื้นที่" สีม่วง) */}
                  <div className="flex items-center gap-2 sm:self-center shrink-0">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${getBadgeColor(
                        act.awardLevel
                      )}`}
                    >
                      {act.awardLevel}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all hidden sm:block" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
