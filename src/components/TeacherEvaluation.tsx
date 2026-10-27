import React, { useState, useMemo } from 'react';
import {
  Users,
  Award,
  Trophy,
  TrendingUp,
  Percent,
  Search,
  Filter,
  Printer,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Calendar,
  CheckCircle2,
  Sparkles,
  School,
  Medal,
  Star,
  Eye,
} from 'lucide-react';
import { ActivityRecord, AwardLevel } from '../types';
import { DEPARTMENTS } from '../data/initialData';

interface TeacherEvaluationProps {
  records: ActivityRecord[];
  onSelectRecord: (record: ActivityRecord) => void;
}

interface TeacherSummary {
  teacherName: string;
  department: string;
  totalWorks: number;
  levelCounts: Record<AwardLevel, number>;
  levelPercentages: Record<AwardLevel, number>;
  yearCounts: Record<string, number>;
  items: ActivityRecord[];
  score: number;
  evaluationTier: 'ดีเด่น' | 'ดีมาก' | 'ดี' | 'ผ่านเกณฑ์';
  highLevelPercent: number; // % of National + Regional
}

export const TeacherEvaluation: React.FC<TeacherEvaluationProps> = ({
  records,
  onSelectRecord,
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ทั้งหมด');
  const [selectedYear, setSelectedYear] = useState<string>('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null);
  const [printingTeacher, setPrintingTeacher] = useState<TeacherSummary | null>(null);

  // Extract all unique academic years from records
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    records.forEach((r) => {
      if (r.academicYear && r.academicYear.trim()) {
        years.add(r.academicYear.trim());
      }
    });
    return Array.from(years).sort().reverse();
  }, [records]);

  // Group and aggregate records per teacher
  const teacherSummaries = useMemo(() => {
    const map = new Map<string, ActivityRecord[]>();

    records.forEach((r) => {
      const rawName = r.teacherName?.trim();
      if (!rawName || rawName === '-' || rawName === 'ไม่มี' || rawName === 'คณะครู') {
        // If it contains multiple teachers separated by commas
        if (rawName && rawName.includes(',')) {
          rawName.split(',').forEach((sub) => {
            const cleanSub = sub.trim();
            if (cleanSub) {
              const current = map.get(cleanSub) || [];
              current.push(r);
              map.set(cleanSub, current);
            }
          });
        }
        return;
      }

      const current = map.get(rawName) || [];
      current.push(r);
      map.set(rawName, current);
    });

    const summaries: TeacherSummary[] = [];

    map.forEach((items, name) => {
      // Filter by selected year if specified
      const filteredByYear =
        selectedYear === 'ทั้งหมด'
          ? items
          : items.filter((it) => it.academicYear === selectedYear);

      if (filteredByYear.length === 0) return;

      // Primary department (the one that appears most often)
      const deptCounts: Record<string, number> = {};
      items.forEach((it) => {
        deptCounts[it.department] = (deptCounts[it.department] || 0) + 1;
      });
      const primaryDept = Object.keys(deptCounts).sort(
        (a, b) => deptCounts[b] - deptCounts[a]
      )[0] || 'ไม่ระบุ';

      // Filter by department if selected
      if (selectedDepartment !== 'ทั้งหมด' && primaryDept !== selectedDepartment) {
        return;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = name.toLowerCase().includes(query);
        const matchDept = primaryDept.toLowerCase().includes(query);
        if (!matchName && !matchDept) return;
      }

      const total = filteredByYear.length;
      const levels: Record<AwardLevel, number> = {
        ระดับชาติ: 0,
        ระดับภาค: 0,
        ระดับเขตพื้นที่: 0,
        ระดับกลุ่มโรงเรียน: 0,
        ระดับโรงเรียน: 0,
      };

      const years: Record<string, number> = {};

      filteredByYear.forEach((it) => {
        if (levels[it.awardLevel] !== undefined) {
          levels[it.awardLevel] += 1;
        }
        years[it.academicYear] = (years[it.academicYear] || 0) + 1;
      });

      const percentages: Record<AwardLevel, number> = {
        ระดับชาติ: total > 0 ? Math.round((levels['ระดับชาติ'] / total) * 100) : 0,
        ระดับภาค: total > 0 ? Math.round((levels['ระดับภาค'] / total) * 100) : 0,
        ระดับเขตพื้นที่: total > 0 ? Math.round((levels['ระดับเขตพื้นที่'] / total) * 100) : 0,
        ระดับกลุ่มโรงเรียน: total > 0 ? Math.round((levels['ระดับกลุ่มโรงเรียน'] / total) * 100) : 0,
        ระดับโรงเรียน: total > 0 ? Math.round((levels['ระดับโรงเรียน'] / total) * 100) : 0,
      };

      // Quality evaluation score based on standard MOE/OBEC weight:
      // ระดับชาติ = 5, ระดับภาค = 4, ระดับเขตพื้นที่ = 3, กลุ่มโรงเรียน = 2, โรงเรียน = 1
      const score =
        levels['ระดับชาติ'] * 5 +
        levels['ระดับภาค'] * 4 +
        levels['ระดับเขตพื้นที่'] * 3 +
        levels['ระดับกลุ่มโรงเรียน'] * 2 +
        levels['ระดับโรงเรียน'] * 1;

      const highLevelPercent = percentages['ระดับชาติ'] + percentages['ระดับภาค'];

      let tier: 'ดีเด่น' | 'ดีมาก' | 'ดี' | 'ผ่านเกณฑ์' = 'ผ่านเกณฑ์';
      if (levels['ระดับชาติ'] >= 1 || score >= 10 || highLevelPercent >= 50) {
        tier = 'ดีเด่น';
      } else if (levels['ระดับภาค'] >= 1 || levels['ระดับเขตพื้นที่'] >= 2 || score >= 6) {
        tier = 'ดีมาก';
      } else if (score >= 3) {
        tier = 'ดี';
      }

      summaries.push({
        teacherName: name,
        department: primaryDept,
        totalWorks: total,
        levelCounts: levels,
        levelPercentages: percentages,
        yearCounts: years,
        items: filteredByYear,
        score,
        evaluationTier: tier,
        highLevelPercent,
      });
    });

    // Sort by evaluation score descending
    return summaries.sort((a, b) => b.score - a.score);
  }, [records, selectedDepartment, selectedYear, searchQuery]);

  // Aggregate stats across filtered teachers
  const aggregateStats = useMemo(() => {
    const totalTeachers = teacherSummaries.length;
    const totalAwards = teacherSummaries.reduce((acc, t) => acc + t.totalWorks, 0);
    const outstandingTeachers = teacherSummaries.filter(
      (t) => t.evaluationTier === 'ดีเด่น'
    ).length;
    const totalNational = teacherSummaries.reduce(
      (acc, t) => acc + t.levelCounts['ระดับชาติ'],
      0
    );

    return {
      totalTeachers,
      totalAwards,
      outstandingTeachers,
      totalNational,
    };
  }, [teacherSummaries]);

  // Handle individual print report for salary promotion
  const handlePrintTeacherReport = (teacher: TeacherSummary) => {
    setPrintingTeacher(teacher);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'ดีเด่น':
        return 'bg-emerald-600 text-white border-emerald-500';
      case 'ดีมาก':
        return 'bg-blue-600 text-white border-blue-500';
      case 'ดี':
        return 'bg-amber-600 text-white border-amber-500';
      default:
        return 'bg-slate-600 text-white border-slate-500';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner: สรุปผลงานครูเพื่อประเมินเลื่อนขั้นเงินเดือน */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-red-400" />
            <span>กลุ่มบริหารงานบุคคล · โรงเรียนพังโคนวิทยาคม</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            ระบบรวมผลงานครูเพื่อประเมินเลื่อนขั้นเงินเดือน (ว.PA)
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            วิเคราะห์ผลงานและรางวัลของครูรายบุคคล แยกเป็นร้อยละ (%)
            ตามระดับรางวัลและกลุ่มสาระการเรียนรู้ เพื่อใช้เป็นหลักฐานเชิงประจักษ์ในการประเมินประสิทธิภาพและประสิทธิผลการปฏิบัติงาน
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold border border-slate-700 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงานสรุปผลงานครูทั้งหมด</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-l-blue-600 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">
                ครูที่มีผลงานในระบบ
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-blue-700 font-mono mt-1">
                {aggregateStats.totalTeachers} ท่าน
              </p>
            </div>
            <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            บันทึกผลงานในฐานข้อมูลโรงเรียน
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-l-purple-600 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">
                ผลงานรวมที่ส่งเข้ามา
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-purple-700 font-mono mt-1">
                {aggregateStats.totalAwards} ผลงาน
              </p>
            </div>
            <div className="w-11 h-11 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            เฉลี่ย {(aggregateStats.totalAwards / Math.max(aggregateStats.totalTeachers, 1)).toFixed(1)} ผลงาน/ท่าน
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-l-emerald-600 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">
                ผลงานระดับชาติ
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono mt-1">
                {aggregateStats.totalNational} รางวัล
              </p>
            </div>
            <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            สัดส่วน {aggregateStats.totalAwards > 0 ? Math.round((aggregateStats.totalNational / aggregateStats.totalAwards) * 100) : 0}% ของผลงานทั้งหมด
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-l-amber-500 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">
                ครูระดับผลงานดีเด่น
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono mt-1">
                {aggregateStats.outstandingTeachers} ท่าน
              </p>
            </div>
            <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <Medal className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            พร้อมเสนอพิจารณาเลื่อนขั้นสูงสุด
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-md p-5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Filter by Department (กลุ่มสาระ) */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>กลุ่มสาระ:</span>
            </span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="ทั้งหมด">ทุกกลุ่มสาระการเรียนรู้</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Academic Year (ปีการศึกษา) */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>ปีการศึกษา:</span>
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="ทั้งหมด">ทุกปีการศึกษา (ผลงานสะสม)</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  ปีการศึกษา {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search by Teacher Name */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อครู..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Teacher Cards: Individual Percentage & Level Breakdown */}
      {teacherSummaries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-200 space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">
            ไม่พบข้อมูลผลงานครูตามเงื่อนไขที่เลือก
          </h3>
          <p className="text-xs text-slate-400">
            ลองปรับเปลี่ยนกลุ่มสาระ ปีการศึกษา หรือคำค้นหาชื่อครู
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {teacherSummaries.map((teacher, index) => {
            const isExpanded = expandedTeacher === teacher.teacherName;

            return (
              <div
                key={teacher.teacherName}
                className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Main Teacher Header Card */}
                <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-100">
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Rank Badge */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-md">
                      #{index + 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                          {teacher.teacherName}
                        </h3>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${getTierBadge(
                            teacher.evaluationTier
                          )}`}
                        >
                          ระดับ{teacher.evaluationTier}
                        </span>
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                          {teacher.department}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>
                          ผลงานรวม:{' '}
                          <strong className="text-slate-800 font-mono">
                            {teacher.totalWorks}
                          </strong>{' '}
                          รายการ
                        </span>
                        <span>·</span>
                        <span>
                          คะแนนประเมินคุณภาพ:{' '}
                          <strong className="text-purple-700 font-mono font-bold">
                            {teacher.score}
                          </strong>{' '}
                          แต้ม
                        </span>
                        <span>·</span>
                        <span>
                          ผลงานระดับชาติ/ภาค:{' '}
                          <strong className="text-emerald-700 font-mono font-bold">
                            {teacher.highLevelPercent}%
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this teacher */}
                  <div className="flex items-center gap-2.5 self-end lg:self-center shrink-0">
                    <button
                      onClick={() => handlePrintTeacherReport(teacher)}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                      title="พิมพ์ใบสรุปผลงานรายบุคคลเพื่อประเมินขั้นเงินเดือน"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>พิมพ์ใบประเมิน</span>
                    </button>

                    <button
                      onClick={() =>
                        setExpandedTeacher(isExpanded ? null : teacher.teacherName)
                      }
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                    >
                      <span>{isExpanded ? 'ซ่อนผลงาน' : 'ดูผลงานทั้งหมด'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Level Percentage & Distribution Visual Bar */}
                <div className="p-5 sm:p-6 bg-slate-50/70 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-purple-600" />
                      <span>สัดส่วนเปอร์เซ็นต์ร้อยละผลงานตามระดับรางวัล:</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      (ฐานคำนวณจาก {teacher.totalWorks} ผลงาน)
                    </span>
                  </div>

                  {/* Multi-segment Colored Percentage Bar */}
                  <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                    {teacher.levelPercentages['ระดับชาติ'] > 0 && (
                      <div
                        style={{ width: `${teacher.levelPercentages['ระดับชาติ']}%` }}
                        className="h-full bg-emerald-600 transition-all relative group"
                        title={`ระดับชาติ: ${teacher.levelPercentages['ระดับชาติ']}% (${teacher.levelCounts['ระดับชาติ']} งาน)`}
                      />
                    )}
                    {teacher.levelPercentages['ระดับภาค'] > 0 && (
                      <div
                        style={{ width: `${teacher.levelPercentages['ระดับภาค']}%` }}
                        className="h-full bg-amber-500 transition-all relative group"
                        title={`ระดับภาค: ${teacher.levelPercentages['ระดับภาค']}% (${teacher.levelCounts['ระดับภาค']} งาน)`}
                      />
                    )}
                    {teacher.levelPercentages['ระดับเขตพื้นที่'] > 0 && (
                      <div
                        style={{ width: `${teacher.levelPercentages['ระดับเขตพื้นที่']}%` }}
                        className="h-full bg-purple-600 transition-all relative group"
                        title={`ระดับเขตพื้นที่: ${teacher.levelPercentages['ระดับเขตพื้นที่']}% (${teacher.levelCounts['ระดับเขตพื้นที่']} งาน)`}
                      />
                    )}
                    {teacher.levelPercentages['ระดับกลุ่มโรงเรียน'] > 0 && (
                      <div
                        style={{ width: `${teacher.levelPercentages['ระดับกลุ่มโรงเรียน']}%` }}
                        className="h-full bg-blue-600 transition-all relative group"
                        title={`ระดับกลุ่มโรงเรียน: ${teacher.levelPercentages['ระดับกลุ่มโรงเรียน']}%`}
                      />
                    )}
                    {teacher.levelPercentages['ระดับโรงเรียน'] > 0 && (
                      <div
                        style={{ width: `${teacher.levelPercentages['ระดับโรงเรียน']}%` }}
                        className="h-full bg-slate-400 transition-all relative group"
                        title={`ระดับโรงเรียน: ${teacher.levelPercentages['ระดับโรงเรียน']}%`}
                      />
                    )}
                  </div>

                  {/* Level Badges with Exact Percentages & Counts */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
                    {/* ระดับชาติ */}
                    <div className="bg-white rounded-lg p-2.5 border border-emerald-200 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-emerald-800">
                          ระดับชาติ
                        </span>
                        <span className="font-extrabold text-emerald-700 font-mono text-sm">
                          {teacher.levelPercentages['ระดับชาติ']}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                        <span>จำนวน:</span>
                        <strong className="text-slate-800 font-mono">
                          {teacher.levelCounts['ระดับชาติ']} งาน
                        </strong>
                      </div>
                    </div>

                    {/* ระดับภาค */}
                    <div className="bg-white rounded-lg p-2.5 border border-amber-200 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-amber-800">
                          ระดับภาค
                        </span>
                        <span className="font-extrabold text-amber-700 font-mono text-sm">
                          {teacher.levelPercentages['ระดับภาค']}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                        <span>จำนวน:</span>
                        <strong className="text-slate-800 font-mono">
                          {teacher.levelCounts['ระดับภาค']} งาน
                        </strong>
                      </div>
                    </div>

                    {/* ระดับเขตพื้นที่ */}
                    <div className="bg-white rounded-lg p-2.5 border border-purple-200 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-purple-800">
                          ระดับเขตพื้นที่
                        </span>
                        <span className="font-extrabold text-purple-700 font-mono text-sm">
                          {teacher.levelPercentages['ระดับเขตพื้นที่']}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                        <span>จำนวน:</span>
                        <strong className="text-slate-800 font-mono">
                          {teacher.levelCounts['ระดับเขตพื้นที่']} งาน
                        </strong>
                      </div>
                    </div>

                    {/* ระดับกลุ่มโรงเรียน */}
                    <div className="bg-white rounded-lg p-2.5 border border-blue-200 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-blue-800">
                          ระดับกลุ่มโรงเรียน
                        </span>
                        <span className="font-extrabold text-blue-700 font-mono text-sm">
                          {teacher.levelPercentages['ระดับกลุ่มโรงเรียน']}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                        <span>จำนวน:</span>
                        <strong className="text-slate-800 font-mono">
                          {teacher.levelCounts['ระดับกลุ่มโรงเรียน']} งาน
                        </strong>
                      </div>
                    </div>

                    {/* ระดับโรงเรียน */}
                    <div className="bg-white rounded-lg p-2.5 border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">
                          ระดับโรงเรียน
                        </span>
                        <span className="font-extrabold text-slate-700 font-mono text-sm">
                          {teacher.levelPercentages['ระดับโรงเรียน']}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                        <span>จำนวน:</span>
                        <strong className="text-slate-800 font-mono">
                          {teacher.levelCounts['ระดับโรงเรียน']} งาน
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Award Items List */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 border-t border-slate-200 bg-white space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        รายการผลงานและรางวัลที่บันทึกไว้ในระบบ ({teacher.items.length} รายการ)
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        คลิกที่ผลงานเพื่อเปิดดูภาพถ่ายและเกียรติบัตร
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {teacher.items.map((item, idx) => (
                        <div
                          key={item.id}
                          onClick={() => onSelectRecord(item)}
                          className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-xs font-mono font-bold text-slate-400 mt-0.5 w-6">
                              {idx + 1}.
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
                                  {item.awardName}
                                </span>
                                {item.certificates && item.certificates.length > 0 && (
                                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Award className="w-3 h-3" />
                                    มีเกียรติบัตร ({item.certificates.length})
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {item.organizer} · ปีการศึกษา {item.academicYear} · วันที่:{' '}
                                {item.awardDate}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:self-center shrink-0">
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                item.awardLevel === 'ระดับชาติ'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.awardLevel === 'ระดับภาค'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {item.awardLevel}
                            </span>
                            <Eye className="w-4 h-4 text-slate-400 hover:text-blue-600" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Printable Sheet for Individual Teacher Evaluation (Hidden on screen, visible during print) */}
      {printingTeacher && (
        <div className="print-only hidden p-8 text-black bg-white">
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-xl font-bold">โรงเรียนพังโคนวิทยาคม</h1>
            <h2 className="text-base font-semibold">กลุ่มบริหารงานบุคคล สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสกลนคร</h2>
            <h3 className="text-sm mt-1">
              แบบสรุปผลงานและรางวัลเชิงประจักษ์เพื่อประกอบการประเมินเลื่อนขั้นเงินเดือน / ว.PA
            </h3>
          </div>

          <div className="mb-4 text-sm leading-relaxed space-y-1">
            <p><strong>ชื่อ-สกุล ข้าราชการครู:</strong> {printingTeacher.teacherName}</p>
            <p><strong>กลุ่มสาระการเรียนรู้:</strong> {printingTeacher.department}</p>
            <p><strong>ระดับผลการประเมินการพัฒนางาน:</strong> ระดับ{printingTeacher.evaluationTier} (คะแนนรวม: {printingTeacher.score} แต้ม)</p>
            <p><strong>จำนวนผลงานรวม:</strong> {printingTeacher.totalWorks} ผลงาน</p>
          </div>

          <table className="w-full text-xs border border-black border-collapse my-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 text-center">ระดับรางวัล</th>
                <th className="border border-black p-2 text-center">จำนวนผลงาน</th>
                <th className="border border-black p-2 text-center">คิดเป็นร้อยละ (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold">1. ระดับชาติ</td>
                <td className="border border-black p-2 text-center">{printingTeacher.levelCounts['ระดับชาติ']}</td>
                <td className="border border-black p-2 text-center">{printingTeacher.levelPercentages['ระดับชาติ']}%</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">2. ระดับภาค</td>
                <td className="border border-black p-2 text-center">{printingTeacher.levelCounts['ระดับภาค']}</td>
                <td className="border border-black p-2 text-center">{printingTeacher.levelPercentages['ระดับภาค']}%</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">3. ระดับเขตพื้นที่การศึกษา</td>
                <td className="border border-black p-2 text-center">{printingTeacher.levelCounts['ระดับเขตพื้นที่']}</td>
                <td className="border border-black p-2 text-center">{printingTeacher.levelPercentages['ระดับเขตพื้นที่']}%</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">4. ระดับกลุ่มโรงเรียน</td>
                <td className="border border-black p-2 text-center">{printingTeacher.levelCounts['ระดับกลุ่มโรงเรียน']}</td>
                <td className="border border-black p-2 text-center">{printingTeacher.levelPercentages['ระดับกลุ่มโรงเรียน']}%</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">5. ระดับโรงเรียน</td>
                <td className="border border-black p-2 text-center">{printingTeacher.levelCounts['ระดับโรงเรียน']}</td>
                <td className="border border-black p-2 text-center">{printingTeacher.levelPercentages['ระดับโรงเรียน']}%</td>
              </tr>
            </tbody>
          </table>

          <h4 className="text-xs font-bold mt-4 mb-2">รายละเอียดรายการผลงาน:</h4>
          <ol className="text-xs space-y-1 list-decimal list-inside">
            {printingTeacher.items.map((it, idx) => (
              <li key={idx}>
                {it.awardName} ({it.awardLevel}) - {it.organizer} [ปีการศึกษา {it.academicYear}]
              </li>
            ))}
          </ol>

          <div className="grid grid-cols-2 text-center text-xs mt-16 pt-8">
            <div>
              <p>ลงชื่อ..........................................................</p>
              <p className="mt-1">({printingTeacher.teacherName})</p>
              <p>ผู้รับการประเมิน</p>
            </div>
            <div>
              <p>ลงชื่อ..........................................................</p>
              <p className="mt-1">(..........................................................)</p>
              <p>ประธานคณะกรรมการกลั่นกรอง / ผู้อำนวยการโรงเรียน</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
