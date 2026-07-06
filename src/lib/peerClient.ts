import { generateClientHelpers } from "peer-host-multiplayer";
import { HostToClientMessages } from "./peerHost";

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

export type ClientToHostMessages = {
  mouseOrientation: [orientation: OrientationPayload];
};

export const { createClient, useClient, useEvent } = generateClientHelpers<
  HostToClientMessages,
  ClientToHostMessages
>();
