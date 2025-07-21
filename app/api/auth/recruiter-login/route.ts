import { NextRequest, NextResponse } from 'next/server'
import { AuthUtils } from '@/lib/auth'
import { createApiResponse } from '@/lib/validations'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Rate limiting map (in production, use Redis or external service)
const rateLimitMap = new Map<string, { attempts: number; lastAttempt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)
    const { email, password } = validatedData

    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const rateLimitKey = `${clientIP}:${email}`
    const now = Date.now()
    
    const rateLimit = rateLimitMap.get(rateLimitKey)
    if (rateLimit) {
      if (rateLimit.attempts >= MAX_ATTEMPTS && (now - rateLimit.lastAttempt) < LOCKOUT_DURATION) {
        return NextResponse.json(
          createApiResponse(false, null, '', 'Too many failed attempts. Please try again later.'),
          { status: 429 }
        )
      }
      
      // Reset if lockout period has passed
      if ((now - rateLimit.lastAttempt) >= LOCKOUT_DURATION) {
        rateLimitMap.delete(rateLimitKey)
      }
    }

    // Look up user in database
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        recruiter: true,
      },
    })

    // Check if user exists and has correct role
    if (!user || user.role !== 'RECRUITER') {
      // Record failed attempt
      const currentAttempts = rateLimit ? rateLimit.attempts + 1 : 1
      rateLimitMap.set(rateLimitKey, { attempts: currentAttempts, lastAttempt: now })
      
      return NextResponse.json(
        createApiResponse(false, null, '', 'Invalid email or password'),
        { status: 401 }
      )
    }

    // Check password
    if (!user.password) {
      // Record failed attempt
      const currentAttempts = rateLimit ? rateLimit.attempts + 1 : 1
      rateLimitMap.set(rateLimitKey, { attempts: currentAttempts, lastAttempt: now })
      
      return NextResponse.json(
        createApiResponse(false, null, '', 'Invalid email or password'),
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await AuthUtils.comparePassword(password, user.password)
    if (!isValidPassword) {
      // Record failed attempt
      const currentAttempts = rateLimit ? rateLimit.attempts + 1 : 1
      rateLimitMap.set(rateLimitKey, { attempts: currentAttempts, lastAttempt: now })
      
      return NextResponse.json(
        createApiResponse(false, null, '', 'Invalid email or password'),
        { status: 401 }
      )
    }

    // Clear rate limiting on successful login
    rateLimitMap.delete(rateLimitKey)

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // Generate JWT token
    const token = AuthUtils.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Prepare user data for response (exclude sensitive data)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      verified: user.verified,
      recruiter: user.recruiter,
    }

    // Create response with security headers
    const response = NextResponse.json(
      createApiResponse(true, { user: userData, token }, 'Login successful')
    )

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')

    return response
  } catch (error) {
    // Log error securely (without sensitive data)
    console.error('Recruiter login error:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return NextResponse.json(
      createApiResponse(false, null, '', 'Internal server error'),
      { status: 500 }
    )
  }
}
