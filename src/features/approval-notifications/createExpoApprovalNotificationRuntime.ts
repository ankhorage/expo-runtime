import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';

import { parseFlowApprovalNotificationData } from './flowApprovalNotification';
import { handleFlowApprovalRouteAsync } from './handleFlowApprovalRouteAsync';
import { resolveFlowApprovalRoute } from './resolveFlowApprovalRoute';
import type {
  ExpoApprovalNotificationPermission,
  ExpoApprovalNotificationRuntime,
  ExpoApprovalNotificationRuntimeOptions,
  FlowApprovalRoute,
} from './types';

/*** Connects Expo notification taps and Linking events to host-owned approval navigation. */
export function createExpoApprovalNotificationRuntime(
  options: ExpoApprovalNotificationRuntimeOptions,
): ExpoApprovalNotificationRuntime {
  let notificationSubscription: { remove: () => void } | undefined;
  let linkingSubscription: { remove: () => void } | undefined;
  let started = false;

  return {
    dispose: () => {
      notificationSubscription?.remove();
      linkingSubscription?.remove();
      notificationSubscription = undefined;
      linkingSubscription = undefined;
      started = false;
    },
    requestPermissionAsync: async () =>
      toPermissionResult(await Notifications.requestPermissionsAsync()),
    startAsync: async () => {
      if (started) return;
      started = true;
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl !== null) await handleUrlAsync(initialUrl, options);

        const lastResponse = Notifications.getLastNotificationResponse();
        const lastRoute = parseFlowApprovalNotificationData(
          lastResponse?.notification.request.content.data,
        );
        if (lastRoute !== undefined) {
          await handleRouteAsync(lastRoute, options);
          Notifications.clearLastNotificationResponse();
        }

        notificationSubscription ??= Notifications.addNotificationResponseReceivedListener(
          (response) => {
            const route = parseFlowApprovalNotificationData(
              response.notification.request.content.data,
            );
            if (route !== undefined) void handleRouteAsync(route, options);
          },
        );
        linkingSubscription ??= Linking.addEventListener('url', ({ url }) => {
          void handleUrlAsync(url, options);
        });
      } catch (error) {
        started = false;
        throw error;
      }
    },
  };
}

/*** Narrows Expo's permission response to the host-visible approval-notification state. */
function toPermissionResult(value: {
  readonly granted: boolean;
}): ExpoApprovalNotificationPermission {
  return value.granted ? 'granted' : 'denied';
}

/*** Parses a deep link before invoking the server-authoritative route handler. */
async function handleUrlAsync(
  url: string,
  options: ExpoApprovalNotificationRuntimeOptions,
): Promise<void> {
  const route = resolveFlowApprovalRoute(url);
  if (route !== undefined) await handleRouteAsync(route, options);
}

/*** Contains asynchronous listener work so malformed or offline events do not escape Expo callbacks. */
async function handleRouteAsync(
  route: FlowApprovalRoute,
  options: ExpoApprovalNotificationRuntimeOptions,
): Promise<void> {
  await handleFlowApprovalRouteAsync(route, options);
}
