const week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
	table = {}
let messes = {},
	weekdayoffset = 1,
	selectedday = "",
	slots = []

import data from '../../frontend/data4.json' assert { type: 'json' };

// console.log(data);
messes = data.messes
weekdayoffset = data.weekdayoffset

function loadtable(d) {
	const date = new Date(d)
	const weekday = date.getDay()
	selectedday = date.toLocaleDateString('en-us', { weekday: 'long' })

	for (let mess in messes) {
		table[mess] = {}
		const items = Object.entries(messes[mess].menu[(weekday - weekdayoffset + 7) % 7]).slice(1)
		let position = 0
		for (let section in messes[mess].sections) {
			if (!slots.includes(section))
				slots.push(section)
			table[mess][section] = items.slice(position, position += messes[mess].sections[section][0])
		}
	}
}

function get_menu_from_slot(slot) {
	if(!slot) return "Unknown slot";
	const [day, mess, time] = slot.split(" > ");
	loadtable(new Date());
	const today_name = new Date().toLocaleDateString('en-us', { weekday: 'long' });
	const todaysslots = table[mess];
	let menu = "";
	for (let item of todaysslots[time]) {
		menu += `${item[1]}\n`;
	}
	menu=menu.replace(/\n\n/g, "\n");
	// make each word start with capital letter
	menu = menu.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
	return menu;
}


export { loadtable, messes, table, week, get_menu_from_slot }