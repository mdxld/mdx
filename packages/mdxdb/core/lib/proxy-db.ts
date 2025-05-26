import { MdxDbInterface } from './types.js'
import { Collection } from './collection.js'

/**
 * Creates a proxy wrapper around a database instance to enable collection-based access
 */
export function createProxyDb(db: MdxDbInterface): MdxDbInterface & Record<string, Collection> {
  const collectionCache = new Map<string, Collection>()

  return new Proxy(db, {
    get(target, prop, receiver) {
      if (prop in target) {
        const value = Reflect.get(target, prop, receiver)
        return typeof value === 'function' ? value.bind(target) : value
      }

      if (typeof prop === 'string') {
        if (!collectionCache.has(prop)) {
          collectionCache.set(prop, new Collection(target, prop))
        }
        return collectionCache.get(prop)
      }

      return undefined
    },

    has(target, prop) {
      return prop in target || typeof prop === 'string'
    },

    ownKeys(target) {
      return Reflect.ownKeys(target)
    },

    getOwnPropertyDescriptor(target, prop) {
      return Reflect.getOwnPropertyDescriptor(target, prop)
    }
  }) as MdxDbInterface & Record<string, Collection>
}
