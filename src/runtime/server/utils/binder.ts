import type { H3Event, Router } from 'h3'
import { sql, eq } from 'drizzle-orm'
import { createError, defineEventHandler } from 'h3'
import type { BinderConfig } from '#api-utils'

export function modelBinder(config: BinderConfig, router: Router) {
  function findTableName(modelName: string, schema: Record<string, unknown>): string | null {
    const variations = []

    // Enhanced pluralization rules
    if (modelName.endsWith('s') || modelName.endsWith('x') || modelName.endsWith('z')
      || modelName.endsWith('ch') || modelName.endsWith('sh')) {
      // Sibilants: add "es" (e.g., kiss -> kisses, box -> boxes, church -> churches)
      variations.push(`${modelName}es`)
    }
    else if (modelName.endsWith('y') && modelName.length > 1
      && !'aeiou'.includes(modelName[modelName.length - 2])) {
      // Consonant + y: change y to ies (e.g., city -> cities, baby -> babies)
      variations.push(`${modelName.slice(0, -1)}ies`)
    }
    else if (modelName.endsWith('f')) {
      // f -> ves (e.g., leaf -> leaves, wolf -> wolves)
      variations.push(`${modelName.slice(0, -1)}ves`)
    }
    else if (modelName.endsWith('fe')) {
      // fe -> ves (e.g., knife -> knives, life -> lives)
      variations.push(`${modelName.slice(0, -2)}ves`)
    }
    else if (modelName.endsWith('o') && modelName.length > 1
      && !'aeiou'.includes(modelName[modelName.length - 2])) {
      // Consonant + o: add "es" (e.g., hero -> heroes, potato -> potatoes)
      variations.push(`${modelName}es`)
    }

    // Always try standard pluralization as fallback
    variations.push(`${modelName}s`)

    // Try original name (for words that don't pluralize or are already plural)
    variations.push(modelName)

    for (const variation of variations) {
      if (schema[variation]) {
        return variation
      }
    }

    return null
  }

  async function lookupModels<T extends Record<string, unknown>>(modelNames: (keyof T)[], event: H3Event): Promise<T> {
    const db = config.drizzleFactory()
    const result = {} as T

    for (const key of modelNames) {
      const tableName = findTableName(String(key), db.session.schema.schema)
      if (!tableName)
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })

      const table = db.session.schema.schema[tableName as keyof typeof db.session.schema.schema]
      if (!table)
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })

      const id = event.context.params?.[`${String(key)}Id`]
      if (!id)
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })

      const record = await db.query[tableName].findFirst({
        where: table.columns.id.columnType === 'MySqlBinary'
          ? eq(table.columns.id, sql`UUID_TO_BIN(${id})`)
          : eq(table.columns.id, id),
        extras: table.columns.id.columnType === 'MySqlBinary'
          ? {
              id: sql<string>`BIN_TO_UUID(${table.columns.id})`.as('id'),
            }
          : undefined,
      })

      if (!record)
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })

      result[key] = record as T[typeof key]
    }

    return result
  }

  function bindModel(url: string): { url: string, modelNames: string[] } {
    const parts = url.split('/')
    const modelNames: string[] = []
    const urlParts = parts.map((part) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        const modelName = part.slice(1, -1)
        modelNames.push(modelName)
        return `:${modelName}Id`
      }
      return part
    })
    return { url: urlParts.join('/'), modelNames }
  }

  function modelBoundHandler<T extends Record<string, unknown>>(
    modelNames: (keyof T)[],
    handler: (models: T, event: H3Event) => Promise<unknown>,
  ) {
    return defineEventHandler(async (event: H3Event) => {
      const boundModels = await lookupModels<T>(modelNames, event)
      return handler(boundModels, event)
    })
  }

  function getLastUrlSegment(url: string): string {
    const segments = url.split('/')
    return segments[segments.length - 1].replace(/[{}]/g, '')
  }

  function apiResource<T extends Record<string, unknown>>(
    router: Router,
    route: string,
    handlers: {
      index?: (models: T, event: H3Event) => Promise<unknown>
      create?: (models: T, event: H3Event) => Promise<unknown>
      get?: (models: T, event: H3Event) => Promise<unknown>
      update?: (models: T, event: H3Event) => Promise<unknown>
      remove?: (models: T, event: H3Event) => Promise<unknown>
    },
  ) {
    const modelName = getLastUrlSegment(route)

    if (handlers.index) {
      const { url: boundUrl, modelNames } = bindModel(route)
      router.get(boundUrl, modelBoundHandler<T>(modelNames as (keyof T)[], handlers.index))
    }

    if (handlers.create) {
      const { url: boundUrl, modelNames } = bindModel(route)
      router.post(boundUrl, modelBoundHandler<T>(modelNames as (keyof T)[], handlers.create))
    }

    if (handlers.get) {
      const { url: boundUrl, modelNames } = bindModel(`${route}/{${modelName}}`)
      router.get(boundUrl, modelBoundHandler<T>([...modelNames, modelName] as (keyof T)[], handlers.get))
    }
    if (handlers.update) {
      const { url: boundUrl, modelNames } = bindModel(`${route}/{${modelName}}`)
      router.put(boundUrl, modelBoundHandler<T>([...modelNames, modelName] as (keyof T)[], handlers.update))
    }

    if (handlers.remove) {
      const { url: boundUrl, modelNames } = bindModel(`${route}/{${modelName}}`)
      router.delete(boundUrl, modelBoundHandler<T>([...modelNames, modelName] as (keyof T)[], handlers.remove))
    }
  }

  return {
    ...router,
    getBound: <T extends Record<string, unknown>>(url: string, handler: (models: T, event: H3Event) => Promise<unknown>) => {
      const { url: boundUrl, modelNames } = bindModel(url)
      return router.get(boundUrl, modelBoundHandler<T>(modelNames as (keyof T)[], handler))
    },
    postBound: <T extends Record<string, unknown>>(url: string, handler: (models: T, event: H3Event) => Promise<unknown>) => {
      const { url: boundUrl, modelNames } = bindModel(url)
      return router.post(boundUrl, modelBoundHandler<T>(modelNames as (keyof T)[], handler))
    },
    putBound: <T extends Record<string, unknown>>(url: string, handler: (models: T, event: H3Event) => Promise<unknown>) => {
      const { url: boundUrl, modelNames } = bindModel(url)
      return router.put(boundUrl, modelBoundHandler<T>(modelNames as (keyof T)[], handler))
    },
    patchBound: <T extends Record<string, unknown>>(url: string, handler: (models: T, event: H3Event) => Promise<unknown>) => {
      const { url: boundUrl, modelNames } = bindModel(url)
      return router.patch(boundUrl, modelBoundHandler<T>(modelNames as (keyof T)[], handler))
    },
    deleteBound: <T extends Record<string, unknown>>(url: string, handler: (models: T, event: H3Event) => Promise<unknown>) => {
      const { url: boundUrl, modelNames } = bindModel(url)
      return router.delete(boundUrl, modelBoundHandler<T>(modelNames as (keyof T)[], handler))
    },
    apiResource: <T extends Record<string, unknown>>(url: string, handlers: {
      index?: (models: T, event: H3Event) => Promise<unknown>
      create?: (models: T, event: H3Event) => Promise<unknown>
      get?: (models: T, event: H3Event) => Promise<unknown>
      update?: (models: T, event: H3Event) => Promise<unknown>
      remove?: (models: T, event: H3Event) => Promise<unknown>
    }) => {
      return apiResource<T>(router, url, handlers)
    },
  }
}
