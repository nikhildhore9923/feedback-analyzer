import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import IngestModal from './IngestModal';

export default function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [ingestModalOpen, setIngestModalOpen] = useState(false);

  const handleFeedbackAdded = () => {
    // Dispatch custom event so active pages (Dashboard, Reviews) can auto-refresh telemetry
    window.dispatchEvent(new CustomEvent('pulse_feedback_added'));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#080C15] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        mobileOpen={mobileSidebarOpen} 
        setMobileOpen={setMobileSidebarOpen}
        onOpenIngest={() => setIngestModalOpen(true)}
      />

      {/* Main App Container (Offset by sidebar width on desktop) */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        
        {/* Top Header */}
        <Header 
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} 
          onOpenIngest={() => setIngestModalOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          <Outlet />
        </main>
      </div>

      {/* Global Ingestion Modal */}
      <IngestModal 
        isOpen={ingestModalOpen}
        onClose={() => setIngestModalOpen(false)}
        onFeedbackAdded={handleFeedbackAdded}
      />

    </div>
  );
}
