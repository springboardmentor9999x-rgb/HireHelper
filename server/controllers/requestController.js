const Request = require("../models/Request");
const Task = require("../models/Task");
const AcceptedTask = require("../models/AcceptedTask");
const Notification = require("../models/Notification");

// Send a request to help with a task
exports.sendRequest = async (req, res) => {
  try {
    const { task_id, message } = req.body;
    const requester_id = req.user.id;

    // Check task exists and is open
    const task = await Task.findById(task_id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.status !== "open")
      return res.status(400).json({ error: "Task is no longer open" });

    // Can't request your own task
    if (task.createdBy.toString() === requester_id) {
      return res.status(400).json({ error: "You cannot request your own task" });
    }

    // Check for duplicate request
    const existing = await Request.findOne({ task_id, requester_id });
    if (existing) {
      return res.status(400).json({ error: "You already requested this task" });
    }

    const request = await Request.create({
      task_id,
      requester_id,
      message: message || "",
    });

    // Notify task owner
    await Notification.create({
      user_id: task.createdBy,
      body: `Someone requested to help with your task "${task.title}"`,
    });

    res.status(201).json({ message: "Request sent", request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Get incoming requests for my tasks
exports.getIncomingRequests = async (req, res) => {
  try {
    // Find all tasks created by the current user
    const myTasks = await Task.find({ createdBy: req.user.id }).select("_id");
    const taskIds = myTasks.map((t) => t._id);

    const requests = await Request.find({ task_id: { $in: taskIds } })
      .populate("task_id", "title description status location startTime endTime category picture")
      .populate("requester_id", "first_name last_name email_id profile_picture is_verified")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get requests I have sent
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ requester_id: req.user.id })
      .populate({
        path: "task_id",
        select: "title description status location startTime endTime picture category",
        populate: { path: "createdBy", select: "first_name last_name email_id profile_picture" },
      })
      .populate("requester_id", "first_name last_name")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Accept a request
exports.acceptRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate("task_id");
    if (!request) return res.status(404).json({ error: "Request not found" });

    // Only task owner can accept
    if (request.task_id.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ error: "Request already processed" });
    }

    // Accept this request
    request.status = "accepted";
    await request.save();

    // Update task status and assign helper
    await Task.findByIdAndUpdate(request.task_id._id, {
      status: "in-progress",
      assignedTo: request.requester_id,
    });

    // Create AcceptedTask record
    await AcceptedTask.create({
      task_id: request.task_id._id,
      user_id: request.requester_id,
    });

    // Reject all other pending requests for this task
    await Request.updateMany(
      {
        task_id: request.task_id._id,
        _id: { $ne: request._id },
        status: "pending",
      },
      { status: "rejected" }
    );

    // Notify the requester
    await Notification.create({
      user_id: request.requester_id,
      body: `Your request for "${request.task_id.title}" has been accepted!`,
    });

    res.json({ message: "Request accepted", request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
// Helper marks work as done
exports.markDone = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate("task_id");
    if (!request) return res.status(404).json({ error: "Request not found" });

    // Only the accepted helper can mark done
    if (request.requester_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (request.status !== "accepted") {
      return res.status(400).json({ error: "Request is not accepted" });
    }

    if (request.helper_marked_done) {
      return res.status(400).json({ error: "Already marked as done" });
    }

    // Mark done on the request
    request.helper_marked_done = true;
    await request.save();

    // Update task status to awaiting-confirmation
    await Task.findByIdAndUpdate(request.task_id._id, {
      status: "awaiting-confirmation",
    });

    // Notify task owner
    await Notification.create({
      user_id: request.task_id.createdBy,
      body: `The helper has marked your task "${request.task_id.title}" as done. Please confirm completion.`,
    });

    res.json({ message: "Marked as done — awaiting owner confirmation", request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Task owner confirms completion
exports.confirmCompletion = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (task.status !== "awaiting-confirmation") {
      return res.status(400).json({ error: "Task is not awaiting confirmation" });
    }

    // Mark task as completed
    task.status = "completed";
    await task.save();

    // Update accepted task records
    await AcceptedTask.updateMany(
      { task_id: task._id },
      { status: "completed" }
    );

    // Notify the helper
    const acceptedRequest = await Request.findOne({
      task_id: task._id,
      status: "accepted",
    });
    if (acceptedRequest) {
      await Notification.create({
        user_id: acceptedRequest.requester_id,
        body: `The owner has confirmed your work on "${task.title}" is complete. Great job!`,
      });
    }

    res.json({ message: "Task marked as completed", task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Task owner disputes completion (sends back to in-progress)
exports.disputeCompletion = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (task.status !== "awaiting-confirmation") {
      return res.status(400).json({ error: "Task is not awaiting confirmation" });
    }

    // Send back to in-progress
    task.status = "in-progress";
    await task.save();

    // Reset the helper_marked_done flag
    await Request.updateOne(
      { task_id: task._id, status: "accepted" },
      { helper_marked_done: false }
    );

    // Notify the helper
    const acceptedRequest = await Request.findOne({
      task_id: task._id,
      status: "accepted",
    });
    if (acceptedRequest) {
      await Notification.create({
        user_id: acceptedRequest.requester_id,
        body: `The owner has indicated that "${task.title}" still needs more work. Please continue.`,
      });
    }

    res.json({ message: "Task sent back to in-progress", task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
// Reject a request
exports.rejectRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate("task_id");
    if (!request) return res.status(404).json({ error: "Request not found" });

    // Only task owner can reject
    if (request.task_id.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ error: "Request already processed" });
    }

    request.status = "rejected";
    await request.save();

    // Notify the requester
    await Notification.create({
      user_id: request.requester_id,
      body: `Your request for "${request.task_id.title}" has been rejected.`,
    });

    res.json({ message: "Request rejected", request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
