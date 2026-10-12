import type {
  AppNotification,
  AppSettings,
  Assignment,
  Attempt,
  Batch,
  Broker,
  Course,
  DocTemplate,
  Driver,
  Feedback,
  Lesson,
  Load,
  NegotiationRule,
  RateEstimate,
  RateTrend,
  Scenario,
  ScoringProfile,
  Shipper,
  ShipperRequest,
  Student,
  Trainer,
  Truck,
} from '../types'

export const trainers: Trainer[] = [
  { id: 'tr1', name: 'Admin Senior', email: 'admin@truckstop.com', role: 'super_admin' },
  { id: 'tr2', name: 'Mike Carter', email: 'mike@truckstop.com', role: 'trainer' },
]

export const batches: Batch[] = [
  { id: 'b1', name: 'Oct 2026 – Dispatch A', trainerId: 'tr1', description: 'First dispatcher batch of October', startDate: '2026-10-01' },
  { id: 'b2', name: 'Oct 2026 – Broker A', trainerId: 'tr2', description: 'Freight broker batch of October', startDate: '2026-10-05' },
  { id: 'b3', name: 'Sep 2026 – Mixed', trainerId: 'tr1', description: 'Completed September cohort', startDate: '2026-09-01' },
]

export const students: Student[] = [
  { id: 's1', name: 'Rahul Sharma', email: 'rahul@example.com', phone: '+91 98100 11111', roles: ['dispatcher'], batchId: 'b1', status: 'active', appAccess: true, inviteStatus: 'accepted', joinedAt: '2026-10-01' },
  { id: 's2', name: 'Priya Singh', email: 'priya@example.com', phone: '+91 98100 22222', roles: ['dispatcher'], batchId: 'b1', status: 'active', appAccess: true, inviteStatus: 'accepted', joinedAt: '2026-10-01' },
  { id: 's3', name: 'Amit Verma', email: 'amit@example.com', phone: '+91 98100 33333', roles: ['broker'], batchId: 'b2', status: 'active', appAccess: true, inviteStatus: 'accepted', joinedAt: '2026-10-05' },
  { id: 's4', name: 'Neha Gupta', email: 'neha@example.com', phone: '+91 98100 44444', roles: ['broker'], batchId: 'b2', status: 'active', appAccess: true, inviteStatus: 'accepted', joinedAt: '2026-10-05' },
  { id: 's5', name: 'Karan Mehta', email: 'karan@example.com', phone: '+91 98100 55555', roles: ['dispatcher', 'broker'], batchId: 'b3', status: 'active', appAccess: true, inviteStatus: 'accepted', joinedAt: '2026-09-01' },
  { id: 's6', name: 'Sneha Joshi', email: 'sneha@example.com', phone: '+91 98100 66666', roles: ['dispatcher'], batchId: 'b1', status: 'active', appAccess: true, inviteStatus: 'accepted', joinedAt: '2026-10-02' },
  { id: 's7', name: 'Vikram Rao', email: 'vikram@example.com', phone: '+91 98100 77777', roles: ['broker'], batchId: 'b2', status: 'inactive', appAccess: false, inviteStatus: 'accepted', joinedAt: '2026-10-06' },
  { id: 's8', name: 'Anjali Nair', email: 'anjali@example.com', phone: '+91 98100 88888', roles: ['dispatcher'], batchId: 'b3', status: 'active', appAccess: true, inviteStatus: 'accepted', joinedAt: '2026-09-02' },
  { id: 's9', name: 'Rohit Kumar', email: 'rohit@example.com', phone: '+91 98100 99999', roles: ['broker'], batchId: 'b3', status: 'suspended', appAccess: false, inviteStatus: 'accepted', joinedAt: '2026-09-03' },
  { id: 's10', name: 'Divya Iyer', email: 'divya@example.com', phone: '+91 98100 10101', roles: ['dispatcher'], batchId: null, status: 'active', appAccess: true, inviteStatus: 'pending', joinedAt: '2026-10-08' },
]

export const brokers: Broker[] = [
  { id: 'br1', company: 'Midwest Freight Brokers', contactName: 'Dan Miller', email: 'dan@midwestfb.com', phone: '(317) 555-0101', mcNumber: 'MC-482913', creditRating: 'A', daysToPay: 25, address: 'Indianapolis, IN' },
  { id: 'br2', company: 'Lone Star Logistics', contactName: 'Maria Lopez', email: 'maria@lonestarlog.com', phone: '(214) 555-0144', mcNumber: 'MC-731204', creditRating: 'B', daysToPay: 35, address: 'Dallas, TX' },
  { id: 'br3', company: 'Pacific Coast Carriers', contactName: 'Jason Lee', email: 'jason@pcc.com', phone: '(213) 555-0178', mcNumber: 'MC-905512', creditRating: 'A', daysToPay: 21, address: 'Los Angeles, CA' },
  { id: 'br4', company: 'Southeast Load Solutions', contactName: 'Tina Brooks', email: 'tina@selsolutions.com', phone: '(404) 555-0190', mcNumber: 'MC-612377', creditRating: 'C', daysToPay: 45, address: 'Atlanta, GA' },
  { id: 'br5', company: 'Great Lakes Transport', contactName: 'Paul Evans', email: 'paul@glt.com', phone: '(312) 555-0166', mcNumber: 'MC-228840', creditRating: 'B', daysToPay: 30, address: 'Chicago, IL' },
]

