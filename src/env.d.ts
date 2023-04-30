/* eslint-disable */
import { Window } from "src-electron/electron-preload";

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: "hash" | "history" | "abstract" | undefined;
    VUE_ROUTER_BASE: string | undefined;
  }
}
