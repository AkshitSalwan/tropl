import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { createCandidateSchema, updateCandidateSchema, listQuerySchema, createApiResponse } from '@/lib/validations'

// GET /api/candidates - List all candidates
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams)
    const { page, limit, sortBy, sortOrder, query, filters } = listQuerySchema.parse(queryParams)

    const where: any = {}
    
    // Add search functionality
    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { jobTitle: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
        { user: { email: { contains: query, mode: 'insensitive' } } },
      ]
    }

    // Add filters
    if (filters) {
      if (filters.availability) {
        where.availability = filters.availability
      }
      if (filters.location) {
        where.location = { contains: filters.location, mode: 'insensitive' }
      }
      if (filters.minExperience) {
        where.experience = { gte: parseInt(filters.minExperience) }
      }
      if (filters.maxExperience) {
        where.experience = { ...where.experience, lte: parseInt(filters.maxExperience) }
      }
    }

    const orderBy: any = {}
    if (sortBy) {
      orderBy[sortBy] = sortOrder
    } else {
      orderBy.createdAt = 'desc'
    }

    const skip = (page - 1) * limit

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              name: true,
              avatar: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              applications: true,
              interviews: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.candidate.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    // Format DOB in all candidates for consistent frontend display
    const formattedCandidates = candidates.map(candidate => ({
      ...candidate,
      dob: candidate.dob ? candidate.dob.toISOString().split('T')[0] : null,
    }))

    return NextResponse.json(
      createApiResponse(
        true,
        formattedCandidates,
        'Candidates retrieved successfully',
        undefined,
        { page, limit, total, totalPages }
      )
    )
  } catch (error) {
    console.error('Get candidates error:', error)
    return NextResponse.json(
      createApiResponse(false, null, '', 'Internal server error'),
      { status: 500 }
    )
  }
})

// POST /api/candidates - Create a new candidate
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    const validatedData = createCandidateSchema.parse(body)

    const userId = request.user!.userId

    // Check if user already has a candidate profile
    const existingCandidate = await prisma.candidate.findUnique({
      where: { userId },
    })

    if (existingCandidate) {
      return NextResponse.json(
        createApiResponse(false, null, '', 'Candidate profile already exists'),
        { status: 400 }
      )
    }    // Create candidate profile
    const candidate = await prisma.candidate.create({
      data: {
        ...validatedData,
        userId,
        skills: validatedData.skills,
        education: validatedData.education,
        workExperience: validatedData.workExperience,
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

    return NextResponse.json(
      createApiResponse(true, candidate, 'Candidate profile created successfully'),
      { status: 201 }
    )
  } catch (error) {
    console.error('Create candidate error:', error)
    return NextResponse.json(
      createApiResponse(false, null, '', 'Internal server error'),
      { status: 500 }
    )
  }
})
