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
	h1: trim("font-medium   text-3xl leading-tight"),
	h2: trim("font-medium   text-2xl leading-tight"),
	h3: trim("font-medium   text-xl  leading-tight"),
	h4: trim("font-semibold text-lg  leading-snug"),
	h5: trim("font-semibold text-lg  leading-snug"),
	h6: trim("font-semibold text-lg  leading-snug"),
}

// Conditionally wraps a React component.
//
// TODO: Extract component and change API to props?
const IfWrapper = ({ cond, wrapper: Wrapper, children }) => {
	if (!cond) {
		return children
	}
	return <Wrapper>{children}</Wrapper>
}

const HeaderAnchor = ({ hash, children }) => (
	<a id={hash} className="block" href={`#${hash}`}>{children}</a>
)

export const Header = React.memo(({ tag, id, syntax, hash, children }) => {
	const [{ readOnly }] = useEditorState()
	// const readOnly = false
	return (
		<Root id={id} className={headerClassNames[tag]}>
			<IfWrapper cond={readOnly} wrapper={({ children }) => <HeaderAnchor hash={hash}>{children}</HeaderAnchor>}>
				<Markdown syntax={syntax}>
					{toReact(children) || (
						<br />
					)}
				</Markdown>
			</IfWrapper>
		</Root>
	)
})

export const Paragraph = React.memo(({ id, emojis, children }) => (
	<Root id={id} className={!emojis ? null : `emojis emojis-${emojis}`}>
		{toReact(children) || (
			<br />
		)}
	</Root>
))

export const BlockquoteItem = React.memo(({ id, syntax, children }) => (
	<Node id={id}>
		<Markdown className="text-md-blue-a400" syntax={syntax}>
			{toReact(children) || (
				<br />
			)}
		</Markdown>
	</Node>
))

// NOTE: Compound component
export const Blockquote = React.memo(({ id, children }) => {
	const style = { backgroundColor: "#2979ff0f", boxShadow: "inset 0.125em 0 var(--md-blue-a400)" }
	return (
		<Root id={id} className="py-4 px-8" style={style}>
			{children.map(({ type: T, ...each }) => (
				React.createElement(typeEnumMap[T], {
					key: each.id,
					...each,
				})
			))}
		</Root>
	)
})

export const Pre = props => (
	<Node style={{ whiteSpace: "pre" }} {...props} />
)

// NOTE: Compound component
export const CodeBlock = React.memo(({ id, syntax, extension, children: nodes }) => {
	const [{ readOnly }] = useEditorState()
	// const readOnly = false

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
		<Root id={id} className="px-6 font-mono text-sm leading-snug bg-white shadow-hero rounded overflow-x-scroll scrolling-touch" {...attrs.code}>
			<span className="inline-block">
				<Pre id={nodes[0].id} className="leading-none">
					<Markdown syntax={[syntax[0]]}>
						{readOnly && (
							<br />
						)}
					</Markdown>
				</Pre>
				{$nodes.map(each => (
					<Pre key={each.id} id={each.id}>
						<span dangerouslySetInnerHTML={{
							__html: each.data || (
								"<br />"
							),
						}} />
					</Pre>
				))}
				<Pre id={nodes[nodes.length - 1].id} className="leading-none">
					<Markdown syntax={[syntax[1]]}>
						{readOnly && (
							<br />
						)}
					</Markdown>
				</Pre>
			</span>
		</Root>
	)
})

export const Break = React.memo(({ id, syntax }) => {
	const [{ readOnly }] = useEditorState()
	// const readOnly = false

	const style = { verticalAlign: "15%" }
	return (
		<Root id={id}>
			<Markdown syntax={syntax}>
				{readOnly && (
					<hr className="inline-block w-full" style={style} />
				)}
			</Markdown>
		</Root>
	)
})
