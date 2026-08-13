# Bundled media

Expo Runtime owns the Expo/Metro-specific resolution boundary for canonical bundled media.

A manifest keeps only the app-relative canonical source, for example:

`{ kind: 'bundled', path: 'assets/authoring/hero/hero.png' }`

Metro cannot resolve an arbitrary runtime string with a dynamic `require()`. Generated Expo app code therefore creates a static `ExpoBundledMediaRegistry` whose values come from literal `require('../../assets/...')` expressions. `getExpoBundledMediaRegistrySource()` renders that static module from explicit canonical-path/require-path entries.

`createExpoBundledMediaResolver()` consumes the generated registry and resolves only `bundled` media. Unknown paths and non-bundled sources return `null`, allowing callers to compose this Expo-specific resolver with provider-backed media resolution at the host/runtime boundary.

The registry contains runtime asset values only. Temporary picker URIs, filesystem locations outside the generated app, provider credentials, and signed storage URLs are not canonical bundled media identity and must never be serialized into the manifest.
