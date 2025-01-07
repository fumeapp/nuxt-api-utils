import type { ZodIssue } from 'zod'

export interface MetapiResponse<T = unknown> {
  meta: {
    benchmark: string
    success: boolean
    detail?: MetapiDetail
  }
  data: T
}

export type MetapiDetail = string | ZodIssue[]
