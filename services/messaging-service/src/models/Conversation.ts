import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
    participants: {
        type: [String], // [userA, userB]
        required: true,
    },
    createdAt: {
        type: String,
        trim: true,
    },
});

export default mongoose.model("Conversation", ConversationSchema);
