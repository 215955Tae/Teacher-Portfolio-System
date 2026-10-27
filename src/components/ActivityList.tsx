import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Calendar,
  User,
  MoreVertical,
  PlusCircle,
  ExternalLink,
  Eye,
  FileText,
  Image as ImageIcon,
  Trophy,
  Filter,
  CheckCircle2,
  Share2,
  Award,
} from 'lucide-react';
import { ActivityRecord, AwardLevel } from '../types';

interface ActivityListProps {
  records: ActivityRecord[];
  onRefresh: () => void;
  onOpenAddModal: () => void;
  onSelectRecord: (record: ActivityRecord) => void;
  initialFilterLevel?: string;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  records,
  onRefresh,
  onOpenAddModal,
  onSelectRecord,
  initialFilterLevel,
}) => {
  const [sortBy, setSortBy] = useState<'latest' | 'name' | 'level' | 'year'>('latest');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>(initialFilterLevel || 'all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Filter & Sort
  const processedRecords = useMemo(() => {
    let result = [...records];

    if (selectedLevelFilter && selectedLevelFilter !== 'all') {
      result = result.filter((r) => r.awardLevel === selectedLevelFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.awardDate || b.createdAt).getTime() - new Date(a.awardDate || a.createdAt).getTime();
      }
      if (sortBy === 'name') {
        return a.awardName.localeCompare(b.awardName, 'th');
      }
      if (sortBy === 'level') {
        return a.awardLevel.localeCompare(b.awardLevel, 'th');
      }
      if (sortBy === 'year') {
        return b.academicYear.localeCompare(a.academicYear);
      }
      return 0;
    });

    return result;
  }, [records, selectedLevelFilter, sortBy]);

  const getBadgeStyle = (level: AwardLevel) => {
    switch (level) {
      case 'ระดับชาติ':
        return 'bg-emerald-500 text-white';
      case 'ระดับภาค':
        return 'bg-amber-500 text-white';
      case 'ระดับเขตพื้นที่':
        return 'bg-purple-600 text-white';
      case 'ระดับกลุ่มโรงเรียน':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-slate-700 text-white';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header with Title, Sort Dropdown & Refresh Button */}
      <div className="bg-white rounded-xl shadow-md p-5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <span>รายการผลงานทั้งหมด</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            โรงเรียนพังโคนวิทยาคม · แสดงทั้งหมด {processedRecords.length} จาก {records.length} รายการ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Level Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedLevelFilter}
              onChange={(e) => setSelectedLevelFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="all">ทุกระดับรางวัล</option>
              <option value="ระดับชาติ">ระดับชาติ</option>
              <option value="ระดับภาค">ระดับภาค</option>
              <option value="ระดับเขตพื้นที่">ระดับเขตพื้นที่</option>
              <option value="ระดับกลุ่มโรงเรียน">ระดับกลุ่มโรงเรียน</option>
              <option value="ระดับโรงเรียน">ระดับโรงเรียน</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">เรียงตาม:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-800 font-semibold rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="latest">วันที่ล่าสุด</option>
              <option value="name">ชื่อรางวัล (ก-ฮ)</option>
              <option value="level">ระดับรางวัล</option>
              <option value="year">ปีการศึกษา</option>
            </select>
          </div>

          {/* ปุ่ม "รีเฟรช" */}
          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 active:scale-95 disabled:opacity-50 cursor-pointer"
            title="รีเฟรชข้อมูล"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 text-slate-600 ${
                isRefreshing ? 'animate-spin text-blue-600' : ''
              }`}
            />
            <span>รีเฟรช</span>
          </button>

          {/* Quick Add Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>เพิ่มผลงาน</span>
          </button>
        </div>
      </div>

      {/* Card Grid Layout: 3 cols desktop, 2 cols tablet, 1 col mobile */}
      {records.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-200 space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center border border-red-100">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">ยังไม่มีข้อมูลผลงานใน Google Sheet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              ระบบดึงข้อมูลสดจาก Google Sheet (ตัดข้อมูลจำลองออกทั้งหมดแล้ว) ท่านสามารถเริ่มบันทึกกิจกรรมและภาพถ่ายใหม่ ซึ่งระบบจะสร้างโฟลเดอร์กลุ่มสาระ ➔ โฟลเดอร์ครูผู้รายงานใน Google Drive ให้อัตโนมัติ
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>เพิ่มกิจกรรมแรก</span>
            </button>
            <button
              onClick={onRefresh}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              รีเฟรชข้อมูลจาก Sheet
            </button>
          </div>
        </div>
      ) : processedRecords.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-200 space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">ไม่พบรายการผลงานตามเงื่อนไขที่เลือก</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            ลองปรับเปลี่ยนระดับรางวัลหรือกดปุ่มรีเฟรชเพื่อโหลดข้อมูลใหม่
          </p>
          <button
            onClick={() => setSelectedLevelFilter('all')}
            className="mt-2 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
          >
            แสดงผลงานทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedRecords.map((item) => {
            const firstPhotoUrl =
              item.photos && item.photos.length > 0
                ? item.photos[0].url ||
                  (item.photos[0].base64
                    ? `data:${item.photos[0].type};base64,${item.photos[0].base64}`
                    : '')
                : '';

            const recipient = item.teacherName || item.studentName || '-';

            return (
              <div
                key={item.id}
                className="group bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
              >
                {/* Top Section: รูปภาพด้านบน (thumbnail) พร้อมป้ายบอกระดับ */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  {firstPhotoUrl ? (
                    <img
                      src={firstPhotoUrl}
                      alt={item.awardName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-200 text-slate-400 p-4">
                      <Trophy className="w-12 h-12 text-slate-300 mb-2" />
                      <span className="text-xs text-slate-400 font-medium">
                        โรงเรียนพังโคนวิทยาคม
                      </span>
                    </div>
                  )}

                  {/* ป้ายบอกระดับ (เช่น "ระดับชาติ" หรือ "ระดับเขตพื้นที่" พร้อมสีพื้นหลังต่างกัน) */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full shadow-md ${getBadgeStyle(
                        item.awardLevel
                      )}`}
                    >
                      {item.awardLevel}
                    </span>
                  </div>

                  {/* Certificate indicator badge */}
                  {item.certificates && item.certificates.length > 0 && (
                    <div className="absolute top-3 right-3 bg-amber-500/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 backdrop-blur-xs">
                      <Award className="w-3 h-3" />
                      <span>มีเกียรติบัตร</span>
                    </div>
                  )}

                  {/* Photo count indicator */}
                  {item.photos?.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      <span>{item.photos.length} รูปภาพ</span>
                    </div>
                  )}

                  {/* Document badge */}
                  {item.documents?.length > 0 && (
                    <div className="absolute bottom-2 left-2 bg-blue-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span>PDF แนบ</span>
                    </div>
                  )}
                </div>

                {/* Middle Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    {/* กลุ่มสาระ */}
                    <div className="text-[11px] font-semibold text-blue-600">
                      {item.department}
                    </div>

                    {/* ชื่อผลงาน (ตัวหนา) */}
                    <h3
                      onClick={() => onSelectRecord(item)}
                      className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 cursor-pointer"
                      title={item.awardName}
                    >
                      {item.awardName}
                    </h3>

                    {/* รายละเอียดสังเขป */}
                    {item.objective && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {item.objective}
                      </p>
                    )}
                  </div>

                  {/* Metadata Row: ปี (มี icon ปฏิทิน) + ชื่อผู้รับ (มี icon คน) */}
                  <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>ปีการศึกษา:</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {item.academicYear}
                        </span>
                      </div>

                      {/* วันที่ประกาศผลงาน (ตัวอักษรเล็ก) */}
                      <span className="text-[11px] text-slate-400 font-mono">
                        {item.awardDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500 shrink-0">ผู้รับ:</span>
                      <span className="font-semibold text-slate-800 truncate" title={recipient}>
                        {recipient}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer: ปุ่มเมนู/เพิ่มเติม มุมขวาล่าง */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>บันทึกแล้ว</span>
                  </div>

                  <button
                    onClick={() => onSelectRecord(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>ดูรายละเอียด / รูปภาพ</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
