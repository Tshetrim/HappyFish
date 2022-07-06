const path = require("path");
const esp32 = require("../models/esp32Model");

const reset = async (req, res) => {
	const docs = await esp32.find();

	if (docs.length == 0) {
		const newEsp32 = new esp32({
			tod: 0,
			sunrise: 28800,
			sunset: 72000,
			duration: 60,
			rValue: 0,
			gValue: 0,
			bValue: 0,
		});
		await newEsp32.save();
		return res.status(201).json(newEsp32);
	}

	return res.status(201).json(docs[0]);
};

const config = async (req, res) => {
	const docs = await esp32.find();
	const doc = docs[0];
	const today = new Date();
	//converting to utc time
	const utc = new Date(today.toUTCString().slice(0, -4));

	//doc["tod"] = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

	//today.setHours(today.getHours());
	let hours = utc.getHours() < 10 ? "0" + utc.getHours() : utc.getHours();
	let mins = utc.getMinutes() < 10 ? "0" + utc.getMinutes() : utc.getMinutes();
	let secs = utc.getSeconds() < 10 ? "0" + utc.getSeconds() : utc.getSeconds();
	console.log(hours + ":" + mins + ":" + secs);
	doc["tod"] = parseInt(hours) * 60 * 60 + parseInt(mins) * 60 + parseInt(secs);

	return res.status(201).json(doc);
};

const dashboard = async (req, res) => {
	res.sendFile(path.resolve(__dirname, "../public/esp32.html"));
};

const save = async (req, res) => {
	console.log("incoming data");
	console.log(JSON.stringify(req.body));

	if (!req.body.pin || !req.body.value)
		return res.status(400).json({ error: "missing pin / value" });

	const pin = req.body.pin;
	if (pin != "r" && pin != "g" && pin != "b")
		return res.status(400).json({ error: "invalid pin" });

	const docs = await esp32.find();
	console.log(docs);
	const doc = docs[0];
	console.log(doc);

	doc[pin + "Value"] = req.body.value;

	await doc.save();

	return res.status(201).json(doc);
};

const saveDuration = async (req, res) => {
	console.log("incoming data");
	console.log(JSON.stringify(req.body));

	if (!req.body.duration) return res.status(400).json({ error: "missing duration" });

	const docs = await esp32.find();
	const doc = docs[0];

	doc["duration"] = req.body.duration;

	await doc.save();

	return res.status(201).json(doc);
};

const saveCustom = async (req, res) => {
	console.log("incoming data");
	console.log(JSON.stringify(req.body));

	if (!req.body.sunrise || !req.body.sunset)
		return res.status(400).json({ error: "missing sunrise / sunset" });
	if (req.body.runrise.length() != 5 || req.body.sunset.length() != 5)
		return res.status(400).json({ error: "invalid length" });

	const docs = await esp32.find();
	console.log(docs);
	const doc = docs[0];
	console.log(doc);

	//gets the seconds value of date in format hh:mm
	let sunriseValue =
		(req.body.sunrise.charAt(0) - "0" * 10 + req.body.sunrise.charAt(1) - "0") * 60 * 60 +
		(req.body.sunrise.charAt(3) - "0" * 10 + req.body.sunrise.charAt(4) - "0") * 60;
	let sunsetValue =
		(req.body.sunset.charAt(0) - "0" * 10 + req.body.sunset.charAt(1) - "0") * 60 * 60 +
		(req.body.sunset.charAt(3) - "0" * 10 + req.body.sunset.charAt(4) - "0") * 60;
	doc["sunrise"] = sunriseValue;
	doc["sunset"] = sunsetValue;

	await doc.save();

	return res.status(201).json(doc);
};

module.exports = {
	reset,
	config,
	dashboard,
	save,
	saveDuration,
	saveCustom,
};
