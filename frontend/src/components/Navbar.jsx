import React, { useState } from 'react';
import { Crown, Sparkles, User, Briefcase, Shield, Database, Calendar, FileText, Menu, X } from 'lucide-react';

export default function Navbar({ activePortal, setActivePortal, openPlanModal, openRequirementSheet }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePortalClick = (portal) => {
    setActivePortal(portal);
    setMobileMenuOpen(false);
  };

  const handleActionClick = (actionFn) => {
    setMobileMenuOpen(false);
    actionFn();
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, width: '100%' }}>
      {/* Top Portal Switcher Bar */}
      <div className="portal-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, color: '#f3c64c', fontSize: '0.78rem' }}>
            <Crown size={14} /> MEZBAAN OS
          </span>
          <span style={{ fontSize: '0.72rem', opacity: 0.7, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 8, display: 'inline-block' }}>
            Beed • Kaij • Ambajogai
          </span>
        </div>

        {/* Scrollable Portal Pills */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          padding: '2px 0'
        }}>
          <button
            onClick={() => handlePortalClick('website')}
            className={`portal-nav-pill ${activePortal === 'website' ? 'active' : ''}`}
          >
            <Sparkles size={13} /> Public Website
          </button>

          <button
            onClick={() => handlePortalClick('customer')}
            className={`portal-nav-pill ${activePortal === 'customer' ? 'active' : ''}`}
          >
            <User size={13} /> Customer Portal
          </button>

          <button
            onClick={() => handlePortalClick('vendor')}
            className={`portal-nav-pill ${activePortal === 'vendor' ? 'active' : ''}`}
          >
            <Briefcase size={13} /> Vendor Portal
          </button>

          <button
            onClick={() => handlePortalClick('admin')}
            className={`portal-nav-pill ${activePortal === 'admin' ? 'active' : ''}`}
          >
            <Shield size={13} /> Admin OS
          </button>

          <button
            onClick={() => handlePortalClick('database')}
            className={`portal-nav-pill ${activePortal === 'database' ? 'active' : ''}`}
          >
            <Database size={13} /> ER Database
          </button>
        </nav>
      </div>

      {/* Main Brand Header */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #ebdcc0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        padding: '10px 0'
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10
        }}>
          {/* Logo & Tagline */}
          <div 
            onClick={() => handlePortalClick('website')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexShrink: 1 }}
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #0f3d2e 0%, #0a291f 100%)',
              border: '1.5px solid #d4af37',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d4af37',
              boxShadow: '0 3px 10px rgba(212, 175, 55, 0.25)',
              flexShrink: 0
            }}>
              <Crown size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 'clamp(1.15rem, 3.5vw, 1.4rem)', fontWeight: 800, color: '#0f3d2e', letterSpacing: '0.03em', fontFamily: 'Outfit', lineHeight: 1.1 }}>
                  MEZBAAN
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b38f20', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Events
                </span>
              </div>
              <p style={{
                fontSize: '0.7rem',
                color: '#6b7280',
                margin: '2px 0 0',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '240px'
              }}>
                Aapka Event, Hamari Zimmedari
              </p>
            </div>
          </div>

          {/* Desktop Navigation CTAs (Visible on screens > 860px) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="desktop-ctas">
            <button
              onClick={() => handleActionClick(openRequirementSheet)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 20,
                background: '#0f3d2e',
                color: '#ffffff',
                border: '1.5px solid #d4af37',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(15, 61, 46, 0.2)'
              }}
            >
              <FileText size={14} color="#d4af37" /> 📝 Customer Requirement (Admin)
            </button>
            <button
              onClick={() => handlePortalClick('database')}
              className="btn-outline"
              style={{ fontSize: '0.82rem', padding: '7px 14px' }}
            >
              <Database size={14} color="#b38f20" /> Schema
            </button>
            <button
              onClick={() => handleActionClick(openPlanModal)}
              className="btn-gold"
              style={{ fontSize: '0.84rem', padding: '8px 18px' }}
            >
              <Calendar size={15} /> Plan My Event
            </button>
          </div>

          {/* Mobile Right Controls (< 860px) */}
          <div style={{ display: 'none', alignItems: 'center', gap: 8 }} className="mobile-header-actions">
            <button
              onClick={() => handleActionClick(openPlanModal)}
              className="btn-gold"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              <Calendar size={13} /> Plan
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              style={{
                padding: '6px',
                borderRadius: 6,
                background: '#f3efe6',
                border: '1px solid #dcd3c4',
                color: '#0f3d2e',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu Overlay */}
      {mobileMenuOpen && (
        <div style={{
          background: '#ffffff',
          borderBottom: '2px solid #0f3d2e',
          boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
          padding: '16px 16px 20px',
          animation: 'fadeIn 0.2s ease-out forwards',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {/* Quick Action Buttons in Mobile Menu */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => handleActionClick(openRequirementSheet)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 8,
                background: '#0f3d2e',
                color: '#ffffff',
                border: '1.5px solid #d4af37',
                fontSize: '0.88rem',
                fontWeight: 700,
                width: '100%',
                cursor: 'pointer'
              }}
            >
              <FileText size={16} color="#d4af37" /> 📝 Customer Requirement (Admin)
            </button>

            <button
              onClick={() => handleActionClick(openPlanModal)}
              className="btn-gold"
              style={{ width: '100%', padding: '10px 16px', fontSize: '0.88rem', borderRadius: 8 }}
            >
              <Calendar size={16} /> Plan My Event
            </button>
          </div>

          <div style={{ height: 1, background: '#e5e7eb', margin: '4px 0' }} />

          {/* Portals Section */}
          <span style={{ fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
            Switch Portal / Section
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { id: 'website', label: 'Public Website', icon: <Sparkles size={14} /> },
              { id: 'customer', label: 'Customer Portal', icon: <User size={14} /> },
              { id: 'vendor', label: 'Vendor Portal', icon: <Briefcase size={14} /> },
              { id: 'admin', label: 'Admin OS', icon: <Shield size={14} /> },
              { id: 'database', label: 'ER Database', icon: <Database size={14} /> }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handlePortalClick(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  borderRadius: 6,
                  fontSize: '0.82rem',
                  fontWeight: activePortal === p.id ? 800 : 600,
                  background: activePortal === p.id ? '#0f3d2e' : '#f9fafb',
                  color: activePortal === p.id ? '#ffffff' : '#374151',
                  border: activePortal === p.id ? '1px solid #0f3d2e' : '1px solid #e5e7eb',
                  textAlign: 'left'
                }}
              >
                {p.icon}
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inline styles for responsive toggling */}
      <style>{`
        @media (max-width: 860px) {
          .desktop-ctas {
            display: none !important;
          }
          .mobile-header-actions {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
