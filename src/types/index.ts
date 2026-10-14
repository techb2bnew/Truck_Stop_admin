// Shapes below mirror the Supabase tables (see supabase/schema.sql). The store converts between camelCase here and snake_case columns.

export type StudentRole = 'dispatcher' | 'broker'
export type AccountStatus = 'active' | 'inactive' | 'suspended'
export type Equipment = 'Van' | 'Reefer' | 'Flatbed'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type Confidence = 'High' | 'Medium' | 'Low'

export interface Trainer {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'trainer'
}

export interface Student {
  id: string
  name: string
  email: string
  phone: string
  roles: StudentRole[]
  batchId: string | null
  status: AccountStatus
  appAccess: boolean
  inviteStatus: 'pending' | 'accepted'
  joinedAt: string
}

export interface Batch {
  id: string
  name: string
  trainerId: string
  description: string
  startDate: string
}

export interface Course {
  id: string
  title: string
  description: string
  audience: StudentRole | 'both'
  status: 'draft' | 'published'
}

export interface Lesson {
  id: string
  courseId: string
  title: string
  type: 'video' | 'pdf' | 'text'
  durationMin: number
  order: number
  content: string
}

export interface ScenarioEvent {
  id: string
  atMinute: number
  type: 'driver_unavailable' | 'pickup_delay' | 'rate_dispute' | 'carrier_cancel' | 'breakdown'
  description: string
}

export interface Scenario {
  id: string
  title: string
  role: StudentRole
  difficulty: Difficulty
  background: string
  instructions: string
  timeLimitMin: number
  maxAttempts: number
  loadIds: string[]
  truckIds: string[]
  driverIds: string[]
  brokerId: string | null
  shipperId: string | null
  documentIds: string[]
  negotiationRuleId: string | null
  scoringProfileId: string | null
  events: ScenarioEvent[]
  status: 'draft' | 'published'
}

export interface Load {
  id: string
  originCity: string
  originState: string
  destCity: string
  destState: string
  pickupDate: string
  deliveryDate: string
  equipment: Equipment
  size: 'Full' | 'Partial'
  weightLbs: number
  lengthFt: number
  commodity: string
  loadedMiles: number
  deadheadMiles: number
  postedRate: number | null
  brokerId: string | null
  postedAt: string
  notes: string
}

export interface RateEstimate {
  id: string
  loadId: string
  low: number
  booked: number
  high: number
  confidence: Confidence
}

export interface RateTrend {
  id: string
  loadId: string
  weekStart: string
  avgRate: number
}

export interface Truck {
  id: string
  unitNumber: string
  equipment: Equipment
  make: string
  year: number
  plate: string
  capacityLbs: number
  lengthFt: number
  mpg: number
  locationCity: string
  locationState: string
  status: 'available' | 'in_use' | 'maintenance'
}

export interface Driver {
  id: string
  name: string
  phone: string
  licenseNo: string
  experienceYears: number
  homeCity: string
  payPerMile: number
  truckId: string | null
  availability: 'available' | 'on_trip' | 'off_duty'
}

export interface Broker {
  id: string
  company: string
  contactName: string
  email: string
  phone: string
  mcNumber: string
  creditRating: 'A' | 'B' | 'C' | 'D'
  daysToPay: number
  address: string
}

export interface Shipper {
  id: string
  company: string
  contactName: string
  email: string
  phone: string
  city: string
  state: string
  industry: string
}

export interface ShipperRequest {
  id: string
  shipperId: string
  originCity: string
  originState: string
  destCity: string
  destState: string
  pickupDate: string
  equipment: Equipment
  weightLbs: number
  commodity: string
  offeredRate: number
  notes: string
}

export interface NegotiationRule {
  id: string
  name: string
  openingOffer: number
  targetRate: number
  minRate: number
  maxRate: number
  maxRounds: number
  stepPercent: number
  acceptMessage: string
  counterMessage: string
  rejectMessage: string
}

export interface DocTemplate {
  id: string
  name: string
  type: 'rate_confirmation' | 'bol' | 'pod' | 'other'
  description: string
  fileName: string
  fields: string[]
}

export interface ScoringCriterion {
  key: string
  label: string
  weight: number
}

export interface ScoringProfile {
  id: string
  name: string
  passMark: number
  criteria: ScoringCriterion[]
}

export type AssignmentStatus = 'assigned' | 'in_progress' | 'submitted' | 'reviewed' | 'retry'

export interface Assignment {
  id: string
  scenarioId: string
  studentId: string
  assignedAt: string
  dueDate: string
  status: AssignmentStatus
  attemptsUsed: number
}

export interface Attempt {
  id: string
  assignmentId: string
  studentId: string
  scenarioId: string
  attemptNo: number
  submittedAt: string
  autoScore: number
  trainerScore: number | null
  timeSpentMin: number
  mistakes: string[]
  breakdown: { key: string; score: number }[]
  status: 'pending_review' | 'approved' | 'retry'
}

export interface Feedback {
  id: string
  attemptId: string
  trainerId: string
  comment: string
  decision: 'approved' | 'retry'
  createdAt: string
}

export interface AppNotification {
  id: string
  kind: 'assignment' | 'deadline' | 'feedback' | 'announcement'
  title: string
  body: string
  target: 'all' | 'batch' | 'student'
  targetId: string | null
  createdAt: string
}

export interface AppSettings {
  id: string
  fuelCostPerMile: number
  driverPayPerMile: number
  deadheadRatePerMile: number
  defaultMaxAttempts: number
  defaultPassMark: number
  organisation: string
}
