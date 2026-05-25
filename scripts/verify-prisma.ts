import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
}).$extends(withAccelerate())

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