export const shippers: Shipper[] = [
  { id: 'sh1', company: 'Harvest Foods Inc.', contactName: 'Linda Park', email: 'linda@harvestfoods.com', phone: '(614) 555-0123', city: 'Columbus', state: 'OH', industry: 'Food & Beverage' },
  { id: 'sh2', company: 'Apex Building Supply', contactName: 'Tom Reed', email: 'tom@apexbs.com', phone: '(713) 555-0155', city: 'Houston', state: 'TX', industry: 'Construction' },
  { id: 'sh3', company: 'BrightTech Electronics', contactName: 'Sara Kim', email: 'sara@brighttech.com', phone: '(206) 555-0188', city: 'Seattle', state: 'WA', industry: 'Electronics' },
  { id: 'sh4', company: 'FreshLine Produce', contactName: 'Carlos Diaz', email: 'carlos@freshline.com', phone: '(305) 555-0112', city: 'Miami', state: 'FL', industry: 'Produce' },
]

export const shipperRequests: ShipperRequest[] = [
  { id: 'rq1', shipperId: 'sh1', originCity: 'Columbus', originState: 'OH', destCity: 'Newark', destState: 'NJ', pickupDate: '2026-10-15', equipment: 'Reefer', weightLbs: 38000, commodity: 'Frozen foods', offeredRate: 1850, notes: 'Temperature must stay at -10F.' },
  { id: 'rq2', shipperId: 'sh2', originCity: 'Houston', originState: 'TX', destCity: 'Nashville', destState: 'TN', pickupDate: '2026-10-16', equipment: 'Flatbed', weightLbs: 44000, commodity: 'Steel beams', offeredRate: 2150, notes: 'Tarps required.' },
  { id: 'rq3', shipperId: 'sh3', originCity: 'Seattle', originState: 'WA', destCity: 'Portland', destState: 'OR', pickupDate: '2026-10-14', equipment: 'Van', weightLbs: 18000, commodity: 'Consumer electronics', offeredRate: 780, notes: 'High value, no stops.' },
  { id: 'rq4', shipperId: 'sh4', originCity: 'Miami', originState: 'FL', destCity: 'Jacksonville', destState: 'FL', pickupDate: '2026-10-17', equipment: 'Reefer', weightLbs: 36000, commodity: 'Fresh produce', offeredRate: 1100, notes: 'Deliver within 24 hours.' },
]

export const trucks: Truck[] = [
  { id: 'tk1', unitNumber: 'TS-101', equipment: 'Van', make: 'Freightliner Cascadia', year: 2022, plate: 'IN-4821', capacityLbs: 45000, lengthFt: 53, mpg: 7.2, locationCity: 'Indianapolis', locationState: 'IN', status: 'available' },
  { id: 'tk2', unitNumber: 'TS-102', equipment: 'Reefer', make: 'Kenworth T680', year: 2021, plate: 'TX-9034', capacityLbs: 42000, lengthFt: 53, mpg: 6.6, locationCity: 'Dallas', locationState: 'TX', status: 'available' },
  { id: 'tk3', unitNumber: 'TS-103', equipment: 'Flatbed', make: 'Peterbilt 579', year: 2020, plate: 'TX-2210', capacityLbs: 48000, lengthFt: 48, mpg: 6.9, locationCity: 'Houston', locationState: 'TX', status: 'available' },
  { id: 'tk4', unitNumber: 'TS-104', equipment: 'Van', make: 'Volvo VNL 860', year: 2023, plate: 'CA-7712', capacityLbs: 45000, lengthFt: 53, mpg: 7.5, locationCity: 'Los Angeles', locationState: 'CA', status: 'in_use' },
  { id: 'tk5', unitNumber: 'TS-105', equipment: 'Van', make: 'International LT', year: 2019, plate: 'GA-5543', capacityLbs: 44000, lengthFt: 53, mpg: 6.8, locationCity: 'Atlanta', locationState: 'GA', status: 'available' },
  { id: 'tk6', unitNumber: 'TS-106', equipment: 'Reefer', make: 'Freightliner Cascadia', year: 2022, plate: 'OH-3098', capacityLbs: 43000, lengthFt: 53, mpg: 6.5, locationCity: 'Columbus', locationState: 'OH', status: 'maintenance' },
  { id: 'tk7', unitNumber: 'TS-107', equipment: 'Flatbed', make: 'Kenworth W990', year: 2021, plate: 'CO-6671', capacityLbs: 48000, lengthFt: 48, mpg: 6.7, locationCity: 'Denver', locationState: 'CO', status: 'available' },
  { id: 'tk8', unitNumber: 'TS-108', equipment: 'Van', make: 'Mack Anthem', year: 2020, plate: 'WA-1189', capacityLbs: 44000, lengthFt: 53, mpg: 7.0, locationCity: 'Seattle', locationState: 'WA', status: 'available' },
]

