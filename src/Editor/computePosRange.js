import * as documentNodes from "./documentNodes"
import { ascendRoot } from "./ascenders"
import { newPos } from "./constructors"

// FIXME
//
// console.log(node, offset)
//
// // while (node.nodeType === Node.ELEMENT_NODE && offset < node.childNodes.length) {
// // 	node = node.childNodes[offset]
// // 	offset = 0
// // }
//
// //	// Iterate to the deepest text node:
// //	while (node.nodeType === Node.ELEMENT_NODE && node.childNodes.length) {
// //		node = node.childNodes[offset]
// //		offset = 0
// //
// //		console.log({ node, offset })
// //	}

// Computes a cursor data structure from the DOM.
function computeDOMPos(root, { node, offset }) {
	// Iterate to the deepest node:
	const pos = newPos()

	if (node.nodeType === Node.ELEMENT_NODE) {
		node = node.childNodes[offset]
		offset = 0
	}

	// while (node.nodeType === Node.ELEMENT_NODE && offset < node.childNodes.length) {
	// 	node = node.childNodes[offset]
	// 	offset = 0
	// }
	const recurse = on => {
		if (on === node) {
			Object.assign(pos, {
				x: pos.x + offset,
				pos: pos.pos + offset,
			})
			return true
		}
		for (const each of on.childNodes) {
			if (each.nodeType === Node.ELEMENT_NODE && each.classList.contains("absolute")) {
				// No-op; defer to end
			} else if (each.nodeType === Node.ELEMENT_NODE && each.classList.contains("hidden")) {
				const { length } = each.innerHTML // FIXME
				Object.assign(pos, {
					x: pos.x + length,
					pos: pos.pos + length,
				})
			} else if (recurse(each)) {
				return true
			}
			const { length } = each.nodeValue || ""
			Object.assign(pos, {
				x: pos.x + length,
				pos: pos.pos + length,
			})
			const next = each.nextElementSibling
			if (next && documentNodes.isNode(next)) {
				Object.assign(pos, {
					x: 0,
					y: pos.y + 1,
					pos: pos.pos + 1,
				})
			}
		}
		return false
	}
	recurse(root)
	return pos
}

// Sums VDOM- and DOM-computed cursor data structures.
function newMetaPos(vdomPos, domPos) {
	const pos = newPos()
	Object.assign(pos, {
		x: vdomPos.x + domPos.x,
		y: vdomPos.y + domPos.y,
		pos: vdomPos.pos + domPos.pos,
	})
	return pos
}

// Computes a meta cursor data structure; uses VDOM and DOM
// to compute.
function computeMetaPos(nodes, { node, offset }) {
	const vdomPos = newPos()

	// TODO: Why are we asecending to the root?
	const root = ascendRoot(node)
	for (const each of nodes) {
		if (each.id === root.id) {
			// No-op
			break
		}
		vdomPos.y++
		vdomPos.pos += (each.data + "\n").length
	}
	const domPos = computeDOMPos(root, { node, offset })
	return newMetaPos(vdomPos, domPos)
}

// Computes a range of cursor data structures.
function computePosRange(editorState) {
	const selection = document.getSelection()
	if (!selection || !selection.rangeCount) {
		throw new Error("computePosRange: selection does not exist when it should")
	}
	const range = selection.getRangeAt(0)
	const pos1 = computeMetaPos(editorState.nodes, { node: range.startContainer, offset: range.startOffset })
	let pos2 = { ...pos1 }
	if (!range.collapsed) {
		pos2 = computeMetaPos(editorState.nodes, { node: range.endContainer, offset: range.endOffset })
	}
	return [pos1, pos2]
}

export default computePosRange
