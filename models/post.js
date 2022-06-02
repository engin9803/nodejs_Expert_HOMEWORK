const mongoose =  require("mongoose");

const postSchema = new mongoose.Schema({
    postId: {
        type: Number,
        required : true,
    },
    password: {
        type: String,
        required : true
    },
    name: {
        type: String
    },
    title : {
        type: String
    },
    content : {
        type: String
    },
    date : {
        type : Date,
        default: Date.now
    },
});
// postSchema.virtual("postId").get(function () {
//     return this._id.toHexString();
// });
// postSchema.set("toJSON", {
//     virtuals: true,
// });
module.exports = mongoose.model("Post", postSchema);