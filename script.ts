import "dotenv/config"
import { PrismaClient } from "./generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const connectionString =
  process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  try {
    const user = await prisma.user.create({
      data: {
        email: `user-${Date.now()}@example.com`,
        name: "Test User",
      },
    })
    console.log("✅ Created user:", user.id)

    const post = await prisma.post.create({
      data: {
        title: "Hello World",
        content: "This is my first post",
        published: true,
        authorId: user.id,
      },
    })
    console.log("✅ Created post:", post.id)

    const allPosts = await prisma.post.findMany({
      include: { author: true },
    })
    console.log("✅ Found posts:", allPosts.length)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
