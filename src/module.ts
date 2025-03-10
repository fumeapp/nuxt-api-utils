import { defineNuxtModule, createResolver, addImports, addServerImportsDir } from '@nuxt/kit'

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
  setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url)
    nuxt.options.alias['#api-utils'] = resolver.resolve('./runtime/types/index.d.ts')

    const composables = [
      { name: 'useApiFetch', from: resolver.resolve('./runtime/app/composables/apiFetch') },
    ]

    addImports(composables)

    addServerImportsDir(resolver.resolve('./runtime/server/utils'))
  },
})
