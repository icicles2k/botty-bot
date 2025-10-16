const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    infractionId: { type: String, required: true },
    type: { type: String, required: true },
    reason: { type: String, required: true },
    username: { type: String, required: true },
    userId: { type: String, required: true },
    moderator: { type: String, required: true },
    moderatorId: { type: String, required: true },
    issued: { type: Date, default: Date.now },
    duration: { type: String },
    expires: { type: Date },
});

module.exports = mongoose.model('Infractions', schema, 'manual-infractions');