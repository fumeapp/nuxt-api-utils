import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core'
import type { ZodIssue } from 'zod'

export interface BinderConfig {
  drizzleFactory: () => DrizzleD1Database<unknown>
  tables: Record<string, SQLiteTableWithColumns<TableConfig>>
}

export type MetapiDetail = string | ZodIssue[]

export interface MetapiResponse<T = unknown> {
  meta: {
    benchmark: string
    success: boolean
    detail?: MetapiDetail
  }
  data: T
}
