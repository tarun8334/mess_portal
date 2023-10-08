import express from 'express'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { getAllUserData } from './db.js'
import cron from 'node-cron'
import { sendSMS } from './sendsms.js'
import { get_menu_from_slot, loadtable, table } from './menu.js'

dotenv.config()

const app = express()


// middleware

// parse cookies
app.use(cookieParser())

// parse application/json
app.use(express.json())

// static
app.use(express.static('../frontend/'))

let userArray = [];


app.get('/users', (req, res) => {
	const user = userArray;
	res.send(user);
	// res.send("<pre>"+get_menu_from_slot("Sunday > South > Breakfast")+"</pre>");
})

app.get('/table', (req, res) => {
	loadtable(new Date());
	res.send(table);
})
app.get('/sendsms', (req, res) => {
	// const phone = req.query.phone;
	const message = req.query.message;
	for (let user of userArray) {
		if (user.phone) {
			sendSMS(user.phone, message);
		}
	}
	res.send(`Sent message to ${userArray.length} users.`);
})

app.listen(process.env.PORT, "0.0.0.0", function () {
	console.log('Node app is running on port', process.env.PORT);
});


function schedule() {
	const timeArray = {
		"Breakfast": '0 7 * * *',
		"Lunch": '0 12 * * *',
		"Snacks": '0 17 * * *',
		"Dinner": '0 19 * * *'
	};

	const checkTime = "0 7 * * *";

	for (let time in timeArray) {
		const cronTime = timeArray[time];
		cron.schedule(cronTime, () => {
			const today_name = new Date().toLocaleDateString('en-us', { weekday: 'long' });
			for (let user of userArray) {
				if (!user.alerts) continue;
				const favorites = user.favorites.split("\n");
				let message = "";
				for (let slot of favorites) {
					const [day, mess, item] = slot.split(" > ");
					if (day != today_name) continue;
					if (item != time) continue;
					message += `Your favorite ${item} is about to be served in ${mess} mess.\n`;
				}
				if (user.phone) {
			sendSMS(user.phone, message);
				}
			}
		});
	};
	cron.schedule(checkTime, () => {
		const today_name = new Date().toLocaleDateString('en-us', { weekday: 'long' });
		for (let user of userArray) {
			if (!user.alerts) continue;
			const favorites = user.favorites.split("\n");
			let meals = 0;
			for (let slot of favorites) {
				const [day, mess, item] = slot.split(" > ");
				if (day != today_name) continue;
				meals++;
			}
			if (meals == 0) {
				const message = `You have not registered in any mess for today.`
				sendSMS(user.phone, message);
			}
		}
	});
}
function test() {
	const time = "Dinner";
	const today_name = new Date().toLocaleDateString('en-us', { weekday: 'long' });
	// test for timeslot
	for (let user of userArray) {
		if (!user.alerts) continue;
		const favorites = user.favorites.split("\n");
		let message = "";
		for (let slot of favorites) {
			const [day, mess, item] = slot.split(" > ");
			if (day != today_name) continue;
			if (item != time) continue;
			message += `Your favorite ${item} is about to be served in ${mess} mess. The menu is:\n`;
			message += get_menu_from_slot(slot);
		}
		sendSMS(user.phone, message);
	}

	// test for checkTime
	//  today_name = new Date().toLocaleDateString('en-us', { weekday: 'long' });
	for (let user of userArray) {
		if (!user.alerts) continue;
		const favorites = user.favorites.split("\n");
		let meals = 0;
		for (let slot of favorites) {
			const [day, mess, item] = slot.split(" > ");
			if (day != today_name) continue;
			meals++;
		}
		if (meals == 0) {
			const message = `You have not registered in any mess for today.`
			sendSMS(user.phone, message);
		}
	}
}

async function main() {
	await getAllUserData()
		.then((userDataArray) => {
			userArray = userDataArray;
		})
		.catch((error) => {
			console.error('Error getting all user data:', error);
		});
	schedule();
	// test();
}

main();

export default app