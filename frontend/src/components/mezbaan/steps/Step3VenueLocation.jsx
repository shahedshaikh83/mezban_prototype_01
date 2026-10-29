import React from 'react';
import { MapPin, Building, IndianRupee, Compass } from 'lucide-react';
import FormField from '../FormField';
import SelectField from '../SelectField';

export default function Step3VenueLocation({ formData, onChange, errors = {} }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SelectField
          label="Venue Status"
          name="venueSelected"
          value={formData.venueSelected || 'Yes'}
          onChange={(e) => onChange('venueSelected', e.target.value)}
          options={[
            { value: 'Yes', label: 'Venue Already Booked / Finalized' },
            { value: 'Shortlisted', label: 'Shortlisted (Need Mezban negotiation)' },
            { value: 'Need Mezban to find venue', label: 'Need Mezban to suggest & book venue' },
            { value: 'No', label: 'Not Decided Yet' }
          ]}
          icon={Building}
        />

        <FormField
          label="Venue Name & Address"
          name="venueName"
          value={formData.venueName}
          onChange={(e) => onChange('venueName', e.target.value)}
          placeholder="Royal Palace Banquet & Lawns, Jalna Road, Beed"
          icon={MapPin}
          error={errors.venueName}
        />

        <FormField
          label="Venue Area / City"
          name="venueArea"
          value={formData.venueArea}
          onChange={(e) => onChange('venueArea', e.target.value)}
          placeholder="Jalna Road, Beed"
          icon={Compass}
        />

        <SelectField
          label="Venue Type"
          name="venueType"
          value={formData.venueType || 'Banquet Hall + Open Lawn'}
          onChange={(e) => onChange('venueType', e.target.value)}
          options={[
            { value: 'Banquet Hall + Open Lawn', label: 'Banquet Hall + Open Lawn' },
            { value: 'AC Banquet Hall', label: 'AC Banquet Hall' },
            { value: 'Open Lawn & Garden', label: 'Open Lawn & Garden' },
            { value: 'Hotel Ballroom', label: 'Hotel Ballroom' },
            { value: 'Farmhouse / Resort', label: 'Farmhouse / Private Resort' },
            { value: 'Community Hall / Shadi Mahal', label: 'Community Hall / Shadi Mahal' }
          ]}
          icon={Building}
        />

        <FormField
          label="Approx. Venue Budget (₹)"
          name="maxVenueBudget"
          type="number"
          value={formData.maxVenueBudget}
          onChange={(e) => onChange('maxVenueBudget', e.target.value)}
          placeholder="75000"
          icon={IndianRupee}
          helperText="Standard banquet rates in Beed: ₹40,000 – ₹1,20,000"
        />
      </div>
    </div>
  );
}
