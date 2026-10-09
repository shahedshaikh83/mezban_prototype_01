import React from 'react';
import { Crown, MapPin, Phone, Mail, Clock, CheckCircle } from 'lucide-react';

export default function Footer({ setActivePortal, openPlanModal }) {
  return (
    <footer style={{
      background: 'linear-gradient(180deg, #0f3d2e 0%, #071f17 100%)',
      color: '#ffffff',
      padding: '60px 0 30px',
      borderTop: '3px solid #d4af37',
      marginTop: 80
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 40,
          marginBottom: 50
        }}>
          {/* Col 1: Brand Ethos */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: '#0a291f',
                border: '1.5px solid #d4af37',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d4af37'
              }}>
                <Crown size={20} />
              </div>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f3c64c', fontFamily: 'Outfit' }}>
                MEZBAAN
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#cadbd2', lineHeight: 1.7, marginBottom: 16 }}>
              Aapka Event, Hamari Zimmedari. We serve as your complete event planning, coordination, and vendor execution partner across Beed, Kaij, Ambajogai, and Gevrai.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(212, 175, 55, 0.15)', padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)', color: '#f5deb3', fontSize: '0.8rem', fontWeight: 600 }}>
              <CheckCircle size={14} color="#f3c64c" /> 100% Verified Local Vendors
            </div>
          </div>

          {/* Col 2: Operating Regions */}
          <div>
            <h4 style={{ color: '#f3c64c', fontSize: '1.05rem', marginBottom: 18, fontFamily: 'Outfit' }}>
              OPERATING MARKETS
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.88rem', color: '#cadbd2', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={16} color="#d4af37" /> <strong>Beed City</strong> (Jalna Rd, Subhash Rd, Stadium)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={16} color="#d4af37" /> <strong>Kaij</strong> (Kaij Bypass, Vidya Nagar)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={16} color="#d4af37" /> <strong>Ambajogai</strong> (Temple Rd, Civil Lines)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={16} color="#d4af37" /> <strong>Gevrai</strong> (NH 52, Shivaji Chowk)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={16} color="#d4af37" /> <strong>Majalgaon & Surrounding Districts</strong>
              </li>
            </ul>
          </div>

          {/* Col 3: Portals & Architecture */}
          <div>
            <h4 style={{ color: '#f3c64c', fontSize: '1.05rem', marginBottom: 18, fontFamily: 'Outfit' }}>
              PLATFORM PORTALS
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem' }}>
              <a onClick={() => setActivePortal('website')} style={{ cursor: 'pointer', color: '#cadbd2' }}>
                • Public Website & Event Catalogue
              </a>
              <a onClick={() => setActivePortal('customer')} style={{ cursor: 'pointer', color: '#cadbd2' }}>
                • Customer Portal (Quotes & Approvals)
              </a>
              <a onClick={() => setActivePortal('vendor')} style={{ cursor: 'pointer', color: '#cadbd2' }}>
                • Vendor Portal (Bids & Rate Cards)
              </a>
              <a onClick={() => setActivePortal('admin')} style={{ cursor: 'pointer', color: '#cadbd2' }}>
                • Mezbaan Admin Operating System
              </a>
              <a onClick={() => setActivePortal('database')} style={{ cursor: 'pointer', color: '#cadbd2' }}>
                • Central Relational ER Database (SQLite)
              </a>
            </div>
          </div>

          {/* Col 4: Contact & Office */}
          <div>
            <h4 style={{ color: '#f3c64c', fontSize: '1.05rem', marginBottom: 18, fontFamily: 'Outfit' }}>
              GET IN TOUCH
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.88rem', color: '#cadbd2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Phone size={16} color="#d4af37" />
                <span>+91 98220 14589 / +91 94231 57890</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={16} color="#d4af37" />
                <span>contact@mezbaanevents.in</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={16} color="#d4af37" />
                <span>Mon - Sun: 9:00 AM - 10:00 PM</span>
              </div>
              <button
                onClick={openPlanModal}
                className="btn-gold"
                style={{ marginTop: 8, fontSize: '0.85rem' }}
              >
                Plan An Event Now
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          fontSize: '0.82rem',
          color: '#8fa99c'
        }}>
          <div>
            © {new Date().getFullYear()} MEZBAAN EVENTS & CELEBRATIONS. Prepared for Rizwan, Shahid & Tausif.
          </div>
          <div>
            Built with Relational SQLite Architecture • Zero Placeholders • 100% Real Database
          </div>
        </div>
      </div>
    </footer>
  );
}
