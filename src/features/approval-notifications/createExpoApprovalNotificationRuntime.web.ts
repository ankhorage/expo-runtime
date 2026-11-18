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
  let lifecycleVersion = 0;
  let started = false;
  const handleLocationChangeAsync = async (startVersion: number) => {
    if (!isCurrentStart(startVersion, lifecycleVersion, started)) return;
    const route = resolveFlowApprovalRoute(window.location.href);
    if (route === undefined) return;
    await handleFlowApprovalRouteAsync(route, options, () =>
      isCurrentStart(startVersion, lifecycleVersion, started),
    );
  };
  const handlePopstate = () =>
    void handleLocationChangeAsync(lifecycleVersion).catch(ignoreEventFailure);

  return {
    dispose: () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handlePopstate);
      }
      lifecycleVersion += 1;
      started = false;
    },
    requestPermissionAsync: async () => requestWebNotificationPermissionAsync(),
    startAsync: async () => {
      if (started || typeof window === 'undefined') return;
      const startVersion = lifecycleVersion;
      started = true;
      await handleLocationChangeAsync(startVersion);
      if (!isCurrentStart(startVersion, lifecycleVersion, started)) return;
      window.addEventListener('popstate', handlePopstate);
    },
  };
}

/*** Prevents rejected browser event work from becoming an unhandled promise rejection. */
function ignoreEventFailure(): undefined {
  return undefined;
}

/*** Keeps an asynchronous web startup from attaching listeners after disposal. */
function isCurrentStart(version: number, lifecycleVersion: number, started: boolean): boolean {
  return version === lifecycleVersion && started;
}

/*** Requests browser notification permission only when the browser exposes that optional capability. */
async function requestWebNotificationPermissionAsync(): Promise<ExpoApprovalNotificationPermission> {
  if (typeof Notification === 'undefined') return 'unsupported';
  return (await Notification.requestPermission()) === 'granted' ? 'granted' : 'denied';
}
