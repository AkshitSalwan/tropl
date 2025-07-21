import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { createApiResponse } from '@/lib/validations';
import { uploadFileToSupabase, generateFilePath } from '@/lib/supabase';

// POST /api/candidates/upload-resume - Upload and save resume file
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        createApiResponse(false, null, '', 'No file uploaded'),
        { status: 400 }
      );
    }

    const userId = request.user!.userId;
    console.log('Upload request - userId:', userId, 'type:', typeof userId);

    // Validate userId format (MongoDB ObjectId should be 24 hex characters)
    if (!userId || typeof userId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      console.error('Invalid userId format:', userId);
      return NextResponse.json(
        createApiResponse(false, null, '', 'Invalid user authentication'),
        { status: 401 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        createApiResponse(false, null, '', 'Invalid file type'),
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        createApiResponse(false, null, '', 'File size too large. Maximum 10MB allowed.'),
        { status: 400 }
      );
    }

    // Generate unique file path for Supabase storage
    const filePath = generateFilePath(userId, file.name);
    
    // Upload file to Supabase storage
    const { url: publicUrl, error: uploadError } = await uploadFileToSupabase(
      file, 
      'resumes', // bucket name
      filePath
    );

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        createApiResponse(false, null, '', `File upload failed: ${uploadError}`),
        { status: 500 }
      );
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
    });

    // Update candidate record with resume URL if candidate exists
    const existingCandidate = await prisma.candidate.findUnique({
      where: { userId },
    });

    if (existingCandidate) {
      await prisma.candidate.update({
        where: { userId },
        data: { resumeUrl: publicUrl },
      });
    }

    return NextResponse.json(
      createApiResponse(
        true,
        {
          id: resumeFile.id,
          fileName: resumeFile.fileName,
          originalName: resumeFile.originalName,
          fileUrl: publicUrl,
          fileSize: resumeFile.fileSize,
          mimeType: resumeFile.mimeType,
        },
        'File uploaded successfully'
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload resume file error:', error);
    return NextResponse.json(
      createApiResponse(false, null, '', 'Internal server error'),
      { status: 500 }
    );
  }
});
