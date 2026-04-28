import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const isVercelProduction = process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'development'

  if (isVercelProduction) {
    // Production: use Neon serverless adapter (WebSocket)
    const { PrismaNeon } = require('@prisma/adapter-neon')
    const { neonConfig } = require('@neondatabase/serverless')
    neonConfig.webSocketConstructor = require('ws')

    const adapter = new PrismaNeon(
      { connectionString: process.env.DATABASE_URL, max: 5 },
      { schema: 'public' }
    )
    return new PrismaClient({ adapter })
  }

  // Local dev: use pg adapter for direct PostgreSQL connection
  const { PrismaPg } = require('@prisma/adapter-pg')
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
