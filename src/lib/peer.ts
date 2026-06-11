import { generateClientHelpers, generateHostHelpers } from "peer-host-multiplayer/index";

type ClientMessages = {
  mousePositionDelta: [position: { x: number; y: number }];
  chat: [message: string];
};

type HostMessages = {
  ping: [dateNumber: number];
};

const { createHost, createLocalClient, useEvent, useHost } = generateHostHelpers<
  HostMessages,
  ClientMessages
>();

const { createClient, useClient } = generateClientHelpers<
  HostMessages,
  ClientMessages
>();

export { createHost, createClient, createLocalClient, useEvent, useHost, useClient  };
