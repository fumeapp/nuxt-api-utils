import { defineNuxtModule, createResolver, addServerImportsDir } from '@nuxt/kit'

// Module options TypeScript interface definition
export interface ModuleOptions {
  foo?: string
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'api-utils',
    configKey: 'apiUtils',
  },
  defaults: {},
  setup(_options, _nuxt) {
    const resolver = createResolver(import.meta.url)
    addServerImportsDir(resolver.resolve('./runtime/server/utils'))
  },
})
