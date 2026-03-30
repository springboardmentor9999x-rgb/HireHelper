const mongoose = require("mongoose");

const acceptedTaskSchema = new mongoose.Schema(
  {
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },
  },
  { timestamps: true }
);

acceptedTaskSchema.index({ task_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model("AcceptedTask", acceptedTaskSchema);
