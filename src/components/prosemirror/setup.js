import { baseKeymap } from "prosemirror-commands";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { menuBar } from "prosemirror-menu";
// import {
//   autoLinkingPlugin,
//   defaultAliasDecoration,
// } from "prosemirror-link-plugin";
import { imagePlugin, defaultSettings } from "prosemirror-image-plugin";

import { mathPlugin } from "@benrbray/prosemirror-math";

import { buildInputRules } from "./inputrules";
import { buildKeymap } from "./keymap";
import { buildMenuItems } from "./menu";

export function setup(options) {
  //   let aliases = [{ alias: "typing", id: 1 }];
  return [
    buildInputRules(options.schema),
    keymap(buildKeymap(options.schema, options.mapKeys)),
    keymap(baseKeymap),
    mathPlugin,
    dropCursor(),
    gapCursor(),
    menuBar({
      floating: false,
      content: buildMenuItems(options.schema).fullMenu,
    }),
    history(),
    // autoLinkingPlugin(aliases, defaultAliasDecoration),
    imagePlugin(options.schema, { ...defaultSettings }),
  ];
}
