import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

// Use DIRECT_DATABASE_URL for seeding (local database)
const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Seed a test user
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      name: "Test User",
      emailVerified: true,
    },
  })

  // Seed a test project
  const project = await prisma.project.upsert({
    where: { id: "test-project-1" },
    update: {},
    create: {
      id: "test-project-1",
      name: "Test Project",
      userId: user.id,
      envVars: { NODE_ENV: "development" },
    },
  })

  // Seed a test chat
  const chat = await prisma.chat.upsert({
    where: { id: "test-chat-1" },
    update: {},
    create: {
      id: "test-chat-1",
      title: "Test Chat",
      userId: user.id,
      projectId: project.id,
    },
  })

  console.log("✅ Seed data created:", { user, project, chat })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
