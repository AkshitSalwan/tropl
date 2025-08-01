import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { createJobApplicationSchema, updateJobApplicationSchema, listQuerySchema, createApiResponse } from '@/lib/validations'

// GET /api/job-applications - List job applications
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams)
    const { page, limit, sortBy, sortOrder, query, filters } = listQuerySchema.parse(queryParams)

    const userRole = request.user!.role
    const userId = request.user!.userId

    const where: any = {}

    // Role-based filtering
    if (userRole === 'CANDIDATE') {
      // Candidates can only see their own applications
      const candidate = await prisma.candidate.findUnique({
        where: { userId },
      })
      if (candidate) {
        where.candidateId = candidate.id
      } else {
        // No candidate profile, return empty
        return NextResponse.json(
          createApiResponse(true, [], 'No applications found', undefined, { page, limit, total: 0, totalPages: 0 })
        )
      }
    } else if (userRole === 'RECRUITER') {
      // Recruiters can see applications for their jobs
      where.job = {
        recruiterId: userId,
      }
    }
    // Admins can see all applications (no additional filtering)

    // Add search functionality
    if (query) {
      where.OR = [
        { job: { title: { contains: query, mode: 'insensitive' } } },
        { job: { jobCode: { contains: query, mode: 'insensitive' } } },
        { candidate: { firstName: { contains: query, mode: 'insensitive' } } },
        { candidate: { lastName: { contains: query, mode: 'insensitive' } } },
      ]
    }

    // Add filters
    if (filters) {
      if (filters.status) {
        where.status = filters.status
      }
      if (filters.currentStage) {
        where.currentStage = filters.currentStage
      }
      if (filters.jobId) {
        where.jobId = filters.jobId
      }
      if (filters.candidateId) {
        where.candidateId = filters.candidateId
      }
    }

    const orderBy: any = {}
    if (sortBy) {
      orderBy[sortBy] = sortOrder
    } else {
      orderBy.appliedAt = 'desc'
    }

    const skip = (page - 1) * limit

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        include: {
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jobTitle: true,
              city: true,
              state: true,
              country: true,
              experience: true,
              user: {
                select: {
                  email: true,
                  phone: true,
                  avatar: true,
                },
              },
            },
          },
          job: {
            select: {
              id: true,
              jobCode: true,
              jobTitle: true,
              city: true,
              state: true,
              country: true,
              client: {
                select: {
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              interviews: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.jobApplication.count({ where }),
    ])    // Parse JSON fields safely
    const responseApplications = applications.map(app => ({
      ...app,
      stageHistory: app.stageHistory && typeof app.stageHistory === 'string' ? JSON.parse(app.stageHistory) : app.stageHistory || null,
    }))

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json(
      createApiResponse(
        true,
        responseApplications,
        'Job applications retrieved successfully',
        undefined,
        { page, limit, total, totalPages }
      )
    )
  } catch (error) {
    console.error('Get job applications error:', error)
    return NextResponse.json(
      createApiResponse(false, null, '', 'Internal server error'),
      { status: 500 }
    )
  }
})

// POST /api/job-applications - Apply for a job (Candidates only)
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    const validatedData = createJobApplicationSchema.parse(body)

    const userId = request.user!.userId

    // Get candidate profile
    const candidate = await prisma.candidate.findUnique({
      where: { userId },
    })

    if (!candidate) {
      return NextResponse.json(
        createApiResponse(false, null, '', 'Candidate profile required to apply for jobs'),
        { status: 400 }
      )
    }

    // Check if job exists and is open
    const job = await prisma.job.findUnique({
      where: { id: validatedData.jobId },
    })

    if (!job) {
      return NextResponse.json(
        createApiResponse(false, null, '', 'Job not found'),
        { status: 404 }
      )
    }

    // if (job.status !== 'OPEN') {
    //   ... handle status logic if you add a status field to Job model ...
    //   return NextResponse.json(
    //     createApiResponse(false, null, '', 'Job is not open for applications'),
    //     { status: 400 }
    //   )
    // }

    // Check if already applied
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        candidateId_jobId: {
          candidateId: candidate.id,
          jobId: validatedData.jobId,
        },
      },
    })

    if (existingApplication) {
      return NextResponse.json(
        createApiResponse(false, null, '', 'You have already applied for this job'),
        { status: 400 }
      )
    }

    // Create application
    const application = await prisma.jobApplication.create({
      data: {
        candidateId: candidate.id,
        jobId: validatedData.jobId,
        notes: validatedData.notes,
        coverLetter: validatedData.coverLetter,
        resumeUrl: candidate.resumeUrl, // Use candidate's resume
        stageHistory: JSON.stringify([
          {
            stage: 'APPLIED',
            timestamp: new Date().toISOString(),
            notes: 'Application submitted',
          },
        ]),
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
          },
        },
        job: {
          select: {
            id: true,
            jobCode: true,
              jobTitle: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })    // Parse JSON fields for response safely
    const responseApplication = {
      ...application,
      stageHistory: typeof application.stageHistory === 'string' ? JSON.parse(application.stageHistory || '[]') : application.stageHistory || [],
    }

    return NextResponse.json(
      createApiResponse(true, responseApplication, 'Application submitted successfully'),
      { status: 201 }
    )
  } catch (error) {
    console.error('Create job application error:', error)
    return NextResponse.json(
      createApiResponse(false, null, '', 'Internal server error'),
      { status: 500 }
    )
  }
})
