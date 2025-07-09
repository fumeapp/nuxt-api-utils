import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import type { SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core'
import type { MySqlTableWithColumns } from 'drizzle-orm/mysql-core'
import type { ZodIssue } from 'zod'

export interface BinderConfigD1 {
  drizzleFactory: () => DrizzleD1Database<unknown>
  tables: Record<string, SQLiteTableWithColumns<TableConfig>>
}

export interface BinderConfigMysql {
  drizzleFactory: () => MySql2Database<unknown>
  tables: Record<string, MySqlTableWithColumns<TableConfig>>
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
