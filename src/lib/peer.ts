import {
  generateClientHelpers,
  generateHostHelpers,
} from "peer-host-multiplayer/index";

export type OrientationPayload = {
  heading: number;
};

export type HostToClientMessages = {
  ping: [amount: number];
};

export type ClientToHostMessages = {
  mouseOrientation: [orientation: OrientationPayload];
};

const { createHost, createLocalClient, useEvent: useHostEvent, useHost } =
  generateHostHelpers<HostToClientMessages, ClientToHostMessages>();

const { createClient, useClient, useEvent: useClientEvent } = generateClientHelpers<
  HostToClientMessages,
  ClientToHostMessages
>();

export {
  createHost,
  createClient,
  createLocalClient,
  useHostEvent,
  useHost,
  useClient,
  useClientEvent,
};
