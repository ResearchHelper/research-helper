/* eslint-disable */
// must import this so we have typehint for window object
import { Window } from "src-electron/electron-preload";

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: "hash" | "history" | "abstract" | undefined;
    VUE_ROUTER_BASE: string | undefined;
  }
}
