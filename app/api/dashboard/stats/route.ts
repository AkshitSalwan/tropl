import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { createApiResponse } from '@/lib/validations'

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userRole = request.user!.role
    const userId = request.user!.userId

    let stats: any = {}

    if (userRole === 'ADMIN') {
      // Admin dashboard - system-wide stats
      const [
        totalUsers,
        totalCandidates,
        totalRecruiters,
        totalJobs,
        totalClients,
        totalVendors,
        totalApplications,
        totalInterviews,
        activeJobs,
        placedCandidates,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.candidate.count(),
        prisma.recruiter.count(),
        prisma.job.count(),
        prisma.client.count(),
        prisma.vendor.count(),
        prisma.jobApplication.count(),
        prisma.interview.count(),
        prisma.job.count(),
        prisma.jobApplication.count({ where: { status: 'SELECTED' } }),
      ])

      stats = {
        users: {
          total: totalUsers,
          candidates: totalCandidates,
          recruiters: totalRecruiters,
        },
        jobs: {
          total: totalJobs,
          active: activeJobs,
          filled: placedCandidates,
        },
        clients: {
          total: totalClients,
        },
        vendors: {
          total: totalVendors,
        },
        applications: {
          total: totalApplications,
        },
        interviews: {
          total: totalInterviews,
        },
        placements: {
          total: placedCandidates,
        },
      }
    } else if (userRole === 'RECRUITER') {
      // Recruiter dashboard - personal stats
      const [
        myJobs,
        activeJobs,
        totalApplications,
        totalInterviews,
        pendingInterviews,
        todaysInterviews,
        placedCandidates,
      ] = await Promise.all([
        prisma.job.count({ where: { recruiterId: userId } }),
        prisma.job.count({ where: { recruiterId: userId } }),
        prisma.jobApplication.count({
          where: { job: { recruiterId: userId } },
        }),
        prisma.interview.count({ where: { recruiterId: userId } }),
        prisma.interview.count({
          where: {
            recruiterId: userId,
            status: 'SCHEDULED',
          },
        }),
        prisma.interview.count({
          where: {
            recruiterId: userId,
            scheduledAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        }),
        prisma.jobApplication.count({
          where: {
            job: { recruiterId: userId },
            status: 'SELECTED',
          },
        }),
      ])

      stats = {
        jobs: {
          total: myJobs,
          active: activeJobs,
        },
        applications: {
          total: totalApplications,
        },
        interviews: {
          total: totalInterviews,
          pending: pendingInterviews,
          today: todaysInterviews,
        },
        placements: {
          total: placedCandidates,
        },
      }
    } else if (userRole === 'CANDIDATE') {
      // Candidate dashboard - personal stats
      const candidate = await prisma.candidate.findUnique({
        where: { userId },
      })

      if (!candidate) {
        return NextResponse.json(
          createApiResponse(false, null, '', 'Candidate profile not found'),
          { status: 404 }
        )
      }

      const [
        totalApplications,
        activeApplications,
        totalInterviews,
        upcomingInterviews,
        rejectedApplications,
        selectedApplications,
      ] = await Promise.all([
        prisma.jobApplication.count({ where: { candidateId: candidate.id } }),
        prisma.jobApplication.count({
          where: {
            candidateId: candidate.id,
            status: { in: ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEWED'] },
          },
        }),
        prisma.interview.count({ where: { candidateId: candidate.id } }),
        prisma.interview.count({
          where: {
            candidateId: candidate.id,
            status: 'SCHEDULED',
            scheduledAt: { gte: new Date() },
          },
        }),
        prisma.jobApplication.count({
          where: { candidateId: candidate.id, status: 'REJECTED' },
        }),
        prisma.jobApplication.count({
          where: { candidateId: candidate.id, status: 'SELECTED' },
        }),
      ])

      stats = {
        applications: {
          total: totalApplications,
          active: activeApplications,
          rejected: rejectedApplications,
          selected: selectedApplications,
        },
        interviews: {
          total: totalInterviews,
          upcoming: upcomingInterviews,
        },
      }
    }    // Get recent activities based on role
    let recentActivities: Array<{
      type: string;
      message: string;
      timestamp: Date;
    }> = []
    if (userRole === 'RECRUITER') {
      const recentApps = await prisma.jobApplication.findMany({
        where: { job: { recruiterId: userId } },
        include: {
          candidate: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          job: {
            select: {
              jobTitle: true,
              jobCode: true,
            },
          },
        },
        orderBy: { appliedAt: 'desc' },
        take: 5,
      })

      recentActivities = recentApps.map(app => ({
        type: 'application',
        message: `${app.candidate.firstName} ${app.candidate.lastName} applied for ${app.job.jobTitle}`,
        timestamp: app.appliedAt,
      }))
    } else if (userRole === 'CANDIDATE') {
      const candidate = await prisma.candidate.findUnique({
        where: { userId },
      })

      if (candidate) {
        const recentApps = await prisma.jobApplication.findMany({
          where: { candidateId: candidate.id },
          include: {
            job: {
              select: {
                jobTitle: true,
                jobCode: true,
                client: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { appliedAt: 'desc' },
          take: 5,
        })

        recentActivities = recentApps.map(app => ({
          type: 'application',
          message: `Applied for ${app.job.jobTitle} at ${app.job.client?.name ?? "Unknown Client"}`,
          timestamp: app.appliedAt,
        }))
      }
    }

    return NextResponse.json(
      createApiResponse(true, { stats, recentActivities }, 'Dashboard stats retrieved successfully')
    )
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return NextResponse.json(
      createApiResponse(false, null, '', 'Internal server error'),
      { status: 500 }
    )
  }
})
