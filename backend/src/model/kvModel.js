const mongoose = require('mongoose');

const kvSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    key: {
        type: String,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    expireAt: {
        type: Date,
        required: true,
        index: { expires: 0 }
    }
}, { timestamps: true });

// Index for quick lookups
kvSchema.index({ userId: 1, token: 1, key: 1 });


const KV = mongoose.model('KV', kvSchema);

module.exports = KV;
