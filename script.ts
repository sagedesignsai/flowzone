import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"

const prisma = new PrismaClient().$extends(withAccelerate())

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
