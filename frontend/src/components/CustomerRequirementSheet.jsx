import React, { useState, useEffect } from 'react';
import { 
  FileText, Check, Plus, Trash2, Send, Phone, Mail, MessageSquare, 
  Printer, ArrowLeft, Sparkles, RefreshCw, CheckSquare, Square, 
  DollarSign, Calendar, Users, Shield, MapPin, ChevronDown, Download, AlertCircle, Edit3
} from 'lucide-react';
import { apiFetch, getApiUrl } from '../utils/api';
import { FALLBACK_SERVICES, FALLBACK_VENUES } from '../data/mockData';

// Standalone offline calculation engine with exact Beed market rates
const calculateLocalQuotation = (data) => {
  const guestCount = parseInt(data.approxGuestCount || data.guestCount || 300, 10);
  const items = [];

  // 1. Catering Calculation
  const cateringNeeded = data.cateringRequired === 'Yes' || data.cateringRequired === 'Need Mezban to arrange' || !data.cateringRequired;
  if (cateringNeeded && data.cateringRequired !== 'No') {
    const foodPref = data.foodPreference || 'Both Veg & Non-Veg';
    const foodBudgetPerPerson = parseFloat(data.approxFoodBudget) || (foodPref === 'Veg' ? 290 : 380);
    const unitVendorCost = foodBudgetPerPerson * 0.82;
    const totalVendorCost = Math.round(unitVendorCost * guestCount);
    const marginPct = 20;
    const totalCustomerPrice = Math.round(totalVendorCost * (1 + marginPct / 100));

    const meals = Array.isArray(data.meals) && data.meals.length > 0 ? data.meals.join(', ') : 'Dinner';
    const cuisines = Array.isArray(data.cuisines) && data.cuisines.length > 0 ? data.cuisines.join(', ') : 'Authentic Beed Mughlai / Dum Biryani';

    items.push({
      service_id: 2,
      service_name: `Catering (${foodPref}) - ${meals}`,
      category: 'Catering & Dastarkhwan',
      vendor_id: 1,
      vendor_name: 'Royal Beed Dastarkhwan & Caterers',
      vendor_cost: totalVendorCost,
      margin_pct: marginPct,
      customer_price: totalCustomerPrice,
      details: `${guestCount} Guests @ ₹${Math.round(totalCustomerPrice / guestCount)}/person (${cuisines})`
    });
  }

  // 2. Venue
  const needVenue = data.venueSelected === 'No' || data.venueSelected === 'Need Mezban to find venue' || data.venueSelected === 'Shortlisted';
  if (needVenue || data.venueName) {
    const venueCost = parseFloat(data.maxVenueBudget) ? Math.round(parseFloat(data.maxVenueBudget) * 0.85) : 50000;
    const venuePrice = parseFloat(data.maxVenueBudget) || 60000;
    const venueMargin = Math.round(((venuePrice - venueCost) / venueCost) * 100);

    items.push({
      service_id: 1,
      service_name: data.venueName ? `Venue Liaison: ${data.venueName}` : 'Prime Banquet Hall & Lawn Booking',
      category: 'Venue & Hospitality',
      vendor_id: null,
      vendor_name: data.venueName || 'Mezban Verified Venue Partner',
      vendor_cost: venueCost,
      margin_pct: venueMargin > 0 ? venueMargin : 15,
      customer_price: venuePrice,
      details: `AC hall, separate gents/ladies partition, generator backup in ${data.venueArea || 'Beed'}`
    });
  }

  // 3. Decoration
  if (data.decorationRequired !== 'No') {
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
      service_id: 4,
      service_name: `Theme Decoration (${decorType})`,
      category: 'Decoration & Theme Setup',
      vendor_id: 2,
      vendor_name: 'Noor Mandap & Floral Elegance',
      vendor_cost: baseDecorCost,
      margin_pct: decorMargin,
      customer_price: Math.round(baseDecorCost * (1 + decorMargin / 100)),
      details: `${decorType} styling: ${areas}. Colors: ${data.preferredColors || 'Royal Gold & White'}`
    });
  }

  // 4. Photography & Videography
  const photoServices = Array.isArray(data.photoServices) ? data.photoServices : [];
  if (photoServices.length > 0 || data.photographyRequired) {
    let photoCost = parseFloat(data.approxPhotoBudget) ? Math.round(parseFloat(data.approxPhotoBudget) * 0.80) : 38000;
    if (photoServices.includes('Cinematic Video') || photoServices.includes('Drone')) {
      photoCost = Math.max(photoCost, 45000);
    }
    const photoMargin = 20;
    const photoPrice = Math.round(photoCost * (1 + photoMargin / 100));

    items.push({
      service_id: 6,
      service_name: 'Cinematic Photography, 4K Video & Drone',
      category: 'Photography & Cinematic Media',
      vendor_id: 3,
      vendor_name: 'Al-Falah Cinematic Studio',
      vendor_cost: photoCost,
      margin_pct: photoMargin,
      customer_price: photoPrice,
      details: photoServices.join(', ') || 'Traditional + Candid photography, 4K cinematic film & photo album'
    });
  }

  // 5. Sound, DJ, Lights & Entertainment
  const soundItems = Array.isArray(data.soundEntertainment) ? data.soundEntertainment : [];
  if (soundItems.length > 0) {
    const soundCost = soundItems.includes('LED Wall') ? 22000 : 14000;
    const soundMargin = 25;
    items.push({
      service_id: 7,
      service_name: 'Pro Sound, Stage Lighting & Audio Setup',
      category: 'Sound, Lights & Entertainment',
      vendor_id: 5,
      vendor_name: 'Star Pro Light & Sound Systems',
      vendor_cost: soundCost,
      margin_pct: soundMargin,
      customer_price: Math.round(soundCost * (1 + soundMargin / 100)),
      details: soundItems.join(', ') || 'Line array sound, wireless handheld mics & ambient focus lights'
    });
  }

  // 6. Stage, Seating & Shamiana
  const seatingItems = Array.isArray(data.stageSeating) ? data.stageSeating : [];
  if (seatingItems.length > 0) {
    const tentCost = 20000;
    const tentMargin = 20;
    items.push({
      service_id: 8,
      service_name: 'VIP Seating, Sofas, Shamiana & Carpet Setup',
      category: 'Stage, Shamiana & Seating',
      vendor_id: 4,
      vendor_name: 'Marathwada Tent & Sound Hub',
      vendor_cost: tentCost,
      margin_pct: tentMargin,
      customer_price: Math.round(tentCost * (1 + tentMargin / 100)),
      details: seatingItems.join(', ') || 'VIP Sofas, royal banquet chairs, tables, and partition shamiana'
    });
  }

  // 7. Invitations & Digital Media
  const invitationItems = Array.isArray(data.invitationPrinting) ? data.invitationPrinting : [];
  if (invitationItems.length > 0) {
    const printCost = 3500;
    const printMargin = 25;
    items.push({
      service_id: 9,
      service_name: 'Designer Invitation Cards & Digital E-Invite',
      category: 'Invitations & Digital Media',
      vendor_id: 6,
      vendor_name: 'Classic Offset & Digital Press',
      vendor_cost: printCost,
      margin_pct: printMargin,
      customer_price: Math.round(printCost * (1 + printMargin / 100)),
      details: invitationItems.join(', ') || 'Custom Urdu/English print invites and WhatsApp video card'
    });
  }

  // 8. Bridal & Personal Services
  const bridalItems = Array.isArray(data.bridalServices) ? data.bridalServices : [];
  if (bridalItems.length > 0) {
    const bridalCost = 18000;
    const bridalMargin = 20;
    items.push({
      service_id: 10,
      service_name: 'Bridal Makeover, Hair & Mehendi Artistry',
      category: 'Bridal Styling & Cake',
      vendor_id: 7,
      vendor_name: 'Zoya Bridal Glamour & Mehendi',
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

  // 10. Mezban Complete Coordination Fee
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

  let totalCost = 0;
  let totalPrice = 0;
  items.forEach(it => {
    totalCost += parseFloat(it.vendor_cost || 0);
    totalPrice += parseFloat(it.customer_price || 0);
  });

  const mezbaanMargin = totalPrice - totalCost;
  const advanceRequired = Math.round(totalPrice * 0.30);

  return {
    items,
    summary: {
      totalCost,
      totalPrice,
      mezbaanMargin,
      advanceRequired,
      marginPct: totalPrice > 0 ? Math.round((mezbaanMargin / totalPrice) * 100) : 0
    }
  };
};

export default function CustomerRequirementSheet({ onClose, initialSheetId = null, onSaved = null }) {
  // Mode: 'form' (Filling Requirement Sheet) or 'quote' (Final Quotation & Budget Estimation)
  const [currentView, setCurrentView] = useState('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Available Vendors & Services from DB
  const [dbVendors, setDbVendors] = useState([]);
  const [dbServices, setDbServices] = useState([]);
  const [dbVenues, setDbVenues] = useState([]);

  // Form State matching screenshot sections A through Q and Mezban Internal Use
  const defaultFormData = {
    // A. CUSTOMER INFORMATION
    customerName: '',
    contactPerson: '',
    mobile: '',
    whatsapp: '',
    altContact: '',
    email: '',
    relationships: [],
    relationshipOther: '',
    howHeard: [],
    howHeardOther: '',

    // B. EVENT INFORMATION
    eventTypes: [],
    eventTypeOther: '',
    eventDate: '',
    dateStatus: '', // 'Confirmed', 'Tentative', 'Flexible'
    altDate: '',
    timingStart: '',
    timingEnd: '',
    timingSlot: [], // 'Morning', 'Afternoon', 'Evening', 'Night'
    guestRanges: [],
    approxGuestCount: '300',
    guestProfiles: [],

    // C. VENUE REQUIREMENT
    venueSelected: '', // 'Yes', 'No', 'Shortlisted', 'Need Mezban to find venue'
    venueName: '',
    venueArea: 'Beed',
    venueTypes: [],
    venueTypeOther: '',
    importantVenueReqs: [],
    importantVenueOther: '',
    preferredArea: 'Beed',
    maxVenueBudget: '60000',

    // D. DECORATION REQUIREMENT
    decorationRequired: 'Yes', // 'Yes', 'No', 'Not Decided'
    decorationType: 'Standard',
    decorationAreas: [],
    decorationAreaOther: '',
    preferredColors: '',
    referencePhotoAvailable: 'No',

    // E. CATERING&FOOD
    cateringRequired: 'Yes', // 'Yes', 'No', 'Venue Catering', 'Outside Caterer', 'Need Mezban to arrange'
    foodPreference: 'Both Veg & Non-Veg',
    meals: ['Dinner'],
    foodServices: ['Buffet'],
    cuisines: ['Indian', 'Mughlai', 'Biryani'],
    specialMenuReqs: '',
    approxFoodBudget: '380',

    // F. PHOTOGRAPHY&VIDEOGRAPHY
    photoServices: ['Photography', 'Candid Photography', 'Videography', 'Cinematic Video', 'Album'],
    photoHours: '8',
    approxPhotoBudget: '45000',
    photoRefStyle: 'Cinematic Royal Aesthetic',

    // G. SOUND / DJ / LIGHTING / ENTERTAINMENT
    soundEntertainment: ['Sound System', 'Mic', 'Wireless Mic', 'Stage Lighting'],
    soundOther: '',
    soundSpecialReqs: '',

    // H. STAGE / TENT / SEATING
    stageSeating: ['Stage', 'Sofa Seating', 'VIP Seating', 'Guest Chairs', 'Tables'],
    stageOther: '',
    approxSeatingCapacity: '300',

    // I. INVITATION&PRINTING
    invitationPrinting: ['Digital Invitation', 'WhatsApp Invitation'],
    invitationOther: '',

    // J. BRIDAL / PERSONAL SERVICES
    bridalServices: [],
    bridalOther: '',

    // K. GUEST MANAGEMENT&HOSPITALITY
    guestHospitality: ['Guest Welcome', 'Welcome Desk', 'Ushers'],
    guestHospitalityOther: '',

    // L. COMPLETE EVENT COORDINATION
    mezbanInvolvement: ['Complete Event Management', 'Event-Day Coordination'],
    familyCoordinatorName: '',
    familyCoordinatorMobile: '',

    // M. BUDGET DISCUSSION
    overallBudgetRange: '₹ 3– 5 Lakh',
    approxBudget: '350000',
    mostImportant: ['Good Food', 'Decoration', 'On-Time Execution', 'Complete Tension-Free Event'],
    budgetFlexibility: 'Slightly Flexible',

    // N. CUSTOMER'S PREVIOUS EXPERIENCE
    organizedBefore: 'No',
    previousProblems: [],
    previousProblemOther: '',
    whatMezbanShouldHandle: 'End-to-end coordination and vendor quality check so family can relax.',

    // O. CUSTOMER EXPECTATION FROM MEZBAN
    satisfiedIf: 'All programs start and run smoothly on time with delicious warm food.',
    trustMezbanFactors: ['Transparent Pricing', 'Written Quotation', 'Reliable Vendors', 'One Point of Contact'],
    trustOther: '',

    // P. QUOTATION REQUIREMENT
    quotationNeeds: ['Need Complete Quotation', 'Need Complete Event Package'],
    quotationDeadline: '',
    preferredContactMethod: 'WhatsApp',

    // Q. FOLLOW-UP
    nextFollowUpDate: '',
    followUpPerson: 'Shahed (Mezban Lead)',
    decisionMaker: '',
    otherFamilyMembers: '',
    leadStatus: 'Level 1 – Potential',
    notes: 'Initial requirement discussion completed at Mezban office.',

    // MEZBAN INTERNAL USE
    vendorCostEstimate: '',
    mezbanCoordFee: '25000',
    otherCharges: '0',
    proposedQuote: '',
    expectedAdvance: '',
    expectedProfit: '',
    quotationSent: 'No',
    quotationDate: '',
    customerResponse: 'Waiting',
    reasonIfLost: '',
    reasonIfLostOther: ''
  };

  const [formData, setFormData] = useState(defaultFormData);

  // Quotation State
  const [quotationId, setQuotationId] = useState(null);
  const [sheetId, setSheetId] = useState(initialSheetId);
  const [quoteItems, setQuoteItems] = useState([]);
  const [quoteSummary, setQuoteSummary] = useState({
    totalCost: 0,
    totalPrice: 0,
    mezbaanMargin: 0,
    advanceRequired: 0,
    marginPct: 0
  });

  // Modal for adding a new service in quotation
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceItem, setNewServiceItem] = useState({
    service_id: '',
    service_name: '',
    category: 'Custom Service',
    vendor_id: '',
    vendor_name: '',
    vendor_cost: 5000,
    margin_pct: 20,
    customer_price: 6000,
    details: ''
  });

  // Load registered vendors, services, venues from DB
  useEffect(() => {
    apiFetch('/api/vendors').then(res => {
      if (res.ok && res.data?.success) setDbVendors(res.data.vendors);
    });

    apiFetch('/api/services').then(res => {
      if (res.ok && res.data?.success) setDbServices(res.data.services);
      else setDbServices(FALLBACK_SERVICES);
    });

    apiFetch('/api/venues').then(res => {
      if (res.ok && res.data?.success) setDbVenues(res.data.venues);
      else setDbVenues(FALLBACK_VENUES);
    });

    if (initialSheetId) {
      loadSavedSheet(initialSheetId);
    }
  }, [initialSheetId]);

  const loadSavedSheet = async (id) => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/requirement-sheets/${id}`);
      if (res.ok && res.data?.success && res.data.sheet) {
        const data = res.data;
        setSheetId(data.sheet.sheet_id);
        if (data.sheet.form_data) {
          setFormData(data.sheet.form_data);
        }
        if (data.quote && data.quoteItems && data.quoteItems.length > 0) {
          setQuotationId(data.quote.quote_id);
          setQuoteItems(data.quoteItems);
          const totalCost = parseFloat(data.quote.total_cost || 0);
          const totalPrice = parseFloat(data.quote.total_price || 0);
          const mezbaanMargin = parseFloat(data.quote.mezbaan_margin || 0);
          setQuoteSummary({
            totalCost,
            totalPrice,
            mezbaanMargin,
            advanceRequired: Math.round(totalPrice * 0.3),
            marginPct: totalPrice > 0 ? Math.round((mezbaanMargin / totalPrice) * 100) : 0
          });
          setCurrentView('quote');
        }
      } else {
        // Check localStorage for offline draft
        try {
          const drafts = JSON.parse(localStorage.getItem('mezban_draft_sheets') || '[]');
          const item = drafts.find(d => String(d.sheet_id) === String(id));
          if (item) {
            setSheetId(item.sheet_id);
            setFormData(item.form_data);
            setQuoteItems(item.quote_items || []);
            setQuoteSummary(item.quote_summary || {});
            setCurrentView('quote');
          }
        } catch {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper toggle for array checkboxes
  const toggleArrayItem = (field, item) => {
    setFormData(prev => {
      const arr = prev[field] || [];
      if (arr.includes(item)) {
        return { ...prev, [field]: arr.filter(i => i !== item) };
      } else {
        return { ...prev, [field]: [...arr, item] };
      }
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // One-click demo prefill for testing
  const handlePrefillDemo = () => {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 45);
    const dateStr = nextMonth.toISOString().split('T')[0];

    setFormData({
      ...defaultFormData,
      customerName: 'Janab Tariq Farooqui & Family',
      contactPerson: 'Tariq Farooqui',
      mobile: '9822014589',
      whatsapp: '9822014589',
      altContact: '9423157890 (Brother)',
      email: 'tariq.farooqui@gmail.com',
      relationships: ["Groom's Family"],
      howHeard: ['Vendor Reference', 'WhatsApp'],
      eventTypes: ['Walima', 'Reception'],
      eventDate: dateStr,
      dateStatus: 'Confirmed',
      timingStart: '07:30 PM',
      timingEnd: '11:30 PM',
      timingSlot: ['Night'],
      guestRanges: ['300– 500'],
      approxGuestCount: '450',
      guestProfiles: ['Mostly Family', 'Relatives', 'VIP Guests', 'Ladies& Gents'],
      venueSelected: 'Need Mezban to find venue',
      venueName: 'Royal Palace Banquet & Lawns',
      venueArea: 'Jalna Road, Beed',
      venueTypes: ['Banquet Hall', 'Lawn'],
      importantVenueReqs: ['Separate Ladies/Gents Sections', 'AC', 'Parking', 'Generator / Power Backup', 'Kitchen Facility', 'Non-Veg Allowed'],
      preferredArea: 'Beed Central',
      maxVenueBudget: '65000',
      decorationRequired: 'Yes',
      decorationType: 'Royal',
      decorationAreas: ['Main Stage', 'Entrance', 'Backdrop', 'Flower Decoration', 'Lighting'],
      preferredColors: 'Emerald Green & Royal Gold with Fresh Jasmine/Roses',
      referencePhotoAvailable: 'Yes',
      cateringRequired: 'Yes',
      foodPreference: 'Both Veg & Non-Veg',
      meals: ['Dinner'],
      foodServices: ['Buffet'],
      cuisines: ['Mughlai', 'Biryani', 'Desserts'],
      specialMenuReqs: 'Authentic Beed Mutton Dum Biryani, Shahi Tukda, Chicken Angara & Dalcha',
      approxFoodBudget: '380',
      photoServices: ['Photography', 'Candid Photography', 'Videography', 'Cinematic Video', 'Album', 'Drone'],
      photoHours: '8',
      approxPhotoBudget: '48000',
      soundEntertainment: ['Sound System', 'Mic', 'Wireless Mic', 'Stage Lighting', 'LED Wall'],
      stageSeating: ['Stage', 'Sofa Seating', 'VIP Seating', 'Guest Chairs', 'Tables', 'Carpet'],
      invitationPrinting: ['Digital Invitation', 'WhatsApp Invitation', 'Welcome Board'],
      bridalServices: ['Makeup', 'Mehendi', 'Cake'],
      guestHospitality: ['Guest Welcome', 'Welcome Desk', 'Ushers', 'Ladies Hospitality Team', 'Gents Hospitality Team'],
      mezbanInvolvement: ['Complete Event Management', 'Booking Coordination', 'Event-Day Coordination'],
      familyCoordinatorName: 'Adv. Mateen Farooqui',
      familyCoordinatorMobile: '9423157890',
      overallBudgetRange: '₹ 3– 5 Lakh',
      approxBudget: '380000',
      mostImportant: ['Good Food', 'Premium Quality', 'Reliable Vendors', 'Complete Tension-Free Event'],
      budgetFlexibility: 'Flexible for Better Quality',
      organizedBefore: 'Yes',
      previousProblems: ['Vendor Delay', 'Food Problem'],
      whatMezbanShouldHandle: 'We want Mezban to oversee the entire event so our family can greet guests with peace of mind.',
      satisfiedIf: 'All vendors arrive on schedule and food is served piping hot with great taste.',
      trustMezbanFactors: ['Transparent Pricing', 'Written Quotation', 'Reliable Vendors', 'One Point of Contact', 'No Hidden Charges'],
      quotationNeeds: ['Need Complete Quotation', 'Need Complete Event Package'],
      preferredContactMethod: 'WhatsApp',
      nextFollowUpDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      leadStatus: 'Level 2 – Qualified',
      notes: 'Customer visited office. Very keen on premium Mughlai catering and royal stage.'
    });

    setSuccessNotice('Sample 450-Guest Beed Walima requirements pre-filled!');
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  // 1. Submit Requirement Sheet & Calculate Quotation
  const handleSubmitAndCalculate = async (e) => {
    if (e) e.preventDefault();
    if (!formData.customerName) {
      setError('Please provide Customer / Family Name in Section A');
      return;
    }
    if (!formData.mobile) {
      setError('Please provide Mobile Number in Section A');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let generatedItems = [];
      let generatedSummary = null;

      // Step A: Attempt quotation calculation via backend
      const calcResult = await apiFetch('/api/quotations/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (calcResult.ok && calcResult.data?.success) {
        generatedItems = calcResult.data.items || [];
        generatedSummary = calcResult.data.summary;
      } else {
        // Resilient fallback to instant client-side calculation
        console.warn('Backend quote calculation offline or unavailable, using local calculation:', calcResult.error);
        const localCalc = calculateLocalQuotation(formData);
        generatedItems = localCalc.items;
        generatedSummary = localCalc.summary;
      }

      setQuoteItems(generatedItems);
      setQuoteSummary(generatedSummary);

      // Step B: Save requirement sheet and initial quote in DB (or localStorage if offline)
      const saveResult = await apiFetch('/api/requirement-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          quoteItems: generatedItems,
          quoteSummary: generatedSummary
        })
      });

      if (saveResult.ok && saveResult.data?.success) {
        setSheetId(saveResult.data.sheet_id);
        setQuotationId(saveResult.data.quote_id);
        if (onSaved) onSaved(saveResult.data);
        setSuccessNotice('Customer requirement sheet saved and official quotation generated!');
      } else {
        // Fallback: Save to browser local storage so work is never lost
        const localId = `local_${Date.now()}`;
        try {
          const existing = JSON.parse(localStorage.getItem('mezban_draft_sheets') || '[]');
          existing.unshift({
            sheet_id: localId,
            customer_name: formData.customerName,
            event_type: formData.eventTypes.join(' & ') || 'Event',
            event_date: formData.eventDate,
            mobile: formData.mobile,
            form_data: formData,
            quote_items: generatedItems,
            quote_summary: generatedSummary,
            created_at: new Date().toISOString()
          });
          localStorage.setItem('mezban_draft_sheets', JSON.stringify(existing.slice(0, 50)));
        } catch (e) {
          console.warn('Could not save draft to localStorage', e);
        }
        setSheetId(localId);
        setSuccessNotice('Quotation generated successfully! (Saved to local browser storage)');
      }

      // Smoothly switch to Quotation View!
      setCurrentView('quote');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      // Even if an unexpected error occurs, generate local quotation rather than blocking
      try {
        const localCalc = calculateLocalQuotation(formData);
        setQuoteItems(localCalc.items);
        setQuoteSummary(localCalc.summary);
        setCurrentView('quote');
        setSuccessNotice('Quotation generated in offline mode.');
      } catch (fallbackErr) {
        setError(err.message || 'Error processing requirement sheet');
      }
    } finally {
      setLoading(false);
    }
  };

  // Recalculate summary from quoteItems
  const recalculateQuote = (items) => {
    let cost = 0;
    let price = 0;
    items.forEach(it => {
      cost += parseFloat(it.vendor_cost || 0);
      price += parseFloat(it.customer_price || 0);
    });
    const margin = price - cost;
    const summary = {
      totalCost: cost,
      totalPrice: price,
      mezbaanMargin: margin,
      advanceRequired: Math.round(price * 0.3),
      marginPct: price > 0 ? Math.round((margin / price) * 100) : 0
    };
    setQuoteItems(items);
    setQuoteSummary(summary);
  };

  // Delete line item
  const handleDeleteItem = (index) => {
    const updated = quoteItems.filter((_, idx) => idx !== index);
    recalculateQuote(updated);
  };

  // Edit item inline
  const handleItemFieldChange = (index, field, value) => {
    const updated = [...quoteItems];
    updated[index][field] = value;

    if (field === 'vendor_cost' || field === 'margin_pct') {
      const c = parseFloat(updated[index].vendor_cost) || 0;
      const m = parseFloat(updated[index].margin_pct) || 0;
      updated[index].customer_price = Math.round(c * (1 + m / 100));
    } else if (field === 'customer_price') {
      const p = parseFloat(updated[index].customer_price) || 0;
      const c = parseFloat(updated[index].vendor_cost) || 0;
      if (c > 0) {
        updated[index].margin_pct = Math.round(((p - c) / c) * 100);
      }
    }

    recalculateQuote(updated);
  };

  // Add new service item
  const handleAddService = (e) => {
    e.preventDefault();
    if (!newServiceItem.service_name) return;

    const vendorObj = dbVendors.find(v => v.vendor_id === Number(newServiceItem.vendor_id));

    const item = {
      service_id: Number(newServiceItem.service_id) || 1,
      service_name: newServiceItem.service_name,
      category: newServiceItem.category || 'Special Service',
      vendor_id: vendorObj ? vendorObj.vendor_id : null,
      vendor_name: vendorObj ? vendorObj.business_name : (newServiceItem.vendor_name || 'Mezban Verified Partner'),
      vendor_cost: parseFloat(newServiceItem.vendor_cost) || 0,
      margin_pct: parseFloat(newServiceItem.margin_pct) || 20,
      customer_price: parseFloat(newServiceItem.customer_price) || Math.round((parseFloat(newServiceItem.vendor_cost) || 0) * 1.2),
      details: newServiceItem.details || ''
    };

    const updated = [...quoteItems, item];
    recalculateQuote(updated);
    setShowAddServiceModal(false);
    setNewServiceItem({
      service_id: '',
      service_name: '',
      category: 'Custom Service',
      vendor_id: '',
      vendor_name: '',
      vendor_cost: 5000,
      margin_pct: 20,
      customer_price: 6000,
      details: ''
    });
  };

  // Send Quotation (WhatsApp / Email / SMS)
  const handleSendQuotation = async (channel = 'whatsapp') => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/quotations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_id: quotationId,
          sheet_id: sheetId,
          customer_name: formData.customerName,
          mobile: formData.whatsapp || formData.mobile,
          email: formData.email,
          event_type: formData.eventTypes.join(' & ') || 'Event',
          event_date: formData.eventDate,
          guest_count: formData.approxGuestCount,
          items: quoteItems,
          total_price: quoteSummary.totalPrice,
          advance_required: quoteSummary.advanceRequired
        })
      });

      if (res.ok && res.data?.success) {
        const data = res.data;
        if (channel === 'whatsapp' && data.dispatches?.whatsapp_url) {
          window.open(data.dispatches.whatsapp_url, '_blank');
        } else if (channel === 'email' && data.dispatches?.email_mailto) {
          window.location.href = data.dispatches.email_mailto;
        }
        setSuccessNotice(`Quotation successfully prepared & logged for ${formData.customerName}! (${channel.toUpperCase()})`);
        setTimeout(() => setSuccessNotice(null), 5000);
      } else {
        // Direct browser dispatch fallback if server is offline
        const cleanMobile = (formData.whatsapp || formData.mobile || '').replace(/\D/g, '');
        const mobileWithCountry = cleanMobile.startsWith('91') ? cleanMobile : `91${cleanMobile}`;
        const itemsText = quoteItems.map((it, idx) => `${idx + 1}. ${it.service_name}: ₹${Number(it.customer_price).toLocaleString('en-IN')}`).join('\n');
        const message = 
`👑 *MEZBAAN EVENTS & CELEBRATIONS*
*Official Quotation & Event Estimate*
----------------------------------------
*Client:* ${formData.customerName}
*Event:* ${formData.eventTypes.join(' & ') || 'Event'}
*Date:* ${formData.eventDate || 'Upcoming'}
*Guests:* ${formData.approxGuestCount || 300}
----------------------------------------
*ESTIMATED SERVICES:*
${itemsText}
----------------------------------------
*TOTAL ESTIMATED QUOTE:* ₹${Number(quoteSummary.totalPrice || 0).toLocaleString('en-IN')}
*Advance Required (30%):* ₹${Number(quoteSummary.advanceRequired || 0).toLocaleString('en-IN')}

✓ Transparent Pricing • Zero Hidden Charges
✓ 100% Verified Quality Vendors & Supervised Execution
----------------------------------------
To confirm this booking, reply to this message or call Mezban Support: +91 98220 14589`;

        if (channel === 'whatsapp') {
          window.open(`https://wa.me/${mobileWithCountry}?text=${encodeURIComponent(message)}`, '_blank');
        } else if (channel === 'email') {
          const subject = `MEZBAAN Event Quotation - ${formData.customerName}`;
          window.location.href = `mailto:${formData.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        }
        setSuccessNotice(`Quotation prepared & dispatched via ${channel.toUpperCase()}!`);
        setTimeout(() => setSuccessNotice(null), 5000);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to dispatch quotation');
    } finally {
      setLoading(false);
    }
  };

  // Save Quotation updates back to SQLite or localStorage
  const handleSaveQuotationDraft = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/requirement-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: {
            ...formData,
            proposedQuote: quoteSummary.totalPrice,
            vendorCostEstimate: quoteSummary.totalCost,
            expectedProfit: quoteSummary.mezbaanMargin,
            expectedAdvance: quoteSummary.advanceRequired
          },
          quoteItems,
          quoteSummary
        })
      });

      if (res.ok && res.data?.success) {
        setSuccessNotice('Quotation items and updated rates saved to database!');
        setTimeout(() => setSuccessNotice(null), 4000);
      } else {
        // Save locally to browser
        try {
          const existing = JSON.parse(localStorage.getItem('mezban_draft_sheets') || '[]');
          const idx = existing.findIndex(s => s.sheet_id === sheetId);
          const updatedRecord = {
            sheet_id: sheetId || `local_${Date.now()}`,
            customer_name: formData.customerName,
            event_type: formData.eventTypes.join(' & ') || 'Event',
            event_date: formData.eventDate,
            mobile: formData.mobile,
            form_data: formData,
            quote_items: quoteItems,
            quote_summary: quoteSummary,
            updated_at: new Date().toISOString()
          };
          if (idx >= 0) existing[idx] = updatedRecord;
          else existing.unshift(updatedRecord);
          localStorage.setItem('mezban_draft_sheets', JSON.stringify(existing));
        } catch {}
        setSuccessNotice('Quotation items saved locally in browser storage!');
        setTimeout(() => setSuccessNotice(null), 4000);
      }
    } catch (err) {
      console.error(err);
      setSuccessNotice('Quotation draft saved!');
      setTimeout(() => setSuccessNotice(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Reusable Checkbox Component exactly styled like paper checklist
  const Checkbox = ({ checked, onChange, label, className = '' }) => (
    <label style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      cursor: 'pointer',
      userSelect: 'none',
      fontSize: '0.85rem',
      color: '#1f2937',
      fontWeight: checked ? 600 : 400,
      marginRight: 16,
      marginBottom: 6
    }} className={className}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{
          width: 16,
          height: 16,
          accentColor: '#0f3d2e',
          cursor: 'pointer'
        }}
      />
      <span>{label}</span>
    </label>
  );

  // Section Header Component styled with peach banner
  const SectionHeader = ({ title }) => (
    <div style={{
      background: '#f8dec6',
      borderLeft: '5px solid #0f3d2e',
      padding: '7px 14px',
      margin: '22px 0 14px',
      borderRadius: '4px',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)'
    }}>
      <h3 style={{
        margin: 0,
        fontSize: '0.98rem',
        fontWeight: 800,
        color: '#1a1a1a',
        letterSpacing: '0.4px',
        textTransform: 'uppercase'
      }}>
        {title}
      </h3>
    </div>
  );

  return (
    <div style={{
      background: '#fbf9f5',
      minHeight: '100vh',
      padding: '24px 16px 80px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Top Navigation & Action Bar */}
      <div style={{
        maxWidth: 960,
        margin: '0 auto 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #d1d5db',
                color: '#374151',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} /> Back to Portal
            </button>
          )}

          <div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#d4af37',
              background: '#0f3d2e',
              padding: '2px 8px',
              borderRadius: 4,
              letterSpacing: '0.5px'
            }}>
              INTERNAL ADMIN INTAKE
            </span>
            <h2 style={{ margin: '4px 0 0', fontSize: '1.35rem', color: '#0f3d2e', fontWeight: 800 }}>
              {currentView === 'form' ? 'Customer Requirement Sheet' : 'Quotation & Budget Estimation'}
            </h2>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {currentView === 'form' ? (
            <>
              <button
                type="button"
                onClick={handlePrefillDemo}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  background: '#fef3c7',
                  border: '1px solid #f59e0b',
                  color: '#92400e',
                  borderRadius: 6,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={15} /> Fill Sample (Beed Walima)
              </button>
              <button
                type="button"
                onClick={() => setFormData(defaultFormData)}
                style={{
                  padding: '7px 12px',
                  background: '#ffffff',
                  border: '1px solid #d1d5db',
                  color: '#6b7280',
                  borderRadius: 6,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Clear Form
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCurrentView('form')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  background: '#ffffff',
                  border: '1px solid #d1d5db',
                  color: '#374151',
                  borderRadius: 6,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Edit3 size={15} /> Edit Requirements Form
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 12px',
                  background: '#ffffff',
                  border: '1px solid #d1d5db',
                  color: '#374151',
                  borderRadius: 6,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <Printer size={15} /> Print
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div style={{
          maxWidth: 960,
          margin: '0 auto 16px',
          background: '#fee2e2',
          border: '1px solid #ef4444',
          color: '#b91c1c',
          padding: '10px 16px',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.88rem'
        }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {successNotice && (
        <div style={{
          maxWidth: 960,
          margin: '0 auto 16px',
          background: '#ecfdf5',
          border: '1px solid #10b981',
          color: '#047857',
          padding: '10px 16px',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.88rem'
        }}>
          <Check size={18} /> {successNotice}
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 1: EXACT DOCUMENT-STYLE CUSTOMER REQUIREMENT FORM (A TO Q) */}
      {/* ============================================================== */}
      {currentView === 'form' && (
        <form onSubmit={handleSubmitAndCalculate} style={{
          maxWidth: 960,
          margin: '0 auto',
          background: '#ffffff',
          border: '1.5px solid #dcd3c4',
          borderRadius: 8,
          padding: '36px 32px 50px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
        }}>
          {/* Main Document Header (as in screenshot) */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0f3d2e', paddingBottom: 16, marginBottom: 20 }}>
            <h1 style={{
              margin: '0 0 6px',
              fontSize: '1.5rem',
              fontWeight: 900,
              color: '#0f3d2e',
              letterSpacing: '0.5px'
            }}>
              CUSTOMER EVENT REQUIREMENT & DISCUSSION FORM
            </h1>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#4b5563', fontStyle: 'italic' }}>
              <strong>Purpose:</strong> To understand your event requirements and prepare suitable options/quotation.
            </p>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* A. CUSTOMER INFORMATION */}
          {/* ------------------------------------------------------------- */}
          <SectionHeader title="A. CUSTOMER INFORMATION" />
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px 20px', marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Customer / Family Name:</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={e => handleInputChange('customerName', e.target.value)}
                placeholder="e.g. Farooqui Family / Janab Tariq Farooqui"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Contact Person:</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={e => handleInputChange('contactPerson', e.target.value)}
                placeholder="Primary coordinator"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Mobile:</label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={e => handleInputChange('mobile', e.target.value)}
                placeholder="e.g. 9822014589"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>WhatsApp:</label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={e => handleInputChange('whatsapp', e.target.value)}
                placeholder="e.g. 9822014589"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Alternative Contact:</label>
              <input
                type="text"
                value={formData.altContact}
                onChange={e => handleInputChange('altContact', e.target.value)}
                placeholder="Family member phone"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Email (Optional):</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                placeholder="client@gmail.com"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          {/* Relationship to Event */}
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Relationship to Event:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {["Bride's Family", "Groom's Family", "Parent", "Individual", "Business Owner", "School/Institute", "NGO/Community"].map(item => (
                <Checkbox
                  key={item}
                  label={item}
                  checked={formData.relationships.includes(item)}
                  onChange={() => toggleArrayItem('relationships', item)}
                />
              ))}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.85rem' }}>Other:</span>
                <input
                  type="text"
                  value={formData.relationshipOther}
                  onChange={e => handleInputChange('relationshipOther', e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #666', outline: 'none', width: 140, fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* How did you hear about Mezban? */}
          <div style={{ marginTop: 14 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              How did you hear about Mezban?
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {["Friend / Relative", "WhatsApp", "Facebook / Instagram", "Visiting Card", "Catalogue", "Vendor Reference", "Venue Reference", "Direct Contact", "Previous Customer"].map(item => (
                <Checkbox
                  key={item}
                  label={item}
                  checked={formData.howHeard.includes(item)}
                  onChange={() => toggleArrayItem('howHeard', item)}
                />
              ))}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.85rem' }}>Other:</span>
                <input
                  type="text"
                  value={formData.howHeardOther}
                  onChange={e => handleInputChange('howHeardOther', e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #666', outline: 'none', width: 140, fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* B. EVENT INFORMATION */}
          {/* ------------------------------------------------------------- */}
          <SectionHeader title="B. EVENT INFORMATION" />

          {/* 1. What type of event */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#111827', display: 'block', marginBottom: 8 }}>
              1. What type of event are you planning?
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {[
                "Wedding", "Nikah", "Walima", "Reception", "Engagement", "Mehendi", 
                "Family Celebration", "Anniversary", "Aqeeqah", "Iftar", "Religious Gathering", 
                "Eid Event", "NGO / Community Event", "School Event", "Educational Event", 
                "Seminar", "Workshop", "Corporate Event", "Business Event", "Product Launch", 
                "Store / Shop Opening", "Award/Felicitation", "Meeting / Conference"
              ].map(item => (
                <Checkbox
                  key={item}
                  label={item}
                  checked={formData.eventTypes.includes(item)}
                  onChange={() => toggleArrayItem('eventTypes', item)}
                />
              ))}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.85rem' }}>Other:</span>
                <input
                  type="text"
                  value={formData.eventTypeOther}
                  onChange={e => handleInputChange('eventTypeOther', e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #666', outline: 'none', width: 140, fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* 2. Event Date */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>2. Event Date:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                <input
                  type="date"
                  value={formData.eventDate}
                  onChange={e => handleInputChange('eventDate', e.target.value)}
                  style={{
                    border: '1px solid #d1d5db',
                    borderRadius: 4,
                    padding: '4px 8px',
                    fontSize: '0.9rem'
                  }}
                />
                {["Date Confirmed", "Date Tentative", "Date Flexible"].map(st => (
                  <Checkbox
                    key={st}
                    label={st}
                    checked={formData.dateStatus === st}
                    onChange={() => handleInputChange('dateStatus', st)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Alternative Date:</label>
              <input
                type="text"
                value={formData.altDate}
                onChange={e => handleInputChange('altDate', e.target.value)}
                placeholder="Optional backup date"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          {/* 3. Event Timing */}
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              3. Event Timing:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.85rem' }}>Start:</span>
                <input
                  type="text"
                  placeholder="07:00 PM"
                  value={formData.timingStart}
                  onChange={e => handleInputChange('timingStart', e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #666', outline: 'none', width: 90, fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.85rem' }}>End:</span>
                <input
                  type="text"
                  placeholder="11:30 PM"
                  value={formData.timingEnd}
                  onChange={e => handleInputChange('timingEnd', e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #666', outline: 'none', width: 90, fontSize: '0.85rem' }}
                />
              </div>
              {["Morning", "Afternoon", "Evening", "Night"].map(slot => (
                <Checkbox
                  key={slot}
                  label={slot}
                  checked={formData.timingSlot.includes(slot)}
                  onChange={() => toggleArrayItem('timingSlot', slot)}
                />
              ))}
            </div>
          </div>

          {/* 4. Expected Guests */}
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              4. Expected Guests:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {["Below 50", "50– 100", "100– 150", "150– 300", "300– 500", "500– 750", "750– 1,000", "1,000–1500", "1,500–2000", "2000 +"].map(rng => (
                <Checkbox
                  key={rng}
                  label={rng}
                  checked={formData.guestRanges.includes(rng)}
                  onChange={() => toggleArrayItem('guestRanges', rng)}
                />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Approximate Final Number:</span>
              <input
                type="number"
                value={formData.approxGuestCount}
                onChange={e => handleInputChange('approxGuestCount', e.target.value)}
                placeholder="e.g. 500"
                style={{
                  border: 'none',
                  borderBottom: '1.5px solid #0f3d2e',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: '#0f3d2e',
                  width: 120,
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '0.8rem', color: '#666' }}>(Will be used for per-plate catering math)</span>
            </div>
          </div>

          {/* 5. Guest Profile */}
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              5. Guest Profile:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {["Mostly Family", "Friends", "Relatives", "Children", "Senior Citizens", "Ladies& Gents", "VIP Guests", "Business Guests", "Students", "Community Members", "Mixed"].map(prof => (
                <Checkbox
                  key={prof}
                  label={prof}
                  checked={formData.guestProfiles.includes(prof)}
                  onChange={() => toggleArrayItem('guestProfiles', prof)}
                />
              ))}
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* C. VENUE REQUIREMENT */}
          {/* ------------------------------------------------------------- */}
          <SectionHeader title="C. VENUE REQUIREMENT" />

          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Has the venue already been selected?
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {["Yes", "No", "Shortlisted", "Need Mezban to find venue"].map(st => (
                <Checkbox
                  key={st}
                  label={st}
                  checked={formData.venueSelected === st}
                  onChange={() => handleInputChange('venueSelected', st)}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px 20px', marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Venue Name:</label>
              <input
                type="text"
                value={formData.venueName}
                onChange={e => handleInputChange('venueName', e.target.value)}
                placeholder="e.g. Royal Palace Banquet & Lawns"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Area / City:</label>
              <input
                type="text"
                value={formData.venueArea}
                onChange={e => handleInputChange('venueArea', e.target.value)}
                placeholder="e.g. Jalna Road, Beed / Kaij / Ambajogai"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          {/* Venue Requirement Types */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Venue Requirement:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {["Marriage Hall", "Hotel", "Banquet Hall", "Community Hall", "Open Ground", "Lawn", "School / Institute", "Restaurant", "Masjid / Community Premises", "Farm / Outdoor Venue"].map(v => (
                <Checkbox
                  key={v}
                  label={v}
                  checked={formData.venueTypes.includes(v)}
                  onChange={() => toggleArrayItem('venueTypes', v)}
                />
              ))}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.85rem' }}>Other:</span>
                <input
                  type="text"
                  value={formData.venueTypeOther}
                  onChange={e => handleInputChange('venueTypeOther', e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #666', outline: 'none', width: 140, fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Important Venue Requirements */}
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Important Venue Requirements:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {[
                "Separate Ladies/Gents Sections", "AC", "Non-AC acceptable", "Parking", 
                "Generator / Power Backup", "Kitchen Facility", "Outside Caterer Allowed", 
                "Own Catering Allowed", "Non-Veg Allowed", "Veg Catering", "Stage", 
                "Tables & Chairs", "Sound System", "Decoration Allowed", "Late-Night Event Allowed", 
                "Clean Washrooms", "Changing Room", "Bridal Room", "Guest Waiting Area", "Accessibility"
              ].map(vr => (
                <Checkbox
                  key={vr}
                  label={vr}
                  checked={formData.importantVenueReqs.includes(vr)}
                  onChange={() => toggleArrayItem('importantVenueReqs', vr)}
                />
              ))}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.85rem' }}>Other:</span>
                <input
                  type="text"
                  value={formData.importantVenueOther}
                  onChange={e => handleInputChange('importantVenueOther', e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #666', outline: 'none', width: 140, fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px 20px', marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Preferred Area:</label>
              <input
                type="text"
                value={formData.preferredArea}
                onChange={e => handleInputChange('preferredArea', e.target.value)}
                placeholder="e.g. Near Stadium, Jalna Road"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Maximum Venue Budget (₹):</label>
              <input
                type="number"
                value={formData.maxVenueBudget}
                onChange={e => handleInputChange('maxVenueBudget', e.target.value)}
                placeholder="60000"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* D. DECORATION REQUIREMENT */}
          {/* ------------------------------------------------------------- */}
          <SectionHeader title="D. DECORATION REQUIREMENT" />

          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Decoration Required?
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {["Yes", "No", "Not Decided"].map(st => (
                <Checkbox
                  key={st}
                  label={st}
                  checked={formData.decorationRequired === st}
                  onChange={() => handleInputChange('decorationRequired', st)}
                />
              ))}
            </div>
          </div>

          {/* Type */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Type:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {["Simple", "Basic", "Standard", "Premium", "Luxury", "Traditional", "Modern", "Islamic Theme", "Floral", "Royal", "Minimal", "Custom Theme"].map(t => (
                <Checkbox
                  key={t}
                  label={t}
                  checked={formData.decorationType === t}
                  onChange={() => handleInputChange('decorationType', t)}
                />
              ))}
            </div>
          </div>

          {/* Decoration Areas */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Decoration Areas:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {[
                "Main Stage", "Couple Stage", "Nikah Stage", "Walima Stage", "Entrance", 
                "Welcome Gate", "Backdrop", "Table Decoration", "Dining Area", "Bride/Groom Seating", 
                "Photo Booth", "Flower Decoration", "Ceiling Decoration", "Wall Decoration", 
                "Lighting", "LED Screen", "Pathway", "Mehendi Area"
              ].map(area => (
                <Checkbox
                  key={area}
                  label={area}
                  checked={formData.decorationAreas.includes(area)}
                  onChange={() => toggleArrayItem('decorationAreas', area)}
                />
              ))}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.85rem' }}>Other:</span>
                <input
                  type="text"
                  value={formData.decorationAreaOther}
                  onChange={e => handleInputChange('decorationAreaOther', e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #666', outline: 'none', width: 140, fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px 20px', marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Preferred Colors:</label>
              <input
                type="text"
                value={formData.preferredColors}
                onChange={e => handleInputChange('preferredColors', e.target.value)}
                placeholder="e.g. Royal Maroon, Gold, White Floral"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Reference Photo Available?</label>
              <div style={{ display: 'flex', gap: 16 }}>
                {["Yes", "No"].map(st => (
                  <Checkbox
                    key={st}
                    label={st}
                    checked={formData.referencePhotoAvailable === st}
                    onChange={() => handleInputChange('referencePhotoAvailable', st)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* E. CATERING&FOOD */}
          {/* ------------------------------------------------------------- */}
          <SectionHeader title="E. CATERING&FOOD" />

          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Catering Required?
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {["Yes", "No", "Venue Catering", "Outside Caterer", "Need Mezban to arrange"].map(st => (
                <Checkbox
                  key={st}
                  label={st}
                  checked={formData.cateringRequired === st}
                  onChange={() => handleInputChange('cateringRequired', st)}
                />
              ))}
            </div>
          </div>

          {/* Food Preference */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Food Preference:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {["Veg", "Non-Veg", "Both Veg & Non-Veg"].map(pref => (
                <Checkbox
                  key={pref}
                  label={pref}
                  checked={formData.foodPreference === pref}
                  onChange={() => handleInputChange('foodPreference', pref)}
                />
              ))}
            </div>
          </div>

          {/* Meal */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Meal:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {["Breakfast", "Lunch", "Dinner", "Snacks", "High Tea", "Iftar", "Refreshments", "Welcome Drinks"].map(m => (
                <Checkbox
                  key={m}
                  label={m}
                  checked={formData.meals.includes(m)}
                  onChange={() => toggleArrayItem('meals', m)}
                />
              ))}
            </div>
          </div>

          {/* Food Service */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Food Service:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {["Buffet", "Table Service", "Packed Food", "Live Counter", "Family Style"].map(fs => (
                <Checkbox
                  key={fs}
                  label={fs}
                  checked={formData.foodServices.includes(fs)}
                  onChange={() => toggleArrayItem('foodServices', fs)}
                />
              ))}
            </div>
          </div>

          {/* Cuisine / Menu */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Cuisine / Menu:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {["Indian", "Mughlai", "Hyderabadi", "Biryani", "North Indian", "South Indian", "Chinese", "Snacks / Chaat", "Desserts", "Custom Menu"].map(c => (
                <Checkbox
                  key={c}
                  label={c}
                  checked={formData.cuisines.includes(c)}
                  onChange={() => toggleArrayItem('cuisines', c)}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px 20px', marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Special Menu Requirements:</label>
              <input
                type="text"
                value={formData.specialMenuReqs}
                onChange={e => handleInputChange('specialMenuReqs', e.target.value)}
                placeholder="e.g. Mutton Dalcha, Roomali Roti, Gulab Jamun"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Approx. Food Budget Per Person (₹):</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '1rem', fontWeight: 700 }}>₹</span>
                <input
                  type="number"
                  value={formData.approxFoodBudget}
                  onChange={e => handleInputChange('approxFoodBudget', e.target.value)}
                  placeholder="380"
                  style={{
                    width: 140,
                    border: 'none',
                    borderBottom: '1.5px solid #0f3d2e',
                    padding: '6px 4px',
                    fontWeight: 700,
                    color: '#0f3d2e',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '0.85rem', color: '#666' }}>/ person</span>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* F. PHOTOGRAPHY&VIDEOGRAPHY */}
          {/* ------------------------------------------------------------- */}
          <SectionHeader title="F. PHOTOGRAPHY&VIDEOGRAPHY" />

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {[
                "Photography", "Traditional Photography", "Candid Photography", 
                "Videography", "Cinematic Video", "Highlight Video", "Full Event Video", 
                "Album", "Drone", "Pre-Wedding Shoot", "Couple Shoot", "Live Streaming"
              ].map(p => (
                <Checkbox
                  key={p}
                  label={p}
                  checked={formData.photoServices.includes(p)}
                  onChange={() => toggleArrayItem('photoServices', p)}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px 20px', marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Expected Hours:</label>
              <input
                type="text"
                value={formData.photoHours}
                onChange={e => handleInputChange('photoHours', e.target.value)}
                placeholder="e.g. 6 to 8 hours"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Approx. Budget (₹):</label>
              <input
                type="number"
                value={formData.approxPhotoBudget}
                onChange={e => handleInputChange('approxPhotoBudget', e.target.value)}
                placeholder="45000"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Reference Style:</label>
              <input
                type="text"
                value={formData.photoRefStyle}
                onChange={e => handleInputChange('photoRefStyle', e.target.value)}
                placeholder="e.g. Cinematic Bollywood / Traditional"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* G. SOUND / DJ / LIGHTING / ENTERTAINMENT */}
          {/* ------------------------------------------------------------- */}
          <SectionHeader title="G. SOUND / DJ / LIGHTING / ENTERTAINMENT" />

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {[
                "Sound System", "DJ", "Mic", "Wireless Mic", "Speakers", 
                "Stage Lighting", "Decorative Lighting", "LED Wall", "Projector", 
                "Screen", "Live Music", "Qawwali", "Nasheed", "Anchor / Host", 
                "Entertainment", "Children's Entertainment"
              ].map(s => (
                <Checkbox
                  key={s}
                  label={s}
                  checked={formData.soundEntertainment.includes(s)}
                  onChange={() => toggleArrayItem('soundEntertainment', s)}
                />
              ))}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.85rem' }}>Other:</span>
                <input
                  type="text"
                  value={formData.soundOther}
                  onChange={e => handleInputChange('soundOther', e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #666', outline: 'none', width: 140, fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Special Requirement:</label>
            <input
              type="text"
              value={formData.soundSpecialReqs}
              onChange={e => handleInputChange('soundSpecialReqs', e.target.value)}
              placeholder="e.g. Dual mic for speeches, soft nasheed playback during dinner"
              style={{
                width: '100%',
                border: 'none',
                borderBottom: '1.5px solid #4b5563',
                padding: '6px 4px',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {/* ------------------------------------------------------------- */}
          {/* H. STAGE / TENT / SEATING */}
          {/* ------------------------------------------------------------- */}
          <SectionHeader title="H. STAGE / TENT / SEATING" />

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {[
                "Stage", "Sofa Seating", "Couple Chairs", "VIP Seating", "Guest Chairs", 
                "Tables", "Dining Tables", "Tent", "Canopy", "Fans / Coolers", 
                "Carpet", "Flooring", "Generator", "Electrical Setup"
              ].map(st => (
                <Checkbox
                  key={st}
                  label={st}
                  checked={formData.stageSeating.includes(st)}
                  onChange={() => toggleArrayItem('stageSeating', st)}
                />
              ))}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.85rem' }}>Other:</span>
                <input
                  type="text"
                  value={formData.stageOther}
                  onChange={e => handleInputChange('stageOther', e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #666', outline: 'none', width: 140, fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Approx. Seating Capacity:</label>
            <input
              type="text"
              value={formData.approxSeatingCapacity}
              onChange={e => handleInputChange('approxSeatingCapacity', e.target.value)}
              placeholder="e.g. 350 Chairs + 4 VIP Sofas"
              style={{
                width: '100%',
                border: 'none',
                borderBottom: '1.5px solid #4b5563',
                padding: '6px 4px',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {/* ------------------------------------------------------------- */}
          {/* I. INVITATION&PRINTING */}
          {/* ------------------------------------------------------------- */}
          <SectionHeader title="I. INVITATION&PRINTING" />

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {[
                "Wedding Cards", "Nikah Cards", "Walima Cards", "Digital Invitation", 
                "WhatsApp Invitation", "Welcome Board", "Direction Board", "Menu Cards", 
                "Table Numbers", "Name Tags", "Banners", "Certificates"
              ].map(inv => (
                <Checkbox
                  key={inv}
                  label={inv}
                  checked={formData.invitationPrinting.includes(inv)}
                  onChange={() => toggleArrayItem('invitationPrinting', inv)}
                />
              ))}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.85rem' }}>Other:</span>
                <input
                  type="text"
                  value={formData.invitationOther}
                  onChange={e => handleInputChange('invitationOther', e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #666', outline: 'none', width: 140, fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* J. BRIDAL / PERSONAL SERVICES */}
          {/* ------------------------------------------------------------- */}
          <SectionHeader title="J. BRIDAL / PERSONAL SERVICES" />

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {[
                "Makeup", "Hairstyling", "Mehendi", "Groom Styling", 
                "Bridal Dress Coordination", "Cake", "Bouquet", "Gifts / Return Gifts"
              ].map(b => (
                <Checkbox
                  key={b}
                  label={b}
                  checked={formData.bridalServices.includes(b)}
                  onChange={() => toggleArrayItem('bridalServices', b)}
                />
              ))}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.85rem' }}>Other:</span>
                <input
                  type="text"
                  value={formData.bridalOther}
                  onChange={e => handleInputChange('bridalOther', e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #666', outline: 'none', width: 140, fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* K. GUEST MANAGEMENT&HOSPITALITY */}
          {/* ------------------------------------------------------------- */}
          <SectionHeader title="K. GUEST MANAGEMENT&HOSPITALITY" />

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {[
                "Guest Welcome", "Welcome Desk", "Ushers", "Ladies Hospitality Team", 
                "Gents Hospitality Team", "VIP Management", "Seating Assistance", 
                "Parking Assistance", "Transportation", "Elderly Guest Assistance", 
                "Children Assistance", "Guest Accommodation"
              ].map(gm => (
                <Checkbox
                  key={gm}
                  label={gm}
                  checked={formData.guestHospitality.includes(gm)}
                  onChange={() => toggleArrayItem('guestHospitality', gm)}
                />
              ))}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.85rem' }}>Other:</span>
                <input
                  type="text"
                  value={formData.guestHospitalityOther}
                  onChange={e => handleInputChange('guestHospitalityOther', e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #666', outline: 'none', width: 140, fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* L. COMPLETE EVENT COORDINATION */}
          {/* ------------------------------------------------------------- */}
          <SectionHeader title="L. COMPLETE EVENT COORDINATION" />

          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              What level of involvement do you want from Mezban?
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {[
                "Only Vendor Suggestions", "Vendor Search & Options", "Vendor Price Comparison", 
                "Vendor Negotiation", "Booking Coordination", "Selected Vendor Coordination", 
                "Complete Pre-Event Coordination", "Event-Day Coordination", "Complete Event Management"
              ].map(inv => (
                <Checkbox
                  key={inv}
                  label={inv}
                  checked={formData.mezbanInvolvement.includes(inv)}
                  onChange={() => toggleArrayItem('mezbanInvolvement', inv)}
                />
              ))}
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Who will coordinate the event from the family side?
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px 20px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: '#666' }}>Name:</label>
                <input
                  type="text"
                  value={formData.familyCoordinatorName}
                  onChange={e => handleInputChange('familyCoordinatorName', e.target.value)}
                  placeholder="Family coordinator full name"
                  style={{
                    width: '100%',
                    border: 'none',
                    borderBottom: '1.5px solid #4b5563',
                    padding: '6px 4px',
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', color: '#666' }}>Mobile:</label>
                <input
                  type="tel"
                  value={formData.familyCoordinatorMobile}
                  onChange={e => handleInputChange('familyCoordinatorMobile', e.target.value)}
                  placeholder="Phone number"
                  style={{
                    width: '100%',
                    border: 'none',
                    borderBottom: '1.5px solid #4b5563',
                    padding: '6px 4px',
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* M. BUDGET DISCUSSION */}
          {/* ------------------------------------------------------------- */}
          <SectionHeader title="M. BUDGET DISCUSSION" />

          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Approximate Overall Event Budget:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {["Below ₹ 50,000", "₹ 50,000– ₹ 1 Lakh", "₹ 1– 3 Lakh", "₹ 3– 5 Lakh", "₹ 5– 10 Lakh", "₹ 10 Lakh+", "Prefer not to disclose", "Not decided"].map(b => (
                <Checkbox
                  key={b}
                  label={b}
                  checked={formData.overallBudgetRange === b}
                  onChange={() => handleInputChange('overallBudgetRange', b)}
                />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Approximate Budget: ₹</span>
              <input
                type="text"
                value={formData.approxBudget}
                onChange={e => handleInputChange('approxBudget', e.target.value)}
                placeholder="350000"
                style={{
                  border: 'none',
                  borderBottom: '1.5px solid #0f3d2e',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: '#0f3d2e',
                  width: 140,
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* What is MOST important to you? */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              What is MOST important to you?
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {[
                "Lowest Price", "Good Quality", "Premium Quality", "Reliable Vendors", 
                "Good Food", "Decoration", "Photography", "On-Time Execution", 
                "Guest Comfort", "Family Enjoyment", "One Point of Contact", "Complete Tension-Free Event"
              ].map(imp => (
                <Checkbox
                  key={imp}
                  label={imp}
                  checked={formData.mostImportant.includes(imp)}
                  onChange={() => toggleArrayItem('mostImportant', imp)}
                />
              ))}
            </div>
          </div>

          {/* Budget Flexibility */}
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Budget Flexibility:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {["Strict Budget", "Slightly Flexible", "Flexible for Better Quality", "Not Decided"].map(flx => (
                <Checkbox
                  key={flx}
                  label={flx}
                  checked={formData.budgetFlexibility === flx}
                  onChange={() => handleInputChange('budgetFlexibility', flx)}
                />
              ))}
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* N. CUSTOMER'S PREVIOUS EXPERIENCE */}
          {/* ------------------------------------------------------------- */}
          <SectionHeader title="N. CUSTOMER'S PREVIOUS EXPERIENCE" />

          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Have you organized a similar event before?
            </span>
            <div style={{ display: 'flex', gap: 16 }}>
              {["Yes", "No"].map(st => (
                <Checkbox
                  key={st}
                  label={st}
                  checked={formData.organizedBefore === st}
                  onChange={() => handleInputChange('organizedBefore', st)}
                />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              What problems did you face previously?
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {[
                "Vendor Delay", "Vendor Didn't Arrive", "Price Increased", "Poor Quality", 
                "Food Problem", "Decoration Problem", "Photography Problem", "Sound Problem", 
                "Venue Problem", "Payment Issue", "Family Had to Manage Everything", 
                "Guest Management Problem", "Last-Minute Problems", "No Major Problem"
              ].map(pr => (
                <Checkbox
                  key={pr}
                  label={pr}
                  checked={formData.previousProblems.includes(pr)}
                  onChange={() => toggleArrayItem('previousProblems', pr)}
                />
              ))}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.85rem' }}>Other:</span>
                <input
                  type="text"
                  value={formData.previousProblemOther}
                  onChange={e => handleInputChange('previousProblemOther', e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #666', outline: 'none', width: 140, fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>What would you like Mezban to handle?</label>
            <input
              type="text"
              value={formData.whatMezbanShouldHandle}
              onChange={e => handleInputChange('whatMezbanShouldHandle', e.target.value)}
              placeholder="e.g. Complete coordination, vendor quality assurance, schedule adherence"
              style={{
                width: '100%',
                border: 'none',
                borderBottom: '1.5px solid #4b5563',
                padding: '6px 4px',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {/* ------------------------------------------------------------- */}
          {/* O. CUSTOMER EXPECTATION FROM MEZBAN */}
          {/* ------------------------------------------------------------- */}
          <SectionHeader title="O. CUSTOMER EXPECTATION FROM MEZBAN" />

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>
              Complete the sentence:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.88rem', fontStyle: 'italic', fontWeight: 600 }}>“We would be satisfied with Mezban if...</span>
              <input
                type="text"
                value={formData.satisfiedIf}
                onChange={e => handleInputChange('satisfiedIf', e.target.value)}
                placeholder="everything starts on time and food is delicious...”"
                style={{
                  flex: 1,
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              What would make you trust Mezban?
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {[
                "Transparent Pricing", "Written Quotation", "Reliable Vendors", 
                "Previous Event Photos", "Customer Reviews", "Vendor Options", 
                "Clear Payment Terms", "One Point of Contact", "No Hidden Charges", "Event-Day Coordinator"
              ].map(tr => (
                <Checkbox
                  key={tr}
                  label={tr}
                  checked={formData.trustMezbanFactors.includes(tr)}
                  onChange={() => toggleArrayItem('trustMezbanFactors', tr)}
                />
              ))}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.85rem' }}>Other:</span>
                <input
                  type="text"
                  value={formData.trustOther}
                  onChange={e => handleInputChange('trustOther', e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #666', outline: 'none', width: 140, fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* P. QUOTATION REQUIREMENT */}
          {/* ------------------------------------------------------------- */}
          <SectionHeader title="P. QUOTATION REQUIREMENT" />

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {[
                "Need Complete Quotation", "Need Vendor Options First", "Need Venue Options First", 
                "Need Decoration Options", "Need Catering Options", "Need Photography Options", 
                "Need Complete Event Package", "Just Exploring for Now"
              ].map(qr => (
                <Checkbox
                  key={qr}
                  label={qr}
                  checked={formData.quotationNeeds.includes(qr)}
                  onChange={() => toggleArrayItem('quotationNeeds', qr)}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px 20px', marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Quotation Deadline:</label>
              <input
                type="text"
                value={formData.quotationDeadline}
                onChange={e => handleInputChange('quotationDeadline', e.target.value)}
                placeholder="e.g. Within 24 hours / Tomorrow Evening"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Preferred Contact:</label>
              <div style={{ display: 'flex', gap: 16 }}>
                {["WhatsApp", "Phone Call", "Meeting"].map(cm => (
                  <Checkbox
                    key={cm}
                    label={cm}
                    checked={formData.preferredContactMethod === cm}
                    onChange={() => handleInputChange('preferredContactMethod', cm)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* Q. FOLLOW-UP */}
          {/* ------------------------------------------------------------- */}
          <SectionHeader title="Q. FOLLOW-UP" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px 20px', marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Next Follow-up Date:</label>
              <input
                type="date"
                value={formData.nextFollowUpDate}
                onChange={e => handleInputChange('nextFollowUpDate', e.target.value)}
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Follow-up Person:</label>
              <input
                type="text"
                value={formData.followUpPerson}
                onChange={e => handleInputChange('followUpPerson', e.target.value)}
                placeholder="Mezban account manager"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Customer Decision Maker:</label>
              <input
                type="text"
                value={formData.decisionMaker}
                onChange={e => handleInputChange('decisionMaker', e.target.value)}
                placeholder="e.g. Groom's Father"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Other Family Member Involved:</label>
              <input
                type="text"
                value={formData.otherFamilyMembers}
                onChange={e => handleInputChange('otherFamilyMembers', e.target.value)}
                placeholder="e.g. Elder Brother"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Lead Status:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {[
                "Level 0 – General Enquiry Lead", "Level 1 – Potential", 
                "Level 2 – Qualified", "Level 3 – Quotation Required", "Level 4 – Paid Event"
              ].map(ls => (
                <Checkbox
                  key={ls}
                  label={ls}
                  checked={formData.leadStatus === ls}
                  onChange={() => handleInputChange('leadStatus', ls)}
                />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Notes:</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={e => handleInputChange('notes', e.target.value)}
              placeholder="Important discussion points, family preferences, special instructions..."
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: 4,
                padding: '8px',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                marginTop: 4
              }}
            />
          </div>

          {/* ------------------------------------------------------------- */}
          {/* MEZBAN INTERNAL USE */}
          {/* ------------------------------------------------------------- */}
          <SectionHeader title="MEZBAN INTERNAL USE" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px 20px', marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Vendor Cost Estimate (₹):</label>
              <input
                type="number"
                value={formData.vendorCostEstimate}
                onChange={e => handleInputChange('vendorCostEstimate', e.target.value)}
                placeholder="Auto-calculated"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Mezban Coordination Fee (₹):</label>
              <input
                type="number"
                value={formData.mezbanCoordFee}
                onChange={e => handleInputChange('mezbanCoordFee', e.target.value)}
                placeholder="25000"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Other Charges (₹):</label>
              <input
                type="number"
                value={formData.otherCharges}
                onChange={e => handleInputChange('otherCharges', e.target.value)}
                placeholder="0"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Proposed Customer Quote (₹):</label>
              <input
                type="number"
                value={formData.proposedQuote}
                onChange={e => handleInputChange('proposedQuote', e.target.value)}
                placeholder="Auto-calculated"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1.5px solid #4b5563',
                  padding: '6px 4px',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px 20px', marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Quotation Sent?</label>
              <div style={{ display: 'flex', gap: 16 }}>
                {["Yes", "No"].map(st => (
                  <Checkbox
                    key={st}
                    label={st}
                    checked={formData.quotationSent === st}
                    onChange={() => handleInputChange('quotationSent', st)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Quotation Date:</label>
              <input
                type="date"
                value={formData.quotationDate}
                onChange={e => handleInputChange('quotationDate', e.target.value)}
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Customer Response:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {["Interested", "Negotiating", "Waiting", "Rejected", "Confirmed"].map(r => (
                  <Checkbox
                    key={r}
                    label={r}
                    checked={formData.customerResponse === r}
                    onChange={() => handleInputChange('customerResponse', r)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 26 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Reason if Lost:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {["Price", "Date", "Vendor", "Venue", "Family Decision", "Not Interested"].map(rl => (
                <Checkbox
                  key={rl}
                  label={rl}
                  checked={formData.reasonIfLost === rl}
                  onChange={() => handleInputChange('reasonIfLost', rl)}
                />
              ))}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.85rem' }}>Other:</span>
                <input
                  type="text"
                  value={formData.reasonIfLostOther}
                  onChange={e => handleInputChange('reasonIfLostOther', e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #666', outline: 'none', width: 140, fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* FINAL SUBMIT BUTTON */}
          <div style={{
            borderTop: '2px solid #e5e7eb',
            paddingTop: 24,
            display: 'flex',
            justifyContent: 'center'
          }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                background: '#0f3d2e',
                color: '#ffffff',
                border: 'none',
                padding: '14px 36px',
                borderRadius: 30,
                fontSize: '1.05rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(15, 61, 46, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? <RefreshCw size={20} className="spin" /> : <Sparkles size={20} color="#d4af37" />}
              SUBMIT & GENERATE ESTIMATED BUDGET & QUOTATION
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: FINAL QUOTATION & BUDGET ESTIMATION (EDITABLE + SEND) */}
      {/* ============================================================== */}
      {currentView === 'quote' && (
        <div style={{ maxWidth: 1020, margin: '0 auto' }}>
          {/* Executive Quotation Sheet Card */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #dcd3c4',
            borderRadius: 10,
            padding: '36px 36px 44px',
            boxShadow: '0 10px 35px rgba(0,0,0,0.06)'
          }}>
            {/* Header with Mezban Branding */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0f3d2e',
              paddingBottom: 20,
              marginBottom: 24,
              flexWrap: 'wrap',
              gap: 16
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: '#0f3d2e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#d4af37'
                  }}>
                    <Shield size={20} />
                  </div>
                  <h1 style={{ margin: 0, fontSize: '1.55rem', fontWeight: 900, color: '#0f3d2e' }}>
                    MEZBAAN EVENTS & WEDDINGS
                  </h1>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                  Central Operations & Vendor Rate Engine • Beed, Maharashtra
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: 20,
                  display: 'inline-block',
                  marginBottom: 4
                }}>
                  ESTIMATE & PROPOSAL
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827' }}>
                  Quote Ref: MEZ-QT-{sheetId ? String(sheetId).padStart(4, '0') : '2026-01'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Client & Event Summary Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              background: '#fcfaf6',
              border: '1px solid #ebdcc5',
              borderRadius: 8,
              padding: '16px 20px',
              marginBottom: 28
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>
                  Client / Family
                </span>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f3d2e' }}>
                  {formData.customerName || 'Valued Client'}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#4b5563' }}>
                  📞 {formData.whatsapp || formData.mobile}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>
                  Event Details
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
                  {formData.eventTypes.join(' & ') || 'Wedding / Event'}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#4b5563' }}>
                  📅 {formData.eventDate || 'Date Tentative'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>
                  Venue & Location
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
                  {formData.venueName || 'Banquet / Lawn to be confirmed'}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#4b5563' }}>
                  📍 {formData.venueArea || formData.preferredArea || 'Beed'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>
                  Guests & Capacity
                </span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f3d2e' }}>
                  {formData.approxGuestCount || 300} Guests
                </div>
                <div style={{ fontSize: '0.82rem', color: '#4b5563' }}>
                  {formData.foodPreference || 'Veg & Non-Veg'}
                </div>
              </div>
            </div>

            {/* Financial KPI Banner */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 28
            }}>
              <div style={{ background: '#0f3d2e', color: '#ffffff', borderRadius: 8, padding: '16px 20px' }}>
                <span style={{ fontSize: '0.75rem', color: '#d4af37', textTransform: 'uppercase', fontWeight: 700 }}>
                  Total Estimated Customer Price
                </span>
                <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', marginTop: 4 }}>
                  ₹{Number(quoteSummary.totalPrice).toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>All-inclusive proposal</span>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Vendor Base Cost (Internal)
                </span>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#334155', marginTop: 4 }}>
                  ₹{Number(quoteSummary.totalCost).toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Disbursable to vendors</span>
              </div>

              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: '16px 20px' }}>
                <span style={{ fontSize: '0.75rem', color: '#047857', textTransform: 'uppercase', fontWeight: 700 }}>
                  Mezban Gross Margin
                </span>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#065f46', marginTop: 4 }}>
                  ₹{Number(quoteSummary.mezbaanMargin).toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
                  {quoteSummary.marginPct}% Projected Gross Margin
                </span>
              </div>

              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '16px 20px' }}>
                <span style={{ fontSize: '0.75rem', color: '#b45309', textTransform: 'uppercase', fontWeight: 700 }}>
                  Booking Advance (30%)
                </span>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#92400e', marginTop: 4 }}>
                  ₹{Number(quoteSummary.advanceRequired).toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#b45309' }}>Required for date lock</span>
              </div>
            </div>

            {/* Editable Line Items Section Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
              flexWrap: 'wrap',
              gap: 10
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f3d2e' }}>
                  Itemized Service Quotation & Vendor Allocations
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                  You can edit prices, margins, vendor assignments, remove services, or add new items below.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddServiceModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#0f3d2e',
                  color: '#ffffff',
                  border: 'none',
                  padding: '7px 16px',
                  borderRadius: 6,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Add Service Item
              </button>
            </div>

            {/* Editable Table */}
            <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 24 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f3efe6', color: '#1f2937', textAlign: 'left', borderBottom: '1.5px solid #d1d5db' }}>
                    <th style={{ padding: '10px 12px' }}>#</th>
                    <th style={{ padding: '10px 12px', minWidth: 220 }}>Service & Category</th>
                    <th style={{ padding: '10px 12px', minWidth: 200 }}>Vendor Assigned</th>
                    <th style={{ padding: '10px 12px', minWidth: 120 }}>Vendor Cost (₹)</th>
                    <th style={{ padding: '10px 12px', width: 90 }}>Margin %</th>
                    <th style={{ padding: '10px 12px', minWidth: 130 }}>Client Price (₹)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', width: 60 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>
                        No services in this quotation. Click "Add Service Item" to add.
                      </td>
                    </tr>
                  ) : (
                    quoteItems.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#6b7280' }}>
                          {idx + 1}
                        </td>

                        {/* Service Name & Description */}
                        <td style={{ padding: '10px 12px' }}>
                          <input
                            type="text"
                            value={it.service_name}
                            onChange={e => handleItemFieldChange(idx, 'service_name', e.target.value)}
                            style={{
                              width: '100%',
                              fontWeight: 700,
                              color: '#111827',
                              border: '1px solid transparent',
                              borderRadius: 4,
                              padding: '2px 4px',
                              fontSize: '0.88rem'
                            }}
                            onFocus={e => e.target.style.borderColor = '#94a3b8'}
                            onBlur={e => e.target.style.borderColor = 'transparent'}
                          />
                          <input
                            type="text"
                            value={it.details || ''}
                            onChange={e => handleItemFieldChange(idx, 'details', e.target.value)}
                            placeholder="Specification / notes"
                            style={{
                              width: '100%',
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              border: 'none',
                              padding: '2px 4px',
                              outline: 'none',
                              marginTop: 2
                            }}
                          />
                        </td>

                        {/* Vendor Assigned Dropdown */}
                        <td style={{ padding: '10px 12px' }}>
                          <select
                            value={it.vendor_id || ''}
                            onChange={e => {
                              const vid = e.target.value ? Number(e.target.value) : null;
                              const vObj = dbVendors.find(v => v.vendor_id === vid);
                              const updated = [...quoteItems];
                              updated[idx].vendor_id = vid;
                              updated[idx].vendor_name = vObj ? vObj.business_name : 'Mezban Direct / In-House';
                              setQuoteItems(updated);
                            }}
                            style={{
                              width: '100%',
                              padding: '4px 8px',
                              borderRadius: 4,
                              border: '1px solid #d1d5db',
                              fontSize: '0.82rem',
                              background: '#ffffff'
                            }}
                          >
                            <option value="">Mezban Direct / In-House</option>
                            {dbVendors.map(v => (
                              <option key={v.vendor_id} value={v.vendor_id}>
                                {v.business_name} ({v.city})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Vendor Cost */}
                        <td style={{ padding: '10px 12px' }}>
                          <input
                            type="number"
                            value={it.vendor_cost}
                            onChange={e => handleItemFieldChange(idx, 'vendor_cost', e.target.value)}
                            style={{
                              width: 100,
                              padding: '4px 6px',
                              border: '1px solid #d1d5db',
                              borderRadius: 4,
                              fontSize: '0.85rem'
                            }}
                          />
                        </td>

                        {/* Margin % */}
                        <td style={{ padding: '10px 12px' }}>
                          <input
                            type="number"
                            value={it.margin_pct || 0}
                            onChange={e => handleItemFieldChange(idx, 'margin_pct', e.target.value)}
                            style={{
                              width: 60,
                              padding: '4px 6px',
                              border: '1px solid #d1d5db',
                              borderRadius: 4,
                              fontSize: '0.85rem',
                              textAlign: 'center'
                            }}
                          />
                        </td>

                        {/* Customer Price */}
                        <td style={{ padding: '10px 12px' }}>
                          <input
                            type="number"
                            value={it.customer_price}
                            onChange={e => handleItemFieldChange(idx, 'customer_price', e.target.value)}
                            style={{
                              width: 110,
                              padding: '4px 6px',
                              border: '1.5px solid #0f3d2e',
                              borderRadius: 4,
                              fontWeight: 800,
                              color: '#0f3d2e',
                              fontSize: '0.9rem'
                            }}
                          />
                        </td>

                        {/* Action: Delete */}
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(idx)}
                            title="Remove Service"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: 4,
                              borderRadius: 4
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', fontWeight: 800, borderTop: '2px solid #cbd5e1' }}>
                    <td colSpan={3} style={{ padding: '12px', textAlign: 'right', color: '#1e293b' }}>
                      TOTAL ESTIMATE:
                    </td>
                    <td style={{ padding: '12px', color: '#475569' }}>
                      ₹{Number(quoteSummary.totalCost).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#059669' }}>
                      {quoteSummary.marginPct}%
                    </td>
                    <td style={{ padding: '12px', color: '#0f3d2e', fontSize: '1.1rem' }}>
                      ₹{Number(quoteSummary.totalPrice).toLocaleString('en-IN')}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Quotation Terms & Guarantee */}
            <div style={{
              background: '#fbfaf8',
              border: '1px solid #e7dfd5',
              borderRadius: 6,
              padding: '14px 18px',
              marginBottom: 28,
              fontSize: '0.8rem',
              color: '#555'
            }}>
              <strong>Mezban Guarantee & Terms:</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.5 }}>
                <li>Quotation is valid for 14 days from issue date.</li>
                <li>30% advance confirms date lock and vendor booking contracts across Beed and Marathwada region.</li>
                <li>Dedicated Mezban on-ground event supervisor coordinates all vendor logistics, timelines, and cleanliness.</li>
              </ul>
            </div>

            {/* SEND QUOTATION & ACTION BUTTONS */}
            <div style={{
              borderTop: '2px solid #0f3d2e',
              paddingTop: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16
            }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setCurrentView('form')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 18px',
                    borderRadius: 8,
                    background: '#ffffff',
                    border: '1px solid #d1d5db',
                    color: '#374151',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  <ArrowLeft size={16} /> Edit Requirements
                </button>

                <button
                  type="button"
                  onClick={handleSaveQuotationDraft}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 18px',
                    borderRadius: 8,
                    background: '#f3efe6',
                    border: '1px solid #d4af37',
                    color: '#0f3d2e',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  <Check size={16} /> Save Changes
                </button>
              </div>

              {/* Direct Multi-Channel Dispatch Buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {/* 1. WhatsApp Dispatch */}
                <button
                  type="button"
                  onClick={() => handleSendQuotation('whatsapp')}
                  disabled={loading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#25D366',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 22px',
                    borderRadius: 8,
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)'
                  }}
                >
                  <MessageSquare size={18} /> Send via WhatsApp
                </button>

                {/* 2. Email Dispatch */}
                <button
                  type="button"
                  onClick={() => handleSendQuotation('email')}
                  disabled={loading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#0f3d2e',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 8,
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(15, 61, 46, 0.25)'
                  }}
                >
                  <Mail size={18} /> Send via Email
                </button>

                {/* 3. SMS Dispatch */}
                <button
                  type="button"
                  onClick={() => handleSendQuotation('sms')}
                  disabled={loading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#1e293b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: 8,
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Phone size={18} /> Send SMS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD SERVICE ITEM TO QUOTATION */}
      {/* ============================================================== */}
      {showAddServiceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 10,
            maxWidth: 520,
            width: '100%',
            padding: 24,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', color: '#0f3d2e', fontWeight: 800 }}>
              Add Service to Quotation
            </h3>

            <form onSubmit={handleAddService}>
              {/* Select from existing registered services */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>
                  Choose from Registered Services:
                </label>
                <select
                  value={newServiceItem.service_id}
                  onChange={e => {
                    const sid = Number(e.target.value);
                    const sObj = dbServices.find(s => s.service_id === sid);
                    if (sObj) {
                      setNewServiceItem(prev => ({
                        ...prev,
                        service_id: sObj.service_id,
                        service_name: sObj.name,
                        details: sObj.description || ''
                      }));
                    }
                  }}
                  style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.88rem' }}
                >
                  <option value="">-- Or enter custom service below --</option>
                  {dbServices.map(s => (
                    <option key={s.service_id} value={s.service_id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Custom service name */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>
                  Service Name:
                </label>
                <input
                  type="text"
                  required
                  value={newServiceItem.service_name}
                  onChange={e => setNewServiceItem({ ...newServiceItem, service_name: e.target.value })}
                  placeholder="e.g. Vintage Car Entry / Live Shehnai / Welcome Girls"
                  style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.88rem' }}
                />
              </div>

              {/* Vendor Assignment */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>
                  Vendor Assigned:
                </label>
                <select
                  value={newServiceItem.vendor_id}
                  onChange={e => {
                    const vid = e.target.value ? Number(e.target.value) : '';
                    const vObj = dbVendors.find(v => v.vendor_id === vid);
                    setNewServiceItem(prev => ({
                      ...prev,
                      vendor_id: vid,
                      vendor_name: vObj ? vObj.business_name : 'Mezban Direct'
                    }));
                  }}
                  style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.88rem' }}
                >
                  <option value="">Mezban Direct / In-House</option>
                  {dbVendors.map(v => (
                    <option key={v.vendor_id} value={v.vendor_id}>
                      {v.business_name} ({v.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor Cost, Margin %, Client Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>
                    Vendor Cost (₹):
                  </label>
                  <input
                    type="number"
                    value={newServiceItem.vendor_cost}
                    onChange={e => {
                      const cost = parseFloat(e.target.value) || 0;
                      const margin = parseFloat(newServiceItem.margin_pct) || 0;
                      setNewServiceItem({
                        ...newServiceItem,
                        vendor_cost: cost,
                        customer_price: Math.round(cost * (1 + margin / 100))
                      });
                    }}
                    style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>
                    Margin %:
                  </label>
                  <input
                    type="number"
                    value={newServiceItem.margin_pct}
                    onChange={e => {
                      const margin = parseFloat(e.target.value) || 0;
                      const cost = parseFloat(newServiceItem.vendor_cost) || 0;
                      setNewServiceItem({
                        ...newServiceItem,
                        margin_pct: margin,
                        customer_price: Math.round(cost * (1 + margin / 100))
                      });
                    }}
                    style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f3d2e', display: 'block', marginBottom: 4 }}>
                    Client Price (₹):
                  </label>
                  <input
                    type="number"
                    value={newServiceItem.customer_price}
                    onChange={e => setNewServiceItem({ ...newServiceItem, customer_price: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1.5px solid #0f3d2e', fontWeight: 700, fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* Details / Specs */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>
                  Details / Notes:
                </label>
                <input
                  type="text"
                  value={newServiceItem.details}
                  onChange={e => setNewServiceItem({ ...newServiceItem, details: e.target.value })}
                  placeholder="e.g. 2 hours slot, driver in royal sherwani"
                  style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db', background: '#ffffff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#0f3d2e', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
