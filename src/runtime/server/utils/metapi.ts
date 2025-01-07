import type { MetapiResponse, MetapiDetail } from '#api-utils'

let start: number | undefined

const bench = (): string => {
  const end = performance.now()
  return start ? `${(end - start).toFixed(3)}ms` : 'n/a'
}

const render = (data: unknown): MetapiResponse => {
  return {
    meta: {
      benchmark: bench(),
      success: true,
    },
    data,
  }
}

const success = (message: string, data?: unknown): MetapiResponse => {
  return {
    meta: {
      benchmark: bench(),
      success: true,
      detail: message,
    },
    data,
  }
}

const error = (event: unknown, detail: MetapiDetail, code: number = 400): MetapiResponse => {
  setResponseStatus(event, code)
  return {
    meta: {
      benchmark: bench(),
      success: false,
      detail,
    },
    data: [],
  }
}

const notFound = (event: unknown): MetapiResponse => error(event, 'Not Found', 404)

const renderNullError = (event: unknown, data: unknown): MetapiResponse => {
  if (data === null) return error(event, 'Not Found', 404)
  return render(data)
}

const metapi = () => {
  start = performance.now()
  return { render, success, error, renderNullError, notFound }
}
export default metapi
