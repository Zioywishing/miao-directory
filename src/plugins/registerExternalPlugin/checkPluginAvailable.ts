import type { Plugin, registerComponentOption } from '@/class/PluginCenter'

export function checkNormalPlugin(obj: any): obj is Plugin {
   return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof obj.name === 'string' &&
      (obj.icon === undefined || typeof obj.icon === 'object') &&
      typeof obj.disable === 'boolean' &&
      Array.isArray(obj.group) &&
      obj.group.every((group: any) => typeof group === 'string') &&
      typeof obj.priority === 'number' &&
      typeof obj.filter === 'function' &&
      typeof obj.func === 'function'
   )
}

export function checkComponentPlugin(obj: any): obj is registerComponentOption {
   return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof obj.key === 'string' &&
      typeof obj.name === 'string' &&
      (obj.icon === undefined || typeof obj.icon === 'object') &&
      typeof obj.getComponent === 'function' &&
      (obj.group === undefined ||
         (Array.isArray(obj.group) &&
            obj.group.every((item: any) => typeof item === 'string'))) &&
      typeof obj.filter === 'function' &&
      (obj.disable === undefined || typeof obj.disable === 'boolean') &&
      (obj.exitConfirm === undefined || typeof obj.exitConfirm === 'boolean') &&
      (obj.single === undefined || typeof obj.single === 'boolean') &&
      (obj.priority === undefined || typeof obj.priority === 'number')
   )
}
