import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, withRole, AuthenticatedRequest } from '@/lib/middleware'
import { updateCandidateSchema, createApiResponse } from '@/lib/validations'
import { FileUtils } from '@/lib/fileUtils'
import { z } from 'zod'

// Enhanced schema for comprehensive candidate updates
const enhancedUpdateCandidateSchema = z.object({
  // Personal Information
  firstName: z.string().min(1, 'First name is required').optional(),
  middleName: z.string().nullable().optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().min(1, 'Phone number is required').optional(),
  dob: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  
  // Contact Information
  linkedin: z.string().nullable().optional(),
  github: z.string().nullable().optional(),
  
  // Location Information
  country: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  
  // Professional Information
  jobTitle: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
  expectedSalary: z.string().nullable().optional(),
  currentSalary: z.string().nullable().optional(),
  noticePeriod: z.string().nullable().optional(),
  relocate: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  
  // Skills
  skills: z.array(z.string()).optional(),
  selectedSkills: z.array(z.string()).optional(),
  
  // ID Information
  aadhaar: z.string().nullable().optional(),
  pan: z.string().nullable().optional(),
  uan: z.string().nullable().optional(),
  
  // Employer Information
  employerName: z.string().nullable().optional(),
  recruiterName: z.string().nullable().optional(),
  recruiterEmail: z.string().nullable().optional(),
  recruiterContact: z.string().nullable().optional(),
  
  // Complex data arrays
  experiences: z.array(z.any()).optional(),
  education: z.array(z.any()).optional(),
  references: z.array(z.any()).optional(),
  otherDocuments: z.array(z.any()).optional(),
  
  // Resume file URL
  resumeUrl: z.string().nullable().optional(),
})

// GET /api/candidates/[id] - Get candidate by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            name: true,
            avatar: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        applications: {
          include: {
            job: {
              select: {
                id: true,
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
        },
        interviews: {
          include: {
            job: {
              select: {
                id: true,
                jobCode: true,
              },
            },
          },
          orderBy: { scheduledAt: 'desc' },
        },
        _count: {
          select: {
            applications: true,
            interviews: true,
          },
        },
      },
    })

    if (!candidate) {
      return NextResponse.json(
        createApiResponse(false, null, '', 'Candidate not found'),
        { status: 404 }
      )
    }    // Parse JSON fields safely
    const responseCandidate = {
      ...candidate,
      // Format DOB as yyyy-mm-dd for frontend display
      dob: candidate.dob ? candidate.dob.toISOString().split('T')[0] : null,
      skills: typeof candidate.skills === 'string' ? JSON.parse(candidate.skills || '[]') : candidate.skills || [],
      education: candidate.education && typeof candidate.education === 'string' ? JSON.parse(candidate.education) : candidate.education,
      workExperience: candidate.workExperience && typeof candidate.workExperience === 'string' ? JSON.parse(candidate.workExperience) : candidate.workExperience,
    }

    return NextResponse.json(
      createApiResponse(true, responseCandidate, 'Candidate retrieved successfully')
    )
  } catch (error) {
    console.error('Get candidate error:', error)
    return NextResponse.json(
      createApiResponse(false, null, '', 'Internal server error'),
      { status: 500 }
    )
  }
}

