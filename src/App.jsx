import Home from "./pages/Home";
import Client from "./pages/Client";
import Host from "./pages/Host";
import { Router, Route } from "@solidjs/router";

function App() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/host" component={Host} />
      <Route path="/client/:id" component={Client} />
    </Router>
  );
}

export default App;