export const drivers: Driver[] = [
  { id: 'dr1', name: 'James Wilson', phone: '(317) 555-0201', licenseNo: 'IN-CDL-88421', experienceYears: 8, homeCity: 'Indianapolis, IN', payPerMile: 0.62, truckId: 'tk1', availability: 'available' },
  { id: 'dr2', name: 'Robert Garcia', phone: '(214) 555-0202', licenseNo: 'TX-CDL-55120', experienceYears: 12, homeCity: 'Dallas, TX', payPerMile: 0.68, truckId: 'tk2', availability: 'available' },
  { id: 'dr3', name: 'Michael Brown', phone: '(713) 555-0203', licenseNo: 'TX-CDL-77018', experienceYears: 5, homeCity: 'Houston, TX', payPerMile: 0.58, truckId: 'tk3', availability: 'available' },
  { id: 'dr4', name: 'David Martinez', phone: '(213) 555-0204', licenseNo: 'CA-CDL-33902', experienceYears: 15, homeCity: 'Los Angeles, CA', payPerMile: 0.72, truckId: 'tk4', availability: 'on_trip' },
  { id: 'dr5', name: 'Chris Johnson', phone: '(404) 555-0205', licenseNo: 'GA-CDL-66431', experienceYears: 3, homeCity: 'Atlanta, GA', payPerMile: 0.55, truckId: 'tk5', availability: 'available' },
  { id: 'dr6', name: 'Anthony Davis', phone: '(614) 555-0206', licenseNo: 'OH-CDL-90217', experienceYears: 9, homeCity: 'Columbus, OH', payPerMile: 0.64, truckId: 'tk6', availability: 'off_duty' },
  { id: 'dr7', name: 'Kevin Taylor', phone: '(303) 555-0207', licenseNo: 'CO-CDL-24780', experienceYears: 6, homeCity: 'Denver, CO', payPerMile: 0.6, truckId: 'tk7', availability: 'available' },
  { id: 'dr8', name: 'Brian Anderson', phone: '(206) 555-0208', licenseNo: 'WA-CDL-11893', experienceYears: 10, homeCity: 'Seattle, WA', payPerMile: 0.66, truckId: 'tk8', availability: 'available' },
]

type LoadSeed = [string, string, string, string, string, string, Load['equipment'], Load['size'], number, number, string, number, number, number | null, string]

const loadSeeds: LoadSeed[] = [
  ['Indianapolis', 'IN', 'Twinsburg', 'OH', '2026-10-14', '2026-10-15', 'Van', 'Full', 41000, 53, 'Auto parts', 330, 25, null, 'br1'],
  ['Dallas', 'TX', 'Atlanta', 'GA', '2026-10-14', '2026-10-17', 'Van', 'Full', 38000, 53, 'Packaged goods', 780, 60, 2250, 'br2'],
  ['Chicago', 'IL', 'Memphis', 'TN', '2026-10-15', '2026-10-16', 'Reefer', 'Full', 36000, 53, 'Dairy products', 530, 40, 1650, 'br5'],
  ['Los Angeles', 'CA', 'Phoenix', 'AZ', '2026-10-13', '2026-10-14', 'Van', 'Full', 33000, 53, 'Furniture', 370, 15, 1100, 'br3'],
  ['Atlanta', 'GA', 'Charlotte', 'NC', '2026-10-16', '2026-10-16', 'Van', 'Partial', 12000, 28, 'Retail goods', 245, 90, 780, 'br4'],
  ['Houston', 'TX', 'Nashville', 'TN', '2026-10-16', '2026-10-18', 'Flatbed', 'Full', 44000, 48, 'Steel beams', 665, 30, 2150, 'br2'],
  ['Denver', 'CO', 'Kansas City', 'MO', '2026-10-15', '2026-10-17', 'Flatbed', 'Full', 42000, 48, 'Lumber', 600, 75, null, 'br5'],
  ['Seattle', 'WA', 'Portland', 'OR', '2026-10-14', '2026-10-14', 'Van', 'Full', 18000, 53, 'Electronics', 175, 10, 780, 'br3'],
  ['Columbus', 'OH', 'Newark', 'NJ', '2026-10-15', '2026-10-16', 'Reefer', 'Full', 38000, 53, 'Frozen foods', 530, 55, 1850, 'br1'],
  ['Miami', 'FL', 'Jacksonville', 'FL', '2026-10-17', '2026-10-17', 'Reefer', 'Full', 36000, 53, 'Fresh produce', 345, 35, 1100, 'br4'],
  ['Kansas City', 'MO', 'St. Louis', 'MO', '2026-10-13', '2026-10-13', 'Van', 'Partial', 15000, 40, 'Paper rolls', 250, 20, 720, 'br5'],
  ['Phoenix', 'AZ', 'Dallas', 'TX', '2026-10-18', '2026-10-20', 'Van', 'Full', 40000, 53, 'Appliances', 1065, 45, null, 'br3'],
  ['Detroit', 'MI', 'Louisville', 'KY', '2026-10-14', '2026-10-15', 'Van', 'Full', 39000, 53, 'Automotive', 380, 30, 1050, 'br1'],
  ['Minneapolis', 'MN', 'Chicago', 'IL', '2026-10-15', '2026-10-16', 'Reefer', 'Full', 37000, 53, 'Beverages', 410, 50, 1220, 'br5'],
]

