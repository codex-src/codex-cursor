/* eslint-disable no-multi-spaces */
import React from "react"
import TypeEnum from "./TypeEnum"

// Describes a fragment of a cursor data structure.
export type PosFragment = {
	id:     string, // Node or root UUID
	offset: number, // Offset to the cursor from the node or root
}

// Describes a cursor data structure.
export type Pos = {
	node: PosFragment,
	root: PosFragment,
}

// Describes an unparsed element.
export type UnparsedElement = {
	id:  string, // The UUID
	raw: string, // The raw-text
}

// Describes an editor state.
export type EditorState = {
	readOnly:    boolean,         // Is the editor read-only?
	focused:     boolean,         // Is the editor focused?
	data:        ParsedElement[], // The parsed document data
	pos1:        Pos,             // The start cursor
	pos2:        Pos,             // The end cursor
	extPosRange: string[],        // The extended cursor range (root ID)
	reactDOM:    HTMLDivElement,  // The React-managed DOM -- obscured from the user
}

// Describes a setState function for EditorState.
export type EditorSetStateAction = React.Dispatch<React.SetStateAction<EditorState>>

export type EditorSetState = [EditorState, EditorSetStateAction]

export type EditorProps = {
	state:    EditorState,
	setState: EditorSetStateAction,
	// TODO: Etc.
}

export type HeaderProps = {
	type:   TypeEnum,
	tag:    string,
	id:     string,
	syntax: string | string[],
	hash:   string,
	raw:    string,
	parsed: string, // React.ReactNode,
}

export type ParagraphProps = {
	type:   TypeEnum,
	id:     string,
	raw:    string,
	parsed: string, // React.ReactNode,
}

// Describes a parsed element.
export type ParsedElement = ParagraphProps
	// HeaderProps &
	// ParagraphProps

// // Describes a parsed element.
// export type ParsedElement = {
// 	type:       TypeEnum,
//   tag?:       string,
// 	id:         string,
// 	className?: string,
// 	style?:     React.CSSProperties,
// 	raw:        string,
// 	parsed:     string, // React.ReactNode,
// }
