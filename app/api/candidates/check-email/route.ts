import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { createApiResponse } from '@/lib/validations';
import { z } from 'zod';

const checkEmailSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const validatedData = checkEmailSchema.parse(body);
    const userId = request.user!.userId;

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        createApiResponse(false, { exists: true }, 'user with same email already exists'),
        { status: 409 }
      );
    }

    return NextResponse.json(
      createApiResponse(true, { exists: false }, 'Email is available')
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createApiResponse(false, null, '', `Validation error: ${error.errors.map(e => e.message).join(', ')}`),
        { status: 400 }
      );
    }
    console.error('Check email error:', error);
    return NextResponse.json(
      createApiResponse(false, null, '', 'Internal server error'),
      { status: 500 }
    );
  }
});