// PUT /api/candidates/[id] - Update candidate by ID
export const PUT = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Log the incoming data for debugging
    console.log('PUT /api/candidates/[id] - Incoming data:', {
      id,
      bodyKeys: Object.keys(body),
      resumeUrl: body.resumeUrl,
      resumeUrlType: typeof body.resumeUrl
    })
    
    const validatedData = enhancedUpdateCandidateSchema.parse(body)

    // Check if candidate exists and user has permission
    const existingCandidate = await prisma.candidate.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!existingCandidate) {
      return NextResponse.json(
        createApiResponse(false, null, '', 'Candidate not found'),
        { status: 404 }
      )
    }

    // Check if user owns this candidate profile or is admin/recruiter
    const userRole = request.user!.role
    const isOwner = existingCandidate.userId === request.user!.userId
    const canEdit = isOwner || userRole === 'ADMIN' || userRole === 'RECRUITER'

    if (!canEdit) {
      return NextResponse.json(
        createApiResponse(false, null, '', 'Permission denied'),
        { status: 403 }
      )
    }

    // Prepare user update data (only what belongs to User model)
    const userUpdateData: any = {}
    if (validatedData.email) userUpdateData.email = validatedData.email
    if (validatedData.phone) userUpdateData.phone = validatedData.phone
    // Combine names for user.name field
    if (validatedData.firstName || validatedData.middleName || validatedData.lastName) {
      const nameParts = [
        validatedData.firstName || existingCandidate.firstName,
        validatedData.middleName || existingCandidate.middleName,
        validatedData.lastName || existingCandidate.lastName
      ].filter(Boolean)
      userUpdateData.name = nameParts.join(' ')
    }

    // Prepare candidate update data (most fields belong to Candidate model)
    const candidateUpdateData: any = {}
    if (validatedData.firstName) candidateUpdateData.firstName = validatedData.firstName
    if ('middleName' in validatedData) candidateUpdateData.middleName = validatedData.middleName
    if (validatedData.lastName) candidateUpdateData.lastName = validatedData.lastName
    if (validatedData.email) candidateUpdateData.email = validatedData.email
    if (validatedData.phone) candidateUpdateData.phone = validatedData.phone
    if ('dob' in validatedData && validatedData.dob) candidateUpdateData.dob = new Date(validatedData.dob)
    if ('gender' in validatedData) candidateUpdateData.gender = validatedData.gender
    if ('linkedin' in validatedData) candidateUpdateData.linkedin = validatedData.linkedin
    if ('github' in validatedData) candidateUpdateData.github = validatedData.github
    if ('country' in validatedData) candidateUpdateData.country = validatedData.country
    if ('state' in validatedData) candidateUpdateData.state = validatedData.state
    if ('city' in validatedData) candidateUpdateData.city = validatedData.city
    if ('jobTitle' in validatedData) candidateUpdateData.jobTitle = validatedData.jobTitle
    if ('experience' in validatedData && validatedData.experience) candidateUpdateData.experience = parseInt(validatedData.experience)
    if ('expectedSalary' in validatedData && validatedData.expectedSalary) candidateUpdateData.expectedSalary = parseFloat(validatedData.expectedSalary)
    if ('currentSalary' in validatedData && validatedData.currentSalary) candidateUpdateData.currentSalary = parseFloat(validatedData.currentSalary)
    if ('noticePeriod' in validatedData) candidateUpdateData.noticePeriod = validatedData.noticePeriod
    if ('relocate' in validatedData) candidateUpdateData.relocate = validatedData.relocate
    if ('summary' in validatedData) candidateUpdateData.profileSummary = validatedData.summary
    if ('aadhaar' in validatedData) candidateUpdateData.aadhaar = validatedData.aadhaar
    if ('pan' in validatedData) candidateUpdateData.pan = validatedData.pan
    if ('uan' in validatedData) candidateUpdateData.uan = validatedData.uan
    if ('employerName' in validatedData) candidateUpdateData.employerName = validatedData.employerName
    if ('recruiterName' in validatedData) candidateUpdateData.recruiterName = validatedData.recruiterName
    if ('recruiterEmail' in validatedData) candidateUpdateData.recruiterEmail = validatedData.recruiterEmail
    if ('recruiterContact' in validatedData) candidateUpdateData.recruiterContact = validatedData.recruiterContact
    if ('resumeUrl' in validatedData) candidateUpdateData.resumeUrl = validatedData.resumeUrl

    // Handle array/object fields with proper assignment
    if (validatedData.skills) candidateUpdateData.skills = validatedData.skills
    if (validatedData.selectedSkills) candidateUpdateData.selectedSkills = validatedData.selectedSkills
    if (validatedData.experiences) candidateUpdateData.experiences = validatedData.experiences
    if (validatedData.education) candidateUpdateData.education = validatedData.education
    if (validatedData.references) candidateUpdateData.references = validatedData.references
    if (validatedData.otherDocuments) candidateUpdateData.otherDocuments = validatedData.otherDocuments

    // Update candidate and user data in a transaction
    const updatedCandidate = await prisma.$transaction(async (tx) => {
      // Update user if there's user data to update
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: existingCandidate.userId },
          data: userUpdateData
        })
      }
      
      // Update candidate
      const candidate = await tx.candidate.update({
        where: { id },
        data: candidateUpdateData,
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
      
      return candidate
    })

    // Parse JSON fields for response safely
    const responseCandidate = {
      ...updatedCandidate,
      // Format DOB as yyyy-mm-dd for frontend display
      dob: updatedCandidate.dob ? updatedCandidate.dob.toISOString().split('T')[0] : null,
      skills: Array.isArray(updatedCandidate.skills) ? updatedCandidate.skills : (updatedCandidate.skills ? [updatedCandidate.skills] : []),
      selectedSkills: Array.isArray(updatedCandidate.selectedSkills) ? updatedCandidate.selectedSkills : (updatedCandidate.selectedSkills ? [updatedCandidate.selectedSkills] : []),
      experiences: updatedCandidate.experiences || [],
      education: updatedCandidate.education || [],
      references: updatedCandidate.references || [],
      otherDocuments: updatedCandidate.otherDocuments || [],
    }

    return NextResponse.json(
      createApiResponse(true, responseCandidate, 'Candidate updated successfully')
    )
  } catch (error) {
    console.error('Update candidate error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createApiResponse(false, null, 'Validation failed', JSON.stringify(error.errors)),
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      createApiResponse(false, null, '', 'Internal server error'),
      { status: 500 }
    )
  }
})

