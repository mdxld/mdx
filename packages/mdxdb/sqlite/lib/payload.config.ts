import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { FilesCollection, EmbeddingsCollection } from './collections.js'
import { customType, index } from '@payloadcms/db-sqlite/drizzle/sqlite-core'

const vector = customType<{
  data: number[]
  config: { dimensions: number }
  configRequired: true
  driverData: string
}>({
  dataType(config) {
    return `TEXT` // Store as JSON string
  },
  fromDriver(value: string) {
    return JSON.parse(value)
  },
  toDriver(value: number[]) {
    return JSON.stringify(value)
  },
})

export const createPayloadConfig = (dbUrl?: string, authToken?: string, secret?: string) => buildConfig({
  collections: [FilesCollection, EmbeddingsCollection] as any,
  secret: secret || process.env.PAYLOAD_SECRET || 'mdxdb-secret-key',
  db: sqliteAdapter({
    client: {
      url: dbUrl || process.env.DATABASE_URL || 'file:mdxdb.db',
      authToken: authToken || process.env.DATABASE_AUTH_TOKEN,
    },
    afterSchemaInit: [
      ({ schema, extendTable }) => {
        extendTable({
          table: schema.tables.embeddings,
          columns: {
            vector: vector('vector', { dimensions: 1536 }),
          },
          extraConfig: (table) => ({
            vector_idx: index('vector_idx').on(table.vector),
          }),
        })
        return schema
      },
    ],
  }),
})

export const payloadConfig = createPayloadConfig()

export const getPayloadClient = async (dbUrl?: string, authToken?: string, secret?: string) => {
  let payload

  try {
    const { getPayload } = await import('payload')
    payload = await getPayload({
      config: createPayloadConfig(dbUrl, authToken, secret),
    })
  } catch (error) {
    console.error('Error initializing Payload:', error)
    throw new Error(`Failed to initialize Payload: ${(error as Error).message}`)
  }

  return payload
}
