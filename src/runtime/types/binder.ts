import type { H3Event } from 'h3'

export interface BinderConfig {
  prismaFactory: (event: H3Event) => unknown
  models: Record<string, unknown>
}
