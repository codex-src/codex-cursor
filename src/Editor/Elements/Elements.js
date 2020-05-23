import attrs from "./attrs"
import dedupeSpaces from "lib/dedupeSpaces"
import escape from "lodash/escape"
import IfWrapper from "lib/IfWrapper"
import Markdown from "./Markdown"
import prismMap from "lib/prismMap"
import React from "react"
import typeEnumArray from "./typeEnumArray"
import useEditorState from "../useEditorState"
import { Strikethrough } from "./InlineElements"

// TODO: Return tags for all elements and inline elements?

// Converts a parsed data structure (children) to renderable
// React components.
function toReact(children) {
	if (children === null || typeof children === "string") {
		return !children ? null : <span key={Math.random().toString(16).substr(2, 4)}>{children}</span>
	}
	const components = []
	for (const each of children) {
		if (each === null || typeof each === "string") {
			components.push(toReact(each))
			continue
		}
		const { type: T, ...props } = each
		components.push(React.createElement(typeEnumArray[T], {
			key: components.length,
			...props,
		}, toReact(props.children)))
	}
	return components
}

const headerClassNames = {
	h1: dedupeSpaces("font-semibold text-3xl leading-tight antialiased"),
	h2: dedupeSpaces("font-semibold text-2xl leading-tight antialiased"),
	h3: dedupeSpaces("font-semibold text-xl  leading-tight antialiased"),
	h4: dedupeSpaces("font-semibold text-xl  leading-tight antialiased"),
	h5: dedupeSpaces("font-semibold text-xl  leading-tight antialiased"),
	h6: dedupeSpaces("font-semibold text-xl  leading-tight antialiased"),
}

export const Header = React.memo(({ tag: Tag, id, syntax, hash, children }) => (
	<Tag id={id} className={headerClassNames[Tag]}>
		<Markdown syntax={syntax}>
			{toReact(children) || (
				<br />
			)}
		</Markdown>
	</Tag>
))

export const Paragraph = React.memo(({ id, children }) => (
	<p id={id}>
		{toReact(children) || (
			<br />
		)}
	</p>
))

export const BlockquoteItem = React.memo(({ id, syntax, children }) => (
	<li id={id} className="list-none text-gray-600">
		<Markdown style={{ letterSpacing: "0.25em" }} syntax={syntax}>
			{toReact(children) || (
				<br />
			)}
		</Markdown>
	</li>
))

export const Blockquote = React.memo(({ id, children: range }) => (
	<blockquote id={id} className="pl-6" style={{ boxShadow: "inset 0.25em 0 var(--gray-300)" }}>
		{range.map(({ type: T, ...each }) => (
			React.createElement(typeEnumArray[T], {
				key: each.id,
				...each,
			})
		))}
	</blockquote>
))

// // NOTE: Use style={{ whiteSpace: "pre" }} not className
// // because of <Node>
// const Pre = props => (
// 	<Node style={{ whiteSpace: "pre" }} {...props} />
// )
// const PreEdge = props => (
// 	<Node className="leading-none" style={{ whiteSpace: "pre" }} {...props} />
// )

const Pre = props => (
	<div className="whitespace-pre" {...props} />
)
const PreEdge = props => (
	<div className="whitespace-pre leading-none" {...props} />
)

