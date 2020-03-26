import React from "react"
import ReactDOM from "react-dom"
import uuidv4 from "uuid/v4"

import "./AppRichText.css"

// Parses syntax into a start (s1) and end (s2) string.
function parseSyntax(syntax) {
	let s1 = "" // Start syntax
	let s2 = "" // End syntax
	if (syntax === null) {
		return ["", ""]
	} else if (typeof syntax === "string") {
		s1 = syntax
		s2 = syntax
	} else if (Array.isArray(syntax)) {
		s1 = syntax[0]
		// Guard end syntax:
		if (syntax.length === 2) {
			s2 = syntax[1]
		}
	}
	return [s1, s2]
}

const Syntax = ({ className, readOnly, ...props }) => (
	<span className={className || "text-md-blue-a400"} style={{ display: readOnly && "none" }}>
		{props.children}
	</span>
)

const Markdown = ({ className, syntax, ...props }) => {
	const { readOnly } = React.useContext(EditorContext)

	const [s1, s2] = parseSyntax(syntax)
	return (
		<React.Fragment>
			{s1 && (
				<Syntax
					className={className}
					readOnly={readOnly}
					children={s1}
				/>
			)}
			{props.children}
			{s2 && (
				<Syntax
					className={className}
					readOnly={readOnly}
					children={s1}
				/>
			)}
		</React.Fragment>
	)
}

const Escape = ({ syntax, ...props }) => (
	<span>
		<Markdown syntax={syntax}>
			{props.children}
		</Markdown>
	</span>
)

const Em = ({ syntax, ...props }) => (
	<span className="italic">
		<Markdown syntax={syntax}>
			{props.children}
		</Markdown>
	</span>
)

const Strong = ({ syntax, ...props }) => (
	<span className="font-semibold">
		<Markdown syntax={syntax}>
			{props.children}
		</Markdown>
	</span>
)

const StrongAndEm = ({ syntax, ...props }) => (
	<span className="font-semibold italic">
		<Markdown syntax={syntax}>
			{props.children}
		</Markdown>
	</span>
)

const Code = ({ syntax, ...props }) => {
	const { readOnly } = React.useContext(EditorContext)

	return (
		<span className="py-px font-mono text-sm text-red-600 bg-red-100 rounded">
			<Markdown className="text-red-600" syntax={syntax}>
				{!readOnly ? (
					props.children
				) : (
					props.children.trim()
				)}
			</Markdown>
		</span>
	)
}

const Strike = ({ syntax, ...props }) => (
	<span className="line-through">
		<Markdown syntax={syntax}>
			{props.children}
		</Markdown>
	</span>
)

export const $Node = ({ id, ...props }) => (
	<div id={id} style={{ whiteSpace: "pre-wrap" }} data-node {...props}>
		{props.children || (
			<br />
		)}
	</div>
)

const Header = React.memo(({ id, syntax, data, ...props }) => (
	// eslint-disable-next-line react/jsx-pascal-case
	<$Node id={id} className="font-medium text-4xl">
		<Markdown syntax={syntax}>
			{toReact(data)}
		</Markdown>
	</$Node>
))

const Subheader = React.memo(({ id, syntax, data, ...props }) => (
	// eslint-disable-next-line react/jsx-pascal-case
	<$Node id={id} className="font-medium text-2xl">
		<Markdown syntax={syntax}>
			{toReact(data)}
		</Markdown>
	</$Node>
))

const H3 = React.memo(({ id, syntax, data, ...props }) => (
	// eslint-disable-next-line react/jsx-pascal-case
	<$Node id={id} className="font-semibold text-xl">
		<Markdown syntax={syntax}>
			{toReact(data)}
		</Markdown>
	</$Node>
))

const H4 = React.memo(({ id, syntax, data, ...props }) => (
	// eslint-disable-next-line react/jsx-pascal-case
	<$Node id={id} className="font-semibold text-lg">
		<Markdown syntax={syntax}>
			{toReact(data)}
		</Markdown>
	</$Node>
))

