import type { EventEmitter } from 'node:events'
import type { Task } from '@vates/types/lib/vates/task'
import type { XapiHostStats, XapiVmStats, XapiStatsGranularity } from '@vates/types/common'
import type {
  XenApiHostWrapped,
  XenApiMessage,
  XenApiNetwork,
  XenApiPoolWrapped,
  XenApiSrWrapped,
  XenApiVbdWrapped,
  XenApiVdiWrapped,
  XenApiVgpuWrapped,
  XenApiVifWrapped,
  XenApiVmWrapped,
  XenApiVtpmWrapped,
} from '@vates/types/xen-api'
import type { XoHost, XoServer, XoUser, XapiXoRecord, XoVm, XoSchedule, XoJob } from '@vates/types/xo'

type XapiRecordByXapiXoRecord = {
  host: XenApiHostWrapped
  message: XenApiMessage
  network: XenApiNetwork
  pool: XenApiPoolWrapped
  SR: XenApiSrWrapped
  VBD: XenApiVbdWrapped
  VDI: XenApiVdiWrapped
  'VDI-snapshot': XenApiVdiWrapped
  'VDI-unmanaged': XenApiVdiWrapped
  VGPU: XenApiVgpuWrapped
  VIF: XenApiVifWrapped
  VM: XenApiVmWrapped
  'VM-controller': XenApiVmWrapped
  'VM-snapshot': XenApiVmWrapped
  'VM-template': XenApiVmWrapped
  VTPM: XenApiVtpmWrapped
}

export type XoApp = {
  tasks: EventEmitter & {
    create: (params: { name: string; objectId?: string; type?: string }) => Task
  }

  // methods ------------
  authenticateUser: (
    credentials: { token?: string; username?: string; password?: string },
    userData?: { ip?: string },
    opts?: { bypassOtp?: boolean }
  ) => Promise<{ bypassOtp: boolean; expiration: number; user: XoUser }>
  getAllSchedules(): Promise<XoSchedule[]>
  getAllXenServers(): Promise<XoServer[]>
  getJob(id: XoJob['id']): Promise<XoJob>
  getObject: <T extends XapiXoRecord>(id: T['id'], type?: T['type']) => T
  getObjectsByType: <T extends XapiXoRecord>(
    type: T['type'],
    opts?: { filter?: string | ((obj: T) => boolean); limit?: number }
  ) => Record<T['id'], T>
  getSchedule(id: XoSchedule['id']): Promise<XoSchedule>
  getXapiHostStats: (hostId: XoHost['id'], granularity?: XapiStatsGranularity) => Promise<XapiHostStats>
  getXapiObject: <T extends XapiXoRecord>(maybeId: T['id'] | T, type: T['type']) => XapiRecordByXapiXoRecord[T['type']]
  getXapiVmStats: (vmId: XoVm['id'], granularity?: XapiStatsGranularity) => Promise<XapiVmStats>
  getXenServer(id: XoServer['id']): Promise<XoServer>
  runJob(job: XoJob, schedule: XoSchedule): void
  runWithApiContext: (user: XoUser, fn: () => void) => Promise<unknown>
}
