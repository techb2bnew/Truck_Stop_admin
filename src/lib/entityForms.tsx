import type { FieldDef, QuickKey } from '../components/formTypes'
import { lastWeekStarts, TODAY } from './format'
import { useAuth } from './auth'
import { db, useCollection } from '../services/store'
import { duplicateMessage } from './duplicates'

// One definition per thing that other forms can pick from a dropdown.
// The admin pages and the "+ Add new" popups both use these, so they can never drift apart.

export interface FormSpec {
  singular: string
  /** Anything with a create() that returns the new row. */
  collection: { create: (item: never) => Promise<{ id: string }> }
  fields: FieldDef[]
  defaults: Record<string, unknown>
  validate?: (values: Record<string, unknown>) => string | null
  onCreated?: (row: never) => void | Promise<void>
}

const NEXT_YEAR = new Date().getFullYear() + 1
const equipment = ['Van', 'Reefer', 'Flatbed'].map((v) => ({ value: v, label: v }))

export function useEntityForms(): Record<QuickKey, FormSpec> {
  const { user } = useAuth()
  const trainers = useCollection(db.trainers)
  const brokers = useCollection(db.brokers)
  const trucks = useCollection(db.trucks)
  const drivers = useCollection(db.drivers)
  const shippers = useCollection(db.shippers)
  const batches = useCollection(db.batches)

  return {
    batch: {
      singular: 'Batch',
      collection: db.batches as unknown as FormSpec['collection'],
      defaults: { name: '', trainerId: user?.id ?? '', description: '', startDate: TODAY },
      fields: [
        { name: 'name', label: 'Batch name', type: 'text', required: true, span: 2 },
        { name: 'trainerId', label: 'Trainer', type: 'select', required: true, options: trainers.map((t) => ({ value: t.id, label: t.name })) },
        { name: 'startDate', label: 'Start date', type: 'date', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
      ],
      validate: (v) => duplicateMessage(batches, v, 'batch', [{ field: 'name', label: 'name' }]),
    },

    broker: {
      singular: 'Broker',
      collection: db.brokers as unknown as FormSpec['collection'],
      defaults: { company: '', contactName: '', email: '', phone: '', mcNumber: '', creditRating: 'B', daysToPay: 30, address: '' },
      fields: [
        { name: 'company', label: 'Company', type: 'text', required: true, span: 2 },
        { name: 'contactName', label: 'Contact name', type: 'text', required: true },
        { name: 'mcNumber', label: 'MC number', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone', type: 'phone', required: true },
        { name: 'creditRating', label: 'Credit rating', type: 'select', required: true, options: ['A', 'B', 'C', 'D'].map((v) => ({ value: v, label: v })) },
        { name: 'daysToPay', label: 'Days to pay', type: 'number', min: 0, max: 120, integer: true, required: true },
        { name: 'address', label: 'City, state', type: 'text', span: 2 },
      ],
      validate: (v) => duplicateMessage(brokers, v, 'broker', [{ field: 'email', label: 'email' }, { field: 'mcNumber', label: 'MC number' }]),
    },

    shipper: {
      singular: 'Shipper',
      collection: db.shippers as unknown as FormSpec['collection'],
      defaults: { company: '', contactName: '', email: '', phone: '', city: '', state: '', industry: '' },
      fields: [
        { name: 'company', label: 'Company', type: 'text', required: true, span: 2 },
        { name: 'contactName', label: 'Contact name', type: 'text', required: true },
        { name: 'industry', label: 'Industry', type: 'text' },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone', type: 'phone', required: true },
        { name: 'city', label: 'City', type: 'text', required: true },
        { name: 'state', label: 'State', type: 'state', required: true, placeholder: 'OH' },
      ],
      validate: (v) => duplicateMessage(shippers, v, 'shipper', [{ field: 'email', label: 'email' }]),
    },

    truck: {
      singular: 'Truck',
      collection: db.trucks as unknown as FormSpec['collection'],
      defaults: { unitNumber: '', equipment: 'Van', make: '', year: 2022, plate: '', capacityLbs: 45000, lengthFt: 53, mpg: 7, locationCity: '', locationState: '', status: 'available' },
      fields: [
        { name: 'unitNumber', label: 'Unit number', type: 'text', required: true, placeholder: 'TS-109' },
        { name: 'equipment', label: 'Equipment', type: 'select', required: true, options: equipment },
        { name: 'make', label: 'Make and model', type: 'text', required: true },
        { name: 'year', label: 'Year', type: 'number', min: 1990, max: NEXT_YEAR, integer: true, required: true },
        { name: 'plate', label: 'Plate', type: 'text', required: true },
        { name: 'capacityLbs', label: 'Capacity (lb)', type: 'number', min: 1, max: 100000, integer: true, required: true },
        { name: 'lengthFt', label: 'Length (ft)', type: 'number', min: 1, max: 100, integer: true, required: true },
        { name: 'mpg', label: 'MPG', type: 'number', min: 1, max: 25, step: '0.1', required: true },
        { name: 'locationCity', label: 'Current city', type: 'text', required: true },
        { name: 'locationState', label: 'Current state', type: 'state', required: true },
        { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'available', label: 'Available' }, { value: 'in_use', label: 'In use' }, { value: 'maintenance', label: 'Maintenance' }] },
      ],
      validate: (v) => duplicateMessage(trucks, v, 'truck', [{ field: 'unitNumber', label: 'unit number' }, { field: 'plate', label: 'plate' }]),
    },

    driver: {
      singular: 'Driver',
      collection: db.drivers as unknown as FormSpec['collection'],
      defaults: { name: '', phone: '', licenseNo: '', experienceYears: 1, homeCity: '', payPerMile: 0.6, truckId: null, availability: 'available' },
      fields: [
        { name: 'name', label: 'Full name', type: 'text', required: true },
        { name: 'phone', label: 'Phone', type: 'phone', required: true },
        { name: 'licenseNo', label: 'CDL number', type: 'text', required: true },
        { name: 'experienceYears', label: 'Experience (years)', type: 'number', min: 0, max: 60, integer: true, required: true },
        { name: 'homeCity', label: 'Home city', type: 'text', required: true },
        { name: 'payPerMile', label: 'Pay per mile ($)', type: 'number', min: 0.01, max: 5, step: '0.01', required: true },
        { name: 'truckId', label: 'Assigned truck', type: 'select', nullable: true, options: trucks.map((t) => {
          const status = t.status === 'available' ? 'Available' : t.status === 'in_use' ? 'In use' : 'In repair'
          const owner = drivers.find((d) => d.truckId === t.id)
          return { value: t.id, label: `${t.unitNumber} (${t.equipment}) · ${status}${owner ? ` · driver: ${owner.name}` : ' · no driver'}` }
        }), addNew: { kind: 'truck', label: 'Add new truck' } },
        { name: 'availability', label: 'Availability', type: 'select', required: true, options: [{ value: 'available', label: 'Available' }, { value: 'on_trip', label: 'On trip' }, { value: 'off_duty', label: 'Off duty' }] },
      ],
      validate: (v) => duplicateMessage(drivers, v, 'driver', [{ field: 'licenseNo', label: 'CDL number' }, { field: 'phone', label: 'phone number', kind: 'phone' }]),
    },

    load: {
      singular: 'Load',
      collection: db.loads as unknown as FormSpec['collection'],
      defaults: {
        originCity: '', originState: '', destCity: '', destState: '', pickupDate: TODAY, deliveryDate: TODAY,
        equipment: 'Van', size: 'Full', weightLbs: 40000, lengthFt: 53, commodity: '', loadedMiles: 0, deadheadMiles: 0,
        postedRate: null, brokerId: null, postedAt: `${TODAY}T09:00:00`, notes: '',
      },
      fields: [
        { name: 'originCity', label: 'Origin city', type: 'text', required: true },
        { name: 'originState', label: 'Origin state', type: 'state', required: true, placeholder: 'IN' },
        { name: 'destCity', label: 'Destination city', type: 'text', required: true },
        { name: 'destState', label: 'Destination state', type: 'state', required: true, placeholder: 'OH' },
        { name: 'pickupDate', label: 'Pickup date', type: 'date', required: true },
        { name: 'deliveryDate', label: 'Delivery date', type: 'date', required: true },
        { name: 'equipment', label: 'Equipment', type: 'select', required: true, options: equipment },
        { name: 'size', label: 'Load size', type: 'select', required: true, options: [{ value: 'Full', label: 'Full' }, { value: 'Partial', label: 'Partial' }] },
        { name: 'weightLbs', label: 'Weight (lb)', type: 'number', min: 1, max: 100000, integer: true, required: true },
        { name: 'lengthFt', label: 'Length (ft)', type: 'number', min: 1, max: 100, integer: true, required: true },
        { name: 'commodity', label: 'Commodity', type: 'text', required: true },
        { name: 'brokerId', label: 'Broker', type: 'select', nullable: true, options: brokers.map((b) => ({ value: b.id, label: b.company })), addNew: { kind: 'broker', label: 'Add new broker' } },
        { name: 'loadedMiles', label: 'Loaded miles', type: 'number', min: 1, max: 5000, integer: true, required: true },
        { name: 'deadheadMiles', label: 'Deadhead miles', type: 'number', min: 0, max: 1000, integer: true, required: true },
        { name: 'postedRate', label: 'Posted rate ($)', type: 'number', min: 1, max: 100000, nullable: true, hint: 'Leave blank for "No rate posted".' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ],
      validate: (v) => (String(v.deliveryDate) < String(v.pickupDate) ? 'Delivery date cannot be before the pickup date' : null),
      // Every new load gets a starter estimate and a 4-week trend so Rate Insights is never empty.
      onCreated: (async (l: { id: string; loadedMiles: number }) => {
        const booked = Math.round((l.loadedMiles || 1) * 3)
        await db.rateEstimates.create({ loadId: l.id, low: Math.round(booked * 0.87), booked, high: Math.round(booked * 1.15), confidence: 'Medium' })
        for (const [i, w] of lastWeekStarts().entries()) {
          await db.rateTrends.create({ loadId: l.id, weekStart: w, avgRate: Math.round(booked * [0.94, 0.97, 1.02, 1][i]) })
        }
      }) as FormSpec['onCreated'],
    },

    document: {
      singular: 'Document',
      collection: db.documents as unknown as FormSpec['collection'],
      defaults: { name: '', type: 'rate_confirmation', description: '', fileName: '', fields: [] },
      fields: [
        { name: 'name', label: 'Document name', type: 'text', required: true },
        { name: 'type', label: 'Type', type: 'select', required: true, options: [{ value: 'rate_confirmation', label: 'Rate Confirmation' }, { value: 'bol', label: 'BOL' }, { value: 'pod', label: 'POD' }, { value: 'other', label: 'Other' }] },
        { name: 'fileName', label: 'File name', type: 'text', hint: 'Real file upload comes with Supabase Storage.' },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'fields', label: 'Fields the student must fill (one per line)', type: 'lines', placeholder: 'Carrier name\nLoad number' },
      ],
    },

    rule: {
      singular: 'Negotiation rule',
      collection: db.negotiationRules as unknown as FormSpec['collection'],
      defaults: { name: '', openingOffer: 0, targetRate: 0, minRate: 0, maxRate: 0, maxRounds: 3, stepPercent: 3, acceptMessage: 'Deal. Send the rate confirmation.', counterMessage: 'This is the best I can do.', rejectMessage: 'That is too high for this lane.' },
      fields: [
        { name: 'name', label: 'Rule name', type: 'text', required: true, span: 2 },
        { name: 'openingOffer', label: 'Opening offer ($)', type: 'number', min: 1, required: true },
        { name: 'targetRate', label: 'Target rate ($)', type: 'number', min: 1, required: true, hint: 'Offers at or below this are accepted straight away.' },
        { name: 'minRate', label: 'Minimum rate ($)', type: 'number', min: 1, required: true },
        { name: 'maxRate', label: 'Maximum rate ($)', type: 'number', min: 1, required: true, hint: 'The other side never goes above this.' },
        { name: 'maxRounds', label: 'Max rounds', type: 'number', min: 1, max: 10, integer: true, required: true },
        { name: 'stepPercent', label: 'Move per round (%)', type: 'number', min: 0, max: 50, step: '0.5', required: true },
        { name: 'acceptMessage', label: 'Accept message', type: 'text' },
        { name: 'counterMessage', label: 'Counter message', type: 'text' },
        { name: 'rejectMessage', label: 'Reject message', type: 'text' },
      ],
      validate: (v) => {
        const { minRate, targetRate, maxRate, openingOffer } = v as Record<string, number | string>
        if (Number(openingOffer) <= 0) return 'Opening offer must be more than 0'
        return Number(minRate) <= Number(targetRate) && Number(targetRate) <= Number(maxRate) ? null : 'Order must be: minimum ≤ target ≤ maximum'
      },
    },
  }
}