// DELETE /api/candidates/[id] - Delete candidate by ID
export const DELETE = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    
    console.log('Deleting candidate:', id);

    // Get the candidate details including user info and resume file
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        user: true,
        applications: true,
        interviews: true,
        candidateShares: true,
      },
    })

    if (!candidate) {
      return NextResponse.json(
        createApiResponse(false, null, '', 'Candidate not found'),
        { status: 404 }
      )
    }

    // Check permissions (recruiters can delete any candidate, candidates can only delete themselves)
    const userRole = request.user!.role
    const isOwner = candidate.userId === request.user!.userId
    const isRecruiter = userRole === 'RECRUITER'

    if (!isOwner && !isRecruiter && userRole !== 'ADMIN') {
      return NextResponse.json(
        createApiResponse(false, null, '', 'Permission denied'),
        { status: 403 }
      )
    }

    console.log('Found candidate to delete:', {
      id: candidate.id,
      email: candidate.email,
      userId: candidate.userId,
      resumeUrl: candidate.resumeUrl
    });

    // Start a transaction to ensure all deletions happen together
    await prisma.$transaction(async (tx) => {
      // Delete related records first (due to foreign key constraints)
      
      // Delete candidate shares
      if (candidate.candidateShares.length > 0) {
        await tx.candidateShare.deleteMany({
          where: { candidateId: id }
        })
        console.log(`Deleted ${candidate.candidateShares.length} candidate shares`);
      }

      // Delete interviews
      if (candidate.interviews.length > 0) {
        await tx.interview.deleteMany({
          where: { candidateId: id }
        })
        console.log(`Deleted ${candidate.interviews.length} interviews`);
      }

      // Delete job applications
      if (candidate.applications.length > 0) {
        await tx.jobApplication.deleteMany({
          where: { candidateId: id }
        })
        console.log(`Deleted ${candidate.applications.length} job applications`);
      }

      // Delete the candidate profile
      await tx.candidate.delete({
        where: { id },
      })
      console.log('Deleted candidate profile');

      // Delete the associated user account (only if recruiter is deleting)
      if (isRecruiter || userRole === 'ADMIN') {
        await tx.user.delete({
          where: { id: candidate.userId }
        })
        console.log('Deleted user account');
      }
    })

    // Delete resume file and other documents if they exist
    if (candidate.resumeUrl) {
      try {
        // The resumeUrl could be in different formats:
        // - "/uploads/resumes/filename.pdf" (public path)
        // - "uploads/resumes/filename.pdf" (relative path)
        // - Full URL for cloud storage
        
        let filePath = candidate.resumeUrl;
        
        // Handle different URL formats
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
          // Cloud storage URL - extract the path after domain
          try {
            const url = new URL(filePath);
            filePath = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
          } catch (urlError) {
            console.error('Invalid URL format:', filePath);
            filePath = candidate.resumeUrl;
          }
        } else if (filePath.startsWith('/')) {
          // Remove leading slash for FileUtils and add public/ prefix if not present
          filePath = filePath.substring(1);
        }
        
        // Ensure the path includes 'public/' prefix for files stored in public directory
        if (!filePath.startsWith('public/') && (filePath.startsWith('uploads/') || filePath.includes('/uploads/'))) {
          filePath = `public/${filePath}`;
        }
        
        // Use FileUtils to delete the file
        const deleted = FileUtils.deleteFile(filePath);
        
        if (deleted) {
          console.log('Successfully deleted resume file:', filePath);
        } else {
          console.log('Resume file not found or already deleted:', filePath);
        }
      } catch (fileError) {
        console.error('Error deleting resume file:', fileError);
        // Don't fail the entire operation if file deletion fails
      }
    }

    // Delete other documents if they exist
    if (candidate.otherDocuments) {
      try {
        let otherDocs = candidate.otherDocuments;
        
        // Handle JSON field - it might be string or object
        if (typeof otherDocs === 'string') {
          otherDocs = JSON.parse(otherDocs);
        }
        
        if (Array.isArray(otherDocs)) {
          for (const doc of otherDocs) {
            if (doc && typeof doc === 'object' && 'fileUrl' in doc) {
              try {
                const docObj = doc as { fileUrl?: string };
                let filePath = docObj.fileUrl;
                
                if (!filePath) continue;
                
                // Handle different URL formats
                if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
                  const url = new URL(filePath);
                  filePath = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
                } else if (filePath.startsWith('/')) {
                  filePath = filePath.substring(1);
                }
                
                // Ensure the path includes 'public/' prefix for files stored in public directory
                if (!filePath.startsWith('public/') && (filePath.startsWith('uploads/') || filePath.includes('/uploads/'))) {
                  filePath = `public/${filePath}`;
                }
                
                const deleted = FileUtils.deleteFile(filePath);
                
                if (deleted) {
                  console.log('Successfully deleted other document:', filePath);
                } else {
                  console.log('Other document not found or already deleted:', filePath);
                }
              } catch (docError) {
                console.error('Error deleting other document:', docError);
              }
            }
          }
        }
      } catch (docsError) {
        console.error('Error processing other documents for deletion:', docsError);
      }
    }

    console.log('Successfully deleted candidate and all related data');

    return NextResponse.json(
      createApiResponse(
        true,
        { deletedCandidateId: id },
        'Candidate and all related data deleted successfully'
      )
    )
  } catch (error) {
    console.error('Delete candidate error:', error)
    return NextResponse.json(
      createApiResponse(false, null, '', 'Internal server error'),
      { status: 500 }
    )
  }
})
