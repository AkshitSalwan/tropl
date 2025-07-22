import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@tropl.ai' }
    })

    if (existingAdmin) {
      console.log('✅ Admin user already exists')
      return
    }

    // Hash the admin password - keeping simple for now
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Create admin user with recruiter role
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@tropl.ai',
        name: 'Admin User',
        role: 'RECRUITER',
        password: hashedPassword,
        verified: true,
      },
    })

    console.log('✅ Created admin user:', adminUser.email)

    // Create recruiter profile for admin
    const recruiterProfile = await prisma.recruiter.create({
      data: {
        userId: adminUser.id,
        companyName: 'Tropl',
        department: 'HR',
        designation: 'Admin',
        experience: 5,
      },
    })

    console.log('✅ Created recruiter profile for admin')
    console.log('🎉 Database seeding completed!')
    
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