const H5 = React.memo(({ id, syntax, data, ...props }) => (
	// eslint-disable-next-line react/jsx-pascal-case
	<$Node id={id} className="font-semibold">
		<Markdown syntax={syntax}>
			{toReact(data)}
		</Markdown>
	</$Node>
))

const H6 = React.memo(({ id, syntax, data, ...props }) => (
	// eslint-disable-next-line react/jsx-pascal-case
	<$Node id={id} className="font-semibold">
		<Markdown syntax={syntax}>
			{toReact(data)}
		</Markdown>
	</$Node>
))

const Paragraph = React.memo(({ id, data, ...props }) => (
	// eslint-disable-next-line react/jsx-pascal-case
	<$Node id={id}>
		{toReact(data) || (
			<br />
		)}
	</$Node>
))

// || text[index + syntax.length + offset - 1] === "\\") {

// Registers a component for parseTextGFM.
function registerComponent(component, syntax, { recurse } = { recurse: true }) {
	// NOTE: Escape syntax for regex
	const escapedSyntax = syntax.split("").map(each => `\\${each}`).join("")
	// const searchRe = `[^\\\\]${escapedSyntax}( |$)` // FIXME: N/A code
	let searchRe = `[^\\\\]${escapedSyntax}`
	if (syntax[0] === "_") {
		searchRe = `[^\\\\]${escapedSyntax}( |$)`
	}
	const parse = (text, index) => {
		// // NOTE: _ and ~ based syntax must be at the start and
		// // end of a word to parse
		// //
		// // https://spec.commonmark.org/dingus
		// if ((syntax[0] === "_" || syntax[0] === "~") && (!index || text[index] !== " ")) {
		// 	return null
		// }

		// Get the nearest offset proceeded by a space or EOL:
		//
		// NOTE: Use ... + 1 because of escape character
		const offset = text.slice(index + syntax.length).search(searchRe) + 1 // text.slice(index + syntax.length).indexOf(syntax)
		if (
			(syntax !== "`" && text[index + syntax.length] === " ") || // Exempt code
			offset <= 0 ||
			(syntax !== "`" && text[index + syntax.length + offset - 1] === " ") // Exempt code
		) {
			return null
		}
		index += syntax.length
		const str = text.slice(index, index + offset)
		const object = {
			component,
			syntax,
			children: !recurse ? str : parseTextGFM(str),
		}
		index += syntax.length + offset - 1
		return { object, x2: index }
	}
	return parse
}

// Parses GFM text to a VDOM representation.
function parseTextGFM(text) {
	if (!text) {
		return null
	}
	const data = []
	for (let index = 0; index < text.length; index++) {
		const char = text[index]
		const charsToEnd = text.length - index
		switch (true) {
		// <Escape>
		case char === "\\":
	 		if (index + 1 < text.length && text[index + 1].match(/[\W_]/)) {
				// No-op
				data.push({
					component: Escape,
					syntax: [char],
					children: text[index + 1],
				})
				index++
				continue
			}
			break
		// <StrongEm> or <Strong> or <Em>
		case char === "*" || char === "_":
			// ***Strong and em***
			if (charsToEnd >= "***x***".length && text.slice(index, index + 3) === char.repeat(3)) {
				// TODO: Can extract registerComponent(...)(...) to
				// parseStrongAndEm(...)
				const parsed = registerComponent(StrongAndEm, char.repeat(3))(text, index)
				if (!parsed) {
					// No-op
					break
				}
				data.push(parsed.object)
				index = parsed.x2
				continue
			// **Strong** or __strong__
			} else if (charsToEnd >= "**x**".length && text.slice(index, index + 2) === char.repeat(2)) {
				const parsed = registerComponent(Strong, char.repeat(2))(text, index)
				if (!parsed) {
					// No-op
					break
				}
				data.push(parsed.object)
				index = parsed.x2
				continue
			// _Emphasis_ or *emphasis*
			} else if (charsToEnd >= "*x*".length) {
				const parsed = registerComponent(Em, char)(text, index)
				if (!parsed) {
					// No-op
					break
				}
				data.push(parsed.object)
				index = parsed.x2
				continue
			}
			break
		// <Strike>
		case char === "~":
			// ~~Strike~~
			if (charsToEnd >= "~~x~~".length && text.slice(index, index + 2) === "~~") {
				const parsed = registerComponent(Strike, "~~")(text, index)
				if (!parsed) {
					// No-op
					break
				}
				data.push(parsed.object)
				index = parsed.x2
				continue
			// ~Strike~
			} else if (charsToEnd >= "~x~".length) {
				const parsed = registerComponent(Strike, "~")(text, index)
				if (!parsed) {
					// No-op
					break
				}
				data.push(parsed.object)
				index = parsed.x2
				continue
			}
			break
		// <Code>
		case char === "`":
			if (charsToEnd >= "`x`".length) {
				const parsed = registerComponent(Code, "`", { recurse: false })(text, index)
				if (!parsed) {
					// No-op
					break
				}
				data.push(parsed.object)
				index = parsed.x2
				continue
			}
			break
		default:
			// No-op
			break
		}
		if (!data.length || typeof data[data.length - 1] !== "string") {
			data.push(char)
			continue
		}
		data[data.length - 1] += char
	}
	// Return a string or an array:
	return !data.length ? data[0] : data
}

