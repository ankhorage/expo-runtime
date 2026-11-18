import type { ExpoApprovalNotificationRuntimeOptions, FlowApprovalRoute } from './types';

/*** Checks the server-owned approval state before delegating the safe route to host navigation. */
export async function handleFlowApprovalRouteAsync(
  route: FlowApprovalRoute,
  options: ExpoApprovalNotificationRuntimeOptions,
  isCurrent: () => boolean = () => true,
): Promise<void> {
  const availability = await resolveAvailabilityAsync(route, options);
  if (!isCurrent()) return;
  if (availability === 'available') {
    await options.navigateAsync(route);
    return;
  }
  await options.onUnavailableAsync(route, availability);
}

/*** Converts an unavailable server lookup into the host's explicit offline state. */
async function resolveAvailabilityAsync(
  route: FlowApprovalRoute,
  options: ExpoApprovalNotificationRuntimeOptions,
): Promise<FlowApprovalAvailability> {
  try {
    return await options.resolveAvailabilityAsync(route);
  } catch {
    return 'offline';
  }
}

type FlowApprovalAvailability = Awaited<
  ReturnType<ExpoApprovalNotificationRuntimeOptions['resolveAvailabilityAsync']>
>;
