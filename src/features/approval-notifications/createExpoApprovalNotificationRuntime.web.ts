import { handleFlowApprovalRouteAsync } from './handleFlowApprovalRouteAsync';
import { resolveFlowApprovalRoute } from './resolveFlowApprovalRoute';
import type {
  ExpoApprovalNotificationPermission,
  ExpoApprovalNotificationRuntime,
  ExpoApprovalNotificationRuntimeOptions,
} from './types';

/*** Provides deep-link resume on web without requiring native notification modules or background work. */
export function createExpoApprovalNotificationRuntime(
  options: ExpoApprovalNotificationRuntimeOptions,
): ExpoApprovalNotificationRuntime {
  let started = false;
  const handleLocationChange = async () => {
    const route = resolveFlowApprovalRoute(window.location.href);
    if (route !== undefined) await handleFlowApprovalRouteAsync(route, options);
  };
  const handlePopstate = () => void handleLocationChange();

  return {
    dispose: () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handlePopstate);
      }
      started = false;
    },
    requestPermissionAsync: async () => requestWebNotificationPermissionAsync(),
    startAsync: async () => {
      if (started || typeof window === 'undefined') return;
      started = true;
      await handleLocationChange();
      window.addEventListener('popstate', handlePopstate);
    },
  };
}

/*** Requests browser notification permission only when the browser exposes that optional capability. */
async function requestWebNotificationPermissionAsync(): Promise<ExpoApprovalNotificationPermission> {
  if (typeof Notification === 'undefined') return 'unsupported';
  return (await Notification.requestPermission()) === 'granted' ? 'granted' : 'denied';
}
