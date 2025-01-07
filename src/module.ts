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
  // Default configuration options of the Nuxt module
  defaults: {},
  setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url)

    nuxt.options.alias['#auth-utils'] = resolver.resolve(
      './runtime/types/index',
    )

    addServerImportsDir(resolver.resolve('./runtime/server/utils'))

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    // addPlugin(resolver.resolve('./runtime/plugin'))
  },
})
