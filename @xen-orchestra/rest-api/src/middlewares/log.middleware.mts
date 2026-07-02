import { Request, Response, NextFunction } from 'express'
import { createLogger } from '@xen-orchestra/log'
import { iocContainer } from '../ioc/ioc.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'

const log = createLogger('xo:rest-api')

function extractAuditEvent(method: string, path: string): string {
  // Extract resource type and action from path like /rest/v0/vms/{id}/actions/clean_shutdown
  const match = path.match(/\/rest\/v0\/([\w-]+)(?:\/[^/]+)?(?:\/actions\/([\w-]+))?/)
  if (match?.[1]) {
    const resource = match[1]
    const action = match[2]
    return action ? `${resource}:${action}` : `${resource}:${method}`
  }
  return method
}

function auditEventToString(event: string): string {
  return event.toLowerCase()
}

function extractObjectId(path: string): string | undefined {
  // Extract object ID from path like /rest/v0/vms/{id}/actions/snapshot
  const match = path.match(/\/rest\/v0\/[\w-]+\/([a-f0-9\-]+)(?:\/|$)/)
  return match?.[1]
}

export function logMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()

  res.on('finish', async () => {
    const duration = Date.now() - start
    const { method, originalUrl, ip } = req
    const { statusCode } = res

    log.debug(`[${new Date().toISOString()}] ${method} ${originalUrl} ${statusCode} ${duration}ms`)

    if (method !== 'GET') {
      try {
        const restApi = iocContainer.get(RestApi)
        const user = restApi.getCurrentUser({ throwUnauthenticated: false })
        if (user) {
          const auditEvent = auditEventToString(extractAuditEvent(method, originalUrl))
          const userAgent = req.get('user-agent') || 'unknown'
          const objectId = extractObjectId(originalUrl)
          const xoApp = restApi.xoApp as any
          let objectName: string | undefined
          if (objectId) {
            try {
              const obj = await xoApp.getObject(objectId)
              objectName = obj?.name_label || obj?.name
            } catch {
              // Object not found or error, skip objectName
            }
          }
          xoApp.emit('xo:audit', auditEvent, {
            userId: user.id,
            userName: user.name,
            userIp: ip,
            path: originalUrl,
            statusCode,
            duration,
            userAgent,
            ...(objectName && { objectName }),
          })
        }
      } catch (error) {
        log.warn('Failed to emit audit event for REST API call', { error })
      }
    }
  })

  next()
}
