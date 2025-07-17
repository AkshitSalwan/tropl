import { z } from 'zod'

// User validation schemas
export const loginSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
  method: z.enum(['email', 'mobile']),
  otp: z.string().optional(),
})

export const verifyOTPSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  method: z.enum(['email', 'mobile']),
})

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['ADMIN', 'RECRUITER', 'CANDIDATE']),
})

// Candidate validation schemas
export const createCandidateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  jobTitle: z.string().optional(),
  experience: z.number().min(0).optional(),
  expectedSalary: z.number().min(0).optional(),
  currentSalary: z.number().min(0).optional(),
  location: z.string().optional(),
  skills: z.array(z.string()).default([]),
  availability: z.enum(['AVAILABLE', 'NOTICE_PERIOD', 'NOT_AVAILABLE']).default('AVAILABLE'),
  profileSummary: z.string().optional(),
  education: z.any().optional(),
  workExperience: z.any().optional(),
})

export const updateCandidateSchema = createCandidateSchema.partial()

// Resume form validation schema
export const resumeFormSchema = z.object({
  // Personal Information
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone number is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.string().optional(),
  
  // Contact Information
  linkedin: z.string().optional(),
  github: z.string().optional(),
  
  // Location Information
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
  
  // Professional Information
  jobTitle: z.string().optional(),
  experience: z.string().optional(),
  expectedSalary: z.string().min(1, 'Expected salary is required'),
  currentSalary: z.string().min(1, 'Current salary is required'),
  noticePeriod: z.string().optional(),
  relocate: z.string().min(1, 'Relocation preference is required'),
  summary: z.string().optional(),
  
  // Skills
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  selectedSkills: z.array(z.string()).length(10, 'Exactly 10 skills must be selected'),
  
  // ID Information
  aadhaar: z.string().optional(),
  pan: z.string().optional(),
  uan: z.string().optional(),
  
  // Employer Information
  employerName: z.string().optional(),
  recruiterName: z.string().optional(),
  recruiterEmail: z.string().optional(),
  recruiterContact: z.string().optional(),
  
  // Complex data arrays
  experiences: z.array(z.object({
    client: z.string(),
    startMonth: z.string(),
    startYear: z.string(),
    endMonth: z.string(),
    endYear: z.string(),
    present: z.boolean(),
    responsibilities: z.string()
  })).optional(),
  
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    year: z.union([z.string(), z.number()]).transform(val => String(val)),
    educationLevel: z.string()
  })).optional(),
  
  references: z.array(z.object({
    name: z.string(),
    designation: z.string(),
    email: z.string(),
    phone: z.string()
  })).optional(),
  
  otherDocuments: z.array(z.object({
    type: z.string(),
    name: z.string(),
    file: z.any().nullable()
  })).optional(),
  
  // Resume file URL
  resumeUrl: z.string().optional(),
})

// Client validation schemas
export const createClientSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  notes: z.string().optional(),
})

export const updateClientSchema = createClientSchema.partial()

// Vendor validation schemas
export const createVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  address: z.string().optional(),
  specialization: z.array(z.string()).default([]),
  rating: z.number().min(0).max(5).optional(),
  notes: z.string().optional(),
})

export const updateVendorSchema = createVendorSchema.partial()

// Job validation schemas
export const createJobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  description: z.string().optional(),
  requirements: z.array(z.string()).default([]),
  location: z.string().optional(),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP']).default('FULL_TIME'),
  experienceLevel: z.enum(['ENTRY_LEVEL', 'MID_LEVEL', 'SENIOR_LEVEL', 'EXECUTIVE']).default('MID_LEVEL'),
  minSalary: z.number().min(0).optional(),
  maxSalary: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  openings: z.number().min(1).default(1),
  clientId: z.string().min(1, 'Client is required'),
  vendorId: z.string().optional(),
  clientJobId: z.string().optional(),
})

export const updateJobSchema = createJobSchema.partial()

// Job Application validation schemas
export const createJobApplicationSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  notes: z.string().optional(),
  coverLetter: z.string().optional(),
})

export const updateJobApplicationSchema = z.object({
  status: z.enum(['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEWED', 'SELECTED', 'REJECTED', 'WITHDRAWN']).optional(),
  currentStage: z.enum(['APPLIED', 'SCREENING', 'PHONE_INTERVIEW', 'TECHNICAL_INTERVIEW', 'FINAL_INTERVIEW', 'OFFER_EXTENDED', 'OFFER_ACCEPTED', 'REJECTED', 'WITHDRAWN']).optional(),
  notes: z.string().optional(),
})

// Interview validation schemas
export const createInterviewSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  candidateId: z.string().min(1, 'Candidate ID is required'),
  applicationId: z.string().optional(),
  title: z.string().min(1, 'Interview title is required'),
  description: z.string().optional(),
  type: z.enum(['PHONE', 'VIDEO', 'IN_PERSON', 'TECHNICAL', 'HR_ROUND', 'FINAL_ROUND']).default('PHONE'),
  scheduledAt: z.string().datetime(),
  duration: z.number().min(15).default(60),
  location: z.string().optional(),
  meetingLink: z.string().url().optional().or(z.literal('')),
})

export const updateInterviewSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['PHONE', 'VIDEO', 'IN_PERSON', 'TECHNICAL', 'HR_ROUND', 'FINAL_ROUND']).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']).optional(),
  scheduledAt: z.string().datetime().optional(),
  duration: z.number().min(15).optional(),
  location: z.string().optional(),
  meetingLink: z.string().url().optional().or(z.literal('')),
  feedback: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  outcome: z.enum(['SELECTED', 'REJECTED', 'ON_HOLD', 'PROCEED_TO_NEXT_ROUND']).optional(),
})

// File upload validation
export const fileUploadSchema = z.object({
  file: z.any(),
  uploadType: z.enum(['RESUME', 'DOCUMENT']).default('RESUME'),
})

// Pagination and filtering
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const searchSchema = z.object({
  query: z.string().optional(),
  filters: z.record(z.any()).optional(),
})

// Combine pagination with search
export const listQuerySchema = paginationSchema.merge(searchSchema)

// Response helpers
export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const createApiResponse = <T = any>(
  success: boolean,
  data?: T,
  message?: string,
  error?: string,
  pagination?: ApiResponse<T>['pagination']
): ApiResponse<T> => ({
  success,
  data,
  message,
  error,
  pagination,
})
