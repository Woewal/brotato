import { Peer } from "peerjs";
import { createHost } from "../utils/peer";

const Host = () => {
	const host = createHost();

	host.on("chat", (message) => console.log(message));
	host.on("mousePositionDelta", (pos) => console.log(pos));

	return <div></div>;
};

export default Host;