// Parses GFM to a VDOM representation.
function parseGFM(text) {
	const data = []
	const paragraphs = text.split("\n")
	// NOTE: Use an index for multiline elements
	for (let index = 0; index < paragraphs.length; index++) {
		const each = paragraphs[index]
		switch (each.charAt(0)) {
		// <Header>
		case "#":
			if (
				(each.length >= 2 && each.slice(0, 2) === "# ") ||
				(each.length >= 3 && each.slice(0, 3) === "## ") ||
				(each.length >= 4 && each.slice(0, 4) === "### ") ||
				(each.length >= 5 && each.slice(0, 5) === "#### ") ||
				(each.length >= 6 && each.slice(0, 6) === "##### ") ||
				(each.length >= 7 && each.slice(0, 7) === "###### ")
			) {
				const syntax = [each.slice(0, each.indexOf(" ") + 1)]
				data.push({
					id: uuidv4(),
					component: [Header, Subheader, H3, H4, H5, H6][syntax[0].length - 2],
					syntax,
					children: parseTextGFM(each.slice(syntax[0].length)),
				})
				continue
			}
			break
		default:
			// No-op
			break
		}
		// <Paragraph>
		data.push({
			id: uuidv4(),
			component: Paragraph,
			syntax: null,
			children: parseTextGFM(each),
		})
	}
	return data
}

// Converts a VDOM representation to React components.
function toReact(children) {
	if (children === null || typeof children === "string") {
		return children
	}
	const components = []
	for (const each of children) {
		if (each === null || typeof each === "string") {
			components.push(each)
			continue
		}
		const { component: Component } = each
		components.push((
			<Component key={components.length} syntax={each.syntax}>
				{toReact(each.children)}
			</Component>
		))
	}
	return components
}

// Converts a VDOM representation to a plaintext string.
function toPlaintext(data, { markdown } = { markdown: false }) {
	let str = ""
	// Recurse children:
	const recurse = children => {
		if (children === null || typeof children === "string") {
			str += children || ""
			return
		}
		for (const each of children) {
			if (each === null || typeof each === "string") {
				str += each || ""
				continue
			}
			str += (markdown && each.syntax) || ""
			recurse(each.children)
			str += (markdown && each.syntax) || ""
		}
	}
	// Iterate top-level children:
	for (const each of data) {
		const [s1, s2] = parseSyntax(each.syntax)
		str += (markdown && s1) || ""
		recurse(each.children)
		str += (markdown && s2) || ""
		if (each !== data[data.length - 1]) {
			str += "\n" // EOL
		}
	}
	return str
}

