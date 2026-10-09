const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'mezbaan.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    -- 1. Venues Table
    CREATE TABLE IF NOT EXISTS venues (
      venue_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      city TEXT,
      capacity INTEGER,
      facilities TEXT,
      status TEXT DEFAULT 'Active'
    );

    -- 2. Customers Table
    CREATE TABLE IF NOT EXISTS customers (
      customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Service Categories Table
    CREATE TABLE IF NOT EXISTS service_categories (
      category_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    -- 4. Services Table
    CREATE TABLE IF NOT EXISTS services (
      service_id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      FOREIGN KEY (category_id) REFERENCES service_categories(category_id) ON DELETE SET NULL
    );

    -- 5. Events Table
    CREATE TABLE IF NOT EXISTS events (
      event_id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      venue_id INTEGER,
      event_type TEXT NOT NULL,
      event_date DATE NOT NULL,
      location TEXT,
      guest_count INTEGER,
      budget DECIMAL(10,2),
      status TEXT DEFAULT 'Enquiry',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
      FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE SET NULL
    );

    -- 6. Event Requirements Table
    CREATE TABLE IF NOT EXISTS event_requirements (
      requirement_id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER,
      service_id INTEGER,
      details TEXT,
      quantity INTEGER DEFAULT 1,
      status TEXT DEFAULT 'Pending',
      FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
    );

    -- 7. Vendors Table
    CREATE TABLE IF NOT EXISTS vendors (
      vendor_id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT NOT NULL,
      email TEXT,
      city TEXT,
      verification_status TEXT DEFAULT 'Verified',
      rating DECIMAL(3,2) DEFAULT 4.5,
      status TEXT DEFAULT 'Active'
    );

    -- 8. Vendor Services Table
    CREATE TABLE IF NOT EXISTS vendor_services (
      vendor_service_id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id INTEGER,
      service_id INTEGER,
      base_price DECIMAL(10,2),
      capacity INTEGER,
      FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
    );

    -- 9. Quotes Table
    CREATE TABLE IF NOT EXISTS quotes (
      quote_id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER,
      total_cost DECIMAL(10,2) DEFAULT 0,
      mezbaan_margin DECIMAL(10,2) DEFAULT 0,
      total_price DECIMAL(10,2) DEFAULT 0,
      status TEXT DEFAULT 'Draft',
      valid_until DATE,
      FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
    );

    -- 10. Quote Items Table
    CREATE TABLE IF NOT EXISTS quote_items (
      quote_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER,
      vendor_id INTEGER,
      service_id INTEGER,
      vendor_cost DECIMAL(10,2) NOT NULL,
      customer_price DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (quote_id) REFERENCES quotes(quote_id) ON DELETE CASCADE,
      FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE SET NULL,
      FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE SET NULL
    );

    -- 11. Bookings Table
    CREATE TABLE IF NOT EXISTS bookings (
      booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER,
      vendor_id INTEGER,
      quote_id INTEGER,
      agreed_amount DECIMAL(10,2) NOT NULL,
      status TEXT DEFAULT 'Confirmed',
      booked_on DATE DEFAULT CURRENT_DATE,
      FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
      FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
      FOREIGN KEY (quote_id) REFERENCES quotes(quote_id) ON DELETE SET NULL
    );

    -- 12. Payments Table
    CREATE TABLE IF NOT EXISTS payments (
      payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER,
      booking_id INTEGER,
      amount DECIMAL(10,2) NOT NULL,
      payment_type TEXT NOT NULL,
      method TEXT DEFAULT 'UPI',
      paid_on DATE DEFAULT CURRENT_DATE,
      status TEXT DEFAULT 'Completed',
      FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
      FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL
    );

    -- 13. Expenses Table
    CREATE TABLE IF NOT EXISTS expenses (
      expense_id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER,
      vendor_id INTEGER,
      booking_id INTEGER,
      description TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      spent_on DATE DEFAULT CURRENT_DATE,
      FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
      FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE SET NULL,
      FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  const count = db.prepare('SELECT count(*) as count FROM venues').get().count;
  if (count > 0) {
    return; // Already seeded
  }

  const insertVenue = db.prepare(`
    INSERT INTO venues (name, address, city, capacity, facilities, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const venuesData = [
    ['Royal Palace Banquet & Lawns', 'Jalna Road, Near Stadium', 'Beed', 800, 'Separate Ladies/Gents AC Halls, Lawn, Outside Caterer Allowed, 150 Car Parking, Power Backup', 'Verified'],
    ['Shahi Lawn & Function Hall', 'Kaij Bypass Road', 'Kaij', 600, 'Covered Stage, Separate Dining Partition, In-house Kitchen, Generator, Valet', 'Verified'],
    ['Diamond Heritage Banquet', 'Amba Mata Temple Road', 'Ambajogai', 450, 'AC Auditorium, Bridal Suite, Stage Lighting, Audio Setup, Kitchen Facilities', 'Verified'],
    ['Madina Function Hall', 'Subhash Road, Old City', 'Beed', 350, 'Central Beed Location, Separate Dining Floor, Budget Friendly, Fans & Coolers', 'Verified'],
    ['Al-Haram Green Palace', 'National Highway 52', 'Gevrai', 1000, 'Grand 2-Acre Lawn, Dual Grand Entrance Gates, Huge Cooking Yard, 300 Parking', 'Verified']
  ];

  venuesData.forEach(v => insertVenue.run(...v));

  // 2. Customers
  const insertCustomer = db.prepare(`
    INSERT INTO customers (name, phone, email, address, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  const customersData = [
    ['Tariq Farooqui', '9822014589', 'tariq.farooqui@gmail.com', 'Shah Ganj, Beed', 'Active'],
    ['Adv. Mateen Qureshi', '9423157890', 'mateen.q@yahoo.com', 'Vidya Nagar, Kaij', 'Active'],
    ['Dr. Ayan Shaikh', '9765412380', 'dr.ayan@shaikhclinic.in', 'Civil Lines, Ambajogai', 'Active'],
    ['Imran Hashmi', '9890123456', 'imran.h@outlook.com', 'Shivaji Chowk, Gevrai', 'Active'],
    ['Zafar Patel', '9158742369', 'zafar.patel@rediffmail.com', 'Subhash Road, Beed', 'Active']
  ];

  customersData.forEach(c => insertCustomer.run(...c));

  // 3. Service Categories
  const insertCategory = db.prepare(`
    INSERT INTO service_categories (name)
    VALUES (?)
  `);

  const categories = [
    'Venue & Hospitality',
    'Catering & Dastarkhwan',
    'Decoration & Theme Setup',
    'Photography & Cinematic Media',
    'Sound, Lights & Entertainment',
    'Stage, Shamiana & Seating',
    'Invitations & Digital Media',
    'Bridal Styling & Cake'
  ];

  categories.forEach(cat => insertCategory.run(cat));

  // 4. Services
  const insertService = db.prepare(`
    INSERT INTO services (category_id, name, description)
    VALUES (?, ?, ?)
  `);

  const servicesData = [
    [1, 'Venue Booking & Coordination', 'Hall and lawn discovery, booking management, and facility liaison'],
    [2, 'Traditional Non-Veg Dastarkhwan', 'Authentic Beed dum biryani, mutton dalcha, naan, shahi tukda, salad with royal dastarkhwan service'],
    [2, 'Deluxe Pure Vegetarian Buffet', 'Paneer specialties, dal makhani, assorted breads, pulao, gulab jamun, chaat counter'],
    [3, 'Royal Wedding Stage & Floral Setup', 'Custom floral backdrop, grand sofa, ambient chandeliers, VIP stage layout'],
    [3, 'Theme & Balloon Kids Setup', 'Custom cartoon/superhero balloon arches, photo booth, backdrop banners'],
    [4, 'Cinematic Photography & 4K Videography', 'Traditional + Candid photography, 4K video, Drone aerial shots, Premium hardbound album'],
    [5, 'Pro Sound & Stage Lighting System', 'Dual wireless mics, line array speakers, LED pars, profile lights, follow spot'],
    [6, 'VIP Shamiana, Sofa & Seating Setup', 'Separate gents & ladies section seating, round tables with royal linens, high-back VIP chairs'],
    [7, 'Custom Invitation Cards & E-Invites', 'Designer Urdu/English/Marathi invitation cards, WhatsApp video invite, RSVP management'],
    [8, 'Bridal Makeup, Mehendi & Custom Cake', 'HD bridal makeover, intricate Arabic bridal mehendi, multi-tier designer celebration cake']
  ];

  servicesData.forEach(s => insertService.run(...s));

  // 5. Vendors
  const insertVendor = db.prepare(`
    INSERT INTO vendors (business_name, contact_person, phone, email, city, verification_status, rating, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const vendorsData = [
    ['Royal Beed Dastarkhwan & Caterers', 'Haji Irfan', '9822554411', 'irfan.caterers@gmail.com', 'Beed', 'Verified', 4.9, 'Active'],
    ['Noor Mandap & Floral Elegance', 'Noor Mohammad', '9422336677', 'noordecor.beed@gmail.com', 'Beed', 'Verified', 4.8, 'Active'],
    ['Al-Falah Cinematic Studio', 'Farhan Quadri', '9766889900', 'alfalahfilms@yahoo.com', 'Beed', 'Verified', 4.9, 'Active'],
    ['Marathwada Tent & Sound Hub', 'Balaji Jadhav', '9158223344', 'marathwadatents@kaij.in', 'Kaij', 'Verified', 4.7, 'Active'],
    ['Star Pro Light & Sound Systems', 'Samir Khan', '9890445566', 'starsound.beed@gmail.com', 'Beed', 'Verified', 4.7, 'Active'],
    ['Classic Offset & Digital Press', 'Mahesh Kulkarni', '9423778899', 'classicpress@ambajogai.in', 'Ambajogai', 'Verified', 4.8, 'Active'],
    ['Zoya Bridal Glamour & Mehendi', 'Zoya Begum', '9765001122', 'zoyabridal@gmail.com', 'Beed', 'Verified', 4.9, 'Active'],
    ['Sweet Treat Bakers & Confectionery', 'Faizan Patel', '9823112233', 'sweettreats@beed.in', 'Beed', 'Verified', 4.6, 'Active']
  ];

  vendorsData.forEach(v => insertVendor.run(...v));

  // 6. Vendor Services
  const insertVendorService = db.prepare(`
    INSERT INTO vendor_services (vendor_id, service_id, base_price, capacity)
    VALUES (?, ?, ?, ?)
  `);

  const vendorServicesData = [
    [1, 2, 380.00, 1500], // Royal Beed Dastarkhwan -> Non-veg per plate
    [1, 3, 290.00, 1000], // Royal Beed Dastarkhwan -> Veg per plate
    [2, 4, 35000.00, 3],  // Noor Mandap -> Stage & floral
    [2, 5, 12000.00, 5],  // Noor Mandap -> Kids balloon theme
    [3, 6, 45000.00, 2],  // Al-Falah -> 4K Video + Photo
    [4, 8, 22000.00, 4],  // Marathwada Tent -> Shamiana & Seating
    [5, 7, 15000.00, 4],  // Star Pro Sound -> Sound & Lighting
    [6, 9, 3500.00, 10],  // Classic Offset -> Invitations batch
    [7, 10, 18000.00, 3], // Zoya Bridal -> Makeup & Mehendi
    [8, 10, 4500.00, 5]   // Sweet Treat Bakers -> Custom Cake
  ];

  vendorServicesData.forEach(vs => insertVendorService.run(...vs));

  // 7. Events (Realistic Beed Examples from Brief)
  const insertEvent = db.prepare(`
    INSERT INTO events (customer_id, venue_id, event_type, event_date, location, guest_count, budget, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const eventsData = [
    // 300-person Walima in Beed
    [1, 1, 'Walima & Reception', '2026-11-15', 'Beed', 300, 260000.00, 'Confirmed'],
    // 500-person Community Gathering in Kaij
    [2, 2, 'Community & Milad Program', '2026-11-28', 'Kaij', 500, 200000.00, 'Quotation Sent'],
    // 50-person Birthday in Ambajogai
    [3, 3, 'Kids Birthday Celebration', '2026-12-05', 'Ambajogai', 50, 50000.00, 'Planning'],
    // Completed Wedding & Nikah in Gevrai
    [4, 5, 'Wedding & Nikah', '2026-10-02', 'Gevrai', 400, 350000.00, 'Completed']
  ];

  eventsData.forEach(e => insertEvent.run(...e));

  // 8. Event Requirements
  const insertReq = db.prepare(`
    INSERT INTO event_requirements (event_id, service_id, details, quantity, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  const requirementsData = [
    // For Event 1 (Walima 300 guests)
    [1, 2, 'Authentic Mutton Dum Biryani, Dalcha, Shahi Tukda with separate ladies and gents seating setup', 300, 'Fulfilled'],
    [1, 4, 'Royal Emerald Green & Gold floral stage backdrop with sofa set', 1, 'Fulfilled'],
    [1, 6, 'Full wedding coverage, candid photography + 4K videography + drone entrance', 1, 'Fulfilled'],
    [1, 7, 'Pro audio with 2 wireless mics for recitation and background ambiance', 1, 'Fulfilled'],
    [1, 8, 'VIP sofas for family and stage partition for ladies section', 1, 'Fulfilled'],

    // For Event 2 (Community 500 guests)
    [2, 3, 'Pure veg lunch buffet with sweet for 500 guests', 500, 'Quoted'],
    [2, 7, 'High power PA system with line array for speakers and audience', 1, 'Quoted'],
    [2, 8, '500 chairs and 20 shamiana canopies with stage', 500, 'Quoted'],

    // For Event 3 (Birthday 50 guests)
    [3, 5, 'Avengers superhero theme balloon backdrop with cake table', 1, 'Pending'],
    [3, 10, '3kg Chocolate truffle themed cake and photo booth', 1, 'Pending']
  ];

  requirementsData.forEach(r => insertReq.run(...r));

  // 9. Quotes
  const insertQuote = db.prepare(`
    INSERT INTO quotes (event_id, total_cost, mezbaan_margin, total_price, status, valid_until)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Event 1 quote: Vendor cost: 1,84,000, Mezbaan margin: 46,000, Total price: 2,30,000
  const q1 = insertQuote.run(1, 184000.00, 46000.00, 230000.00, 'Approved', '2026-11-01');
  const quote1Id = q1.lastInsertRowid;

  // Event 2 quote: Vendor cost: 1,42,000, Mezbaan margin: 28,000, Total price: 1,70,000
  const q2 = insertQuote.run(2, 142000.00, 28000.00, 170000.00, 'Sent', '2026-11-10');
  const quote2Id = q2.lastInsertRowid;

  // 10. Quote Items
  const insertQuoteItem = db.prepare(`
    INSERT INTO quote_items (quote_id, vendor_id, service_id, vendor_cost, customer_price)
    VALUES (?, ?, ?, ?, ?)
  `);

  const quoteItemsData = [
    // Quote 1 items
    [quote1Id, 1, 2, 114000.00, 142000.00], // Catering (380 cost -> ~473 customer price)
    [quote1Id, 2, 4, 30000.00, 38000.00],   // Noor Decor
    [quote1Id, 3, 6, 25000.00, 32000.00],   // Al-Falah Films
    [quote1Id, 5, 7, 7000.00, 9000.00],     // Star Pro Sound
    [quote1Id, 4, 8, 8000.00, 9000.00],     // Seating

    // Quote 2 items
    [quote2Id, 1, 3, 110000.00, 130000.00], // Veg catering
    [quote2Id, 5, 7, 14000.00, 18000.00],   // Sound line array
    [quote2Id, 4, 8, 18000.00, 22000.00]    // Shamiana & Seating
  ];

  quoteItemsData.forEach(qi => insertQuoteItem.run(...qi));

  // 11. Bookings (Confirmed vendors for Event 1)
  const insertBooking = db.prepare(`
    INSERT INTO bookings (event_id, vendor_id, quote_id, agreed_amount, status, booked_on)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const b1 = insertBooking.run(1, 1, quote1Id, 114000.00, 'Confirmed', '2026-10-05');
  const b2 = insertBooking.run(1, 2, quote1Id, 30000.00, 'Confirmed', '2026-10-05');
  const b3 = insertBooking.run(1, 3, quote1Id, 25000.00, 'Confirmed', '2026-10-05');

  // 12. Payments
  const insertPayment = db.prepare(`
    INSERT INTO payments (event_id, booking_id, amount, payment_type, method, paid_on, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Customer paid 50% advance for Event 1
  insertPayment.run(1, null, 115000.00, 'Customer Advance', 'UPI', '2026-10-05', 'Completed');

  // Mezbaan paid advance to Caterer
  insertPayment.run(1, b1.lastInsertRowid, 40000.00, 'Vendor Advance', 'Bank Transfer', '2026-10-06', 'Completed');

  // Mezbaan paid advance to Decorator
  insertPayment.run(1, b2.lastInsertRowid, 10000.00, 'Vendor Advance', 'UPI', '2026-10-06', 'Completed');

  // 13. Expenses
  const insertExpense = db.prepare(`
    INSERT INTO expenses (event_id, vendor_id, booking_id, description, amount, spent_on)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertExpense.run(1, null, null, 'Coordinator transportation and venue pre-inspection visit to Royal Palace', 1500.00, '2026-10-04');
  insertExpense.run(1, null, null, 'Printout of customized table menu cards & venue signage', 800.00, '2026-10-05');

  console.log('Mezbaan database initialized and successfully seeded with realistic Beed event records.');
}

module.exports = {
  db,
  initDatabase
};
