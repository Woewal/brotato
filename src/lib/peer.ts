import {
  generateClientHelpers,
  generateHostHelpers,
} from "peer-host-multiplayer/index";

export type Quaternion = {
  x: number;
  y: number;
  z: number;
  w: number;
};

export type OrientationPayload = {
  yaw: number;
  pitch: number;
  quaternion: Quaternion;
};

type ClientMessages = {
  orientation: [orientation: OrientationPayload];
  chat: [message: string];
};

type HostMessages = {
  ping: [dateNumber: number];
};

const { createHost, createLocalClient, useEvent, useHost } =
  generateHostHelpers<HostMessages, ClientMessages>();

const { createClient, useClient } = generateClientHelpers<
  HostMessages,
  ClientMessages
>();

export {
  createHost,
  createClient,
  createLocalClient,
  useEvent,
  useHost,
  useClient,
};