// Converts a VDOM representation to an HTML string.
function toHTML(data) {
	let str = ""
	// Recurse children:
	const recurse = children => {
		if (children === null || typeof children === "string") {
			str += children || `<br>`
			return
		}
		for (const each of children) {
			if (each === null || typeof each === "string") {
				str += each || `<br>`
				continue
			}
			// str += (markdown && each.syntax) || ""
			recurse(each.children)
			// str += (markdown && each.syntax) || ""
		}
	}
	// Iterate top-level children:
	for (const each of data) {
		const html = cmapHTML[each.component.type]
		str += `<${html}>\n\t`
		recurse(each.children)
		str += `\n</${html}>`
		if (each !== data[data.length - 1]) {
			str += "\n" // EOL
		}
	}
	return str
}

// Recursively reads from an element.
function innerText(element) {
	let str = ""
	const recurse = element => {
		for (const each of element.childNodes) {
			// Text and <br>:
			if (each.nodeType === Node.TEXT_NODE || each.nodeName === "BR") {
				str += each.nodeValue || ""
			// <Any>:
			} else if (each.nodeType === Node.ELEMENT_NODE) {
				recurse(each)
				if (each.getAttribute("data-node") || each.getAttribute("data-compound-node")) {
					str += "\n"
				}
			}
		}
	}
	recurse(element)
	return str
}

// Renders editor blocks.
const EditorBlocks = ({ data, ...props }) => (
	data.map(({ component: Block, ...each }) => (
		<Block key={each.id} id={each.id} syntax={each.syntax} data={each.children} />
	))
)

const EditorContext = React.createContext()

// Maps component references to names or HTML.
const cmap = new Map()
const cmapHTML = new Map()

;(() => {
	// Inline components:
	cmap[Escape] = "Escape"
	cmap[Em] = "Em"
	cmap[Strong] = "Strong"
	cmap[StrongAndEm] = "StrongAndEm"
	cmap[Strike] = "Strike"

	// Block components:
	cmap[Header.type] = "Header"
	cmap[Subheader.type] = "Subheader"
	cmap[H3.type] = "H3"
	cmap[H4.type] = "H4"
	cmap[H5.type] = "H5"
	cmap[H6.type] = "H6"
	cmap[Paragraph.type] = "Paragraph"

	// Inline components:
	cmapHTML[Escape] = "Escape" // ??
	cmapHTML[Em] = "em"
	cmapHTML[Strong] = "strong"
	cmapHTML[StrongAndEm] = "strong+em" // ?
	cmapHTML[Strike] = "strike"

	// Block components:
	cmapHTML[Header.type] = "h1"
	cmapHTML[Subheader.type] = "h2"
	cmapHTML[H3.type] = "h3"
	cmapHTML[H4.type] = "h4"
	cmapHTML[H5.type] = "h5"
	cmapHTML[H6.type] = "h6"
	cmapHTML[Paragraph.type] = "p"
})()

function stringify(obj) {
	const data = JSON.stringify(
		obj,
		(key, value) => {
			// Non-component:
			if (key !== "component") {
				return value
			}
			// Component (guard React.memo):
			if (value.type) {
				value = value.type
			}
			return `<${cmap[value]}>`
		},
		"\t",
	)
	return data
}

const DocumentTitle = props => {
	React.useEffect(() => {
		document.title = props.title
	}, [props.title])
	return props.children
}

