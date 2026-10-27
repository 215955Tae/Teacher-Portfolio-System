import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Search,
  FileBarChart,
  PlusCircle,
  ExternalLink,
  Code2,
  GraduationCap,
  Sparkles,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  currentTab: 'dashboard' | 'list' | 'search' | 'report' | 'teachers' | 'add';
  onSelectTab: (tab: 'dashboard' | 'list' | 'search' | 'report' | 'teachers' | 'add') => void;
  onOpenAppsScriptModal: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAppsScriptModal,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'หน้าหลัก (Dashboard)',
      icon: LayoutDashboard,
    },
    {
      id: 'teachers',
      label: 'รวมผลงานครู (ประเมินขั้น)',
      icon: UserCheck,
    },
    {
      id: 'list',
      label: 'ดูรายการทั้งหมด',
      icon: FolderKanban,
    },
    {
      id: 'search',
      label: 'ค้นหาข้อมูล',
      icon: Search,
    },
    {
      id: 'report',
      label: 'รายงานสรุปผล',
      icon: FileBarChart,
    },
  ] as const;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 text-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / School Header */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-900/30 shrink-0 ring-2 ring-red-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-red-400 font-semibold flex items-center gap-1">
                <span>กลุ่มบริหารงานบุคคล</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              </div>
              <h1 className="text-base font-bold text-white leading-tight">
                พังโคนวิทยาคม
              </h1>
              <p className="text-[11px] text-slate-400 truncate max-w-[170px]">
                ระบบบันทึกรายงานผลงาน
              </p>
            </div>
          </div>
        </div>

        {/* School External Link Button (MANDATORY: Must be RED as requested) */}
        <div className="px-4 pt-4 pb-2">
          <a
            href="https://pangkhonwit.ac.th/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-xl shadow-md shadow-red-950/50 transition-all border border-red-500/40 hover:scale-[1.01]"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              <span className="whitespace-nowrap">โรงเรียนพังโคนวิทยาคม</span>
            </div>
            <ExternalLink className="w-4 h-4 text-red-200 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </a>
        </div>

        {/* Main Navigation Menu */}
        <div className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            เมนูหลัก
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Standout Prominent Red "เพิ่มกิจกรรมใหม่" Button (at the bottom of nav) */}
        <div className="p-4 border-t border-slate-800/80 space-y-2 bg-slate-950/80">
          <button
            onClick={() => {
              onSelectTab('add');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-lg ${
              currentTab === 'add'
                ? 'bg-red-600 ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-[1.01]'
                : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-95 shadow-red-900/40'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            <span className="whitespace-nowrap">เพิ่มกิจกรรมใหม่</span>
          </button>

          {/* Apps Script & System Info Button */}
          <button
            onClick={onOpenAppsScriptModal}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-850 rounded-lg transition-colors border border-slate-800"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="whitespace-nowrap">โค้ด Google Apps Script</span>
          </button>

          <div className="pt-1 text-center">
            <p className="text-[10px] text-slate-400">
              ระบบบันทึกรายงานผลงาน v2.5
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
