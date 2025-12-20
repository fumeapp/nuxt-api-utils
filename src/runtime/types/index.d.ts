import type { $ZodIssue } from 'zod/v4/core'

import type { Database, TableConfig } from 'drizzle-orm'

export interface BinderConfig { db: Database<TableConfig> }

export type MetapiDetail = string | $ZodIssue[]

export interface MetapiResponse<T = unknown, M = Record<string, never>> {
  meta: {
    benchmark: string
    success: boolean
    detail?: MetapiDetail
  } & (M extends Record<string, unknown> ? M : Record<string, never>)
  data: T
}
