import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient, ApiError } from '@/lib/api-client'

const mockFetch = vi.fn()
global.fetch = mockFetch

function jsonResponse(status: number, body?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response
}

describe('apiClient', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('get returns parsed json', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, [{ id: 1 }]))
    const data = await apiClient.get<Array<{ id: number }>>('/api/todos')
    expect(data).toEqual([{ id: 1 }])
    expect(mockFetch).toHaveBeenCalledWith('/api/todos', undefined)
  })

  it('post sends json body with content-type header', async () => {
    mockFetch.mockResolvedValue(jsonResponse(201, { id: 1 }))
    await apiClient.post('/api/todos', { title: 'Test' })
    expect(mockFetch).toHaveBeenCalledWith('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test' }),
    })
  })

  it('put and patch send correct methods', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, {}))
    await apiClient.put('/api/todos/1', { title: 'A' })
    expect(mockFetch.mock.calls[0][1]?.method).toBe('PUT')
    await apiClient.patch('/api/todos/1', { title: 'B' })
    expect(mockFetch.mock.calls[1][1]?.method).toBe('PATCH')
  })

  it('delete uses DELETE method', async () => {
    mockFetch.mockResolvedValue(jsonResponse(204))
    await apiClient.delete('/api/todos/1')
    expect(mockFetch).toHaveBeenCalledWith('/api/todos/1', { method: 'DELETE' })
  })

  it('returns undefined for 204 No Content', async () => {
    mockFetch.mockResolvedValue(jsonResponse(204))
    const data = await apiClient.delete('/api/todos/1')
    expect(data).toBeUndefined()
  })

  it('throws ApiError with status and server message on failure', async () => {
    mockFetch.mockResolvedValue(jsonResponse(400, { error: 'Name is required' }))
    const promise = apiClient.post('/api/categories', {})
    await expect(promise).rejects.toBeInstanceOf(ApiError)
    await expect(promise).rejects.toMatchObject({ status: 400, message: 'Name is required' })
  })

  it('throws ApiError with generic message when body is not json', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('not json')),
    } as unknown as Response)
    await expect(apiClient.get('/api/x')).rejects.toMatchObject({
      status: 500,
      message: 'Request failed with status 500',
    })
  })
})
