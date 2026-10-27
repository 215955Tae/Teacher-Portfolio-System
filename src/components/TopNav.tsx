import React from 'react';
import { Menu, PlusCircle, Sparkles, School, RefreshCw, FileSpreadsheet } from 'lucide-react';

interface TopNavProps {
  currentTab: string;
  onOpenAddModal: () => void;
  onToggleMobileMenu: () => void;
  totalRecords: number;
  isLoadingSheet?: boolean;
  lastSyncedTime?: string | null;
  onSyncFromGoogleSheet?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onOpenAddModal,
  onToggleMobileMenu,
  totalRecords,
  isLoadingSheet = false,
  lastSyncedTime,
  onSyncFromGoogleSheet,
}) => {
  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'หน้าหลักแดชบอร์ด (Dashboard)';
      case 'list':
        return 'รายการผลงานกิจกรรมทั้งหมด';
      case 'search':
        return 'ค้นหาข้อมูลกิจกรรมย้อนหลัง';
      case 'report':
        return 'สรุปรายงานผลงานและส่งออก';
      case 'teachers':
        return 'สรุปผลงานครูรายบุคคล (ประเมินเลื่อนขั้นเงินเดือน)';
      case 'add':
        return 'บันทึกข้อมูลกิจกรรมใหม่';
      default:
        return 'ระบบบันทึกรายงานผลการจัดกิจกรรม';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 md:gap-8 px-4 sm:px-6 lg:px-8 py-3.5 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      {/* Zone 1: Brand title & Mobile Menu Toggle */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 md:hidden transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <School className="w-5 h-5 text-red-500 hidden sm:block shrink-0" />
          <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
            ระบบบันทึกผลการจัดกิจกรรม
          </span>
          <span className="hidden lg:inline text-xs bg-slate-800 text-slate-300 font-medium px-2 py-0.5 rounded-md border border-slate-700 whitespace-nowrap">
            กลุ่มบริหารงานบุคคล
          </span>
        </div>
      </div>

      {/* Zone 2: Contextual section indicator / Breadcrumb */}
      <div className="hidden md:flex items-center gap-2 text-xs lg:text-sm font-medium text-slate-400 truncate">
        <span className="text-slate-400">โรงเรียนพังโคนวิทยาคม</span>
        <span className="text-slate-400">/</span>
        <span className="text-slate-200 font-semibold truncate">{getTabTitle()}</span>
        <span className="text-slate-400">·</span>
        <span className="text-slate-400 font-mono tabular-nums">{totalRecords} ผลงาน (จาก Google Sheet)</span>
      </div>

      {/* Zone 3: Sync Button & Red "+ เพิ่มกิจกรรมใหม่" */}
      <div className="flex items-center gap-2 shrink-0">
        {onSyncFromGoogleSheet && (
          <button
            onClick={onSyncFromGoogleSheet}
            disabled={isLoadingSheet}
            title={lastSyncedTime ? `ซิงค์ล่าสุดเวลา ${lastSyncedTime}` : 'กดเพื่อดึงข้อมูลสดจาก Google Sheet'}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoadingSheet ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {isLoadingSheet ? 'กำลังดึงข้อมูล...' : 'ดึงจาก Sheet'}
            </span>
          </button>
        )}

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-lg shadow-md shadow-red-950 transition-all hover:scale-[1.02] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">เพิ่มกิจกรรมใหม่</span>
        </button>
      </div>
    </header>
  );
};
