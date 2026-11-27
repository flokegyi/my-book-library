import bcrypt from 'bcryptjs'
import { env } from '../src/config/env.js'
import { PASSWORD_SALT_ROUNDS } from '../src/lib/auth.js'
import { prisma } from '../src/lib/prisma.js'

async function main() {
  const email = env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = env.ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed the account')
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      tokenVersion: { increment: 1 },
    },
    create: {
      email,
      passwordHash,
      name: 'Library Owner',
    },
    select: {
      email: true,
    },
  })

  console.log(`Seeded library account: ${user.email}`)
}

main()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
