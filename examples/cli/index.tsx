import React from 'react'
import {render} from 'ink'
import SelectInput from 'ink-select-input'
import {Text} from 'ink'

type Item = { label: string, value: string }

const Demo = () => {
	const [selected, setSelected] = React.useState<Item | null>(null)
	const handleSelect = (item: Item) => {
		// `item` = { label: 'First', value: 'first' }
		console.log(item)
		setSelected(item)
	};

	const items: Item[] = [
		{
			label: 'First',
			value: 'first'
		},
		{
			label: 'Second',
			value: 'second'
		},
		{
			label: 'Third',
			value: 'third'
		}
	]

	return (
		<>
			<SelectInput items={items} onSelect={handleSelect} />
			<Text>You selected {selected?.value ?? 'nothing'}</Text>
		</>
	)
}

render(<Demo />)