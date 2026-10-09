import React, { useState, useEffect } from 'react';
import { 
  Crown, Sparkles, CheckCircle2, XCircle, Users, Calendar, MapPin, 
  ArrowRight, ShieldCheck, HeartHandshake, Utensils, Camera, Music, 
  Layers, Palette, Star, Clock, IndianRupee, ChevronRight 
} from 'lucide-react';

import { FALLBACK_VENUES, FALLBACK_SERVICES } from '../data/mockData';

export default function PublicWebsite({ openPlanModal, setActivePortal }) {
  const [venues, setVenues] = useState(FALLBACK_VENUES);
  const [services, setServices] = useState(FALLBACK_SERVICES);
  const [activeCity, setActiveCity] = useState('All');

  useEffect(() => {
    fetch('/api/venues')
      .then(res => res.json())
      .then(d => { if (d && d.success && d.venues && d.venues.length > 0) setVenues(d.venues); })
      .catch(() => { /* Fallback data is already loaded */ });

    fetch('/api/services')
      .then(res => res.json())
      .then(d => { if (d && d.success && d.services && d.services.length > 0) setServices(d.services); })
      .catch(() => { /* Fallback data is already loaded */ });
  }, []);

  const filteredVenues = activeCity === 'All' 
    ? venues 
    : venues.filter(v => v.city.toLowerCase() === activeCity.toLowerCase());

  const eventCategories = [
    {
      title: 'Weddings & Nikah',
      badge: 'Signature',
      desc: 'Complete stage, floral themes, dastarkhwan, candid photography, videography, and bridal coordination.',
      guests: '200 - 1500 Guests'
    },
    {
      title: 'Walima & Receptions',
      badge: 'Most Popular',
      desc: 'Grand banquet setup, separate ladies & gents dining, VIP sofa hospitality, and cinematic media coverage.',
      guests: '300 - 2000 Guests'
    },
    {
      title: 'Engagement Ceremonies',
      badge: 'Classic',
      desc: 'Ring ceremony setup, romantic theme lighting, specialized floral backdrops, and intimate guest catering.',
      guests: '100 - 400 Guests'
    },
    {
      title: 'Birthdays & Kids Celebrations',
      badge: 'Theme Based',
      desc: 'Superhero / fairytale balloon arches, custom designer cakes, photography, games, and snack buffets.',
      guests: '50 - 200 Guests'
    },
    {
      title: 'Aqeeqah & Family Celebrations',
      badge: 'Traditional',
      desc: 'Heartfelt family gatherings, traditional banquet arrangements, guest hospitality, and photography.',
      guests: '100 - 500 Guests'
    },
    {
      title: 'Community & Milad Programs',
      badge: 'High Capacity',
      desc: 'Lawn and ground setup, high-power line-array PA audio, shamiana canopy, and bulk catering service.',
      guests: '500 - 3000 Guests'
    },
    {
      title: 'School & Educational Events',
      badge: 'Academic',
      desc: 'Annual gatherings, prize distribution staging, podium sound, student seating, and video recording.',
      guests: '250 - 1000 Guests'
    },
    {
      title: 'Corporate & Product Launches',
      badge: 'Professional',
      desc: 'Dealer meetings, brand displays, LED walls, executive lunch boxes, and institutional logistics.',
      guests: '50 - 600 Guests'
    }
  ];

  return (
    <div className="fade-in">
      {/* 1. HERO SECTION */}
      <section style={{
        background: 'linear-gradient(135deg, #09261c 0%, #0f3d2e 60%, #175440 100%)',
        color: '#ffffff',
        padding: '90px 0 100px',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '4px solid #d4af37'
      }}>
        {/* Subtle decorative background circles */}
        <div style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: -50,
          left: -50,
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27,94,64,0.3) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
            {/* Top Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid #d4af37',
              borderRadius: 30,
              padding: '6px 18px',
              fontSize: '0.85rem',
              color: '#f8e7a6',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 24,
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}>
              <Crown size={16} color="#f3c64c" /> Complete Event Solutions • Beed, Maharashtra
            </div>

            {/* Main Promise / Headline */}
            <h1 style={{
              fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
              fontWeight: 800,
              lineHeight: 1.18,
              color: '#ffffff',
              marginBottom: 20,
              fontFamily: 'Outfit'
            }}>
              Your Event, <span style={{
                background: 'linear-gradient(135deg, #f7df8d 0%, #dfb83b 50%, #f3ce5e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Our Responsibility</span>
            </h1>

            <p style={{
              fontSize: '1.35rem',
              color: '#eddba6',
              fontFamily: 'Outfit',
              fontWeight: 600,
              marginBottom: 16
            }}>
              "Aapka Event, Hamari Zimmedari"
            </p>

            <p style={{
              fontSize: '1.05rem',
              color: '#d2e4dc',
              maxWidth: 720,
              margin: '0 auto 36px',
              lineHeight: 1.7
            }}>
              You enjoy your celebration with family and guests. MEZBAAN coordinates venues, verified local caterers, royal floral decor, cinematic photography, sound, and on-ground execution across Beed, Kaij, Ambajogai, and Gevrai.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <button
                onClick={openPlanModal}
                className="btn-gold"
                style={{ fontSize: '1.05rem', padding: '14px 34px' }}
              >
                <Calendar size={18} /> Plan My Event With Mezbaan
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('why-mezbaan');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-outline"
                style={{
                  fontSize: '1.02rem',
                  padding: '14px 28px',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  borderColor: 'rgba(212,175,55,0.5)'
                }}
              >
                Why Choose Mezbaan <ArrowRight size={16} />
              </button>
            </div>

            {/* Trust Metrics Pill */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 20,
              marginTop: 60,
              padding: '20px 24px',
              background: 'rgba(8, 33, 24, 0.7)',
              borderRadius: 16,
              border: '1px solid rgba(212, 175, 55, 0.25)',
              backdropFilter: 'blur(8px)'
            }}>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f3c64c', fontFamily: 'Outfit' }}>
                  100%
                </div>
                <div style={{ fontSize: '0.8rem', color: '#c4dbcf', fontWeight: 600 }}>
                  Single-Point Responsibility
                </div>
              </div>

              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f3c64c', fontFamily: 'Outfit' }}>
                  ₹0 Chaos
                </div>
                <div style={{ fontSize: '0.8rem', color: '#c4dbcf', fontWeight: 600 }}>
                  Transparent Cost Quotations
                </div>
              </div>

              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f3c64c', fontFamily: 'Outfit' }}>
                  Beed & Kaij
                </div>
                <div style={{ fontSize: '0.8rem', color: '#c4dbcf', fontWeight: 600 }}>
                  Deep Local Venue Expertise
                </div>
              </div>

              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f3c64c', fontFamily: 'Outfit' }}>
                  Live SQL DB
                </div>
                <div style={{ fontSize: '0.8rem', color: '#c4dbcf', fontWeight: 600 }}>
                  Scalable Digital Operating System
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE CORE PROBLEM & SOLUTION (SECTION 15 FROM MASTER BRIEF) */}
      <section id="why-mezbaan" style={{ padding: '80px 0', background: '#fdfbf7' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 740, margin: '0 auto 50px' }}>
            <span className="badge badge-gold" style={{ marginBottom: 12 }}>
              The Mezbaan Difference
            </span>
            <h2 style={{ fontSize: '2.3rem', color: '#0f3d2e', marginBottom: 14 }}>
              What MEZBAAN Actually Helps With
            </h2>
            <p style={{ color: '#4b5563', fontSize: '1.02rem', lineHeight: 1.7 }}>
              Planning an event alone creates endless headaches. With MEZBAAN, you deal with one trusted partner who manages every single detail.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 30
          }}>
            {/* Left: Without MEZBAAN (Chaos) */}
            <div style={{
              background: '#ffffff',
              border: '1.5px solid #f0cfcb',
              borderRadius: 16,
              padding: 32,
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626'
                }}>
                  <XCircle size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#991b1b', margin: 0 }}>
                    Without MEZBAAN
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 600 }}>
                    Customer Manages Everything Alone
                  </span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  'Calling 10+ different decorators and caterers separately in Beed',
                  'Inconsistent pricing, hidden surprise costs, and endless haggling',
                  'Checking venue rules manually (ladies/gents partition, cooking gas, curfews)',
                  'Uncertain vendor availability and late cancellations right before the event',
                  'Host remains stressed on stage instead of enjoying with relatives and guests',
                  'Chasing photographers for 6 months to get final albums and videos',
                  'No single point of accountability when things go wrong'
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.92rem', color: '#4b5563' }}>
                    <XCircle size={17} color="#ef4444" style={{ flexShrink: 0, marginTop: 3 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: With MEZBAAN (Responsibility) */}
            <div style={{
              background: '#ffffff',
              border: '2px solid #d4af37',
              borderRadius: 16,
              padding: 32,
              boxShadow: '0 8px 25px rgba(212, 175, 55, 0.15)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: -12,
                right: 24,
                background: 'linear-gradient(135deg, #dfbc46 0%, #c49d27 100%)',
                color: '#0d281e',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '4px 14px',
                borderRadius: 20,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Recommended Peace Of Mind
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#eaf5ee',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0e633d'
                }}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#0f3d2e', margin: 0 }}>
                    With MEZBAAN
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#0e633d', fontWeight: 600 }}>
                    One Call • Complete End-to-End Coordination
                  </span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  'Single point of coordination for requirement, venue, decor, and dastarkhwan',
                  'Clear itemized quotations with upfront inclusions, exclusions & payment stages',
                  'Pre-verified venue matching in Beed, Kaij, and Ambajogai with exact facilities',
                  'Only trusted, rate-locked, and vetted local vendors assigned to your function',
                  'On-ground event coordinator ensures on-time setup, sound check, and serving',
                  'Guaranteed delivery timelines for photo albums, 4K video, and highlight reels',
                  'You and your family relax and celebrate as true hosts'
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.92rem', color: '#1f2937', fontWeight: 500 }}>
                    <CheckCircle2 size={17} color="#059669" style={{ flexShrink: 0, marginTop: 3 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #ebdcc0', textAlign: 'center' }}>
                <button
                  onClick={openPlanModal}
                  className="btn-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Calendar size={16} /> Submit Your Requirement Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. EVENT CATEGORIES */}
      <section style={{ padding: '80px 0', background: '#f5f0e6' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 740, margin: '0 auto 50px' }}>
            <span className="badge badge-green" style={{ marginBottom: 12 }}>
              Tailored Celebrations
            </span>
            <h2 style={{ fontSize: '2.3rem', color: '#0f3d2e', marginBottom: 14 }}>
              Initial Target Event Categories
            </h2>
            <p style={{ color: '#4b5563', fontSize: '1.02rem', lineHeight: 1.7 }}>
              From intimate 50-person family birthdays to grand 1,500-person wedding Walimas, MEZBAAN handles every scale seamlessly.
            </p>
          </div>

          <div className="grid-4">
            {eventCategories.map((cat, i) => (
              <div 
                key={i} 
                className="card"
                style={{
                  background: '#ffffff',
                  border: '1px solid #ebdcc0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 14,
                  padding: 24,
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <span className="badge badge-gold">{cat.badge}</span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                      {cat.guests}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.18rem', color: '#0f3d2e', marginBottom: 10 }}>
                    {cat.title}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#555', lineHeight: 1.6, marginBottom: 20 }}>
                    {cat.desc}
                  </p>
                </div>

                <button
                  onClick={openPlanModal}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#0f3d2e',
                    borderTop: '1px solid #f1e9d8',
                    paddingTop: 12
                  }}
                >
                  Plan This Event <ChevronRight size={14} color="#d4af37" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. BEED REGIONAL VENUES SHOWCASE */}
      <section style={{ padding: '80px 0', background: '#ffffff' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20, marginBottom: 40 }}>
            <div>
              <span className="badge badge-gold" style={{ marginBottom: 12 }}>
                Local Knowledge
              </span>
              <h2 style={{ fontSize: '2.3rem', color: '#0f3d2e', marginBottom: 10 }}>
                Verified Venues in Beed Region
              </h2>
              <p style={{ color: '#4b5563', fontSize: '1rem', maxWidth: 600 }}>
                Structured details on guest capacity, ladies/gents partitions, catering permissions, and parking availability.
              </p>
            </div>

            {/* City filter tabs */}
            <div style={{ display: 'flex', gap: 8, background: '#f3efe6', padding: 6, borderRadius: 30, border: '1px solid #e2d7c0' }}>
              {['All', 'Beed', 'Kaij', 'Ambajogai', 'Gevrai'].map(city => (
                <button
                  key={city}
                  onClick={() => setActiveCity(city)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 20,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    background: activeCity === city ? '#0f3d2e' : 'transparent',
                    color: activeCity === city ? '#ffffff' : '#4b5563',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          <div className="grid-3">
            {filteredVenues.map(venue => (
              <div key={venue.venue_id} className="card-luxury">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span className="badge badge-green">
                    <ShieldCheck size={12} /> {venue.status}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#b38f20', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={13} /> {venue.city}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', color: '#0f3d2e', marginBottom: 8 }}>
                  {venue.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 14 }}>
                  {venue.address}
                </p>

                <div style={{
                  background: '#fcfaf5',
                  border: '1px solid #eee5d4',
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginBottom: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                    <span style={{ color: '#555' }}>Guest Capacity:</span>
                    <strong style={{ color: '#0f3d2e' }}>Up to {venue.capacity} Persons</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#444', lineHeight: 1.5 }}>
                    <strong>Facilities:</strong> {venue.facilities}
                  </div>
                </div>

                <button
                  onClick={openPlanModal}
                  className="btn-outline"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
                >
                  Check Availability & Pricing
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SERVICES CATALOGUE */}
      <section style={{ padding: '80px 0', background: '#fdfbf7' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 740, margin: '0 auto 50px' }}>
            <span className="badge badge-gold" style={{ marginBottom: 12 }}>
              Comprehensive Services
            </span>
            <h2 style={{ fontSize: '2.3rem', color: '#0f3d2e', marginBottom: 14 }}>
              End-to-End Service Catalogue
            </h2>
            <p style={{ color: '#4b5563', fontSize: '1.02rem', lineHeight: 1.7 }}>
              Every service in our database is managed under standard operating procedures and backed by verified local contractors.
            </p>
          </div>

          <div className="grid-2">
            {services.map(s => (
              <div 
                key={s.service_id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #ebdcc0',
                  borderRadius: 14,
                  padding: 24,
                  display: 'flex',
                  gap: 18,
                  alignItems: 'flex-start'
                }}
              >
                <div style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: '#f5f0e6',
                  border: '1px solid #d4af37',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0f3d2e',
                  flexShrink: 0
                }}>
                  <Sparkles size={22} color="#b38f20" />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <h3 style={{ fontSize: '1.15rem', color: '#0f3d2e', margin: 0 }}>
                      {s.name}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600 }}>
                      {s.category_name}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#555', lineHeight: 1.6, marginBottom: 12 }}>
                    {s.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '0.78rem', background: '#f1ede2', color: '#0f3d2e', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
                      Service ID: SVC-{String(s.service_id).padStart(3, '0')}
                    </span>
                    <button
                      onClick={openPlanModal}
                      style={{ fontSize: '0.82rem', color: '#b38f20', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      Include in Quote <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BAR */}
      <section style={{
        background: 'linear-gradient(135deg, #0f3d2e 0%, #071f17 100%)',
        color: '#ffffff',
        padding: '70px 0',
        textAlign: 'center',
        borderTop: '2px solid #d4af37'
      }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <Crown size={36} color="#f3c64c" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: '2.5rem', color: '#ffffff', marginBottom: 16, fontFamily: 'Outfit' }}>
            Ready to Celebrate Without The Stress?
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#cadbd2', lineHeight: 1.7, marginBottom: 30 }}>
            Tell us your date, location, and guest requirements. We will prepare an itemized costing and assign a dedicated coordinator immediately.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button
              onClick={openPlanModal}
              className="btn-gold"
              style={{ fontSize: '1.05rem', padding: '14px 36px' }}
            >
              <Calendar size={18} /> Request Free Event Consultation
            </button>
            <button
              onClick={() => setActivePortal('database')}
              className="btn-outline"
              style={{
                fontSize: '1rem',
                padding: '14px 28px',
                background: 'rgba(255,255,255,0.06)',
                color: '#ffffff',
                borderColor: 'rgba(212,175,55,0.4)'
              }}
            >
              Explore Live SQLite Backend
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
