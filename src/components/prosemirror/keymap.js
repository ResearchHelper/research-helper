import {
	chainCommands, deleteSelection, joinBackward, joinDown,
	joinUp, lift, selectNodeBackward, selectParentNode, toggleMark
} from 'prosemirror-commands'
import { liftListItem, sinkListItem, splitListItem } from 'prosemirror-schema-list'
import { redo, undo } from 'prosemirror-history'
import { undoInputRule } from 'prosemirror-inputrules'

import { insertMathCmd, mathBackspaceCmd } from '@benrbray/prosemirror-math'

export function buildKeymap (schema, mapKeys) {

	let keys = {}, type
	function bind (key, cmd) {
		if (mapKeys) {
			const mapped = mapKeys[key]
			if (mapped === false)
				return
			if (mapped)
				key = mapped
		}
		keys[key] = cmd
	}

	bind('Mod-z', undo)
	bind('Shift-Mod-z', redo)
	bind('Backspace', undoInputRule)
	bind('Alt-ArrowUp', joinUp)
	bind('Alt-ArrowDown', joinDown)
	bind('Mod-BracketLeft', lift)
	bind('Escape', selectParentNode)
	bind('Mod-b', toggleMark(schema.marks.strong))
	bind('Mod-B', toggleMark(schema.marks.strong))
	bind('Mod-i',toggleMark(schema.marks.em))
	bind('Mod-I',toggleMark(schema.marks.em))
	bind('Mod-`',toggleMark(schema.marks.code))
	bind('Enter', splitListItem(schema.nodes.list_item))
	bind('Mod-[', liftListItem(schema.nodes.list_item))
	bind('Mod-]', sinkListItem(schema.nodes.list_item))
	bind('Mod-Space', insertMathCmd(schema.nodes.math_inline))
	bind('Backspace',
		chainCommands(deleteSelection,
			mathBackspaceCmd,
			joinBackward,
			selectNodeBackward
		))

	return keys

}
