const mongoose = require('mongoose');

const DataSchema = new mongoose.Schema(
	{
		name: { type: String },
		number: { type: String }
	}
)

const ListSchema = new mongoose.Schema(
	{
		listName: { type: String },
		listContents: [DataSchema]
	}
)

const UserSchema = new mongoose.Schema(
	{
		username: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		lists: [ListSchema]
	},
	{ collection: 'users' }
)

const model = mongoose.model('UserSchema', UserSchema);

module.exports = model;