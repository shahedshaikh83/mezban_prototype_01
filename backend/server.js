const express = require('express');
const cors = require('cors');
const { db, initDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize SQLite database and tables
initDatabase();

// -------------------------------------------------------------
// 1. STATS / EXECUTIVE SUMMARY
// -------------------------------------------------------------
app.get('/api/stats', (req, res) => {
  try {
    const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
    const activeEvents = db.prepare("SELECT COUNT(*) as count FROM events WHERE status NOT IN ('Completed', 'Cancelled')").get().count;
    const completedEvents = db.prepare("SELECT COUNT(*) as count FROM events WHERE status = 'Completed'").get().count;
    const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
    const totalVendors = db.prepare('SELECT COUNT(*) as count FROM vendors').get().count;
    const verifiedVendors = db.prepare("SELECT COUNT(*) as count FROM vendors WHERE verification_status = 'Verified'").get().count;
    const totalVenues = db.prepare('SELECT COUNT(*) as count FROM venues').get().count;

    // Financial calculations
    const approvedQuotes = db.prepare(`
      SELECT 
        COALESCE(SUM(total_price), 0) as total_billed,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(SUM(mezbaan_margin), 0) as total_margin
      FROM quotes 
      WHERE status = 'Approved'
    `).get();

    const customerPayments = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_received
      FROM payments 
      WHERE payment_type LIKE 'Customer%' AND status = 'Completed'
    `).get().total_received;

    const vendorPayments = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_disbursed
      FROM payments 
      WHERE payment_type LIKE 'Vendor%' AND status = 'Completed'
    `).get().total_disbursed;

    const directExpenses = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_expenses
      FROM expenses
    `).get().total_expenses;

    const grossContribution = approvedQuotes.total_billed - approvedQuotes.total_cost - directExpenses;
    const marginPercent = approvedQuotes.total_billed > 0
      ? Math.round((grossContribution / approvedQuotes.total_billed) * 100)
      : 0;

    res.json({
      success: true,
      stats: {
        totalEvents,
        activeEvents,
        completedEvents,
        totalCustomers,
        totalVendors,
        verifiedVendors,
        totalVenues,
        financials: {
          totalBilled: approvedQuotes.total_billed,
          customerPaid: customerPayments,
          customerOutstanding: Math.max(0, approvedQuotes.total_billed - customerPayments),
          vendorAgreedCost: approvedQuotes.total_cost,
          vendorPaid: vendorPayments,
          vendorOutstanding: Math.max(0, approvedQuotes.total_cost - vendorPayments),
          directExpenses: directExpenses,
          grossContribution,
          marginPercent
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 2. EVENTS
// -------------------------------------------------------------
app.get('/api/events', (req, res) => {
  try {
    const { status, customer_id } = req.query;
    let query = `
      SELECT 
        e.*, 
        c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
        v.name as venue_name, v.city as venue_city, v.capacity as venue_capacity,
        (SELECT COUNT(*) FROM event_requirements er WHERE er.event_id = e.event_id) as requirements_count,
        (SELECT q.total_price FROM quotes q WHERE q.event_id = e.event_id ORDER BY q.quote_id DESC LIMIT 1) as quote_price,
        (SELECT q.status FROM quotes q WHERE q.event_id = e.event_id ORDER BY q.quote_id DESC LIMIT 1) as quote_status,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.event_id = e.event_id AND p.payment_type LIKE 'Customer%') as amount_paid
      FROM events e
      LEFT JOIN customers c ON e.customer_id = c.customer_id
      LEFT JOIN venues v ON e.venue_id = v.venue_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }
    if (customer_id) {
      query += ' AND e.customer_id = ?';
      params.push(customer_id);
    }

    query += ' ORDER BY e.event_date ASC';

    const events = db.prepare(query).all(...params);
    res.json({ success: true, events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/events/:id', (req, res) => {
  try {
    const event = db.prepare(`
      SELECT 
        e.*, 
        c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address,
        v.name as venue_name, v.address as venue_address, v.city as venue_city, v.capacity as venue_capacity, v.facilities as venue_facilities
      FROM events e
      LEFT JOIN customers c ON e.customer_id = c.customer_id
      LEFT JOIN venues v ON e.venue_id = v.venue_id
      WHERE e.event_id = ?
    `).get(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Requirements
    const requirements = db.prepare(`
      SELECT er.*, s.name as service_name, sc.name as category_name
      FROM event_requirements er
      LEFT JOIN services s ON er.service_id = s.service_id
      LEFT JOIN service_categories sc ON s.category_id = sc.category_id
      WHERE er.event_id = ?
    `).all(req.params.id);

    // Quotes
    const quotes = db.prepare(`
      SELECT * FROM quotes WHERE event_id = ? ORDER BY quote_id DESC
    `).all(req.params.id);

    // For each quote get items
    quotes.forEach(q => {
      q.items = db.prepare(`
        SELECT qi.*, s.name as service_name, v.business_name as vendor_name
        FROM quote_items qi
        LEFT JOIN services s ON qi.service_id = s.service_id
        LEFT JOIN vendors v ON qi.vendor_id = v.vendor_id
        WHERE qi.quote_id = ?
      `).all(q.quote_id);
    });

    // Bookings
    const bookings = db.prepare(`
      SELECT b.*, v.business_name as vendor_name, v.contact_person, v.phone as vendor_phone
      FROM bookings b
      LEFT JOIN vendors v ON b.vendor_id = v.vendor_id
      WHERE b.event_id = ?
    `).all(req.params.id);

    // Payments
    const payments = db.prepare(`
      SELECT * FROM payments WHERE event_id = ? ORDER BY paid_on DESC
    `).all(req.params.id);

    // Expenses
    const expenses = db.prepare(`
      SELECT * FROM expenses WHERE event_id = ? ORDER BY spent_on DESC
    `).all(req.params.id);

    res.json({
      success: true,
      event,
      requirements,
      quotes,
      bookings,
      payments,
      expenses
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/events', (req, res) => {
  try {
    const { customer_id, venue_id, event_type, event_date, location, guest_count, budget, status } = req.body;
    const stmt = db.prepare(`
      INSERT INTO events (customer_id, venue_id, event_type, event_date, location, guest_count, budget, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(customer_id, venue_id || null, event_type, event_date, location || 'Beed', guest_count || 100, budget || 0, status || 'Enquiry');
    res.json({ success: true, event_id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/events/:id', (req, res) => {
  try {
    const { venue_id, event_type, event_date, location, guest_count, budget, status } = req.body;
    const stmt = db.prepare(`
      UPDATE events 
      SET venue_id = ?, event_type = ?, event_date = ?, location = ?, guest_count = ?, budget = ?, status = ?
      WHERE event_id = ?
    `);
    stmt.run(venue_id || null, event_type, event_date, location, guest_count, budget, status, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/events/:id/requirements', (req, res) => {
  try {
    const { service_id, details, quantity, status } = req.body;
    const stmt = db.prepare(`
      INSERT INTO event_requirements (event_id, service_id, details, quantity, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(req.params.id, service_id, details, quantity || 1, status || 'Pending');
    res.json({ success: true, requirement_id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 3. PUBLIC ENQUIRY / LEAD GENERATOR
// -------------------------------------------------------------
app.post('/api/enquiries', (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      event_type,
      event_date,
      location,
      guest_count,
      budget,
      venue_id,
      selected_services, // array of service_ids
      special_requirements
    } = req.body;

    if (!name || !phone || !event_type || !event_date) {
      return res.status(400).json({ success: false, message: 'Name, phone, event type, and date are required' });
    }

    // 1. Find or create customer
    let customer = db.prepare('SELECT customer_id FROM customers WHERE phone = ?').get(phone);
    let customerId;
    if (customer) {
      customerId = customer.customer_id;
      db.prepare('UPDATE customers SET name = ?, email = COALESCE(?, email), address = COALESCE(?, address), updated_at = CURRENT_TIMESTAMP WHERE customer_id = ?')
        .run(name, email || null, address || null, customerId);
    } else {
      const custStmt = db.prepare(`
        INSERT INTO customers (name, phone, email, address, status)
        VALUES (?, ?, ?, ?, 'Active')
      `);
      const info = custStmt.run(name, phone, email || null, address || null);
      customerId = info.lastInsertRowid;
    }

    // 2. Create Event
    const eventStmt = db.prepare(`
      INSERT INTO events (customer_id, venue_id, event_type, event_date, location, guest_count, budget, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Enquiry')
    `);
    const eventInfo = eventStmt.run(
      customerId,
      venue_id || null,
      event_type,
      event_date,
      location || 'Beed',
      guest_count || 100,
      budget || 0
    );
    const eventId = eventInfo.lastInsertRowid;

    // 3. Insert requirements for selected services
    if (Array.isArray(selected_services) && selected_services.length > 0) {
      const reqStmt = db.prepare(`
        INSERT INTO event_requirements (event_id, service_id, details, quantity, status)
        VALUES (?, ?, ?, 1, 'Pending')
      `);
      for (const serviceId of selected_services) {
        reqStmt.run(eventId, serviceId, special_requirements || 'Initial requirement submitted via website');
      }
    } else if (special_requirements) {
      // Default to general coordination service if no specific selected
      const reqStmt = db.prepare(`
        INSERT INTO event_requirements (event_id, service_id, details, quantity, status)
        VALUES (?, 1, ?, 1, 'Pending')
      `);
      reqStmt.run(eventId, special_requirements);
    }

    res.json({
      success: true,
      event_id: eventId,
      event_code: `MEZ-EVT-2026-${String(eventId).padStart(4, '0')}`,
      message: 'Event enquiry registered successfully! Our event coordinator will contact you shortly.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 4. CUSTOMERS
// -------------------------------------------------------------
app.get('/api/customers', (req, res) => {
  try {
    const customers = db.prepare(`
      SELECT 
        c.*, 
        COUNT(e.event_id) as total_events
      FROM customers c
      LEFT JOIN events e ON c.customer_id = e.customer_id
      GROUP BY c.customer_id
      ORDER BY c.created_at DESC
    `).all();
    res.json({ success: true, customers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const { name, phone, email, address, status } = req.body;
    const stmt = db.prepare(`
      INSERT INTO customers (name, phone, email, address, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, phone, email || null, address || null, status || 'Active');
    res.json({ success: true, customer_id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 5. VENUES
// -------------------------------------------------------------
app.get('/api/venues', (req, res) => {
  try {
    const { city } = req.query;
    let query = 'SELECT * FROM venues WHERE 1=1';
    const params = [];
    if (city) {
      query += ' AND city = ?';
      params.push(city);
    }
    query += ' ORDER BY capacity DESC';
    const venues = db.prepare(query).all(...params);
    res.json({ success: true, venues });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/venues', (req, res) => {
  try {
    const { name, address, city, capacity, facilities, status } = req.body;
    const stmt = db.prepare(`
      INSERT INTO venues (name, address, city, capacity, facilities, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, address, city, capacity, facilities, status || 'Active');
    res.json({ success: true, venue_id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 6. VENDORS & VENDOR SERVICES
// -------------------------------------------------------------
app.get('/api/vendors', (req, res) => {
  try {
    const vendors = db.prepare('SELECT * FROM vendors ORDER BY rating DESC, business_name ASC').all();

    // Attach services for each vendor
    const getServices = db.prepare(`
      SELECT vs.*, s.name as service_name, sc.name as category_name
      FROM vendor_services vs
      JOIN services s ON vs.service_id = s.service_id
      JOIN service_categories sc ON s.category_id = sc.category_id
      WHERE vs.vendor_id = ?
    `);

    vendors.forEach(v => {
      v.services = getServices.all(v.vendor_id);
    });

    res.json({ success: true, vendors });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/vendors', (req, res) => {
  try {
    const { business_name, contact_person, phone, email, city, verification_status, rating, status, services } = req.body;
    const stmt = db.prepare(`
      INSERT INTO vendors (business_name, contact_person, phone, email, city, verification_status, rating, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      business_name,
      contact_person,
      phone,
      email || null,
      city || 'Beed',
      verification_status || 'Under Review',
      rating || 4.5,
      status || 'Active'
    );
    const vendorId = info.lastInsertRowid;

    if (Array.isArray(services) && services.length > 0) {
      const vsStmt = db.prepare(`
        INSERT INTO vendor_services (vendor_id, service_id, base_price, capacity)
        VALUES (?, ?, ?, ?)
      `);
      for (const s of services) {
        vsStmt.run(vendorId, s.service_id, s.base_price || 0, s.capacity || 1);
      }
    }

    res.json({ success: true, vendor_id: vendorId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/vendors/:id/verify', (req, res) => {
  try {
    const { verification_status, rating, status } = req.body;
    const stmt = db.prepare(`
      UPDATE vendors 
      SET verification_status = COALESCE(?, verification_status),
          rating = COALESCE(?, rating),
          status = COALESCE(?, status)
      WHERE vendor_id = ?
    `);
    stmt.run(verification_status, rating, status, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 7. SERVICES & CATEGORIES
// -------------------------------------------------------------
app.get('/api/services', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM service_categories ORDER BY category_id ASC').all();
    const services = db.prepare(`
      SELECT s.*, sc.name as category_name
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.category_id
      ORDER BY s.category_id ASC, s.name ASC
    `).all();

    res.json({ success: true, categories, services });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 8. QUOTES & QUOTE ITEMS (Costing, Margins, Approval)
// -------------------------------------------------------------
app.get('/api/quotes', (req, res) => {
  try {
    const quotes = db.prepare(`
      SELECT q.*, e.event_type, e.event_date, e.location, c.name as customer_name, c.phone as customer_phone
      FROM quotes q
      JOIN events e ON q.event_id = e.event_id
      JOIN customers c ON e.customer_id = c.customer_id
      ORDER BY q.quote_id DESC
    `).all();

    quotes.forEach(q => {
      q.items = db.prepare(`
        SELECT qi.*, s.name as service_name, v.business_name as vendor_name
        FROM quote_items qi
        LEFT JOIN services s ON qi.service_id = s.service_id
        LEFT JOIN vendors v ON qi.vendor_id = v.vendor_id
        WHERE qi.quote_id = ?
      `).all(q.quote_id);
    });

    res.json({ success: true, quotes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/quotes', (req, res) => {
  try {
    const { event_id, items, valid_until, status } = req.body;
    if (!event_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Event ID and items array are required' });
    }

    let totalCost = 0;
    let totalPrice = 0;

    items.forEach(it => {
      totalCost += parseFloat(it.vendor_cost || 0);
      totalPrice += parseFloat(it.customer_price || 0);
    });

    const mezbaanMargin = totalPrice - totalCost;

    const quoteStmt = db.prepare(`
      INSERT INTO quotes (event_id, total_cost, mezbaan_margin, total_price, status, valid_until)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const quoteInfo = quoteStmt.run(
      event_id,
      totalCost,
      mezbaanMargin,
      totalPrice,
      status || 'Sent',
      valid_until || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    );
    const quoteId = quoteInfo.lastInsertRowid;

    const itemStmt = db.prepare(`
      INSERT INTO quote_items (quote_id, vendor_id, service_id, vendor_cost, customer_price)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const it of items) {
      itemStmt.run(quoteId, it.vendor_id || null, it.service_id, it.vendor_cost, it.customer_price);
    }

    // Update event status to 'Quotation Sent' if currently 'Enquiry' or 'Planning'
    db.prepare("UPDATE events SET status = 'Quotation Sent' WHERE event_id = ? AND status IN ('Enquiry', 'Planning')").run(event_id);

    res.json({ success: true, quote_id: quoteId, total_cost: totalCost, mezbaan_margin: mezbaanMargin, total_price: totalPrice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/quotes/:id/status', (req, res) => {
  try {
    const { status } = req.body; // 'Approved', 'Rejected', 'Revised'
    const quote = db.prepare('SELECT * FROM quotes WHERE quote_id = ?').get(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }

    db.prepare('UPDATE quotes SET status = ? WHERE quote_id = ?').run(status, req.params.id);

    // If Approved, update event status to 'Confirmed' and auto-create Bookings for each vendor item!
    if (status === 'Approved') {
      db.prepare("UPDATE events SET status = 'Confirmed' WHERE event_id = ?").run(quote.event_id);

      const items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ? AND vendor_id IS NOT NULL').all(quote.quote_id);
      const bookingStmt = db.prepare(`
        INSERT INTO bookings (event_id, vendor_id, quote_id, agreed_amount, status, booked_on)
        VALUES (?, ?, ?, ?, 'Confirmed', CURRENT_DATE)
      `);

      for (const it of items) {
        // Check if booking already exists for this event and vendor
        const existing = db.prepare('SELECT booking_id FROM bookings WHERE event_id = ? AND vendor_id = ?').get(quote.event_id, it.vendor_id);
        if (!existing) {
          bookingStmt.run(quote.event_id, it.vendor_id, quote.quote_id, it.vendor_cost);
        }
      }
    }

    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 9. BOOKINGS
// -------------------------------------------------------------
app.get('/api/bookings', (req, res) => {
  try {
    const { vendor_id, event_id } = req.query;
    let query = `
      SELECT 
        b.*, 
        e.event_type, e.event_date, e.location as event_location, e.status as event_status,
        c.name as customer_name,
        v.business_name as vendor_name, v.contact_person, v.phone as vendor_phone
      FROM bookings b
      JOIN events e ON b.event_id = e.event_id
      JOIN customers c ON e.customer_id = c.customer_id
      JOIN vendors v ON b.vendor_id = v.vendor_id
      WHERE 1=1
    `;
    const params = [];
    if (vendor_id) {
      query += ' AND b.vendor_id = ?';
      params.push(vendor_id);
    }
    if (event_id) {
      query += ' AND b.event_id = ?';
      params.push(event_id);
    }
    query += ' ORDER BY b.booking_id DESC';

    const bookings = db.prepare(query).all(...params);
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/bookings', (req, res) => {
  try {
    const { event_id, vendor_id, quote_id, agreed_amount, status } = req.body;
    const stmt = db.prepare(`
      INSERT INTO bookings (event_id, vendor_id, quote_id, agreed_amount, status, booked_on)
      VALUES (?, ?, ?, ?, ?, CURRENT_DATE)
    `);
    const info = stmt.run(event_id, vendor_id, quote_id || null, agreed_amount, status || 'Confirmed');
    res.json({ success: true, booking_id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 10. PAYMENTS (Customer & Vendor)
// -------------------------------------------------------------
app.get('/api/payments', (req, res) => {
  try {
    const payments = db.prepare(`
      SELECT 
        p.*, 
        e.event_type, e.event_date,
        c.name as customer_name,
        v.business_name as vendor_name
      FROM payments p
      JOIN events e ON p.event_id = e.event_id
      JOIN customers c ON e.customer_id = c.customer_id
      LEFT JOIN bookings b ON p.booking_id = b.booking_id
      LEFT JOIN vendors v ON b.vendor_id = v.vendor_id
      ORDER BY p.payment_id DESC
    `).all();
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/payments', (req, res) => {
  try {
    const { event_id, booking_id, amount, payment_type, method, paid_on, status } = req.body;
    const stmt = db.prepare(`
      INSERT INTO payments (event_id, booking_id, amount, payment_type, method, paid_on, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      event_id,
      booking_id || null,
      amount,
      payment_type, // 'Customer Advance', 'Customer Final', 'Vendor Advance', 'Vendor Balance'
      method || 'UPI',
      paid_on || new Date().toISOString().split('T')[0],
      status || 'Completed'
    );
    res.json({ success: true, payment_id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 11. EXPENSES (Direct Event Expenses)
// -------------------------------------------------------------
app.get('/api/expenses', (req, res) => {
  try {
    const expenses = db.prepare(`
      SELECT 
        ex.*, 
        e.event_type, e.event_date,
        v.business_name as vendor_name
      FROM expenses ex
      JOIN events e ON ex.event_id = e.event_id
      LEFT JOIN vendors v ON ex.vendor_id = v.vendor_id
      ORDER BY ex.expense_id DESC
    `).all();
    res.json({ success: true, expenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/expenses', (req, res) => {
  try {
    const { event_id, vendor_id, booking_id, description, amount, spent_on } = req.body;
    const stmt = db.prepare(`
      INSERT INTO expenses (event_id, vendor_id, booking_id, description, amount, spent_on)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      event_id,
      vendor_id || null,
      booking_id || null,
      description,
      amount,
      spent_on || new Date().toISOString().split('T')[0]
    );
    res.json({ success: true, expense_id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 12. CUSTOMER REQUIREMENT SHEETS & AUTOMATED QUOTATION ENGINE
// -------------------------------------------------------------

// Calculate smart quotation from form requirements using database vendors & pricing
app.post('/api/quotations/calculate', (req, res) => {
  try {
    const data = req.body;
    const guestCount = parseInt(data.approxGuestCount || data.guestCount || 300, 10);
    const eventType = data.eventType || 'Wedding / Event';
    const items = [];

    // 1. Catering Calculation
    const cateringNeeded = data.cateringRequired === 'Yes' || data.cateringRequired === 'Need Mezban to arrange' || !data.cateringRequired;
    if (cateringNeeded && data.cateringRequired !== 'No') {
      const foodPref = data.foodPreference || 'Both Veg & Non-Veg';
      const foodBudgetPerPerson = parseFloat(data.approxFoodBudget) || (foodPref === 'Veg' ? 290 : 380);

      // Find caterer from DB
      const caterer = db.prepare(`
        SELECT v.vendor_id, v.business_name, vs.service_id, s.name as service_name, vs.base_price
        FROM vendors v
        JOIN vendor_services vs ON v.vendor_id = vs.vendor_id
        JOIN services s ON vs.service_id = s.service_id
        WHERE s.category_id = 2
        LIMIT 1
      `).get();

      const unitVendorCost = caterer?.base_price ? parseFloat(caterer.base_price) : (foodBudgetPerPerson * 0.82);
      const totalVendorCost = Math.round(unitVendorCost * guestCount);
      const marginPct = 20;
      const totalCustomerPrice = Math.round(totalVendorCost * (1 + marginPct / 100));

      const meals = Array.isArray(data.meals) && data.meals.length > 0 ? data.meals.join(', ') : 'Dinner';
      const cuisines = Array.isArray(data.cuisines) && data.cuisines.length > 0 ? data.cuisines.join(', ') : 'Authentic Beed Mughlai / Dum Biryani';

      items.push({
        service_id: caterer?.service_id || 2,
        service_name: `Catering (${foodPref}) - ${meals}`,
        category: 'Catering & Dastarkhwan',
        vendor_id: caterer?.vendor_id || 1,
        vendor_name: caterer?.business_name || 'Royal Beed Dastarkhwan & Caterers',
        vendor_cost: totalVendorCost,
        margin_pct: marginPct,
        customer_price: totalCustomerPrice,
        details: `${guestCount} Guests @ ₹${Math.round(totalCustomerPrice / guestCount)}/person (${cuisines})`
      });
    }

    // 2. Venue Booking / Liaison
    const needVenue = data.venueSelected === 'No' || data.venueSelected === 'Need Mezban to find venue' || data.venueSelected === 'Shortlisted';
    if (needVenue || data.venueName) {
      const preferredVenue = db.prepare('SELECT * FROM venues WHERE city = ? OR city = ? LIMIT 1').get(data.venueArea || 'Beed', 'Beed');
      const venueCost = parseFloat(data.maxVenueBudget) ? Math.round(parseFloat(data.maxVenueBudget) * 0.85) : 50000;
      const venuePrice = parseFloat(data.maxVenueBudget) || 60000;
      const venueMargin = Math.round(((venuePrice - venueCost) / venueCost) * 100);

      items.push({
        service_id: 1,
        service_name: data.venueName ? `Venue Liaison: ${data.venueName}` : 'Prime Banquet Hall & Lawn Booking',
        category: 'Venue & Hospitality',
        vendor_id: null,
        vendor_name: preferredVenue ? preferredVenue.name : 'Mezban Verified Venue Partner',
        vendor_cost: venueCost,
        margin_pct: venueMargin > 0 ? venueMargin : 15,
        customer_price: venuePrice,
        details: `AC hall, separate gents/ladies partition, generator backup in ${data.venueArea || 'Beed'}`
      });
    }

    // 3. Decoration Requirement
    if (data.decorationRequired !== 'No') {
      const decorVendor = db.prepare(`
        SELECT v.vendor_id, v.business_name, vs.service_id, s.name as service_name, vs.base_price
        FROM vendors v
        JOIN vendor_services vs ON v.vendor_id = vs.vendor_id
        JOIN services s ON vs.service_id = s.service_id
        WHERE s.category_id = 3
        LIMIT 1
      `).get();

      const decorType = data.decorationType || 'Standard';
      let baseDecorCost = 25000;
      if (['Premium', 'Luxury', 'Royal'].includes(decorType)) baseDecorCost = 45000;
      else if (['Islamic Theme', 'Modern', 'Floral'].includes(decorType)) baseDecorCost = 35000;
      else if (['Simple', 'Basic', 'Minimal'].includes(decorType)) baseDecorCost = 16000;

      const areas = Array.isArray(data.decorationAreas) && data.decorationAreas.length > 0 
        ? data.decorationAreas.slice(0, 4).join(', ') 
        : 'Main Stage, Entrance Gate, Floral Backdrop';

      const decorMargin = 22;
      items.push({
        service_id: decorVendor?.service_id || 4,
        service_name: `Theme Decoration (${decorType})`,
        category: 'Decoration & Theme Setup',
        vendor_id: decorVendor?.vendor_id || 2,
        vendor_name: decorVendor?.business_name || 'Noor Mandap & Floral Elegance',
        vendor_cost: baseDecorCost,
        margin_pct: decorMargin,
        customer_price: Math.round(baseDecorCost * (1 + decorMargin / 100)),
        details: `${decorType} styling: ${areas}. Colors: ${data.preferredColors || 'Royal Gold & White'}`
      });
    }

    // 4. Photography & Videography
    const photoServices = Array.isArray(data.photoServices) ? data.photoServices : [];
    if (photoServices.length > 0 || data.photographyRequired) {
      const photoVendor = db.prepare(`
        SELECT v.vendor_id, v.business_name, vs.service_id, s.name as service_name, vs.base_price
        FROM vendors v
        JOIN vendor_services vs ON v.vendor_id = vs.vendor_id
        JOIN services s ON vs.service_id = s.service_id
        WHERE s.category_id = 4
        LIMIT 1
      `).get();

      let photoCost = parseFloat(data.approxPhotoBudget) ? Math.round(parseFloat(data.approxPhotoBudget) * 0.80) : 38000;
      if (photoServices.includes('Cinematic Video') || photoServices.includes('Drone')) {
        photoCost = Math.max(photoCost, 45000);
      }
      const photoMargin = 20;
      const photoPrice = Math.round(photoCost * (1 + photoMargin / 100));

      items.push({
        service_id: photoVendor?.service_id || 6,
        service_name: 'Cinematic Photography, 4K Video & Drone',
        category: 'Photography & Cinematic Media',
        vendor_id: photoVendor?.vendor_id || 3,
        vendor_name: photoVendor?.business_name || 'Al-Falah Cinematic Studio',
        vendor_cost: photoCost,
        margin_pct: photoMargin,
        customer_price: photoPrice,
        details: photoServices.join(', ') || 'Traditional + Candid photography, 4K cinematic film & photo album'
      });
    }

    // 5. Sound, DJ, Lights & Entertainment
    const soundItems = Array.isArray(data.soundEntertainment) ? data.soundEntertainment : [];
    if (soundItems.length > 0) {
      const soundVendor = db.prepare(`
        SELECT v.vendor_id, v.business_name, vs.service_id, s.name as service_name, vs.base_price
        FROM vendors v
        JOIN vendor_services vs ON v.vendor_id = vs.vendor_id
        JOIN services s ON vs.service_id = s.service_id
        WHERE s.category_id = 5
        LIMIT 1
      `).get();

      const soundCost = soundItems.includes('LED Wall') ? 22000 : 14000;
      const soundMargin = 25;
      items.push({
        service_id: soundVendor?.service_id || 7,
        service_name: 'Pro Sound, Stage Lighting & Audio Setup',
        category: 'Sound, Lights & Entertainment',
        vendor_id: soundVendor?.vendor_id || 5,
        vendor_name: soundVendor?.business_name || 'Star Pro Light & Sound Systems',
        vendor_cost: soundCost,
        margin_pct: soundMargin,
        customer_price: Math.round(soundCost * (1 + soundMargin / 100)),
        details: soundItems.join(', ') || 'Line array sound, wireless handheld mics & ambient focus lights'
      });
    }

    // 6. Stage, Seating & Shamiana
    const seatingItems = Array.isArray(data.stageSeating) ? data.stageSeating : [];
    if (seatingItems.length > 0) {
      const tentVendor = db.prepare(`
        SELECT v.vendor_id, v.business_name, vs.service_id, s.name as service_name, vs.base_price
        FROM vendors v
        JOIN vendor_services vs ON v.vendor_id = vs.vendor_id
        JOIN services s ON vs.service_id = s.service_id
        WHERE s.category_id = 6
        LIMIT 1
      `).get();

      const tentCost = 20000;
      const tentMargin = 20;
      items.push({
        service_id: tentVendor?.service_id || 8,
        service_name: 'VIP Seating, Sofas, Shamiana & Carpet Setup',
        category: 'Stage, Shamiana & Seating',
        vendor_id: tentVendor?.vendor_id || 4,
        vendor_name: tentVendor?.business_name || 'Marathwada Tent & Sound Hub',
        vendor_cost: tentCost,
        margin_pct: tentMargin,
        customer_price: Math.round(tentCost * (1 + tentMargin / 100)),
        details: seatingItems.join(', ') || 'VIP Sofas, royal banquet chairs, tables, and partition shamiana'
      });
    }

    // 7. Invitations & Digital Media
    const invitationItems = Array.isArray(data.invitationPrinting) ? data.invitationPrinting : [];
    if (invitationItems.length > 0) {
      const printVendor = db.prepare(`
        SELECT v.vendor_id, v.business_name, vs.service_id, s.name as service_name, vs.base_price
        FROM vendors v
        JOIN vendor_services vs ON v.vendor_id = vs.vendor_id
        JOIN services s ON vs.service_id = s.service_id
        WHERE s.category_id = 7
        LIMIT 1
      `).get();

      const printCost = 3500;
      const printMargin = 25;
      items.push({
        service_id: printVendor?.service_id || 9,
        service_name: 'Designer Invitation Cards & Digital E-Invite',
        category: 'Invitations & Digital Media',
        vendor_id: printVendor?.vendor_id || 6,
        vendor_name: printVendor?.business_name || 'Classic Offset & Digital Press',
        vendor_cost: printCost,
        margin_pct: printMargin,
        customer_price: Math.round(printCost * (1 + printMargin / 100)),
        details: invitationItems.join(', ') || 'Custom Urdu/English print invites and WhatsApp video card'
      });
    }

    // 8. Bridal & Personal Services
    const bridalItems = Array.isArray(data.bridalServices) ? data.bridalServices : [];
    if (bridalItems.length > 0) {
      const bridalVendor = db.prepare(`
        SELECT v.vendor_id, v.business_name, vs.service_id, s.name as service_name, vs.base_price
        FROM vendors v
        JOIN vendor_services vs ON v.vendor_id = vs.vendor_id
        JOIN services s ON vs.service_id = s.service_id
        WHERE s.category_id = 8
        LIMIT 1
      `).get();

      const bridalCost = 18000;
      const bridalMargin = 20;
      items.push({
        service_id: bridalVendor?.service_id || 10,
        service_name: 'Bridal Makeover, Hair & Mehendi Artistry',
        category: 'Bridal Styling & Cake',
        vendor_id: bridalVendor?.vendor_id || 7,
        vendor_name: bridalVendor?.business_name || 'Zoya Bridal Glamour & Mehendi',
        vendor_cost: bridalCost,
        margin_pct: bridalMargin,
        customer_price: Math.round(bridalCost * (1 + bridalMargin / 100)),
        details: bridalItems.join(', ') || 'HD bridal makeup, hair styling, intricate bridal mehendi'
      });
    }

    // 9. Guest Hospitality & Management
    const hospitalityItems = Array.isArray(data.guestHospitality) ? data.guestHospitality : [];
    if (hospitalityItems.length > 0) {
      items.push({
        service_id: 1,
        service_name: 'Event Hospitality & Guest Welcome Desk',
        category: 'Venue & Hospitality',
        vendor_id: null,
        vendor_name: 'Mezban In-House Hospitality Staff',
        vendor_cost: 8000,
        margin_pct: 25,
        customer_price: 10000,
        details: hospitalityItems.join(', ') || 'Welcome desk, gent/ladies usher coordination & assistance'
      });
    }

    // 10. Mezban Complete Coordination & Quality Assurance Fee
    const mezbanCoordCost = 12000;
    const mezbanCoordPrice = 25000;
    items.push({
      service_id: 1,
      service_name: 'Mezban On-Ground Event Management & Supervision',
      category: 'Venue & Hospitality',
      vendor_id: null,
      vendor_name: 'Mezban Operations Team (Beed)',
      vendor_cost: mezbanCoordCost,
      margin_pct: Math.round(((mezbanCoordPrice - mezbanCoordCost) / mezbanCoordCost) * 100),
      customer_price: mezbanCoordPrice,
      details: 'Full day supervisor, vendor liaison, timeline enforcement & stress-free delivery'
    });

    // Summary calculations
    let totalCost = 0;
    let totalPrice = 0;
    items.forEach(it => {
      totalCost += parseFloat(it.vendor_cost || 0);
      totalPrice += parseFloat(it.customer_price || 0);
    });

    const mezbaanMargin = totalPrice - totalCost;
    const advanceRequired = Math.round(totalPrice * 0.30); // 30% advance standard

    res.json({
      success: true,
      items,
      summary: {
        totalCost,
        totalPrice,
        mezbaanMargin,
        advanceRequired,
        marginPct: Math.round((mezbaanMargin / totalPrice) * 100)
      }
    });
  } catch (err) {
    console.error('Error calculating quote:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save or submit requirement sheet
app.post('/api/requirement-sheets', (req, res) => {
  try {
    const { formData, quoteItems, quoteSummary } = req.body;
    if (!formData) {
      return res.status(400).json({ success: false, message: 'Form data is required' });
    }

    const customerName = formData.customerName || formData.contactPerson || 'Customer Lead';
    const mobile = formData.mobile || formData.whatsapp || '9999999999';
    const email = formData.email || `${mobile}@mezban.in`;
    const eventType = formData.eventType || 'Event';
    const eventDate = formData.eventDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const guestCount = parseInt(formData.approxGuestCount || formData.guestCount || 300, 10);
    const leadStatus = formData.leadStatus || 'Level 1 – Potential';

    // 1. Ensure customer exists or create
    let customer = db.prepare('SELECT customer_id FROM customers WHERE phone = ?').get(mobile);
    let customerId;
    if (customer) {
      customerId = customer.customer_id;
      db.prepare('UPDATE customers SET name = ?, email = ? WHERE customer_id = ?').run(customerName, email, customerId);
    } else {
      const cInfo = db.prepare(`
        INSERT INTO customers (name, phone, email, address, status)
        VALUES (?, ?, ?, ?, 'Active')
      `).run(customerName, mobile, email, formData.venueArea || 'Beed');
      customerId = cInfo.lastInsertRowid;
    }

    // 2. Ensure event exists or create
    const budget = quoteSummary?.totalPrice || parseFloat(formData.approxBudget) || 200000;
    const eInfo = db.prepare(`
      INSERT INTO events (customer_id, event_type, event_date, location, guest_count, budget, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Quotation Sent')
    `).run(customerId, eventType, eventDate, formData.venueArea || 'Beed', guestCount, budget);
    const eventId = eInfo.lastInsertRowid;

    // 3. Create Quote and Quote Items if quoteItems provided
    let quoteId = null;
    if (Array.isArray(quoteItems) && quoteItems.length > 0) {
      let totalCost = 0;
      let totalPrice = 0;
      quoteItems.forEach(it => {
        totalCost += parseFloat(it.vendor_cost || 0);
        totalPrice += parseFloat(it.customer_price || 0);
      });
      const mezbaanMargin = totalPrice - totalCost;

      const qInfo = db.prepare(`
        INSERT INTO quotes (event_id, total_cost, mezbaan_margin, total_price, status, valid_until)
        VALUES (?, ?, ?, ?, 'Draft', ?)
      `).run(
        eventId,
        totalCost,
        mezbaanMargin,
        totalPrice,
        new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
      );
      quoteId = qInfo.lastInsertRowid;

      const itemStmt = db.prepare(`
        INSERT INTO quote_items (quote_id, vendor_id, service_id, vendor_cost, customer_price)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const it of quoteItems) {
        itemStmt.run(quoteId, it.vendor_id || null, it.service_id || null, it.vendor_cost, it.customer_price);
      }
    }

    // 4. Save to requirement_sheets table
    const sheetInfo = db.prepare(`
      INSERT INTO requirement_sheets (
        event_id, customer_id, customer_name, contact_person, mobile, whatsapp, email,
        event_type, event_date, guest_count, form_data, lead_status, quotation_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      eventId,
      customerId,
      customerName,
      formData.contactPerson || customerName,
      mobile,
      formData.whatsapp || mobile,
      email,
      eventType,
      eventDate,
      guestCount,
      JSON.stringify(formData),
      leadStatus,
      quoteId
    );

    res.json({
      success: true,
      sheet_id: sheetInfo.lastInsertRowid,
      event_id: eventId,
      customer_id: customerId,
      quote_id: quoteId,
      message: 'Customer requirement and quotation registered successfully'
    });
  } catch (err) {
    console.error('Error saving requirement sheet:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// List all requirement sheets
app.get('/api/requirement-sheets', (req, res) => {
  try {
    const sheets = db.prepare(`
      SELECT rs.*, q.total_price, q.total_cost, q.mezbaan_margin, q.status as quote_status
      FROM requirement_sheets rs
      LEFT JOIN quotes q ON rs.quotation_id = q.quote_id
      ORDER BY rs.sheet_id DESC
    `).all();

    res.json({ success: true, sheets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Single requirement sheet details
app.get('/api/requirement-sheets/:id', (req, res) => {
  try {
    const sheet = db.prepare('SELECT * FROM requirement_sheets WHERE sheet_id = ?').get(req.params.id);
    if (!sheet) {
      return res.status(404).json({ success: false, message: 'Requirement sheet not found' });
    }

    let quote = null;
    let quoteItems = [];
    if (sheet.quotation_id) {
      quote = db.prepare('SELECT * FROM quotes WHERE quote_id = ?').get(sheet.quotation_id);
      quoteItems = db.prepare(`
        SELECT qi.*, s.name as service_name, v.business_name as vendor_name
        FROM quote_items qi
        LEFT JOIN services s ON qi.service_id = s.service_id
        LEFT JOIN vendors v ON qi.vendor_id = v.vendor_id
        WHERE qi.quote_id = ?
      `).all(sheet.quotation_id);
    }

    res.json({
      success: true,
      sheet: {
        ...sheet,
        form_data: typeof sheet.form_data === 'string' ? JSON.parse(sheet.form_data) : sheet.form_data
      },
      quote,
      quoteItems
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send quotation via WhatsApp / Email / SMS
app.post('/api/quotations/send', (req, res) => {
  try {
    const { quote_id, sheet_id, customer_name, mobile, email, event_type, event_date, guest_count, items, total_price, advance_required } = req.body;

    // Update quote status in DB if exists
    if (quote_id) {
      db.prepare("UPDATE quotes SET status = 'Sent' WHERE quote_id = ?").run(quote_id);
    }

    // Format WhatsApp & SMS plain text message
    let itemsText = '';
    if (Array.isArray(items)) {
      itemsText = items.map((it, idx) => `${idx + 1}. ${it.service_name}: ₹${Number(it.customer_price).toLocaleString('en-IN')}`).join('\n');
    }

    const cleanMobile = (mobile || '').replace(/\D/g, '');
    const mobileWithCountry = cleanMobile.startsWith('91') ? cleanMobile : `91${cleanMobile}`;

    const whatsappMessage = 
`👑 *MEZBAAN EVENTS & CELEBRATIONS*
*Official Quotation & Event Estimate*
----------------------------------------
*Client:* ${customer_name || 'Valued Client'}
*Event:* ${event_type || 'Event'}
*Date:* ${event_date || 'Upcoming'}
*Guests:* ${guest_count || 300}
----------------------------------------
*ESTIMATED SERVICES:*
${itemsText}
----------------------------------------
*TOTAL ESTIMATED QUOTE:* ₹${Number(total_price || 0).toLocaleString('en-IN')}
*Advance Required (30%):* ₹${Number(advance_required || Math.round((total_price || 0) * 0.3)).toLocaleString('en-IN')}

✓ Transparent Pricing • Zero Hidden Charges
✓ 100% Verified Quality Vendors & Supervised Execution
----------------------------------------
To confirm this booking, reply to this message or call Mezban Support: +91 98220 14589`;

    const whatsappUrl = `https://wa.me/${mobileWithCountry}?text=${encodeURIComponent(whatsappMessage)}`;
    const emailSubject = `MEZBAAN Event Quotation - ${event_type} for ${customer_name}`;
    const emailMailto = `mailto:${email || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(whatsappMessage)}`;

    res.json({
      success: true,
      message: `Quotation prepared for ${customer_name}. Ready to dispatch to Mobile: ${mobile} & Email: ${email}`,
      dispatches: {
        whatsapp_url: whatsappUrl,
        email_mailto: emailMailto,
        whatsapp_message: whatsappMessage,
        recipient_mobile: mobile,
        recipient_email: email,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Error sending quotation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 13. DATABASE EXPLORER & ER DIAGRAM INSPECTOR
// -------------------------------------------------------------
app.get('/api/database/overview', (req, res) => {
  try {
    const tables = [
      'venues',
      'customers',
      'service_categories',
      'services',
      'events',
      'event_requirements',
      'requirement_sheets',
      'vendors',
      'vendor_services',
      'quotes',
      'quote_items',
      'bookings',
      'payments',
      'expenses'
    ];

    const result = tables.map(table => {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
      const columns = db.prepare(`PRAGMA table_info(${table})`).all();
      return {
        table,
        count,
        columns: columns.map(c => ({
          name: c.name,
          type: c.type,
          pk: c.pk === 1,
          notnull: c.notnull === 1
        }))
      };
    });

    res.json({ success: true, tables: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/database/table/:name', (req, res) => {
  try {
    const tableName = req.params.name;
    const allowed = [
      'venues', 'customers', 'service_categories', 'services',
      'events', 'event_requirements', 'vendors', 'vendor_services',
      'quotes', 'quote_items', 'bookings', 'payments', 'expenses'
    ];
    if (!allowed.includes(tableName)) {
      return res.status(400).json({ success: false, message: 'Invalid table name' });
    }

    const rows = db.prepare(`SELECT * FROM ${tableName} LIMIT 100`).all();
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();

    res.json({
      success: true,
      tableName,
      columns,
      rows
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'MEZBAAN Events Technology Platform',
    version: '1.0.0',
    market: 'Beed, Kaij, Ambajogai, Gevrai, Maharashtra'
  });
});

// Serve frontend build if availablez
const path = require('path');
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));

app.get('/{*splat}', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }

  const indexPath = path.join(distPath, 'index.html');

  res.sendFile(indexPath, err => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`MEZBAAN Unified Server running on http://localhost:${PORT}`);
});

