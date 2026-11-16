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
  const state: ApprovalNotificationRuntimeState = {
    lifecycleVersion: 0,
    started: false,
  };

  return {
    dispose: () => disposeRuntime(state),
    requestPermissionAsync: async () =>
      toPermissionResult(await Notifications.requestPermissionsAsync()),
    startAsync: () => startRuntimeAsync(options, state),
  };
}

/*** Starts native approval routing only while its owning runtime remains current. */
async function startRuntimeAsync(
  options: ExpoApprovalNotificationRuntimeOptions,
  state: ApprovalNotificationRuntimeState,
): Promise<void> {
  if (state.started) return;
  const startVersion = state.lifecycleVersion;
  state.started = true;
  try {
    const initialUrl = await Linking.getInitialURL();
    if (!isCurrentStart(startVersion, state)) return;
    if (initialUrl !== null) await handleUrlAsync(initialUrl, options);
    if (!isCurrentStart(startVersion, state)) return;
    await resumeLastNotificationAsync(options, state, startVersion);
    if (isCurrentStart(startVersion, state)) attachListeners(options, state, startVersion);
  } catch (error) {
    state.started = false;
    throw error;
  }
}

/*** Resumes only the current startup's last approval response before listener registration. */
async function resumeLastNotificationAsync(
  options: ExpoApprovalNotificationRuntimeOptions,
  state: ApprovalNotificationRuntimeState,
  startVersion: number,
): Promise<void> {
  const route = parseFlowApprovalNotificationData(
    Notifications.getLastNotificationResponse()?.notification.request.content.data,
  );
  if (route === undefined) return;
  await handleRouteAsync(route, options);
  if (isCurrentStart(startVersion, state)) Notifications.clearLastNotificationResponse();
}

/*** Attaches native event listeners only for the active runtime lifecycle. */
function attachListeners(
  options: ExpoApprovalNotificationRuntimeOptions,
  state: ApprovalNotificationRuntimeState,
  startVersion: number,
): void {
  const isCurrent = () => isCurrentStart(startVersion, state);
  state.notificationSubscription ??= Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const route = parseFlowApprovalNotificationData(response.notification.request.content.data);
      if (route !== undefined) void handleEventRouteAsync(route, options, isCurrent);
    },
  );
  state.linkingSubscription ??= Linking.addEventListener('url', ({ url }) => {
    void handleEventUrlAsync(url, options, isCurrent);
  });
}

/*** Removes native event listeners and invalidates every in-flight startup. */
function disposeRuntime(state: ApprovalNotificationRuntimeState): void {
  state.notificationSubscription?.remove();
  state.linkingSubscription?.remove();
  state.notificationSubscription = undefined;
  state.linkingSubscription = undefined;
  state.lifecycleVersion += 1;
  state.started = false;
}

/*** Keeps an asynchronous startup from attaching listeners after its runtime has been disposed. */
function isCurrentStart(version: number, state: ApprovalNotificationRuntimeState): boolean {
  return version === state.lifecycleVersion && state.started;
}

interface ApprovalNotificationRuntimeState {
  lifecycleVersion: number;
  linkingSubscription?: { remove: () => void };
  notificationSubscription?: { remove: () => void };
  started: boolean;
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

/*** Contains untrusted notification-event failures at Expo's callback boundary. */
async function handleEventRouteAsync(
  route: FlowApprovalRoute,
  options: ExpoApprovalNotificationRuntimeOptions,
  isCurrent: () => boolean,
): Promise<void> {
  if (!isCurrent()) return;
  try {
    await handleRouteAsync(route, options);
  } catch {
    // Expo callback errors have no awaiting caller and must not become unhandled rejections.
  }
}

/*** Parses and contains untrusted Linking-event failures at Expo's callback boundary. */
async function handleEventUrlAsync(
  url: string,
  options: ExpoApprovalNotificationRuntimeOptions,
  isCurrent: () => boolean,
): Promise<void> {
  if (!isCurrent()) return;
  try {
    await handleUrlAsync(url, options);
  } catch {
    // Expo callback errors have no awaiting caller and must not become unhandled rejections.
  }
}

/*** Contains asynchronous listener work so malformed or offline events do not escape Expo callbacks. */
async function handleRouteAsync(
  route: FlowApprovalRoute,
  options: ExpoApprovalNotificationRuntimeOptions,
): Promise<void> {
  await handleFlowApprovalRouteAsync(route, options);
}
