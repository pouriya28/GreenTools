import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('*/auth/staff/operation-password/verify', () =>
    HttpResponse.json({ success: true, data: null, message: 'تایید شد' })
  ),
]