export const loads: Load[] = loadSeeds.map((s, i) => ({
  id: `ld${i + 1}`,
  originCity: s[0], originState: s[1], destCity: s[2], destState: s[3],
  pickupDate: s[4], deliveryDate: s[5], equipment: s[6], size: s[7],
  weightLbs: s[8], lengthFt: s[9], commodity: s[10], loadedMiles: s[11], deadheadMiles: s[12],
  postedRate: s[13], brokerId: s[14],
  postedAt: `2026-10-${String(9 + (i % 3)).padStart(2, '0')}T${String(8 + (i % 8)).padStart(2, '0')}:15:00`,
  notes: i % 4 === 0 ? 'Driver assist not required. Appointment needed.' : '',
}))

const rpm = [3.58, 2.9, 3.1, 3.0, 3.2, 3.2, 2.3, 4.4, 3.5, 3.2, 2.9, 2.4, 2.8, 3.0]
const conf: RateEstimate['confidence'][] = ['High', 'High', 'Medium', 'High', 'Low', 'High', 'Medium', 'High', 'High', 'Medium', 'Medium', 'High', 'High', 'Medium']

export const rateEstimates: RateEstimate[] = loads.map((l, i) => {
  const booked = Math.round(l.loadedMiles * rpm[i])
  return { id: `re${i + 1}`, loadId: l.id, low: Math.round(booked * 0.87), booked, high: Math.round(booked * 1.15), confidence: conf[i] }
})

const weeks = ['2026-09-21', '2026-09-28', '2026-10-05', '2026-10-12']
const factors = [0.94, 0.97, 1.02, 1]

export const rateTrends: RateTrend[] = loads.flatMap((l, i) =>
  weeks.map((w, k) => ({
    id: `rt${i + 1}_${k + 1}`,
    loadId: l.id,
    weekStart: w,
    avgRate: Math.round(rateEstimates[i].booked * factors[k]),
  })),
)

export const negotiationRules: NegotiationRule[] = [
  { id: 'nr1', name: 'Easy – flexible broker', openingOffer: 950, targetRate: 1100, minRate: 1000, maxRate: 1250, maxRounds: 4, stepPercent: 5, acceptMessage: 'Deal. Send me the rate confirmation.', counterMessage: 'I can meet you around this number.', rejectMessage: 'Sorry, that is too high for this lane.' },
  { id: 'nr2', name: 'Medium – firm broker', openingOffer: 1650, targetRate: 1850, minRate: 1700, maxRate: 1950, maxRounds: 3, stepPercent: 3, acceptMessage: 'Okay, we can do that. Booking it.', counterMessage: 'That is the best I can do right now.', rejectMessage: 'No, my customer will not pay that.' },
  { id: 'nr3', name: 'Hard – tight margin', openingOffer: 2000, targetRate: 2200, minRate: 2100, maxRate: 2300, maxRounds: 2, stepPercent: 2, acceptMessage: 'Fine. Done at that rate.', counterMessage: 'I cannot move much more.', rejectMessage: 'Too high. I will call another carrier.' },
  { id: 'nr4', name: 'Shipper – selling rate', openingOffer: 1750, targetRate: 1850, minRate: 1800, maxRate: 2000, maxRounds: 3, stepPercent: 4, acceptMessage: 'Approved. Please confirm the carrier.', counterMessage: 'Let us settle near this price.', rejectMessage: 'That is above our budget.' },
]

