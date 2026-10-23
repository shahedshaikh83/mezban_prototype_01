import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PlanEventModal from './components/PlanEventModal';
import PublicWebsite from './pages/PublicWebsite';
import AdminOS from './pages/AdminOS';
import CustomerRequirementSheet from './components/CustomerRequirementSheet';

export default function App() {
  const [activePortal, setActivePortalState] = useState('website'); // 'website' | 'requirements' | 'admin'
  const [adminSection, setAdminSection] = useState('dashboard'); // 'dashboard' | 'customer' | 'vendor' | 'database' | 'schema'
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isRequirementSheetOpen, setIsRequirementSheetOpen] = useState(false);
  const [activeSheetId, setActiveSheetId] = useState(null);

  // Parse location hash for direct URL access and browser refresh
  const parseRouteFromHash = useCallback(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();

    if (!hash || hash === 'website') {
      setActivePortalState('website');
    } else if (hash === 'requirements' || hash === 'requirement') {
      setActivePortalState('requirements');
    } else if (hash.startsWith('admin')) {
      setActivePortalState('admin');
      const parts = hash.split('/');
      const section = parts[1];
      if (['dashboard', 'customer', 'vendor', 'database', 'schema'].includes(section)) {
        setAdminSection(section);
      } else {
        setAdminSection('dashboard');
      }
    } else if (hash === 'customer') {
      // Legacy redirect into Admin OS
      setActivePortalState('admin');
      setAdminSection('customer');
    } else if (hash === 'vendor') {
      // Legacy redirect into Admin OS
      setActivePortalState('admin');
      setAdminSection('vendor');
    } else if (hash === 'database') {
      // Legacy redirect into Admin OS
      setActivePortalState('admin');
      setAdminSection('database');
    } else if (hash === 'schema') {
      // Legacy redirect into Admin OS
      setActivePortalState('admin');
      setAdminSection('schema');
    }
  }, []);

  // Sync route on mount and listen to hashchange events (for browser Back/Forward & direct links)
  useEffect(() => {
    parseRouteFromHash();
    window.addEventListener('hashchange', parseRouteFromHash);
    return () => window.removeEventListener('hashchange', parseRouteFromHash);
  }, [parseRouteFromHash]);

  // Unified navigation handler
  const navigateTo = (portal, section = null) => {
    if (portal === 'website') {
      setActivePortalState('website');
      if (window.location.hash !== '#/website') {
        window.history.pushState(null, '', '#/website');
      }
    } else if (portal === 'requirements') {
      setActivePortalState('requirements');
      if (window.location.hash !== '#/requirements') {
        window.history.pushState(null, '', '#/requirements');
      }
    } else if (portal === 'admin') {
      setActivePortalState('admin');
      const targetSection = section || adminSection || 'dashboard';
      setAdminSection(targetSection);
      const targetHash = `#/admin/${targetSection}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash);
      }
    } else if (portal === 'customer') {
      // Compatibility for legacy callers
      setActivePortalState('admin');
      setAdminSection('customer');
      window.history.pushState(null, '', '#/admin/customer');
    } else if (portal === 'vendor') {
      // Compatibility for legacy callers
      setActivePortalState('admin');
      setAdminSection('vendor');
      window.history.pushState(null, '', '#/admin/vendor');
    } else if (portal === 'database') {
      // Compatibility for legacy callers
      setActivePortalState('admin');
      setAdminSection('database');
      window.history.pushState(null, '', '#/admin/database');
    } else if (portal === 'schema') {
      // Compatibility for legacy callers
      setActivePortalState('admin');
      setAdminSection('schema');
      window.history.pushState(null, '', '#/admin/schema');
    }
  };

  const handleAdminSectionChange = (section) => {
    setAdminSection(section);
    window.history.pushState(null, '', `#/admin/${section}`);
  };

  const handleEventCreated = (eventInfo) => {
    console.log('Event successfully registered:', eventInfo);
  };

  const handleOpenQuotation = (sheetId) => {
    setActiveSheetId(sheetId || null);
    setIsPlanModalOpen(false);
    navigateTo('requirements');
  };

  const openRequirementSheet = () => {
    setActiveSheetId(null);
    navigateTo('requirements');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Global Header: Only Public Website, Customer Requirement, Admin OS + Plan My Event */}
      <Navbar
        activePortal={activePortal}
        setActivePortal={navigateTo}
        openPlanModal={() => setIsPlanModalOpen(true)}
        openRequirementSheet={openRequirementSheet}
      />

      {/* Main View Router */}
      <main style={{ flex: 1, minWidth: 0 }}>
        {/* 1. Public Website */}
        {activePortal === 'website' && (
          <PublicWebsite
            openPlanModal={() => setIsPlanModalOpen(true)}
            setActivePortal={navigateTo}
          />
        )}

        {/* 2. Customer Requirement Intake (Direct Global Option) */}
        {activePortal === 'requirements' && (
          <div style={{ minHeight: 'calc(100vh - 120px)' }}>
            <CustomerRequirementSheet
              initialSheetId={activeSheetId}
              isAdmin={false}
              onClose={() => {
                setActiveSheetId(null);
                navigateTo('website');
              }}
              onSaved={() => {
                // Requirement sheet saved successfully
              }}
            />
          </div>
        )}

        {/* 3. Admin OS (Central Operating Management Hub) */}
        {activePortal === 'admin' && (
          <AdminOS
            activeSection={adminSection}
            onSectionChange={handleAdminSectionChange}
            openPlanModal={() => setIsPlanModalOpen(true)}
            onNavigatePortal={navigateTo}
          />
        )}
      </main>

      {/* Global Footer */}
      <Footer
        setActivePortal={navigateTo}
        openPlanModal={() => setIsPlanModalOpen(true)}
      />

      {/* Interactive Requirement Planner Modal */}
      <PlanEventModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onEventCreated={handleEventCreated}
        onOpenQuotation={handleOpenQuotation}
      />

      {/* Customer Event Requirement Modal (For direct popup trigger if invoked) */}
      {isRequirementSheetOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#fbf9f5',
          zIndex: 9999,
          overflowY: 'auto'
        }}>
          <CustomerRequirementSheet
            initialSheetId={activeSheetId}
            isAdmin={false}
            onClose={() => {
              setIsRequirementSheetOpen(false);
              setActiveSheetId(null);
            }}
            onSaved={() => {
              // Intentionally keep modal open so the generated quotation & estimated cost view stays visible to the user!
            }}
          />
        </div>
      )}
    </div>
  );
}
