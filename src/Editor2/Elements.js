import attrs from "./attrs"
import escape from "lodash/escape"
import Markdown from "./Markdown"
import PrismExtensions from "PrismExtensions"
import React from "react"
import typeEnumMap from "./typeEnumMap"
import useEditorState from "./useEditorState"

import {
	Node,
	Root,
} from "./HOC"

// Converts a parsed data structure (children) to renderable
// React components.
function toReact(children) {
	if (children === null || typeof children === "string") {
		return children
	}
	const components = []
	for (const each of children) {
		if (each === null || typeof each === "string") {
			components.push(toReact(each))
			continue
		}
		const { type: T, ...props } = each
		components.push(React.createElement(typeEnumMap[T], {
			key: components.length,
			...props,
		}, toReact(props.children)))
	}
	return components
}

// Trims extraneous spaces.
function trim(str) {
	return str.replace(/ +/g, " ")
}

const headerClassNames = {
	h1: trim("font-semibold text-3xl leading-tight text-black antialiased"),
	h2: trim("font-semibold text-2xl leading-tight text-black antialiased"),
	h3: trim("font-semibold text-xl  leading-tight text-black antialiased"),
	h4: trim("font-semibold text-xl  leading-tight text-black antialiased"),
	h5: trim("font-semibold text-xl  leading-tight text-black antialiased"),
	h6: trim("font-semibold text-xl  leading-tight text-black antialiased"),
}

// // Conditionally wraps a React element.
// const IfWrapper = ({ cond, wrapper: Wrapper, children }) => {
// 	if (!cond) {
// 		return children
// 	}
// 	return <Wrapper>{children}</Wrapper>
// }
//
// const HeaderAnchor = ({ hash, children }) => (
// 	<a id={hash} className="block" href={`#${hash}`}>{children}</a>
// )

// <IfWrapper cond={tag !== "h1" && readOnly} wrapper={({ children }) => <HeaderAnchor hash={hash}>{children}</HeaderAnchor>}>
export const Header = React.memo(({ tag, id, syntax, hash, children }) => (
	<Root id={id} className={headerClassNames[tag]}>
		<Markdown syntax={syntax}>
			{toReact(children) || (
				<br />
			)}
		</Markdown>
	</Root>
))

export const Paragraph = React.memo(({ id, emojis, children }) => (
 	// style={{ margin: !children && "-0.25em 0" }}
	<Root id={id} className={!emojis ? null : `emojis emojis-${emojis}`}>
		{toReact(children) || (
			<br />
		)}
	</Root>
))

export const BlockquoteItem = React.memo(({ id, syntax, children }) => (
	<Node id={id} className="text-gray-600">
		<Markdown className="mr-2 text-md-blue-a400" syntax={syntax}>
			{toReact(children) || (
				<br />
			)}
		</Markdown>
	</Node>
))

export const Blockquote = React.memo(({ id, children: nodes }) => {
	const style = { boxShadow: "inset 0.25em 0 var(--gray-300)" }
	return (
		<Root id={id} className="px-6" style={style}>
			{nodes.map(({ type: T, ...each }) => (
				React.createElement(typeEnumMap[T], {
					key: each.id,
					...each,
				})
			))}
		</Root>
	)
})

// export const Pre = props => (
// 	<Node style={{ whiteSpace: "pre" }} {...props} />
// )

