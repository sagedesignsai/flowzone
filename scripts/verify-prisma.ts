import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function verify() {
  try {
    const userCount = await prisma.user.count()
    console.log(`✅ Connected. Found ${userCount} user(s) in the database.`)
    process.exit(0)
  } catch (error) {
    console.error("❌ Connection failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verify()