export const Preformatted = React.memo(({ id, syntax, extension, children: range }) => {
	const [{ readOnly }] = useEditorState()

	// NOTE: Use useMemo not useState; state needs to be
	// updated eagerly
	const $range = React.useMemo(() => {
		const r = range.slice(1, -1)
		if (!extension || range.length === 2) {
			return r.map(each => ({ ...each, data: escape(each.data) }))
		}
		const parser = prismMap[extension]
		if (!parser) {
			return r.map(each => ({ ...each, data: escape(each.data) }))
		}
		const data = r.map(each => each.data).join("\n")
		const html = window.Prism.highlight(data, parser, extension)
		return html.split("\n").map((each, x) => ({ id: r[x].id, data: each }))
	}, [extension, range])

	return (
		<pre id={id} className="-mx-6 px-4 bg-white-100 rounded shadow-hero overflow-x-scroll scrolling-touch" {...attrs.disableAutoCorrect}>
			<code className="inline-block min-w-full">
				<PreEdge id={range[0].id}>
					<Markdown syntax={[syntax[0]]}>
						{readOnly && (
							<br />
						)}
					</Markdown>
				</PreEdge>
				{$range.map(each => (
					// style={{ "--width": String(range.length).length + "ch" }}
					<Pre key={each.id} id={each.id} dangerouslySetInnerHTML={{
						__html: each.data || (
							"<br />"
						),
					}} />
				))}
				<PreEdge id={range[range.length - 1].id}>
					<Markdown syntax={[syntax[1]]}>
						{readOnly && (
							<br />
						)}
					</Markdown>
				</PreEdge>
			</code>
		</pre>
	)
})

// TODO: Extract <AnyList>
export const AnyListItem = React.memo(({ tag: Tag, id, syntax, ordered, children }) => (
	<Tag id={id} className="my-1" data-codex-ordered={ordered}>
		<Markdown className="hidden" syntax={syntax}>
			{toReact(children) || (
				<br />
			)}
		</Markdown>
	</Tag>
))

export const TodoItem = React.memo(({ tag: Tag, id, syntax, checked, children }) => {
	const [, { checkTodo }] = useEditorState()
	const ref = React.useRef()

	return (
		<Tag id={id} className="relative my-1" data-codex-checked={checked}>
			<Markdown className="hidden" syntax={syntax}>
				<div className="absolute">
					<input
						ref={ref}
						className={dedupeSpaces(`
							form-checkbox
							text-md-blue-a200
							border-none
							rounded-md
							shadow-hero
							transform
							scale-105
							transition
							ease-out
							duration-150
							cursor-pointer
						`)}
						type="checkbox"
						checked={checked}
						onChange={() => {
							ref.current.focus()
							checkTodo(id)
						}}
					/>
				</div>
				<IfWrapper cond={checked} wrapper={({ children }) => <Strikethrough>{children}</Strikethrough>}>
					{toReact(children) || (
						<br />
					)}
				</IfWrapper>
			</Markdown>
		</Tag>
	)
})

export const AnyList = React.memo(({ type, tag: Tag, id, children: range }) => (
	<Tag id={id} className="ml-6">
		{range.map(({ type: T, ...each }) => (
			React.createElement(typeEnumArray[T], {
				key: each.id,
				...each,
			})
		))}
	</Tag>
))

export const Image = React.memo(({ id, syntax, src, alt, href, children }) => {
	const [{ readOnly }] = useEditorState()
	return (
		<figure id={id}>
			<IfWrapper cond={readOnly && Boolean(href)} wrapper={({ children }) => <a href={href} {...attrs.a}>{children}</a>}>
				{/* TODO */}
				<img className="mx-auto" style={{ minHeight: "1.5em", maxHeight: "24em" }} src={src} alt={alt} />
			</IfWrapper>
			{(!readOnly || (readOnly && children)) && (
				// TODO: Can we reuse <Anchor> here? Do we want to?
				<figcaption className="px-6 py-2 text-center text-sm text-gray-600">
					<Markdown syntax={syntax} {...attrs.disableAutoCorrect}>
						{toReact(children) || (
							<br />
						)}
					</Markdown>
				</figcaption>
			)}
		</figure>
	)
})

// TODO: Compute line-height?
const backgroundImage = "linear-gradient(" +
	"transparent 0, " +
	"transparent calc(0.75em - 2px), " +
	"var(--gray-300) calc(0.75em - 2px), " +
	"var(--gray-300) calc(0.75em + 2px), " +
	"transparent calc(0.75em + 2px)" +
")"

// FIXME
export const Break = React.memo(({ id, syntax }) => (
	// TODO: Use tag="hr"?
	<div id={id} className="text-right" style={{ backgroundImage }}>
		<Markdown className="hidden" syntax={syntax}>
			<br />
		</Markdown>
	</div>
))