export const documents: DocTemplate[] = [
  { id: 'dc1', name: 'Rate Confirmation – Standard', type: 'rate_confirmation', description: 'Agreement of rate, pickup and delivery between broker and carrier.', fileName: 'rate-confirmation-standard.pdf', fields: ['Carrier name', 'Load number', 'Agreed rate', 'Pickup date', 'Delivery date'] },
  { id: 'dc2', name: 'Bill of Lading – Standard', type: 'bol', description: 'Shipment receipt signed at pickup.', fileName: 'bol-standard.pdf', fields: ['Shipper', 'Consignee', 'Commodity', 'Weight', 'Pieces', 'Signature'] },
  { id: 'dc3', name: 'Proof of Delivery', type: 'pod', description: 'Delivery receipt signed by the consignee.', fileName: 'pod-standard.pdf', fields: ['Delivery date', 'Receiver name', 'Condition', 'Signature'] },
  { id: 'dc4', name: 'Carrier Packet Checklist', type: 'other', description: 'Documents a carrier must provide before booking.', fileName: 'carrier-packet.pdf', fields: ['MC number', 'Insurance', 'W-9', 'Authority letter'] },
  { id: 'dc5', name: 'Detention Request Form', type: 'other', description: 'Form to request detention pay.', fileName: 'detention-form.pdf', fields: ['Arrival time', 'Departure time', 'Reason'] },
]

export const scoringProfiles: ScoringProfile[] = [
  {
    id: 'sp1', name: 'Dispatcher – standard', passMark: 70,
    criteria: [
      { key: 'rate', label: 'Rate vs target', weight: 30 },
      { key: 'equipment', label: 'Correct truck and driver', weight: 20 },
      { key: 'deadhead', label: 'Deadhead and profit', weight: 20 },
      { key: 'documents', label: 'Document accuracy', weight: 15 },
      { key: 'time', label: 'Time taken', weight: 15 },
    ],
  },
  {
    id: 'sp2', name: 'Broker – standard', passMark: 70,
    criteria: [
      { key: 'margin', label: 'Gross margin', weight: 35 },
      { key: 'carrier', label: 'Carrier selection', weight: 20 },
      { key: 'negotiation', label: 'Negotiation result', weight: 20 },
      { key: 'documents', label: 'Document accuracy', weight: 15 },
      { key: 'problem', label: 'Problem resolution', weight: 10 },
    ],
  },
]

export const courses: Course[] = [
  { id: 'c1', title: 'Dispatching Fundamentals', description: 'Load boards, rates, trucks, drivers and dispatch flow.', audience: 'dispatcher', status: 'published' },
  { id: 'c2', title: 'Freight Brokerage Basics', description: 'Shippers, carriers, margins and booking.', audience: 'broker', status: 'published' },
  { id: 'c3', title: 'Rate Negotiation Masterclass', description: 'How to negotiate with brokers and shippers using rate data.', audience: 'both', status: 'draft' },
]

export const lessons: Lesson[] = [
  { id: 'l1', courseId: 'c1', title: 'Reading the load board', type: 'video', durationMin: 12, order: 1, content: 'Understand origin, destination, equipment and posted rate.' },
  { id: 'l2', courseId: 'c1', title: 'Deadhead and loaded miles', type: 'text', durationMin: 8, order: 2, content: 'How empty miles affect profit.' },
  { id: 'l3', courseId: 'c1', title: 'Choosing truck and driver', type: 'pdf', durationMin: 10, order: 3, content: 'Match equipment, weight and driver availability.' },
  { id: 'l4', courseId: 'c1', title: 'Dispatch status updates', type: 'video', durationMin: 9, order: 4, content: 'Assigned, picked up, in transit, delayed, delivered.' },
  { id: 'l5', courseId: 'c2', title: 'Working with shippers', type: 'video', durationMin: 14, order: 1, content: 'Understand shipper requirements.' },
  { id: 'l6', courseId: 'c2', title: 'Finding carriers', type: 'text', durationMin: 10, order: 2, content: 'Vetting carriers by MC number, insurance and rating.' },
  { id: 'l7', courseId: 'c2', title: 'Margin calculation', type: 'pdf', durationMin: 11, order: 3, content: 'Selling rate minus carrier cost.' },
  { id: 'l8', courseId: 'c3', title: 'Using rate insights', type: 'video', durationMin: 15, order: 1, content: 'Estimates, trends and confidence level.' },
  { id: 'l9', courseId: 'c3', title: 'Counter-offer tactics', type: 'text', durationMin: 9, order: 2, content: 'When to push and when to accept.' },
]

