import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthUtils } from '@/lib/auth'
import { EmailService } from '@/lib/email'
import { loginSchema, createApiResponse } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)
    const { contact, method } = validatedData

    // Determine if contact is email or phone
    const isEmail = method === 'email' || contact.includes('@')
    const searchField = isEmail ? 'email' : 'phone'    // Find or create user
    let user = await prisma.user.findFirst({
      where: isEmail ? { email: contact } : { phone: contact },
    })

    if (!user) {
      // Create new user
      const userData = {
        email: isEmail ? contact : `${contact}@temp.com`, // Temporary email for phone users
        phone: isEmail ? null : contact,
        role: 'CANDIDATE' as const, // Default role
        verified: false,
      }
      
      user = await prisma.user.create({
        data: userData,
      })
    }

    // Generate OTP
    const otp = AuthUtils.generateOTP()
    const otpExpiry = AuthUtils.getOTPExpiry()

    // Update user with OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpiry,
      },
    })

    // Send OTP
    let otpSent = false
    if (isEmail) {
      otpSent = await EmailService.sendOTPEmail(contact, otp, user.name || undefined)
    } else {
      // SMS integration would go here
      console.log(`SMS OTP for ${contact}: ${otp}`)
      otpSent = true // Mock success for now
    }

    if (!otpSent) {
      return NextResponse.json(
        createApiResponse(false, null, '', 'Failed to send OTP'),
        { status: 500 }
      )
    }

    return NextResponse.json(
      createApiResponse(true, { userId: user.id }, 'OTP sent successfully')
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      createApiResponse(false, null, '', 'Internal server error'),
      { status: 500 }
    )
  }
}
