import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { createApiResponse } from '@/lib/validations'
import { z } from 'zod'
import { promises as fs } from 'fs'
import path from 'path'

// Resume form validation schema
const resumeFormSchema = z.object({
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

// POST /api/candidates/resume - Create or update candidate resume
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    const validatedData = resumeFormSchema.parse(body)

    const userId = request.user!.userId
    console.log('Resume save request - userId:', userId, 'type:', typeof userId);

    // Validate userId format (MongoDB ObjectId should be 24 hex characters)
    if (!userId || typeof userId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      console.error('Invalid userId format:', userId);
      return NextResponse.json(
        createApiResponse(false, null, '', 'Invalid user authentication'),
        { status: 401 }
      );
    }

    // Convert string values to appropriate types
    const experienceYears = validatedData.experience ? parseInt(validatedData.experience) : null
    const expectedSalary = parseFloat(validatedData.expectedSalary)
    const currentSalary = parseFloat(validatedData.currentSalary)
    const dobDate = new Date(validatedData.dob)

    // Prepare data for database
    const candidateData = {
      // Personal Information
      firstName: validatedData.firstName,
      middleName: validatedData.middleName || null,
      lastName: validatedData.lastName,
      email: validatedData.email,
      phone: validatedData.phone,
      dob: dobDate,
      gender: validatedData.gender || null,
      
      // Contact Information
      linkedin: validatedData.linkedin || null,
      github: validatedData.github || null,
      
      // Location Information
      country: validatedData.country,
      state: validatedData.state,
      city: validatedData.city,
      location: `${validatedData.city}, ${validatedData.state}, ${validatedData.country}`, // For legacy compatibility
      
      // Professional Information
      jobTitle: validatedData.jobTitle || null,
      experience: experienceYears,
      expectedSalary,
      currentSalary,
      noticePeriod: validatedData.noticePeriod || null,
      relocate: validatedData.relocate,
      profileSummary: validatedData.summary || null,
      
      // Skills
      skills: validatedData.skills,
      selectedSkills: validatedData.selectedSkills,
      
      // ID Information
      aadhaar: validatedData.aadhaar || null,
      pan: validatedData.pan || null,
      uan: validatedData.uan || null,
      
      // Employer Information
      employerName: validatedData.employerName || null,
      recruiterName: validatedData.recruiterName || null,
      recruiterEmail: validatedData.recruiterEmail || null,
      recruiterContact: validatedData.recruiterContact || null,
      
      // Complex data as JSON
      experiences: validatedData.experiences || [],
      education: validatedData.education || [],
      references: validatedData.references || [],
      otherDocuments: validatedData.otherDocuments || [],
      
      // Resume file URL
      resumeUrl: validatedData.resumeUrl || null,
    }

    // Check if candidate profile already exists
    const existingCandidate = await prisma.candidate.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    let candidate
    if (existingCandidate) {
      // Update existing candidate
      candidate = await prisma.candidate.update({
        where: { userId },
        data: candidateData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              name: true,
              avatar: true,
            },
          },
        },
      })
    } else {
      // Create new candidate profile
      candidate = await prisma.candidate.create({
        data: {
          ...candidateData,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              name: true,
              avatar: true,
            },
          },
        },
      })
    }

    // Also update the user's name and email if provided
    if (validatedData.firstName || validatedData.lastName || validatedData.email) {
      const fullName = `${validatedData.firstName} ${validatedData.lastName}`.trim()
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: fullName,
          email: validatedData.email,
          phone: validatedData.phone,
        },
      })
    }

    return NextResponse.json(
      createApiResponse(
        true, 
        candidate, 
        existingCandidate ? 'Resume updated successfully' : 'Resume saved successfully'
      ),
      { status: existingCandidate ? 200 : 201 }
    )
  } catch (error) {
    console.error('Save resume error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createApiResponse(false, null, '', `Validation error: ${error.errors.map(e => e.message).join(', ')}`),
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      createApiResponse(false, null, '', 'Internal server error'),
      { status: 500 }
    )
  }
})

// GET /api/candidates/resume - Get current user's resume data
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.user!.userId

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    if (!candidate) {
      return NextResponse.json(
        createApiResponse(false, null, '', 'Resume not found'),
        { status: 404 }
      )
    }

    return NextResponse.json(
      createApiResponse(true, candidate, 'Resume retrieved successfully')
    )
  } catch (error) {
    console.error('Get resume error:', error)
    return NextResponse.json(
      createApiResponse(false, null, '', 'Internal server error'),
      { status: 500 }
    )
  }
})
