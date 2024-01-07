import { useParams } from "@solidjs/router";
import { createClient } from "../utils/peer";

const Client = () => {
  const params = useParams();
  createClient(params.id);

  return <div>bonga</div>;
};

export default Client;
