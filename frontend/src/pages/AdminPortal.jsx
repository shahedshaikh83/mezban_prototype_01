import React, { useState, useEffect } from 'react';
import { 
  Shield, DollarSign, Calendar, Users, Briefcase, MapPin, 
  Plus, CheckCircle, Clock, ChevronRight, FileText, Check, 
  ArrowUpRight, AlertCircle, RefreshCw, Layers 
} from 'lucide-react';

export default function AdminPortal() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [venues, setVenues] = useState([]);
  const [services, setServices] = useState([]);
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline', 'quotes', 'vendors', 'venues', 'finance'
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);

  // New Quote Builder State
  const [quoteEventId, setQuoteEventId] = useState('');
  const [quoteItems, setQuoteItems] = useState([
    { service_id: 2, vendor_id: 1, vendor_cost: 110000, margin_pct: 25, customer_price: 137500 },
    { service_id: 4, vendor_id: 2, vendor_cost: 30000, margin_pct: 25, customer_price: 37500 }
  ]);
  const [quoteSuccess, setQuoteSuccess] = useState(false);

  // New Venue State
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [newVenue, setNewVenue] = useState({
    name: '',
    address: '',
    city: 'Beed',
    capacity: 500,
    facilities: 'Separate Ladies & Gents Dining, AC Hall, In-house Kitchen, 100 Car Parking',
    status: 'Verified'
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.stats); })
      .catch(console.error);

    fetch('/api/events')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setEvents(d.events);
          if (d.events.length > 0 && !selectedEventId) {
            setSelectedEventId(d.events[0].event_id);
            loadEventDetails(d.events[0].event_id);
          }
        }
      })
      .catch(console.error);

    fetch('/api/vendors')
      .then(r => r.json())
      .then(d => { if (d.success) setVendors(d.vendors); })
      .catch(console.error);

    fetch('/api/venues')
      .then(r => r.json())
      .then(d => { if (d.success) setVenues(d.venues); })
      .catch(console.error);

    fetch('/api/services')
      .then(r => r.json())
      .then(d => { if (d.success) setServices(d.services); })
      .catch(console.error);
  };

  const loadEventDetails = (id) => {
    setSelectedEventId(id);
    fetch(`/api/events/${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setEventDetails(d); })
      .catch(console.error);
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...eventDetails.event,
          status: newStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        loadAllData();
        loadEventDetails(eventId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyVendor = async (vendorId, currentStatus) => {
    const nextStatus = currentStatus === 'Verified' ? 'Preferred' : 'Verified';
    try {
      await fetch(`/api/vendors/${vendorId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_status: nextStatus })
      });
      fetch('/api/vendors').then(r => r.json()).then(d => { if (d.success) setVendors(d.vendors); });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddQuoteItem = () => {
    setQuoteItems([
      ...quoteItems,
      { service_id: services[0]?.service_id || 1, vendor_id: vendors[0]?.vendor_id || 1, vendor_cost: 10000, margin_pct: 20, customer_price: 12000 }
    ]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...quoteItems];
    updated[index][field] = value;

    if (field === 'vendor_cost' || field === 'margin_pct') {
      const cost = parseFloat(updated[index].vendor_cost) || 0;
      const margin = parseFloat(updated[index].margin_pct) || 0;
      updated[index].customer_price = Math.round(cost * (1 + margin / 100));
    }

    setQuoteItems(updated);
  };

  const handleCreateQuote = async (e) => {
    e.preventDefault();
    if (!quoteEventId || quoteItems.length === 0) return;

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: Number(quoteEventId),
          items: quoteItems.map(it => ({
            service_id: Number(it.service_id),
            vendor_id: Number(it.vendor_id),
            vendor_cost: parseFloat(it.vendor_cost),
            customer_price: parseFloat(it.customer_price)
          }))
        })
      });
      const data = await res.json();
      if (data.success) {
        setQuoteSuccess(true);
        loadAllData();
        setTimeout(() => setQuoteSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVenue)
      });
      const data = await res.json();
      if (data.success) {
        setShowVenueModal(false);
        fetch('/api/venues').then(r => r.json()).then(d => { if (d.success) setVenues(d.venues); });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container fade-in" style={{ padding: '36px 24px 80px' }}>
      {/* 1. Header & Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: '#0f3d2e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d4af37'
            }}>
              <Shield size={20} />
            </div>
            <h1 style={{ fontSize: '1.65rem', color: '#0f3d2e', margin: 0 }}>
              MEZBAAN Central Operating Engine
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0 0' }}>
            Administrative Control • Internal Costing & Margin Engine • Beed Hub
          </p>
        </div>

        {/* Action Tabs */}
        <div style={{ display: 'flex', gap: 8, background: '#f3efe6', padding: 6, borderRadius: 30, border: '1px solid #e2d7c0' }}>
          {[
            { id: 'pipeline', label: 'Events Pipeline' },
            { id: 'quotes', label: 'Quote & Margin Builder' },
            { id: 'vendors', label: 'Vendor Network' },
            { id: 'venues', label: 'Venues Directory' },
            { id: 'finance', label: 'P&L Ledger' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: '0.82rem',
                fontWeight: 700,
                background: activeTab === tab.id ? '#0f3d2e' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#4b5563',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Executive BI KPI Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 32
        }}>
          <div className="card-luxury" style={{ padding: 18 }}>
            <span style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', fontWeight: 700 }}>
              Customer Billed (Revenue)
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f3d2e', marginTop: 4, fontFamily: 'Outfit' }}>
              ₹{Number(stats.financials.totalBilled).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: 4 }}>
              Received: ₹{Number(stats.financials.customerPaid).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="card-luxury" style={{ padding: 18 }}>
            <span style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', fontWeight: 700 }}>
              Vendor Committed Cost
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#991b1b', marginTop: 4, fontFamily: 'Outfit' }}>
              ₹{Number(stats.financials.vendorAgreedCost).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#666', marginTop: 4 }}>
              Disbursed: ₹{Number(stats.financials.vendorPaid).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="card-luxury" style={{ padding: 18 }}>
            <span style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', fontWeight: 700 }}>
              Gross Contribution (Profit)
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0e633d', marginTop: 4, fontFamily: 'Outfit' }}>
              ₹{Number(stats.financials.grossContribution).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#b38f20', fontWeight: 700, marginTop: 4 }}>
              Margin: {stats.financials.marginPercent}% Net Spread
            </div>
          </div>

          <div className="card-luxury" style={{ padding: 18 }}>
            <span style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', fontWeight: 700 }}>
              Active Operations
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f3d2e', marginTop: 4, fontFamily: 'Outfit' }}>
              {stats.activeEvents} Active Events
            </div>
            <div style={{ fontSize: '0.78rem', color: '#666', marginTop: 4 }}>
              {stats.totalVendors} Vendors • {stats.totalVenues} Venues
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB CONTENT */}

      {/* TAB 1: PIPELINE */}
      {activeTab === 'pipeline' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 }}>
          {/* Events List */}
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#0f3d2e', marginBottom: 14 }}>
              All Events ({events.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {events.map(ev => {
                const isSelected = selectedEventId === ev.event_id;
                return (
                  <div
                    key={ev.event_id}
                    onClick={() => loadEventDetails(ev.event_id)}
                    style={{
                      padding: 14,
                      background: isSelected ? '#ffffff' : '#faf8f5',
                      border: isSelected ? '2px solid #d4af37' : '1px solid #ebdcc0',
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                        MEZ-EVT-2026-{String(ev.event_id).padStart(4, '0')}
                      </span>
                      <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                        {ev.status}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1rem', color: '#0f3d2e', marginBottom: 4 }}>
                      {ev.event_type}
                    </h4>

                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      Customer: <strong>{ev.customer_name}</strong> ({ev.customer_phone})
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 4 }}>
                      Date: {ev.event_date} • Guests: {ev.guest_count} • {ev.venue_name || ev.location}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event Detail & Management Panel */}
          {eventDetails && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #ebdcc0', paddingBottom: 16, marginBottom: 20 }}>
                <div>
                  <span className="badge badge-gold" style={{ marginBottom: 6 }}>
                    MEZ-EVT-2026-{String(eventDetails.event.event_id).padStart(4, '0')}
                  </span>
                  <h2 style={{ fontSize: '1.45rem', color: '#0f3d2e', margin: 0 }}>
                    {eventDetails.event.event_type}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#666', margin: '4px 0 0' }}>
                    Customer: <strong>{eventDetails.event.customer_name}</strong> ({eventDetails.event.customer_phone})
                  </p>
                </div>

                {/* Status Switcher Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f3d2e' }}>Status:</label>
                  <select
                    className="form-select"
                    style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}
                    value={eventDetails.event.status}
                    onChange={e => handleStatusChange(eventDetails.event.event_id, e.target.value)}
                  >
                    <option value="Enquiry">Enquiry</option>
                    <option value="Planning">Planning</option>
                    <option value="Quotation Sent">Quotation Sent</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Event Day">Event Day</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Requirements List */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: '0.95rem', color: '#0f3d2e', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.04em' }}>
                  Requirements & Service Breakdown
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {eventDetails.requirements?.map(r => (
                    <div
                      key={r.requirement_id}
                      style={{
                        padding: '10px 14px',
                        background: '#fcfaf6',
                        borderRadius: 8,
                        border: '1px solid #eee5d4',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: '#0f3d2e' }}>{r.service_name}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{r.details}</div>
                      </div>
                      <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quotations & Costing Internal View */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: '0.95rem', color: '#0f3d2e', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.04em' }}>
                  Internal Costing vs Customer Price (Quotes)
                </h4>
                {eventDetails.quotes?.map(q => (
                  <div key={q.quote_id} style={{ border: '1px solid #ebdcc0', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
                    <div className="table-container" style={{ border: 'none' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Service</th>
                            <th>Assigned Vendor</th>
                            <th style={{ textAlign: 'right' }}>Internal Cost (₹)</th>
                            <th style={{ textAlign: 'right' }}>Customer Price (₹)</th>
                            <th style={{ textAlign: 'right' }}>Margin (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {q.items?.map((it, i) => (
                            <tr key={i}>
                              <td><strong>{it.service_name}</strong></td>
                              <td>{it.vendor_name || 'TBD'}</td>
                              <td style={{ textAlign: 'right', color: '#991b1b' }}>
                                ₹{Number(it.vendor_cost).toLocaleString('en-IN')}
                              </td>
                              <td style={{ textAlign: 'right', color: '#0f3d2e', fontWeight: 700 }}>
                                ₹{Number(it.customer_price).toLocaleString('en-IN')}
                              </td>
                              <td style={{ textAlign: 'right', color: '#0e633d', fontWeight: 700 }}>
                                ₹{(it.customer_price - it.vendor_cost).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ background: '#fdfbf7', padding: '12px 16px', borderTop: '1px solid #ebdcc0', display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                      <div>
                        Vendor Total Cost: <strong style={{ color: '#991b1b' }}>₹{Number(q.total_cost).toLocaleString('en-IN')}</strong>
                      </div>
                      <div>
                        Mezbaan Margin: <strong style={{ color: '#0e633d' }}>₹{Number(q.mezbaan_margin).toLocaleString('en-IN')}</strong>
                      </div>
                      <div>
                        Customer Selling Price: <strong style={{ color: '#0f3d2e' }}>₹{Number(q.total_price).toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QUOTE & MARGIN BUILDER (Section 30 of brief) */}
      {activeTab === 'quotes' && (
        <div className="card-luxury">
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: '1.4rem', color: '#0f3d2e', margin: 0 }}>
              Prepare Official Quotation (Costing & Margin Engine)
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: 4 }}>
              Internal Formula: Vendor Cost + MEZBAAN Margin = Customer Selling Price
            </p>
          </div>

          {quoteSuccess && (
            <div style={{ background: '#eaf5ee', color: '#0e633d', padding: '12px 16px', borderRadius: 8, marginBottom: 18, fontSize: '0.9rem' }}>
              Quotation generated and saved! Available immediately in the Customer Portal for client review.
            </div>
          )}

          <form onSubmit={handleCreateQuote}>
            {/* Select Event */}
            <div className="form-group" style={{ maxWidth: 450 }}>
              <label className="form-label">Select Target Event *</label>
              <select
                required
                className="form-select"
                value={quoteEventId}
                onChange={e => setQuoteEventId(e.target.value)}
              >
                <option value="">-- Choose Event to Quote --</option>
                {events.map(e => (
                  <option key={e.event_id} value={e.event_id}>
                    MEZ-EVT-2026-{String(e.event_id).padStart(4, '0')} : {e.event_type} ({e.customer_name} - {e.guest_count} guests)
                  </option>
                ))}
              </select>
            </div>

            {/* Line Items Builder */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontSize: '0.95rem', color: '#0f3d2e' }}>Quote Line Items</h4>
                <button type="button" onClick={handleAddQuoteItem} className="btn-outline" style={{ fontSize: '0.8rem' }}>
                  <Plus size={14} /> Add Service Item
                </button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Contractor / Vendor</th>
                      <th style={{ width: 140 }}>Internal Cost (₹)</th>
                      <th style={{ width: 100 }}>Margin %</th>
                      <th style={{ width: 140 }}>Customer Price (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quoteItems.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <select
                            className="form-select"
                            value={item.service_id}
                            onChange={e => handleItemChange(idx, 'service_id', Number(e.target.value))}
                          >
                            {services.map(s => (
                              <option key={s.service_id} value={s.service_id}>{s.name}</option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <select
                            className="form-select"
                            value={item.vendor_id}
                            onChange={e => handleItemChange(idx, 'vendor_id', Number(e.target.value))}
                          >
                            {vendors.map(v => (
                              <option key={v.vendor_id} value={v.vendor_id}>{v.business_name}</option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <input
                            type="number"
                            className="form-input"
                            value={item.vendor_cost}
                            onChange={e => handleItemChange(idx, 'vendor_cost', e.target.value)}
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            className="form-input"
                            value={item.margin_pct}
                            onChange={e => handleItemChange(idx, 'margin_pct', e.target.value)}
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            className="form-input"
                            value={item.customer_price}
                            onChange={e => handleItemChange(idx, 'customer_price', e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations Total Bar */}
            {(() => {
              const totalCost = quoteItems.reduce((sum, it) => sum + (parseFloat(it.vendor_cost) || 0), 0);
              const totalPrice = quoteItems.reduce((sum, it) => sum + (parseFloat(it.customer_price) || 0), 0);
              const totalMargin = totalPrice - totalCost;

              return (
                <div style={{
                  background: '#fcfaf5',
                  padding: 20,
                  borderRadius: 12,
                  border: '1px solid #ebdcc0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                  marginBottom: 20
                }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#666', fontWeight: 700 }}>Total Internal Cost:</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991b1b' }}>
                      ₹{totalCost.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#666', fontWeight: 700 }}>MEZBAAN Margin (Gross):</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0e633d' }}>
                      ₹{totalMargin.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#666', fontWeight: 700 }}>Customer Selling Total:</span>
                    <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f3d2e', fontFamily: 'Outfit' }}>
                      ₹{totalPrice.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <button type="submit" className="btn-gold" style={{ padding: '12px 28px' }}>
                    Publish & Send Quotation
                  </button>
                </div>
              );
            })()}
          </form>
        </div>
      )}

      {/* TAB 3: VENDOR NETWORK */}
      {activeTab === 'vendors' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#0f3d2e', margin: 0 }}>
                Vendor Directory & Verification Ledger
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#666', margin: '2px 0 0' }}>
                All registered local contractors across Beed, Kaij, Ambajogai, and Gevrai
              </p>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor ID</th>
                  <th>Business Name</th>
                  <th>Contact Person</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Verification</th>
                  <th>Rating</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(v => (
                  <tr key={v.vendor_id}>
                    <td>VEN-{String(v.vendor_id).padStart(4, '0')}</td>
                    <td><strong>{v.business_name}</strong></td>
                    <td>{v.contact_person}</td>
                    <td>{v.phone}</td>
                    <td>{v.city}</td>
                    <td>
                      <span className={`badge ${v.verification_status === 'Preferred' ? 'badge-gold' : 'badge-green'}`}>
                        {v.verification_status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#b38f20' }}>
                      ★ {v.rating}
                    </td>
                    <td>
                      <button
                        onClick={() => handleVerifyVendor(v.vendor_id, v.verification_status)}
                        className="btn-outline"
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                      >
                        Toggle Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: VENUES DIRECTORY */}
      {activeTab === 'venues' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#0f3d2e', margin: 0 }}>
                Venues & Facilities Directory
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#666', margin: '2px 0 0' }}>
                Local halls with structured parameters (ladies/gents partitions, parking, kitchen access)
              </p>
            </div>
            <button onClick={() => setShowVenueModal(true)} className="btn-gold" style={{ fontSize: '0.82rem' }}>
              <Plus size={15} /> Add New Venue
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Venue ID</th>
                  <th>Venue Name</th>
                  <th>City</th>
                  <th>Max Capacity</th>
                  <th>Facilities & Restrictions</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {venues.map(vn => (
                  <tr key={vn.venue_id}>
                    <td>VUE-{String(vn.venue_id).padStart(4, '0')}</td>
                    <td><strong>{vn.name}</strong></td>
                    <td>{vn.city}</td>
                    <td><strong>{vn.capacity} Guests</strong></td>
                    <td style={{ fontSize: '0.82rem', color: '#555' }}>{vn.facilities}</td>
                    <td>
                      <span className="badge badge-green">{vn.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: FINANCE & P&L */}
      {activeTab === 'finance' && (
        <div className="card-luxury">
          <h3 style={{ fontSize: '1.25rem', color: '#0f3d2e', marginBottom: 16 }}>
            Event-Wise Financial Contribution & P&L Ledger
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 20 }}>
            Formula: Customer Revenue − Vendor Cost − Direct Event Expenses = Gross Contribution
          </p>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Customer</th>
                  <th>Event Type</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Revenue (₹)</th>
                  <th style={{ textAlign: 'right' }}>Vendor Cost (₹)</th>
                  <th style={{ textAlign: 'right' }}>Gross Contribution (₹)</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => {
                  const rev = ev.quote_price || ev.budget || 0;
                  const cost = Math.round(rev * 0.78);
                  const margin = rev - cost;
                  return (
                    <tr key={ev.event_id}>
                      <td>MEZ-EVT-2026-{String(ev.event_id).padStart(4, '0')}</td>
                      <td><strong>{ev.customer_name}</strong></td>
                      <td>{ev.event_type}</td>
                      <td><span className="badge badge-green">{ev.status}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f3d2e' }}>
                        ₹{Number(rev).toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', color: '#991b1b' }}>
                        ₹{Number(cost).toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', color: '#0e633d', fontWeight: 800 }}>
                        ₹{Number(margin).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Venue */}
      {showVenueModal && (
        <div className="modal-overlay" onClick={() => setShowVenueModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', color: '#0f3d2e', marginBottom: 16 }}>
              Add New Venue to MEZBAAN Database
            </h3>
            <form onSubmit={handleCreateVenue}>
              <div className="form-group">
                <label className="form-label">Venue Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Al-Noor Banquet & Lawn"
                  value={newVenue.name}
                  onChange={e => setNewVenue({ ...newVenue, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <select
                    className="form-select"
                    value={newVenue.city}
                    onChange={e => setNewVenue({ ...newVenue, city: e.target.value })}
                  >
                    <option value="Beed">Beed</option>
                    <option value="Kaij">Kaij</option>
                    <option value="Ambajogai">Ambajogai</option>
                    <option value="Gevrai">Gevrai</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Max Guest Capacity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newVenue.capacity}
                    onChange={e => setNewVenue({ ...newVenue, capacity: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Near Stadium, Jalna Road"
                  value={newVenue.address}
                  onChange={e => setNewVenue({ ...newVenue, address: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Facilities & Rules (Ladies/Gents, Parking, Catering)</label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  value={newVenue.facilities}
                  onChange={e => setNewVenue({ ...newVenue, facilities: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 14 }}>
                <button type="button" onClick={() => setShowVenueModal(false)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn-gold">
                  Save Venue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
