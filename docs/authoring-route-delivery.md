# Authoring route delivery boundary

Issue [#491](https://github.com/ankhorage/expo-runtime/issues/491) investigates delivery of
manifest-declared authoring screens below `/ankh` into a generated Expo Router application.

## Current released inputs

The public `@ankhorage/studio-authoring@0.1.0` root entrypoint exports
`AUTHORING_ANKH_ROUTE_IDS`, `AnkhRouteId`, and `resolveAnkhRouteId`. Those exports establish the
portable authoring route identities and validate a pathname. They intentionally do not expose an
Expo Router file path, a module specifier, or a screen component. `@ankhorage/contracts@26.10.0`
likewise defines authored application screens and requirements, but no `/ankh` route-to-screen
delivery declaration.

Consequently, Expo Runtime cannot derive a generated Router file from the released APIs without
either copying Studio's route table or inventing a second route generator. Both would violate the
owner boundary.

## Required owner API

`@ankhorage/studio-authoring` must publish a host-independent, serializable route-delivery
definition for each of its `/ankh` routes. Each definition needs the canonical pathname and an
authoring-owned screen export reference. The Expo-specific screen-module adapter, if one is needed,
must be a separate public Authoring/ZORA entrypoint; it must not be implemented in Expo Runtime.

Once that API is released, Expo Runtime can own a small route-delivery planner that translates the
published definitions into Expo Router files. The planner may coordinate file locations and output,
but must not render Authoring UI, duplicate path policy, or contain Studio-specific route data.

## Deliberate non-deliveries

- No `@ankhorage/studio-authoring` dependency is added: the released package lacks the required
  route-delivery contract, so adding it would not make the package a valid consumer.
- No Expo Router action bridge is added or changed. That provider-specific imperative navigation
  concern remains tracked by [#158](https://github.com/ankhorage/expo-runtime/issues/158).
- No Changeset is added. There is no public Expo Runtime behavior change to release while the
  upstream owner API is unavailable.
