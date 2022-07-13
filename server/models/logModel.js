const { Schema, model } = require("mongoose");

const LogSchema = new Schema({
	msg: String,
	timeStamp: Date,
});

const log = model("log", LogSchema);
module.exports = log;
