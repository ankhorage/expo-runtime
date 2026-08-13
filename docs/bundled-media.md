# Bundled media

Expo Runtime owns the Expo/Metro-specific resolution boundary for canonical bundled media.

A manifest keeps only the app-relative canonical source, for example `{ kind: 'bundled', path: 'assets/authoring/hero/hero.png' }`.

Consumers that only need bundled media should import `@ankhorage/expo-runtime/bundled-media`. This lightweight subpath exports the resolver, registry types and static registry source generator without loading the root Expo runtime/provider barrel. Node-based generators such as the Studio trusted host can therefore generate Metro asset registries without pulling React Native UI peers into their process.

Metro cannot resolve an arbitrary runtime string with a dynamic `require()`. Generated Expo app code therefore creates a static `ExpoBundledMediaRegistry` whose values come from literal `require('../../assets/...')` expressions. `getExpoBundledMediaRegistrySource()` renders that static module and its generated type import also targets the lightweight bundled-media subpath.

`createExpoBundledMediaResolver()` resolves only bundled media. Unknown paths and non-bundled sources return `null`, allowing composition with provider-backed media resolution.

Temporary picker URIs, host filesystem paths, provider credentials and signed storage URLs are never canonical bundled media identity.
