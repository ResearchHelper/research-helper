import { MenuItem, blockTypeItem, icons } from "prosemirror-menu";
import {
  joinUp,
  lift,
  selectParentNode,
  toggleMark,
} from "prosemirror-commands";
import { wrapInList } from "prosemirror-schema-list";

import { insertMathCmd } from "@benrbray/prosemirror-math";

function cmdItem(cmd, options) {
  let passedOptions = {
    label: options.title,
    run: cmd,
  };
  for (let prop in options) {
    passedOptions[prop] = options[prop];
  }
  if ((!options.enable || options.enable === true) && !options.select) {
    passedOptions[options.enable ? "enable" : "select"] = (state) => cmd(state);
  }

  return new MenuItem(passedOptions);
}

function markActive(state, type) {
  let { from, $from, to, empty } = state.selection;
  if (empty) {
    return type.isInSet(state.storedMarks || $from.marks());
  } else {
    return state.doc.rangeHasMark(from, to, type);
  }
}

function markItem(markType, options) {
  let passedOptions = {
    active(state) {
      return markActive(state, markType);
    },
    enable: true,
  };
  for (let prop in options) {
    passedOptions[prop] = options[prop];
  }
  return cmdItem(toggleMark(markType), passedOptions);
}

function wrapListItem(nodeType, options) {
  return cmdItem(wrapInList(nodeType, options.attrs), options);
}

export function buildMenuItems(schema) {
  let r = {};

  r.toggleStrong = markItem(schema.marks.strong, {
    title: "Bold (Ctrl+b)",
    icon: icons.strong,
  });

  r.toggleEm = markItem(schema.marks.em, {
    title: "Italik (Ctrl+i)",
    icon: icons.em,
  });

  r.toggleCode = markItem(schema.marks.code, {
    title: "Kôd (Ctrl+c)",
    icon: icons.code,
  });

  r.wrapUnorderedList = wrapListItem(schema.nodes.unordered_list, {
    title: "Ubaci u neuređenu listu",
    icon: icons.bulletList,
  });

  r.wrapOrderedList = wrapListItem(schema.nodes.ordered_list, {
    title: "Ubaci u uređenu listu",
    icon: icons.orderedList,
  });

  r.makeParagraph = blockTypeItem(schema.nodes.paragraph, {
    title: "Paragraf",
    icon: { text: "P", css: "font-weight: bold" },
  });

  r.makeCodeBlock = blockTypeItem(schema.nodes.code_block, {
    title: "Kôd blok",
    icon: icons.blockquote,
  });

  r.makeMathBlock = blockTypeItem(schema.nodes.math_display, {
    title: "Matematički blok",
    icon: { text: "$$", css: "font-family: monospaced" },
  });

  r.inlineMath = new MenuItem({
    title: "Matematički izraz (Ctrl+Space)",
    run: insertMathCmd(schema.nodes.math_inline),
    select: () => insertMathCmd(schema.nodes.math_inline),
    icon: { text: "$", css: "font-fammily: monospaced" },
  });

  r.liftItem = new MenuItem({
    title: "Izbaci iz trenutnog bloka",
    run: lift,
    select: (state) => lift(state),
    icon: icons.lift,
  });

  r.joinUpItem = new MenuItem({
    title: "Spoji sa gornjim blokom",
    run: joinUp,
    select: (state) => joinUp(state),
    icon: icons.join,
  });

  r.selectParentNodeItem = new MenuItem({
    title: "Selektuj blok",
    run: selectParentNode,
    select: (state) => selectParentNode(state),
    icon: icons.selectParentNode,
  });

  r.fullMenu = [
    [r.toggleStrong, r.toggleEm, r.toggleCode],
    [r.inlineMath],
    [r.makeParagraph, r.makeCodeBlock, r.makeMathBlock],
    [
      r.wrapOrderedList,
      r.wrapUnorderedList,
      r.joinUpItem,
      r.liftItem,
      r.selectParentNodeItem,
    ],
  ];

  return r;
}
