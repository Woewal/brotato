import { generateHostHelpers } from "peer-host-multiplayer";
import { ClientToHostMessages } from "./peerClient";

export type HostToClientMessages = {
  ping: [amount: number];
};

export const {
  createHost,
  createLocalClient,
  useClientMessage,
  useEvent,
  useHost,
} = generateHostHelpers<HostToClientMessages, ClientToHostMessages>();
