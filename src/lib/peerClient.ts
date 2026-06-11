import { generateClientHelpers } from "peer-host-multiplayer";
import { HostToClientMessages } from "./peerHost";

export type ClientToHostMessages = {
  mouseOrientation: [orientation: { yaw: number; pitch: number }];
};

export const { createClient, useClient, useEvent } = generateClientHelpers<
  HostToClientMessages,
  ClientToHostMessages
>();