export const scenarios: Scenario[] = [
  {
    id: 'sc1', title: 'No-rate load: Indianapolis to Twinsburg', role: 'dispatcher', difficulty: 'easy',
    background: 'The broker has not posted a rate. Use the rate insights to decide what to ask for.',
    instructions: 'Analyse the load, pick a truck and driver, negotiate a rate and book the load.',
    timeLimitMin: 30, maxAttempts: 3, loadIds: ['ld1'], truckIds: ['tk1', 'tk5', 'tk8'], driverIds: ['dr1', 'dr5', 'dr8'],
    brokerId: 'br1', shipperId: null, documentIds: ['dc1', 'dc2', 'dc3'], negotiationRuleId: 'nr1', scoringProfileId: 'sp1',
    events: [], status: 'published',
  },
  {
    id: 'sc2', title: 'Long haul with delay: Dallas to Atlanta', role: 'dispatcher', difficulty: 'medium',
    background: 'A long lane with a weather delay mid-trip.',
    instructions: 'Book the load, dispatch the driver and handle the delay with the broker.',
    timeLimitMin: 45, maxAttempts: 3, loadIds: ['ld2'], truckIds: ['tk1', 'tk2', 'tk5'], driverIds: ['dr2', 'dr1', 'dr5'],
    brokerId: 'br2', shipperId: null, documentIds: ['dc1', 'dc2', 'dc3'], negotiationRuleId: 'nr2', scoringProfileId: 'sp1',
    events: [{ id: 'ev1', atMinute: 20, type: 'pickup_delay', description: 'Shipper says the dock is delayed by 3 hours.' }], status: 'published',
  },
  {
    id: 'sc3', title: 'Driver breakdown: Houston to Nashville', role: 'dispatcher', difficulty: 'hard',
    background: 'Flatbed load, tight rate and a breakdown during transit.',
    instructions: 'Negotiate, book, and recover from the breakdown with a replacement driver.',
    timeLimitMin: 60, maxAttempts: 2, loadIds: ['ld6'], truckIds: ['tk3', 'tk7'], driverIds: ['dr3', 'dr7'],
    brokerId: 'br2', shipperId: null, documentIds: ['dc1', 'dc2', 'dc3', 'dc5'], negotiationRuleId: 'nr3', scoringProfileId: 'sp1',
    events: [{ id: 'ev2', atMinute: 25, type: 'breakdown', description: 'Truck breaks down 200 miles from pickup.' }], status: 'published',
  },
  {
    id: 'sc4', title: 'Reefer shipper request: Columbus to Newark', role: 'broker', difficulty: 'easy',
    background: 'Harvest Foods needs a reefer carrier for frozen goods.',
    instructions: 'Create the load, find a carrier, negotiate and protect your margin.',
    timeLimitMin: 40, maxAttempts: 3, loadIds: ['ld9'], truckIds: ['tk2', 'tk6'], driverIds: ['dr2', 'dr6'],
    brokerId: null, shipperId: 'sh1', documentIds: ['dc1', 'dc2', 'dc4'], negotiationRuleId: 'nr4', scoringProfileId: 'sp2',
    events: [], status: 'published',
  },
  {
    id: 'sc5', title: 'Carrier cancels: Seattle to Portland', role: 'broker', difficulty: 'medium',
    background: 'High value electronics. The first carrier cancels after booking.',
    instructions: 'Find a replacement carrier and keep the shipper updated.',
    timeLimitMin: 45, maxAttempts: 3, loadIds: ['ld8'], truckIds: ['tk8', 'tk4'], driverIds: ['dr8', 'dr4'],
    brokerId: null, shipperId: 'sh3', documentIds: ['dc1', 'dc2', 'dc3'], negotiationRuleId: 'nr4', scoringProfileId: 'sp2',
    events: [{ id: 'ev3', atMinute: 15, type: 'carrier_cancel', description: 'Booked carrier cancels due to equipment issue.' }], status: 'published',
  },
  {
    id: 'sc6', title: 'Produce run: Miami to Jacksonville', role: 'broker', difficulty: 'hard',
    background: 'Perishable load with a 24 hour window and a thin margin.',
    instructions: 'Quote the shipper, buy at a good rate and manage a late pickup.',
    timeLimitMin: 50, maxAttempts: 2, loadIds: ['ld10'], truckIds: ['tk2', 'tk6'], driverIds: ['dr2', 'dr6'],
    brokerId: null, shipperId: 'sh4', documentIds: ['dc1', 'dc2', 'dc3'], negotiationRuleId: 'nr3', scoringProfileId: 'sp2',
    events: [{ id: 'ev4', atMinute: 30, type: 'pickup_delay', description: 'Carrier reports a late pickup.' }], status: 'draft',
  },
]

