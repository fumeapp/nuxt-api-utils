import type { H3Event } from 'h3'
import type { ZodIssue } from 'zod'

export type BinderConfig = {
  prismaFactory: (event: H3Event) => unknown
  models: Record<string, unknown>
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
