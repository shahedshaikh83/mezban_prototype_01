import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PlanEventModal from './components/PlanEventModal';
import PublicWebsite from './pages/PublicWebsite';
import CustomerPortal from './pages/CustomerPortal';
import VendorPortal from './pages/VendorPortal';
import AdminPortal from './pages/AdminPortal';
import DatabaseExplorer from './pages/DatabaseExplorer';

export default function App() {
  const [activePortal, setActivePortal] = useState('website');
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const handleEventCreated = (eventInfo) => {
    // Keep modal open with confirmation or switch portal
    console.log('Event successfully registered:', eventInfo);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Global Header & Portal Switcher */}
      <Navbar
        activePortal={activePortal}
        setActivePortal={setActivePortal}
        openPlanModal={() => setIsPlanModalOpen(true)}
      />

      {/* Main View Router */}
      <main style={{ flex: 1 }}>
        {activePortal === 'website' && (
          <PublicWebsite
            openPlanModal={() => setIsPlanModalOpen(true)}
            setActivePortal={setActivePortal}
          />
        )}

        {activePortal === 'customer' && (
          <CustomerPortal
            openPlanModal={() => setIsPlanModalOpen(true)}
          />
        )}

        {activePortal === 'vendor' && (
          <VendorPortal />
        )}

        {activePortal === 'admin' && (
          <AdminPortal />
        )}

        {activePortal === 'database' && (
          <DatabaseExplorer />
        )}
      </main>

      {/* Global Footer */}
      <Footer
        setActivePortal={setActivePortal}
        openPlanModal={() => setIsPlanModalOpen(true)}
      />

      {/* Interactive Requirement Planner Modal */}
      <PlanEventModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
}
