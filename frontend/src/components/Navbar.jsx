import React from 'react';
import { Crown, Sparkles, User, Briefcase, Shield, Database, Calendar } from 'lucide-react';

export default function Navbar({ activePortal, setActivePortal, openPlanModal }) {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Top Portal Switcher Bar */}
      <div className="portal-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#f3c64c' }}>
            <Crown size={15} /> MEZBAAN DIGITAL OPERATING SYSTEM
          </span>
          <span style={{ fontSize: '0.75rem', opacity: 0.7, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 10 }}>
            Market: Beed • Kaij • Ambajogai • Gevrai
          </span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActivePortal('website')}
            className={`portal-nav-pill ${activePortal === 'website' ? 'active' : ''}`}
          >
            <Sparkles size={14} /> Public Website
          </button>

          <button
            onClick={() => setActivePortal('customer')}
            className={`portal-nav-pill ${activePortal === 'customer' ? 'active' : ''}`}
          >
            <User size={14} /> Customer Portal
          </button>

          <button
            onClick={() => setActivePortal('vendor')}
            className={`portal-nav-pill ${activePortal === 'vendor' ? 'active' : ''}`}
          >
            <Briefcase size={14} /> Vendor Portal
          </button>

          <button
            onClick={() => setActivePortal('admin')}
            className={`portal-nav-pill ${activePortal === 'admin' ? 'active' : ''}`}
          >
            <Shield size={14} /> Mezbaan Admin OS
          </button>

          <button
            onClick={() => setActivePortal('database')}
            className={`portal-nav-pill ${activePortal === 'database' ? 'active' : ''}`}
          >
            <Database size={14} /> Live ER Database
          </button>
        </nav>
      </div>

      {/* Main Brand Header */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #ebdcc0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        padding: '14px 24px'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo & Tagline */}
          <div 
            onClick={() => setActivePortal('website')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0f3d2e 0%, #0a291f 100%)',
              border: '2px solid #d4af37',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d4af37',
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.25)'
            }}>
              <Crown size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f3d2e', letterSpacing: '0.04em', fontFamily: 'Outfit' }}>
                  MEZBAAN
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b38f20', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Events & Celebrations
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, fontWeight: 500 }}>
                Aapka Event, Hamari Zimmedari • Your Event, Our Responsibility
              </p>
            </div>
          </div>

          {/* Quick CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => setActivePortal('database')}
              className="btn-outline"
              style={{ fontSize: '0.85rem' }}
            >
              <Database size={15} color="#b38f20" /> View ER Schema
            </button>
            <button
              onClick={openPlanModal}
              className="btn-gold"
              style={{ fontSize: '0.88rem' }}
            >
              <Calendar size={16} /> Plan My Event
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
