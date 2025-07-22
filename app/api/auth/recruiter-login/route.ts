import { NextRequest, NextResponse } from 'next/server'
import { AuthUtils } from '@/lib/auth'
import { createApiResponse } from '@/lib/validations'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)
    const { email, password } = validatedData

    // Look up user in database
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        recruiter: true,
      },
    })

    if (!user || user.role !== 'RECRUITER') {
      return NextResponse.json(
        createApiResponse(false, null, '', 'Invalid email or password'),
        { status: 401 }
      )
    }

    // Check password
    if (user.password) {
      // For hashed passwords
      const isValidPassword = await AuthUtils.comparePassword(password, user.password)
      if (!isValidPassword) {
        return NextResponse.json(
          createApiResponse(false, null, '', 'Invalid email or password'),
          { status: 401 }
        )
      }
    } else {
      // Temporary fallback for demo - remove in production
      if (email === 'admin@tropl.ai' && password === 'admin123') {
        // Allow login for demo user
      } else {
        return NextResponse.json(
          createApiResponse(false, null, '', 'Invalid email or password'),
          { status: 401 }
        )
      }
    }

    // Generate JWT token
    const token = AuthUtils.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Prepare user data for response (exclude password)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      verified: user.verified,
      recruiter: user.recruiter,
    }

    return NextResponse.json(
      createApiResponse(true, { user: userData, token }, 'Login successful')
    )
  } catch (error) {
    console.error('Recruiter login error:', error)
    return NextResponse.json(
      createApiResponse(false, null, '', 'Internal server error'),
      { status: 500 }
    )
  }
}
