import {
  ellipsis,
  emDash,
  inputRules,
  wrappingInputRule,
  textblockTypeInputRule,
  smartQuotes,
} from "prosemirror-inputrules";

import {
  makeBlockMathInputRule,
  makeInlineMathInputRule,
} from "@benrbray/prosemirror-math";

export function buildInputRules(schema) {
  const inlineMathInputRule = makeInlineMathInputRule(
    /\$(.+)\$/,
    schema.nodes.math_inline
  );
  const inlineMathInputRule2 = makeInlineMathInputRule(
    /\\\((.+)\\\)/,
    schema.nodes.math_inline
  );
  const blockMathInputRule = makeBlockMathInputRule(
    /\$\$\s+$/,
    schema.nodes.math_display
  );
  const blockMathInputRule2 = makeBlockMathInputRule(
    /\\\[(.+)\\\]/,
    schema.nodes.math_display
  );

  const blockQuoteRule = wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote);

  const orderedListRule = wrappingInputRule(
    /^(\d+)\.\s$/,
    schema.nodes.ordered_list,
    (match) => ({ order: +match[1] }),
    (match, node) => node.childCount + node.attrs.order == +match[1]
  );

  const bulletListRule = wrappingInputRule(
    /^\s*([-+*])\s$/,
    schema.nodes.bullet_list
  );

  const codeBlockRule = textblockTypeInputRule(
    /^```$/,
    schema.nodes.code_block
  );

  const headingRule = textblockTypeInputRule(
    /^(#{1,6})\s$/,
    schema.nodes.heading,
    (match) => ({ level: match[1].length })
  );

  let rules = smartQuotes.concat(ellipsis, emDash);
  rules.push(inlineMathInputRule);
  rules.push(inlineMathInputRule2);
  rules.push(blockMathInputRule);
  rules.push(blockMathInputRule2);

  rules.push(blockQuoteRule);
  rules.push(orderedListRule);
  rules.push(bulletListRule);
  rules.push(codeBlockRule);
  rules.push(headingRule);
  return inputRules({ rules });
}
