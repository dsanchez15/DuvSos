export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface ErrorBody {
  error?: string
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)

  if (!res.ok) {
    const body = (await res.json().catch(() => undefined)) as ErrorBody | undefined
    throw new ApiError(res.status, body?.error ?? `Request failed with status ${res.status}`, body)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

export const apiClient = {
  get<T>(url: string): Promise<T> {
    return request<T>(url)
  },
  post<T>(url: string, body: unknown): Promise<T> {
    return request<T>(url, jsonInit('POST', body))
  },
  put<T>(url: string, body: unknown): Promise<T> {
    return request<T>(url, jsonInit('PUT', body))
  },
  patch<T>(url: string, body: unknown): Promise<T> {
    return request<T>(url, jsonInit('PATCH', body))
  },
  delete<T>(url: string): Promise<T> {
    return request<T>(url, { method: 'DELETE' })
  },
}
