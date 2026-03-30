const Task = require("../models/Task");
const Request = require("../models/Request");
const AcceptedTask = require("../models/AcceptedTask");

// Create Task
exports.createTask = async (req, res) => {
  try {
    const { title, description, category, location, startTime, endTime } = req.body;

    const task = new Task({
      title,
      description,
      category: category || "General",
      location,
      startTime,
      endTime,
      picture: req.file ? req.file.path : null,
      createdBy: req.user.id,
    });

    await task.save();
    res.status(201).json({ message: "Task Created", task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get My Tasks (tasks I created)
exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ createdBy: req.user.id })
      .populate("assignedTo", "first_name last_name email_id profile_picture")
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Tasks (Feed — shows all open tasks)
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      status: "open",
    })
      .populate("createdBy", "first_name last_name email_id profile_picture")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "createdBy",
      "first_name last_name email_id profile_picture"
    );

    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update task status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Only owner can update status
    if (task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    task.status = status;
    await task.save();

    // If task is completed, update accepted task record too
    if (status === "completed") {
      await AcceptedTask.updateMany(
        { task_id: task._id },
        { status: "completed" }
      );
    }

    res.json({ message: "Task status updated", task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Only owner can delete
    if (task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Clean up related requests and accepted tasks
    await Request.deleteMany({ task_id: task._id });
    await AcceptedTask.deleteMany({ task_id: task._id });
    await Task.findByIdAndDelete(task._id);

    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
