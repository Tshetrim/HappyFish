const path = require("path");
const esp32 = require("../models/esp32Model");
const log = require("../models/logModel");
require('dotenv').config();

const reset = async (req, res) => {
	var session = req.session;

	if (!session.userid){
		return res.status(400).json({ error: "not logged in" });
	} 

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

	hours = parseInt(hours);
	mins = parseInt(mins);
	secs = parseInt(secs);

	if (hours < 0 || hours > 24 || mins < 0 || mins > 60 || secs < 0 || secs > 60) {
		console.log("Invalid Input");
		return res.status(400).json({ error: "invalid time input" });
	}

	doc["tod"] = parseInt(hours) * 60 * 60 + parseInt(mins) * 60 + parseInt(secs);

	//saving a log
	let userAgent = req.headers["user-agent"];
	if (userAgent == undefined) userAgent = "Caller Unknown";
	const newLog = new log({
		msg: "Config requested: " + userAgent,
		timeStamp: today,
	});
	await newLog.save();
	console.log("Saved new log: " + newLog);

	return res.status(201).json(doc);
};


const loginPageESP32 = async (req, res) => {
	var session = req.session;

	if (session.userid) {
		res.sendFile(path.resolve(__dirname, "../public/esp32LoggedIn.html"));
	} else {
	  	res.sendFile(path.resolve(__dirname, "../public/loginEsp32.html"));
	}
};


const loginESP32 = async (req, res) => {
	try {
	  console.log('Login attempt ' + JSON.stringify(req.body))
  
	  if (req.body.password == process.env.INCUBATOR_PASSWORD) {
		var session = req.session;
		session.userid = req.body.username;
		console.log(req.session);
	
		res.redirect("/esp32/dashboard");
	  } else {
		res.send("Invalid username or password");
	  }
	} catch (err) {
	  console.log(error)
	  return res.status(400).json({'error': 'exception thrown'})
	}
};

const dashboard = async (req, res) => {
	var session = req.session;

	if (session.userid) {
		res.sendFile(path.resolve(__dirname, "../public/esp32LoggedIn.html"));
	} else {
		res.sendFile(path.resolve(__dirname, "../public/esp32.html"));
	}
};

const save = async (req, res) => {

	var session = req.session;

	if (!session.userid){
		return res.status(400).json({ error: "not logged in" });
	} 

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

	var session = req.session;

	if (!session.userid){
		return res.status(400).json({ error: "not logged in" });
	} 

	//input validation
	if (!req.body.duration) return res.status(400).json({ error: "missing duration" });

	var re = new RegExp("^[0-9]{1,3}$");
	if (!re.test(req.body.duration)) {
		return res.status(400).json({ error: "invalid input" });
	}

	//saving to database
	const docs = await esp32.find();
	const doc = docs[0];

	doc["duration"] = req.body.duration;

	await doc.save();

	return res.status(201).json(doc);
};

const saveCustom = async (req, res) => {
	console.log("incoming data");
	console.log(JSON.stringify(req.body));

	var session = req.session;

	if (!session.userid){
		return res.status(400).json({ error: "not logged in" });
	} 

	if (!req.body.sunrise || !req.body.sunset)
		return res.status(400).json({ error: "missing sunrise / sunset" });
	if (req.body.sunrise.length != 5 || req.body.sunset.length != 5)
		return res.status(400).json({ error: "invalid length" });

	//input validation
	let re = new RegExp("^[0-9]{2}[:]{1}[0-9]{2}$");
	if (re.test(req.body.sunrise)) {
		if (
			req.body.sunrise.charAt(0) - "0" > 2 ||
			(req.body.sunrise.charAt(1) > 4 && req.body.sunrise.charAt(0) > 1)
		) {
			return res.status(400).json({ error: "invalid input" });
		}
	} else {
		valid = false;
		return res.status(400).json({ error: "invalid input" });
	}

	if (re.test(req.body.sunset)) {
		if (
			req.body.sunset.charAt(0) - "0" > 2 ||
			(req.body.sunset.charAt(1) > 4 && req.body.sunset.charAt(0) > 1)
		) {
			return res.status(400).json({ error: "invalid input" });
		}
	} else {
		return res.status(400).json({ error: "invalid input" });
	}

	//saving to database
	const docs = await esp32.find();
	console.log(docs);
	const doc = docs[0];
	console.log(doc);

	let sunriseHours = req.body.sunrise.charAt(0) - "0" * 10 + req.body.sunrise.charAt(1) - "0";
	let sunriseMins = req.body.sunrise.charAt(3) - "0" * 10 + req.body.sunrise.charAt(4) - "0";
	let sunsetHours = req.body.sunset.charAt(0) - "0" * 10 + req.body.sunset.charAt(1) - "0";
	let sunsetMins = req.body.sunset.charAt(3) - "0" * 10 + req.body.sunset.charAt(4) - "0";

	if (sunriseHours < 0 || sunriseHours > 24 || sunriseMins < 0 || sunriseMins > 60) {
		console.log("Invalid Input");
		return res.status(400).json({ error: "invalid input" });
	}
	if (sunsetHours < 0 || sunsetHours > 24 || sunsetMins < 0 || sunsetMins > 60) {
		console.log("Invalid Input");
		return res.status(400).json({ error: "invalid input" });
	}

	//gets the seconds value of date in format hh:mm
	let sunriseValue = sunriseHours * 60 * 60 + sunriseMins * 60;
	let sunsetValue = sunsetHours * 60 * 60 + sunsetMins * 60;

	//can remove if ESP32 can handle taking a sunriseValue > sunsetValue but currently, leaving a check to prevent this
	if (sunriseValue > sunsetValue) {
		return res
			.status(400)
			.json({ error: "invalid input - sunrise value must be less than sunset value" });
	}

	//checking if time is > 24:00
	if (sunriseValue > 24 * 60 * 60 || sunsetValue > 24 * 60 * 60) {
		return res
			.status(400)
			.json({ error: "invalid input - value must be less than 24:00 in seconds" });
	}

	doc["sunrise"] = sunriseValue;
	doc["sunset"] = sunsetValue;

	await doc.save();

	return res.status(201).json(doc);
};

module.exports = {
	reset,
	config,
	loginESP32,
	loginPageESP32,
	dashboard,
	save,
	saveDuration,
	saveCustom,
};
