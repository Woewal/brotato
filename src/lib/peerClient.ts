import { generateClientHelpers } from "peer-host-multiplayer";
import { HostToClientMessages } from "./peerHost";

export type OrientationPayload = {
  heading: number;
};

export type ClientToHostMessages = {
  mouseOrientation: [orientation: OrientationPayload];
};

export const { createClient, useClient, useEvent } = generateClientHelpers<
  HostToClientMessages,
  ClientToHostMessages
>();
