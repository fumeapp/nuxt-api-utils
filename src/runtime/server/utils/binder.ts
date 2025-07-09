import type { H3Event, Router } from 'h3'
import { eq } from 'drizzle-orm'
import { createError, defineEventHandler } from 'h3'
import type { BinderConfig } from '#api-utils'

export function modelBinder(config: BinderConfig, router: Router) {
  async function lookupModels<T extends Record<string, unknown>>(modelNames: (keyof T)[], event: H3Event): Promise<T> {
    const db = config.drizzleFactory()
    const result = {} as T

    for (const key of modelNames) {
      const table = db.session.schema.schema[`${String(key)}s` as keyof typeof db.session.schema.schema]
      if (!table)
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })

      const id = event.context.params?.[`${String(key)}Id`]
      if (!id)
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })

      const record = db.query[`${String(key)}s`].findFirst({ where: eq(table.columns.id, id) })
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
