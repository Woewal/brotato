import "./index.css";
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
const app = createApp(App);

import HomeView from "./pages/Home.vue";
import ClientView from "./pages/Client.vue";
import HostView from "./pages/Host.vue";
import { createRouter, createWebHistory } from "vue-router";

const routes = [
  { path: "/client/:id", component: ClientView },
  { path: "/host", component: HostView },
  { path: "/", component: HomeView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

app.use(createPinia());

app.use(router);

app.mount("#app");
