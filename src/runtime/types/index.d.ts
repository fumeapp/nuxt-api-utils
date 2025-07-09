import type { ZodIssue } from 'zod'

import type { Database, TableConfig } from 'drizzle-orm'

export interface BinderConfig { drizzleFactory: () => Database<TableConfig> }

export type MetapiDetail = string | ZodIssue[]

export interface MetapiResponse<T = unknown> {
  meta: {
    benchmark: string
    success: boolean
    detail?: MetapiDetail
  }
  data: T
}