export const Preformatted = React.memo(({ id, syntax, extension, children: nodes }) => {
	const [{ readOnly }] = useEditorState()

	// NOTE: Use useMemo not useState; state needs to be
	// updated eagerly
	const $nodes = React.useMemo(() => {
		const range = nodes.slice(1, -1)
		if (!extension || nodes.length === 2) {
			return range.map(each => ({ ...each, data: escape(each.data) }))
		}
		const parser = PrismExtensions[extension]
		if (!parser) {
			return range.map(each => ({ ...each, data: escape(each.data) }))
		}
		// TODO: Move to parser? Moving syntax highlighting to
		// parser (possibly) breaks cmap
		const data = range.map(each => each.data).join("\n")
		const __html = window.Prism.highlight(data, parser, extension)
		return __html.split("\n").map((each, x) => ({ id: range[x].id, data: each }))
	}, [extension, nodes])

	return (
		<Root id={id} className="px-6 font-mono text-sm bg-white shadow-hero rounded" {...attrs.code}>
			<Node id={nodes[0].id} className="leading-none">
				<Markdown syntax={[syntax[0]]}>
					{readOnly && (
						<br />
					)}
				</Markdown>
			</Node>
			{$nodes.map(each => (
				<Node key={each.id} id={each.id} className="leading-snug">
					<span dangerouslySetInnerHTML={{
						__html: each.data || (
							"<br />"
						),
					}} />
				</Node>
			))}
			<Node id={nodes[nodes.length - 1].id} className="leading-none">
				<Markdown syntax={[syntax[1]]}>
					{readOnly && (
						<br />
					)}
				</Markdown>
			</Node>
		</Root>
	)
})

// Describes a list item; <li>.
export const AnyListItem = React.memo(({ tag, id, tabs, syntax, children }) => (
	<Node tag={tag} id={id} className="my-2" data-codex-content={syntax[0]}>
		<span className="hidden">{tabs}</span>
		<Markdown className="hidden" syntax={syntax}>
			{toReact(children) || (
				<br />
			)}
		</Markdown>
	</Node>
))

// const Todo = ({ className, ...props }) => (
// 	<input className={`form-checkbox ${className}`} type="checkbox" {...props} />
// )
//
// // Prepares a checked state and functions e.g. {...etc}.
// function useTodo(initialValue) {
// 	const [done, setDone] = React.useState(initialValue)
// 	const etc = {
// 		checked: done,
// 		onChange: e => {
// 			setDone(!done)
// 		},
// 	}
// 	return [done, etc]
// }

export const TodoItem = React.memo(({ tag, id, tabs, syntax, checked, children }) => {
	// const [done, etc] = useTodo(checked.value)

	const style = {
		marginLeft: "-1.5em", // FIXME?
		borderRadius: "0.3125em",
	}
	return (
		<Node tag={tag} id={id} className="todo relative my-2" style={checked.value && attrs.strike.style}>
			<span className="hidden">{tabs}</span>
			<Markdown className="hidden" syntax={syntax}>
				<div className="absolute">
					<span className={`-mt-px inline-block align-middle w-4 h-4 ${!checked.value ? "bg-white shadow-hero" : "bg-md-blue-a200 shadow"} rounded focus:outline-none select-none`} style={style} tabIndex="0">
						<svg fill="#fff" viewBox="0 0 16 16">
							<path d="M5.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L7 8.586 5.707 7.293z"></path>
						</svg>
					</span>
				</div>
				{/* <span className={`mr-2 mt-1 flex-shrink-0 w-4 h-4 ${!checked.value ? "bg-white shadow-hero" : "bg-md-blue-a200 shadow"} rounded focus:outline-none select-none`} style={style} tabIndex="0"> */}
				{/* 	<svg fill="#fff" viewBox="0 0 16 16"> */}
				{/* 		<path d="M5.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L7 8.586 5.707 7.293z"></path> */}
				{/* 	</svg> */}
				{/* </span> */}
				{toReact(children) || (
					<br />
				)}
			</Markdown>
		</Node>
	)
})

// Describes any list; <ul> or <ol>.
export const AnyList = React.memo(({ tag, id, tabs, children: nodes }) => {
	const HOC = !tabs.length ? Root : Node
	return (
		<HOC tag={tag} id={id}>
			{nodes.map(({ type: T, ...each }) => (
				React.createElement(typeEnumMap[T], {
					key: each.id,
					...each,
				})
			))}
		</HOC>
	)
})

export const Break = React.memo(({ id, syntax }) => {
	const [{ readOnly }] = useEditorState()

	const style = { verticalAlign: "15%" }
	return (
		<Root id={id}>
			<Markdown syntax={syntax}>
				{readOnly && (
					<hr className="inline-block w-full border-t-2" style={style} />
				)}
			</Markdown>
		</Root>
	)
})
