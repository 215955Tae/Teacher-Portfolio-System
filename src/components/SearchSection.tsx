import React, { useState, useMemo } from 'react';
import {
  Search,
  Trophy,
  Calendar,
  User,
  Eye,
  Filter,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { ActivityRecord, AwardLevel } from '../types';
import { DEPARTMENTS, AWARD_LEVELS, ACADEMIC_YEARS } from '../data/initialData';

interface SearchSectionProps {
  records: ActivityRecord[];
  onSelectRecord: (record: ActivityRecord) => void;
}

export const SearchSection: React.FC<SearchSectionProps> = ({
  records,
  onSelectRecord,
}) => {
  // Filters
  const [academicYear, setAcademicYear] = useState<string>('');
  const [awardLevel, setAwardLevel] = useState<string>('ทั้งหมด');
  const [department, setDepartment] = useState<string>('ทั้งหมด');
  const [keyword, setKeyword] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(true);

  // Search Results
  const searchResults = useMemo(() => {
    return records.filter((rec) => {
      // Filter year
      if (academicYear && !rec.academicYear.includes(academicYear.trim())) {
        return false;
      }
      // Filter level
      if (awardLevel !== 'ทั้งหมด' && rec.awardLevel !== awardLevel) {
        return false;
      }
      // Filter department
      if (department !== 'ทั้งหมด' && rec.department !== department) {
        return false;
      }
      // Filter keyword (Teacher, Student, or Award name)
      if (keyword.trim()) {
        const query = keyword.toLowerCase().trim();
        const matchTeacher = (rec.teacherName || '').toLowerCase().includes(query);
        const matchStudent = (rec.studentName || '').toLowerCase().includes(query);
        const matchAward = (rec.awardName || '').toLowerCase().includes(query);
        const matchOrg = (rec.organizer || '').toLowerCase().includes(query);
        if (!matchTeacher && !matchStudent && !matchAward && !matchOrg) {
          return false;
        }
      }
      return true;
    });
  }, [records, academicYear, awardLevel, department, keyword]);

  const handleReset = () => {
    setAcademicYear('');
    setAwardLevel('ทั้งหมด');
    setDepartment('ทั้งหมด');
    setKeyword('');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* =========================================================================
          Search Form Card:
          หัวข้อด้านบน “ค้นหาผลงาน” พร้อมไอคอนแว่นขยาย
          แถวของช่องกรอกข้อมูล (Filter):
          - กรอกข้อมูลปีการศึกษา
          - Dropdown ระดับรางวัล
          - Dropdown กลุ่มสาระการเรียนรู้
          - ช่องกรอกข้อความ (ค้นหาชื่อ ครู/นักเรียน)
          ปุ่มค้นหา (พื้นหลังสีม่วง, มีไอคอนแว่นขยาย, อยู่ตรงกลางด้านล่าง)
          ข้อความตัวเล็กด้านล่าง “กรอกเงื่อนไขการค้นหาและกดปุ่มค้นหา” พร้อมไอคอนแว่นขยายใหญ่จาง ๆ
         ========================================================================= */}
      <div className="relative bg-white rounded-xl shadow-md p-6 sm:p-8 border border-slate-200 overflow-hidden">
        {/* Faint large magnifying glass icon in the background */}
        <div className="absolute -right-8 -bottom-8 text-slate-100 pointer-events-none select-none opacity-60">
          <Search className="w-56 h-56" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                ค้นหาผลงาน
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ค้นหาข้อมูลรางวัลและกิจกรรมย้อนหลัง โรงเรียนพังโคนวิทยาคม
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ล้างเงื่อนไข</span>
          </button>
        </div>

        {/* Filter Form */}
        <form onSubmit={handleSearchSubmit} className="relative z-10 mt-6 space-y-6">
          {/* Responsive Fields: 2 cols on tablet, 1 on mobile, 4 on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* กรอกข้อมูลปีการศึกษา */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ปีการศึกษา
              </label>
              <input
                type="text"
                placeholder="เช่น 2568 หรือเว้นว่าง"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>

            {/* Dropdown ระดับรางวัล */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ระดับรางวัล
              </label>
              <select
                value={awardLevel}
                onChange={(e) => setAwardLevel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              >
                <option value="ทั้งหมด">ทั้งหมด</option>
                <option value="ระดับชาติ">ระดับชาติ</option>
                <option value="ระดับภาค">ระดับภาค</option>
                <option value="ระดับเขตพื้นที่">ระดับเขตพื้นที่</option>
                <option value="ระดับกลุ่มโรงเรียน">ระดับกลุ่มโรงเรียน</option>
                <option value="ระดับโรงเรียน">ระดับโรงเรียน</option>
              </select>
            </div>

            {/* Dropdown กลุ่มสาระการเรียนรู้ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                กลุ่มสาระการเรียนรู้
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              >
                <option value="ทั้งหมด">ทั้งหมด</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ช่องกรอกข้อความ (สำหรับค้นหาชื่อ ครู/นักเรียน) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ค้นหาชื่อ ครู / นักเรียน
              </label>
              <input
                type="text"
                placeholder="ระบุชื่อครู หรือ นักเรียน หรือคำสำคัญ"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* ปุ่มค้นหา (พื้นหลังสีม่วง, มีไอคอนแว่นขยาย, อยู่ตรงกลางด้านล่าง) */}
          <div className="flex flex-col items-center justify-center pt-2">
            <button
              type="submit"
              className="px-8 py-3 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-bold rounded-xl shadow-lg shadow-purple-950/30 flex items-center justify-center gap-2.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Search className="w-5 h-5" />
              <span>ค้นหาผลงาน</span>
            </button>

            {/* ข้อความตัวเล็กด้านล่าง “กรอกเงื่อนไขการค้นหาและกดปุ่มค้นหา” */}
            <p className="text-xs text-slate-400 mt-3 font-medium flex items-center gap-1.5">
              <span>กรอกเงื่อนไขการค้นหาและกดปุ่มค้นหา</span>
            </p>
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-white">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>ผลลัพธ์การค้นหา ({searchResults.length} รายการ)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            ทั้งหมด {records.length} รายการในฐานข้อมูล
          </span>
        </div>

        {searchResults.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-10 text-center border border-slate-200 space-y-2">
            <Search className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-700">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</h4>
            <p className="text-xs text-slate-400">
              ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "ล้างเงื่อนไข" เพื่อเริ่มค้นหาใหม่
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {searchResults.map((rec) => {
              const recipient = rec.teacherName || rec.studentName || '-';
              return (
                <div
                  key={rec.id}
                  onClick={() => onSelectRecord(rec)}
                  className="group bg-white rounded-xl shadow-md p-5 border border-slate-200 hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        {rec.department}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {rec.awardLevel}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-2">
                      {rec.awardName}
                    </h4>

                    {rec.objective && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {rec.objective}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>ปี {rec.academicYear}</span>
                      </div>
                      <span className="text-slate-400">{rec.awardDate}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 truncate">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800 truncate">
                          {recipient}
                        </span>
                      </div>
                      <span className="text-purple-600 font-bold flex items-center gap-1 text-[11px] group-hover:translate-x-1 transition-transform">
                        ดูรายละเอียด <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
