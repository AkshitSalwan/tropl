import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { createApiResponse } from '@/lib/validations'
import { uploadFileToSupabase, generateFilePath } from '@/lib/supabase'

// Apply authentication middleware and export as POST
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const uploadType = formData.get('uploadType') as string || 'RESUME'

    if (!files || files.length === 0) {
      return NextResponse.json(
        createApiResponse(false, null, '', 'No files provided'),
        { status: 400 }
      )
    }

    const userId = request.user!.userId
    const uploadedFiles = []

    for (const file of files) {
      // Define allowed file types and max sizes
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ]
      const maxSize = 10 * 1024 * 1024 // 10MB

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          createApiResponse(false, null, '', `Invalid file type for ${file.name}. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG`),
          { status: 400 }
        )
      }

      // Validate file size
      if (file.size > maxSize) {
        return NextResponse.json(
          createApiResponse(false, null, '', `File ${file.name} is too large. Maximum size: 10MB`),
          { status: 400 }
        )
      }

      try {
        // Generate unique file path for Supabase storage
        const filePath = generateFilePath(userId, file.name)
        
        // Upload file to Supabase storage
        const { url: publicUrl, error: uploadError } = await uploadFileToSupabase(
          file, 
          'resumes', // bucket name
          filePath
        )

        if (uploadError) {
          console.error('Supabase upload error:', uploadError)
          return NextResponse.json(
            createApiResponse(false, null, '', `Upload failed for ${file.name}: ${uploadError}`),
            { status: 500 }
          )
        }

        // Save file record to database
        const resumeFile = await prisma.resumeFile.create({
          data: {
            originalName: file.name,
            fileName: filePath.split('/').pop() || file.name,
            filePath: publicUrl,
            fileSize: file.size,
            mimeType: file.type,
            uploadedBy: userId,
            status: 'COMPLETED',
          },
        })

        uploadedFiles.push({
          id: resumeFile.id,
          originalName: file.name,
          fileName: resumeFile.fileName,
          fileSize: file.size,
          mimeType: file.type,
          status: 'COMPLETED',
          uploadedAt: resumeFile.createdAt,
        })
      } catch (error) {
        console.error('File upload error:', error)
        return NextResponse.json(
          createApiResponse(false, null, '', `Failed to upload ${file.name}`),
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      createApiResponse(true, { files: uploadedFiles }, 'Files uploaded successfully'),
      { status: 201 }
    )
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      createApiResponse(false, null, '', 'Internal server error'),
      { status: 500 }
    )
  }
})