export const assignments: Assignment[] = [
  { id: 'as1', scenarioId: 'sc1', studentId: 's1', assignedAt: '2026-10-03', dueDate: '2026-10-10', status: 'reviewed', attemptsUsed: 2 },
  { id: 'as2', scenarioId: 'sc2', studentId: 's1', assignedAt: '2026-10-08', dueDate: '2026-10-16', status: 'submitted', attemptsUsed: 1 },
  { id: 'as3', scenarioId: 'sc1', studentId: 's2', assignedAt: '2026-10-03', dueDate: '2026-10-10', status: 'reviewed', attemptsUsed: 1 },
  { id: 'as4', scenarioId: 'sc2', studentId: 's2', assignedAt: '2026-10-08', dueDate: '2026-10-16', status: 'in_progress', attemptsUsed: 0 },
  { id: 'as5', scenarioId: 'sc1', studentId: 's6', assignedAt: '2026-10-03', dueDate: '2026-10-11', status: 'retry', attemptsUsed: 1 },
  { id: 'as6', scenarioId: 'sc4', studentId: 's3', assignedAt: '2026-10-07', dueDate: '2026-10-14', status: 'submitted', attemptsUsed: 1 },
  { id: 'as7', scenarioId: 'sc4', studentId: 's4', assignedAt: '2026-10-07', dueDate: '2026-10-14', status: 'reviewed', attemptsUsed: 1 },
  { id: 'as8', scenarioId: 'sc5', studentId: 's3', assignedAt: '2026-10-10', dueDate: '2026-10-20', status: 'assigned', attemptsUsed: 0 },
  { id: 'as9', scenarioId: 'sc5', studentId: 's4', assignedAt: '2026-10-10', dueDate: '2026-10-20', status: 'assigned', attemptsUsed: 0 },
  { id: 'as10', scenarioId: 'sc3', studentId: 's5', assignedAt: '2026-09-20', dueDate: '2026-09-30', status: 'reviewed', attemptsUsed: 2 },
  { id: 'as11', scenarioId: 'sc4', studentId: 's5', assignedAt: '2026-09-22', dueDate: '2026-10-02', status: 'reviewed', attemptsUsed: 1 },
  { id: 'as12', scenarioId: 'sc1', studentId: 's8', assignedAt: '2026-09-15', dueDate: '2026-09-25', status: 'reviewed', attemptsUsed: 1 },
  { id: 'as13', scenarioId: 'sc2', studentId: 's6', assignedAt: '2026-10-09', dueDate: '2026-10-18', status: 'assigned', attemptsUsed: 0 },
]

