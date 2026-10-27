/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { Dashboard } from './components/Dashboard';
import { ActivityList } from './components/ActivityList';
import { ActivityForm } from './components/ActivityForm';
import { SearchSection } from './components/SearchSection';
import { ReportDashboard } from './components/ReportDashboard';
import { ActivityDetailModal } from './components/ActivityDetailModal';
import { AppsScriptModal } from './components/AppsScriptModal';
import { TeacherEvaluation } from './components/TeacherEvaluation';
import { ActivityRecord } from './types';
import {
  loadStoredActivities,
  saveAllActivities,
  fetchActivitiesFromGoogleSheet,
} from './services/appsScriptService';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'list' | 'search' | 'report' | 'teachers' | 'add'>('dashboard');
  const [records, setRecords] = useState<ActivityRecord[]>(() =>
    loadStoredActivities([])
  );
  const [isLoadingSheet, setIsLoadingSheet] = useState<boolean>(true);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ActivityRecord | null>(null);
  const [listFilterLevel, setListFilterLevel] = useState<string | undefined>(undefined);
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Initial load from Google Sheet (Only real records, zero mock data)
  useEffect(() => {
    let isMounted = true;
    const fetchRealData = async () => {
      setIsLoadingSheet(true);
      try {
        const liveRecords = await fetchActivitiesFromGoogleSheet();
        if (isMounted) {
          setRecords(liveRecords);
          setLastSyncedTime(new Date().toLocaleTimeString('th-TH'));
        }
      } catch (err) {
        console.warn('Failed to fetch from Google Sheet on start:', err);
      } finally {
        if (isMounted) {
          setIsLoadingSheet(false);
        }
      }
    };

    fetchRealData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Manual sync handler
  const handleSyncFromGoogleSheet = async () => {
    setIsLoadingSheet(true);
    try {
      const liveRecords = await fetchActivitiesFromGoogleSheet();
      setRecords(liveRecords);
      setLastSyncedTime(new Date().toLocaleTimeString('th-TH'));
    } catch (err) {
      console.warn('Manual sync failed:', err);
    } finally {
      setIsLoadingSheet(false);
    }
  };

  // Sync state changes with localStorage
  const handleAddSuccess = (newRecord: ActivityRecord) => {
    setRecords((prev) => {
      const updated = [newRecord, ...prev.filter((r) => r.id !== newRecord.id)];
      saveAllActivities(updated);
      return updated;
    });
    // Trigger fresh pull from sheet in background
    setTimeout(() => {
      fetchActivitiesFromGoogleSheet().then((fresh) => {
        if (fresh.length > 0) setRecords(fresh);
      });
    }, 2000);
    setCurrentTab('list');
  };

  const handleRefreshRecords = () => {
    handleSyncFromGoogleSheet();
  };

  const handleNavigateToList = (filterLevel?: string) => {
    setListFilterLevel(filterLevel);
    setCurrentTab('list');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-red-500 selection:text-white">
      {/* 1. Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'list') {
            setListFilterLevel(undefined);
          }
          setCurrentTab(tab);
        }}
        onOpenAppsScriptModal={() => setIsAppsScriptModalOpen(true)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area (offset on desktop for fixed sidebar w-72) */}
      <div className="flex-1 md:pl-72 flex flex-col min-w-0">
        {/* 2. Top Navigation Bar */}
        <TopNav
          currentTab={currentTab}
          onOpenAddModal={() => setCurrentTab('add')}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          totalRecords={records.length}
          isLoadingSheet={isLoadingSheet}
          lastSyncedTime={lastSyncedTime}
          onSyncFromGoogleSheet={handleSyncFromGoogleSheet}
        />

        {/* 3. Main Viewport Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {isLoadingSheet && records.length === 0 && (
            <div className="mb-6 p-3.5 rounded-xl bg-blue-950/50 border border-blue-800/70 text-blue-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                <span>กำลังเชื่อมต่อและดึงข้อมูลผลงานจริงจาก Google Sheet โรงเรียนพังโคนวิทยาคม...</span>
              </div>
            </div>
          )}

          {currentTab === 'dashboard' && (
            <Dashboard
              records={records}
              onNavigateToList={handleNavigateToList}
              onNavigateToTeachers={() => setCurrentTab('teachers')}
              onOpenAddModal={() => setCurrentTab('add')}
              onSelectRecord={(rec) => setSelectedRecord(rec)}
            />
          )}

          {currentTab === 'teachers' && (
            <TeacherEvaluation
              records={records}
              onSelectRecord={(rec) => setSelectedRecord(rec)}
            />
          )}

          {currentTab === 'list' && (
            <ActivityList
              records={records}
              onRefresh={handleRefreshRecords}
              onOpenAddModal={() => setCurrentTab('add')}
              onSelectRecord={(rec) => setSelectedRecord(rec)}
              initialFilterLevel={listFilterLevel}
            />
          )}

          {currentTab === 'search' && (
            <SearchSection
              records={records}
              onSelectRecord={(rec) => setSelectedRecord(rec)}
            />
          )}

          {currentTab === 'report' && (
            <ReportDashboard
              records={records}
              onSelectRecord={(rec) => setSelectedRecord(rec)}
            />
          )}

          {currentTab === 'add' && (
            <ActivityForm
              onSuccess={handleAddSuccess}
              onCancel={() => setCurrentTab('dashboard')}
            />
          )}
        </main>

        {/* Footer info banner */}
        <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-4 px-6 text-center text-xs text-slate-400">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>
              กลุ่มบริหารงานบุคคล โรงเรียนพังโคนวิทยาคม · ระบบบันทึกรายงานผลการจัดกิจกรรมและบันทึกภาพกิจกรรม
            </span>
            <div className="flex items-center gap-3">
              <a
                href="https://pangkhonwit.ac.th/"
                target="_blank"
                rel="noreferrer"
                className="text-red-400 hover:text-red-300 font-semibold"
              >
                โรงเรียนพังโคนวิทยาคม
              </a>
              <span>·</span>
              <button
                onClick={() => setIsAppsScriptModalOpen(true)}
                className="text-slate-400 hover:text-slate-200 underline"
              >
                สคริปต์ Google Apps Script
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Detail Modal */}
      <ActivityDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />

      {/* Google Apps Script Modal */}
      <AppsScriptModal
        isOpen={isAppsScriptModalOpen}
        onClose={() => setIsAppsScriptModalOpen(false)}
      />
    </div>
  );
}
