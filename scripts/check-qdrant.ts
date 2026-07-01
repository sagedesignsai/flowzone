import "dotenv/config"
import { QdrantClient } from "@qdrant/js-client-rest"

async function main() {
  console.log("QDRANT_URL:", process.env.QDRANT_URL)
  console.log("QDRANT_API_KEY:", process.env.QDRANT_API_KEY?.slice(0, 20) + "...")

  const client = new QdrantClient({
    url: process.env.QDRANT_URL!,
    apiKey: process.env.QDRANT_API_KEY!,
  })

  const result = await client.getCollections()
  console.log("Qdrant connected. Collections:", JSON.stringify(result.collections, null, 2))
}

main().catch(console.error)
