import type { Capability } from '@ankhorage/contracts/capabilities';

/*** Publish the portable capabilities that Expo Runtime owns and executes. */
export const CAPABILITIES = [
  {
    id: 'expo.alert',
    owner: '@ankhorage/expo-runtime',
    access: ['invoke'],
    binding: {
      kind: 'action',
      bindableAs: ['target'],
    },
    label: 'Show an Expo alert',
    description: 'Display a platform alert through the Expo runtime.',
    input: {
      schema: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
  },
] as const satisfies readonly Capability[];
