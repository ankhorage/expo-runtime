import {
  ANKHORAGE_CAPABILITY_NAMES,
  ANKHORAGE_PERMISSION_NAMES,
  type AnkhorageCapabilityName,
  type AnkhoragePermissionName,
  type ScreenRequirements,
} from '@ankhorage/contracts';

interface ExpoRuntimeManifestRequirementSelection {
  readonly permissions: Map<
    AnkhoragePermissionName,
    { readonly permission: AnkhoragePermissionName }
  >;
  readonly capabilities: Map<
    AnkhorageCapabilityName,
    { readonly capability: AnkhorageCapabilityName }
  >;
}

/*** Collect canonical screen requirement-set membership into the deterministic planning maps. */
export function collectExpoRuntimeManifestRequirements(
  screens: Readonly<Record<string, { readonly requires?: ScreenRequirements }>>,
): ExpoRuntimeManifestRequirementSelection {
  const permissions = new Map<
    AnkhoragePermissionName,
    { readonly permission: AnkhoragePermissionName }
  >();
  const capabilities = new Map<
    AnkhorageCapabilityName,
    { readonly capability: AnkhorageCapabilityName }
  >();

  for (const screen of Object.values(screens)) {
    for (const permission of ANKHORAGE_PERMISSION_NAMES) {
      if (hasRequirement(screen.requires?.permissions, permission)) {
        permissions.set(permission, { permission });
      }
    }
    for (const capability of ANKHORAGE_CAPABILITY_NAMES) {
      if (hasRequirement(screen.requires?.capabilities, capability)) {
        capabilities.set(capability, { capability });
      }
    }
  }

  return { permissions, capabilities };
}

/*** Return whether a canonical serializable requirement set contains one enabled name. */
function hasRequirement(
  requirements: Readonly<Partial<Record<string, true>>> | undefined,
  name: string,
): boolean {
  return Object.hasOwn(requirements ?? {}, name);
}