// Renders an editor.
const Editor = ({ state, setState, ...props }) => {
	const ref = React.useRef()

	// Rerender the DOM when data changes (use useLayoutEffect
	// because of contenteditable):
	//
	// TODO: Use useMemo?
	React.useLayoutEffect(() => {
		// React.useCallback(() => {
		const { Provider } = EditorContext
		ReactDOM.render(
			// FIXME: Prevent useless rerenders to <Provider>?
			<Provider value={state}>
				<EditorBlocks data={state.data} />
			</Provider>,
			ref.current,
		)
		// }, [state.data]),
	}, [state])

	// TODO: Add HTML?
	React.useEffect(() => {
		console.log(toHTML(state.data))

		const txt = toPlaintext(state.data)
		const gfm = toPlaintext(state.data, { markdown: true })
		// Compute metrics:
		// const bytes = txt.length
		const characters = [...txt].length
		const words = txt.split(/\s+/).filter(Boolean).length
		const duration = words / 250
		setState(current => ({
			...current,
			txt: {
				title: [...txt.split("\n", 1)[0]].slice(0, 100).join("") || "Untitled",
				data: txt,
				// bytes,
				characters,
				words,
				duration,
			},
			gfm,
		}))
	}, [
		state.data,
		setState,
	])

	return (
		// <React.Fragment>
		<DocumentTitle title={!state.txt ? "Loading…" : state.txt.title}>

			{/* Editor */}
			{React.createElement(
				"div",
				{
					ref,

					className: props.className,

					style: {
						outline: "none",
						caretColor: "black",
						...props.style,
					},

					contentEditable: !state.readOnly,
					suppressContentEditableWarning: !state.readOnly,
				},
			)}

			{/* Debugger */}
			{true && (
				<div className="my-6 whitespace-pre-wrap font-mono text-xs" style={{ tabSize: 2 }}>
					{stringify(state)}
				</div>
			)}

		</DocumentTitle>
		// </React.Fragment>
	)
}

const App = props => {
	// <textarea> (1 of 2):
	const [value, setValue] = React.useState(() => {
		const cache = localStorage.getItem("codex-app-v2")
		if (cache) {
			const json = JSON.parse(cache)
			return json.data
		}
		return `
# This is a header
## This is a subheader
### H3
#### H4
##### H5
###### H6

*oh*man*is*it*
_oh_man_is_it_

*oh*shit* -- OK
**oh**shit** -- OK
***oh***shit*** -- OK
_oh_shit_ -- OK
__oh__shit__ -- OK
___oh___shit___ -- OK
\`oh\`shit\` -- OK
~oh~shit~ -- OK
~~oh~~shit~~ -- OK

* oh *
** oh **
*** oh *** -- Not sure
_ oh _
__ oh __
___ oh ___ -- Not sure
\` oh \`
~ oh ~
~~ oh ~~

_em **and**_ **strong** or ~strike~ or ~~strike~~

_em_ **_and_ strong**
`.trim()
	})

	// <textarea> (2 of 2):
	React.useEffect(() => {
		localStorage.setItem("codex-app-v2", JSON.stringify({ data: value }))
	}, [value])

	// State (once):
	const [state, setState] = React.useState(() => ({
		readOnly: false,
		data: parseGFM(value),
	}))

	// State (per update):
	React.useLayoutEffect(() => {
		setState(current => ({
			...current,
			data: parseGFM(value),
		}))
	}, [value])

	// Shortcuts:
	React.useEffect(() => {
		const handler = e => {
			if (!e.metaKey || e.keyCode !== 80) {
				// No-op
				return
			}
			e.preventDefault()
			setState(current => ({
				...current,
				readOnly: !state.readOnly,
			}))
		}
		window.addEventListener("keydown", handler)
		return () => {
			window.removeEventListener("keydown", handler)
		}
	}, [state.readOnly])

	return (
		<div className="flex flex-row justify-center">
			<div className="px-6 py-32 flex flex-row w-full max-w-6xl">

				<div className="p-3 fixed right-0 top-0">
					<button
						className="px-3 py-2 bg-white hover:bg-gray-100 rounded-lg shadow transition duration-75"
						onPointerDown={e => e.preventDefault()}
						onClick={e => setState({ ...state, readOnly: !state.readOnly })}
					>
						Toggle read-only: {!state.readOnly ? "OFF" : "ON"}
					</button>
				</div>

				{/* LHS */}
				<div className="flex-shrink-0 w-1/2">
					<textarea
						className="w-full h-full resize-none outline-none"
						value={value}
						onChange={e => setValue(e.target.value)}
					/>
				</div>

				{/* RHS */}
				<div className="flex-shrink-0 w-6" />
				<div className="flex-shrink-0 w-1/2">
					<Editor
						// className="text-lg"
						state={state}
						setState={setState}
					/>
				</div>

			</div>
		</div>
	)
}

export default App
