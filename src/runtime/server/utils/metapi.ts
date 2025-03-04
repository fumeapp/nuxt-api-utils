import type { H3Event } from 'h3'
import { setResponseStatus } from 'h3'
import type { MetapiDetail, MetapiResponse } from '#api-utils'

let start: number | undefined

function bench(): string {
  const end = performance.now()
  return start ? `${(end - start).toFixed(3)}ms` : 'n/a'
}

function render(data: unknown): MetapiResponse {
  return {
    meta: {
      benchmark: bench(),
      success: true,
    },
    data,
  }
}

function success(message: string, data?: unknown): MetapiResponse {
  return {
    meta: {
      benchmark: bench(),
      success: true,
      detail: message,
    },
    data,
  }
}

function error(event: H3Event, detail: MetapiDetail, code: number = 400): MetapiResponse {
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

function zodError(event: H3Event, message: string, path: string): MetapiResponse {
  return error(event, [{ message, path: [path], code: 'custom' }], 400)
}

function notFound(event: H3Event): MetapiResponse {
  return error(event, 'Not Found', 404)
}

function renderNullError(event: H3Event, data: unknown): MetapiResponse {
  if (data === null) return error(event, 'Not Found', 404)
  return render(data)
}

export function metapi() {
  start = performance.now()
  return {
    render,
    success,
    error,
    zodError,
    renderNullError,
    notFound,
  }
}
