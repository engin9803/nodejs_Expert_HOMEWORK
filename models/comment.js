const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    userId: String,
    postId: Number,
    content: String,
    date : {
        type : Date,
        default: Date.now
    },
});

module.exports = mongoose.model("Comment", commentSchema);