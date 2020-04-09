import Enum from "Enum"
import React from "react"

const Type = new Enum(
	"P", // Paragraph
)

const Editor = ({ state, setState }) => (
	"Hello, world!"
)

function useEditor(initialValue, options = null) {
	const [state, setState] = React.useState(() => ({
		data: [
			{
				type: Type.P,
				id: "abc-123-xyz",
				data: "Hello, world!",
			},
		],
		pos1: {
			id: "",
			offset: "",
		},
		pos2: {
			id: "",
			offset: "",
		},
	}))
	return [state, setState]
}

const App = () => {
	const [state, setState] = useEditor("Hello, world!")

	return (
		<div className="py-32 flex flex-row justify-center">
			<div className="px-6 w-full max-w-screen-md">
				<Editor
					state={state}
					setState={setState}
				/>
			</div>
		</div>
	)
}

export default App
