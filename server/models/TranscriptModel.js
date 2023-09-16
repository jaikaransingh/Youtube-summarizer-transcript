const mongoose = require('mongoose');

const transcriptSchema = new mongoose.Schema({
    videoUrl: {
        type: String,
        required: true
    },
    videoId: {
        type: String,
    },
    title: {
        type: String
    },
    transcript: {
        type: String
    },
}, { timestamps: true });
  
module.exports = mongoose.model('Transcript', transcriptSchema);