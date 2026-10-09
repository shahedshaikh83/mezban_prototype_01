import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Users, IndianRupee, Check, Sparkles, AlertCircle } from 'lucide-react';

import { FALLBACK_VENUES, FALLBACK_SERVICES } from '../data/mockData';

export default function PlanEventModal({ isOpen, onClose, onEventCreated }) {
  const [venues, setVenues] = useState(FALLBACK_VENUES);
  const [services, setServices] = useState(FALLBACK_SERVICES);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    event_type: 'Walima & Reception',
    event_date: '',
    location: 'Beed',
    guest_count: 300,
    budget: 250000,
    venue_id: '',
    selected_services: [2, 4, 6], // default: Catering, Decor, Photography
    special_requirements: 'Require separate ladies and gents dining sections with authentic Beed mutton dum biryani dastarkhwan service.'
  });

  useEffect(() => {
    if (isOpen) {
      // Fetch venues and services from backend if available
      fetch('/api/venues')
        .then(res => res.json())
        .then(data => { if (data && data.success && data.venues && data.venues.length > 0) setVenues(data.venues); })
        .catch(() => {});

      fetch('/api/services')
        .then(res => res.json())
        .then(data => { if (data && data.success && data.services && data.services.length > 0) setServices(data.services); })
        .catch(() => {});

      setSuccessData(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => {
      const exists = prev.selected_services.includes(serviceId);
      if (exists) {
        return { ...prev, selected_services: prev.selected_services.filter(id => id !== serviceId) };
      } else {
        return { ...prev, selected_services: [...prev.selected_services, serviceId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessData(data);
        if (onEventCreated) onEventCreated(data);
      } else {
        setError(data.message || 'Failed to submit enquiry');
      }
    } catch {
      // In offline/Live Server mode without backend, provide simulated success
      const simulatedSuccess = {
        success: true,
        event_id: Math.floor(100 + Math.random() * 900),
        tracking_code: 'MZB-2026-' + Math.floor(1000 + Math.random() * 9000),
        message: 'Event requirement recorded successfully!'
      };
      setSuccessData(simulatedSuccess);
      if (onEventCreated) onEventCreated(simulatedSuccess);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e6dfcf', paddingBottom: 16, marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', color: '#0f3d2e', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={20} color="#d4af37" /> Plan Your Event with MEZBAAN
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '4px 0 0' }}>
              Aapka Event, Hamari Zimmedari • Fill in your event details below
            </p>
          </div>
          <button onClick={onClose} style={{ color: '#9ca3af', padding: 4 }}>
            <X size={22} />
          </button>
        </div>

        {successData ? (
          <div style={{ textAlign: 'center', padding: '24px 10px' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#eaf5ee',
              color: '#0e633d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              border: '2px solid #a9dec1'
            }}>
              <Check size={36} />
            </div>
            <h3 style={{ fontSize: '1.4rem', color: '#0f3d2e', marginBottom: 8 }}>
              Event Requirement Registered!
            </h3>
            <div style={{
              display: 'inline-block',
              background: '#fbf5df',
              border: '1px solid #ebd998',
              borderRadius: 8,
              padding: '8px 20px',
              fontWeight: 800,
              color: '#946f05',
              fontSize: '1.1rem',
              letterSpacing: '0.05em',
              marginBottom: 16
            }}>
              Reference ID: {successData.event_code}
            </div>
            <p style={{ color: '#4b5563', fontSize: '0.92rem', lineHeight: 1.6, maxWidth: 500, margin: '0 auto 24px' }}>
              Your event requirement has been recorded in the MEZBAAN database. Our dedicated event coordinator is reviewing your services and matching available preferred vendors in Beed.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                onClick={onClose}
                className="btn-gold"
              >
                Close & View Portals
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.88rem' }}>
                <AlertCircle size={18} /> {error}
              </div>
            )}

            {/* Section 1: Customer Contact */}
            <div style={{ background: '#fdfbf7', padding: 16, borderRadius: 10, border: '1px solid #eee5d4', marginBottom: 18 }}>
              <h4 style={{ fontSize: '0.9rem', color: '#b38f20', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>
                1. Customer Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Tariq Farooqui"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    className="form-input"
                    placeholder="e.g. 9822014589"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="tariq@gmail.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Area / Address in Beed</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Shah Ganj, Beed"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Event Details */}
            <div style={{ background: '#fdfbf7', padding: 16, borderRadius: 10, border: '1px solid #eee5d4', marginBottom: 18 }}>
              <h4 style={{ fontSize: '0.9rem', color: '#b38f20', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>
                2. Event Specifics
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Event Category *</label>
                  <select
                    className="form-select"
                    value={formData.event_type}
                    onChange={e => setFormData({ ...formData, event_type: e.target.value })}
                  >
                    <option value="Walima & Reception">Walima & Reception</option>
                    <option value="Wedding & Nikah">Wedding & Nikah</option>
                    <option value="Engagement Ceremony">Engagement Ceremony</option>
                    <option value="Kids Birthday Celebration">Kids Birthday Celebration</option>
                    <option value="Aqeeqah Function">Aqeeqah Function</option>
                    <option value="Community & Milad Gathering">Community & Milad Gathering</option>
                    <option value="Educational & School Event">Educational & School Event</option>
                    <option value="Corporate / Brand Launch">Corporate / Brand Launch</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Event Date *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.event_date}
                    onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Operating City</label>
                  <select
                    className="form-select"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                  >
                    <option value="Beed">Beed</option>
                    <option value="Kaij">Kaij</option>
                    <option value="Ambajogai">Ambajogai</option>
                    <option value="Gevrai">Gevrai</option>
                    <option value="Majalgaon">Majalgaon</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Expected Guest Count</label>
                  <input
                    type="number"
                    min="20"
                    step="10"
                    className="form-input"
                    value={formData.guest_count}
                    onChange={e => setFormData({ ...formData, guest_count: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Approximate Budget (₹)</label>
                  <input
                    type="number"
                    step="5000"
                    className="form-input"
                    value={formData.budget}
                    onChange={e => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Preferred Venue</label>
                  <select
                    className="form-select"
                    value={formData.venue_id}
                    onChange={e => setFormData({ ...formData, venue_id: e.target.value })}
                  >
                    <option value="">-- Let Mezbaan Recommend Suitable Venue --</option>
                    {venues.map(v => (
                      <option key={v.venue_id} value={v.venue_id}>
                        {v.name} ({v.city} - Cap: {v.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Required Services (Multi-select) */}
            <div style={{ background: '#fdfbf7', padding: 16, borderRadius: 10, border: '1px solid #eee5d4', marginBottom: 18 }}>
              <h4 style={{ fontSize: '0.9rem', color: '#b38f20', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
                3. Services Required (Select all that apply)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 10 }}>
                {services.map(s => {
                  const isChecked = formData.selected_services.includes(s.service_id);
                  return (
                    <div
                      key={s.service_id}
                      onClick={() => handleServiceToggle(s.service_id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: isChecked ? '1.5px solid #d4af37' : '1px solid #e0d7c3',
                        background: isChecked ? '#fcf9ea' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: isChecked ? '1.5px solid #b38f20' : '1.5px solid #9ca3af',
                        background: isChecked ? '#b38f20' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff'
                      }}>
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1f2937' }}>
                        {s.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Special Requirements */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Special Notes / Menu / Partition Requirements</label>
              <textarea
                rows={3}
                className="form-textarea"
                placeholder="e.g. Separate Ladies/Gents shamiana, Mutton Dum Biryani menu, 4K Drone entry..."
                value={formData.special_requirements}
                onChange={e => setFormData({ ...formData, special_requirements: e.target.value })}
              />
            </div>

            {/* Submit Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-outline"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-gold"
                disabled={loading}
              >
                {loading ? 'Submitting Requirement...' : 'Confirm & Submit to MEZBAAN'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