export const attempts: Attempt[] = [
  { id: 'at1', assignmentId: 'as1', studentId: 's1', scenarioId: 'sc1', attemptNo: 1, submittedAt: '2026-10-05T10:20:00', autoScore: 58, trainerScore: 55, timeSpentMin: 34, mistakes: ['Quoted above the estimate high', 'Chose a truck far from pickup'], breakdown: [{ key: 'rate', score: 12 }, { key: 'equipment', score: 10 }, { key: 'deadhead', score: 12 }, { key: 'documents', score: 12 }, { key: 'time', score: 12 }], status: 'retry' },
  { id: 'at2', assignmentId: 'as1', studentId: 's1', scenarioId: 'sc1', attemptNo: 2, submittedAt: '2026-10-08T15:05:00', autoScore: 82, trainerScore: 85, timeSpentMin: 26, mistakes: ['BOL weight entered wrong'], breakdown: [{ key: 'rate', score: 26 }, { key: 'equipment', score: 18 }, { key: 'deadhead', score: 16 }, { key: 'documents', score: 10 }, { key: 'time', score: 12 }], status: 'approved' },
  { id: 'at3', assignmentId: 'as2', studentId: 's1', scenarioId: 'sc2', attemptNo: 1, submittedAt: '2026-10-11T18:40:00', autoScore: 74, trainerScore: null, timeSpentMin: 48, mistakes: ['Did not inform broker about the delay'], breakdown: [{ key: 'rate', score: 22 }, { key: 'equipment', score: 16 }, { key: 'deadhead', score: 14 }, { key: 'documents', score: 12 }, { key: 'time', score: 10 }], status: 'pending_review' },
  { id: 'at4', assignmentId: 'as3', studentId: 's2', scenarioId: 'sc1', attemptNo: 1, submittedAt: '2026-10-07T11:00:00', autoScore: 91, trainerScore: 92, timeSpentMin: 24, mistakes: [], breakdown: [{ key: 'rate', score: 28 }, { key: 'equipment', score: 19 }, { key: 'deadhead', score: 19 }, { key: 'documents', score: 14 }, { key: 'time', score: 12 }], status: 'approved' },
  { id: 'at5', assignmentId: 'as5', studentId: 's6', scenarioId: 'sc1', attemptNo: 1, submittedAt: '2026-10-09T09:30:00', autoScore: 49, trainerScore: 45, timeSpentMin: 41, mistakes: ['Accepted the first offer', 'Skipped rate insights', 'POD not submitted'], breakdown: [{ key: 'rate', score: 8 }, { key: 'equipment', score: 12 }, { key: 'deadhead', score: 10 }, { key: 'documents', score: 7 }, { key: 'time', score: 12 }], status: 'retry' },
  { id: 'at6', assignmentId: 'as6', studentId: 's3', scenarioId: 'sc4', attemptNo: 1, submittedAt: '2026-10-11T12:10:00', autoScore: 68, trainerScore: null, timeSpentMin: 44, mistakes: ['Margin below 8 percent'], breakdown: [{ key: 'margin', score: 20 }, { key: 'carrier', score: 15 }, { key: 'negotiation', score: 14 }, { key: 'documents', score: 12 }, { key: 'problem', score: 7 }], status: 'pending_review' },
  { id: 'at7', assignmentId: 'as7', studentId: 's4', scenarioId: 'sc4', attemptNo: 1, submittedAt: '2026-10-09T16:45:00', autoScore: 88, trainerScore: 90, timeSpentMin: 33, mistakes: [], breakdown: [{ key: 'margin', score: 31 }, { key: 'carrier', score: 18 }, { key: 'negotiation', score: 17 }, { key: 'documents', score: 13 }, { key: 'problem', score: 9 }], status: 'approved' },
  { id: 'at8', assignmentId: 'as10', studentId: 's5', scenarioId: 'sc3', attemptNo: 2, submittedAt: '2026-09-28T14:00:00', autoScore: 77, trainerScore: 78, timeSpentMin: 58, mistakes: ['Replacement driver chosen late'], breakdown: [{ key: 'rate', score: 24 }, { key: 'equipment', score: 15 }, { key: 'deadhead', score: 14 }, { key: 'documents', score: 12 }, { key: 'time', score: 12 }], status: 'approved' },
  { id: 'at9', assignmentId: 'as12', studentId: 's8', scenarioId: 'sc1', attemptNo: 1, submittedAt: '2026-09-22T10:00:00', autoScore: 80, trainerScore: 80, timeSpentMin: 27, mistakes: ['Weak counter-offer'], breakdown: [{ key: 'rate', score: 24 }, { key: 'equipment', score: 18 }, { key: 'deadhead', score: 16 }, { key: 'documents', score: 12 }, { key: 'time', score: 10 }], status: 'approved' },
]

export const feedbacks: Feedback[] = [
  { id: 'fb1', attemptId: 'at1', trainerId: 'tr1', comment: 'Check the estimate range before quoting. Try again.', decision: 'retry', createdAt: '2026-10-06T09:00:00' },
  { id: 'fb2', attemptId: 'at2', trainerId: 'tr1', comment: 'Good improvement. Double-check the BOL weight next time.', decision: 'approved', createdAt: '2026-10-09T10:00:00' },
  { id: 'fb3', attemptId: 'at4', trainerId: 'tr1', comment: 'Excellent work.', decision: 'approved', createdAt: '2026-10-08T09:30:00' },
  { id: 'fb4', attemptId: 'at5', trainerId: 'tr1', comment: 'Use rate insights first, never accept the first offer.', decision: 'retry', createdAt: '2026-10-10T08:45:00' },
  { id: 'fb5', attemptId: 'at7', trainerId: 'tr2', comment: 'Strong margin management.', decision: 'approved', createdAt: '2026-10-10T09:10:00' },
]

export const notifications: AppNotification[] = [
  { id: 'n1', kind: 'assignment', title: 'New practice assigned', body: 'Long haul with delay: Dallas to Atlanta is now on your list.', target: 'batch', targetId: 'b1', createdAt: '2026-10-08T09:00:00' },
  { id: 'n2', kind: 'deadline', title: 'Deadline tomorrow', body: 'Reefer shipper request is due tomorrow.', target: 'batch', targetId: 'b2', createdAt: '2026-10-13T08:00:00' },
  { id: 'n3', kind: 'feedback', title: 'Feedback available', body: 'Your trainer reviewed your last attempt.', target: 'student', targetId: 's6', createdAt: '2026-10-10T08:50:00' },
  { id: 'n4', kind: 'announcement', title: 'Welcome to Truck Stop', body: 'Check My Training before starting your first practice.', target: 'all', targetId: null, createdAt: '2026-10-01T08:00:00' },
]

export const settings: AppSettings[] = [
  { id: 'settings', fuelCostPerMile: 0.55, driverPayPerMile: 0.62, deadheadRatePerMile: 0.4, defaultMaxAttempts: 3, defaultPassMark: 70, organisation: 'Truck Stop Academy' },
]
