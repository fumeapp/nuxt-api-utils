import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import type { SQLiteTableWithColumns, TableConfig as D1TableConfig } from 'drizzle-orm/sqlite-core'
import type { MySqlTableWithColumns, TableConfig as MysqlTableConfig } from 'drizzle-orm/mysql-core'
import type { ZodIssue } from 'zod'

export interface BinderConfigD1<
  TTables extends Record<string, SQLiteTableWithColumns<D1TableConfig>>,
  TDb extends DrizzleD1Database<TTables> = DrizzleD1Database<TTables>,
> {
  drizzleFactory: () => TDb
  tables: TTables
}

export interface BinderConfigMysql<
  TTables extends Record<string, MySqlTableWithColumns<MysqlTableConfig>>,
  TDb extends MySql2Database<TTables> = MySql2Database<TTables>,
> {
  drizzleFactory: () => TDb & { $client: AnyMySql2Connection }
  tables: TTables
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
