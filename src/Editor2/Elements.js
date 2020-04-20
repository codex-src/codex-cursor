import attrs from "./attrs"
import Highlighted from "Highlighted"
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
		<Markdown className="text-md-blue-a200" syntax={syntax}>
			{toReact(children) || (
				<br />
			)}
		</Markdown>
	</Node>
))

// NOTE: Compound component
export const Blockquote = React.memo(({ id, children }) => {
	const style = { backgroundColor: "#448aff0f", boxShadow: "inset 0.125em 0 var(--md-blue-a200)" }
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

// import PrismExtensions from "PrismExtensions"
// import React from "react"
//
// // Performs syntax highlighting.
// const Highlighted = React.memo(({ extension, children }) => {
// 	const [highlighted, setHighlighted] = React.useState(null)
// 	React.useEffect(() => {
// 		if (!extension) {
// 			// No-op
// 			return
// 		}
// 		const parser = PrismExtensions[extension]
// 		if (!parser) {
// 			// No-op
// 			return
// 		}
// 		setHighlighted((
// 			<div className={extension && `language-${extension}`} dangerouslySetInnerHTML={{
// 				__html: window.Prism.highlight(children, parser, extension),
// 			}} />
// 		))
// 	}, [extension, children])
// 	return highlighted || children
// })

// NOTE: Compound component
export const CodeBlock = React.memo(({ id, syntax, extension, children: nodes }) => {
	const [{ readOnly }] = useEditorState()

	// const [$nodes, $setNodes] = React.useState(nodes)

	const $nodes = React.useMemo(() => nodes, [nodes])

	// React.useLayoutEffect(() => {
	// 	if (!extension) {
	// 		// No-op
	// 		return
	// 	}
	// 	const parser = PrismExtensions[extension]
	// 	if (!parser) {
	// 		// No-op
	// 		return
	// 	}
	// 	const data = window.Prism.highlight(nodes.slice(1, -1).map(each => each.data).join("\n"), parser, extension)
	// 	$setNodes(data.split("\n").map((each, x) => ({ id: nodes.slice(1, -1)[x].id, data: each })))
	// }, [extension, nodes])

	console.log(nodes, $nodes)

	const style = { whiteSpace: "pre" }
	return (
		<Root id={id} className="-mx-6 px-6 font-mono text-sm leading-snug bg-white shadow-hero rounded overflow-x-scroll scrolling-touch" {...attrs.code}>
			<span className="inline-block">
				<Node id={nodes[0].id} className="py-px leading-none text-md-blue-a400" style={style}>
					<Markdown syntax={[syntax[0]]}>
						{readOnly && (
							<br />
						)}
					</Markdown>
				</Node>
				{$nodes.slice(1, -1).map(each => (
					<Node key={each.id} id={each.id} style={style} dangerouslySetInnerHTML={{
						__html: each.data || "<br>",
					}} />
				))}
				<Node id={nodes[nodes.length - 1].id} className="py-px leading-none text-md-blue-a400" style={style}>
					<Markdown syntax={[syntax[1]]}>
						{readOnly && (
							<br />
						)}
					</Markdown>
				</Node>
			</span>
		</Root>
	)
})

export const Break = React.memo(({ id, syntax }) => {
	const [{ readOnly }] = useEditorState()

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
