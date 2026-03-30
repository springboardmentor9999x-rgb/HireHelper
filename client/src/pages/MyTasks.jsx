import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { toast } from "react-hot-toast";
import {
  MapPin,
  Clock,
  Trash2,
  CheckCircle,
  ClipboardList,
  Plus,
  Briefcase,
  User,
  XCircle,
  Loader,
} from "lucide-react";

const STATUS_COLORS = {
  open: "bg-green-500/20 text-green-400",
  "in-progress": "bg-yellow-500/20 text-yellow-400",
  "awaiting-confirmation": "bg-amber-500/20 text-amber-400",
  completed: "bg-blue-500/20 text-blue-400",
};

const STATUS_LABELS = {
  open: "Active",
  "in-progress": "In Progress",
  "awaiting-confirmation": "Awaiting Confirmation",
  completed: "Completed",
};

const CATEGORY_COLORS = {
  moving: "bg-green-500/20 text-green-400",
  gardening: "bg-emerald-500/20 text-emerald-400",
  painting: "bg-orange-500/20 text-orange-400",
  cleaning: "bg-cyan-500/20 text-cyan-400",
  tech: "bg-blue-500/20 text-blue-400",
  delivery: "bg-purple-500/20 text-purple-400",
  repair: "bg-red-500/20 text-red-400",
  cooking: "bg-pink-500/20 text-pink-400",
  tutoring: "bg-yellow-500/20 text-yellow-400",
  general: "bg-gray-500/20 text-gray-400",
};

const getCategoryColor = (category) => {
  const key = category?.toLowerCase() || "general";
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.general;
};

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get("/tasks/my");
      setTasks(res.data);
    } catch (err) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      toast.success(`Task marked as ${newStatus}`);
      fetchTasks();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success("Task deleted");
      fetchTasks();
    } catch (err) {
      toast.error("Failed to delete task");
    }
  };

  const handleConfirmCompletion = async (taskId) => {
    try {
      await api.put(`/requests/task/${taskId}/confirm`);
      toast.success("Task marked as completed!");
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to confirm");
    }
  };

  const handleDisputeCompletion = async (taskId) => {
    if (!window.confirm("Send this task back to in-progress? The helper will be notified.")) return;
    try {
      await api.put(`/requests/task/${taskId}/dispute`);
      toast.success("Task sent back to in-progress");
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to dispute");
    }
  };

  const formatDateTime = (start, end) => {
    const s = new Date(start);
    const dateStr = s.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const startTime = s.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    if (!end) return `${dateStr} • ${startTime}`;
    const endTime = new Date(end).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${dateStr} • ${startTime} - ${endTime}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">My Tasks</h1>
          <p className="text-white/50 text-sm mt-1">
            Manage your posted tasks
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/addtask")}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold transition-all"
        >
          <Plus size={16} />
          Add New Task
        </button>
      </div>

      {/* Task Grid */}
      {tasks.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <ClipboardList size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-semibold">No tasks found</p>
          <p className="text-sm">Create your first task to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="bg-[rgba(15,23,42,0.45)] backdrop-blur-xl border border-[rgba(255,255,255,0.18)] rounded-2xl overflow-hidden hover:border-indigo-400/40 transition-all group shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            >
              {/* Task Image */}
              <div className="h-44 overflow-hidden bg-white/5 relative">
                {task.picture ? (
                  <img
                    src={`http://localhost:5000/${task.picture}`}
                    alt={task.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Briefcase size={40} className="text-white/10" />
                  </div>
                )}

                {/* Action buttons overlay */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {task.status === "open" && (
                    <button
                      onClick={() => handleDelete(task._id)}
                      className="p-2 bg-red-500/90 rounded-lg text-white hover:bg-red-500 transition-all"
                      title="Delete Task"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-3">
                {/* Category + Status Badges */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold ${getCategoryColor(
                      task.category
                    )}`}
                  >
                    {task.category || "General"}
                  </span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      STATUS_COLORS[task.status]
                    }`}
                  >
                    {STATUS_LABELS[task.status] || task.status}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-lg font-bold leading-tight">
                  {task.title}
                </h3>
                <p className="text-white/50 text-sm line-clamp-2">
                  {task.description}
                </p>

                {/* Location & Time */}
                <div className="flex flex-col gap-1.5 text-sm text-white/40">
                  {task.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="shrink-0" />
                      <span className="truncate">{task.location}</span>
                    </div>
                  )}
                  {task.startTime && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="shrink-0" />
                      <span className="truncate">
                        {formatDateTime(task.startTime, task.endTime)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Assigned Helper Info */}
                {task.assignedTo && task.status !== "open" && (
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    {task.assignedTo.profile_picture ? (
                      <img
                        src={`http://localhost:5000/${task.assignedTo.profile_picture}`}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center">
                        <User size={12} className="text-indigo-300" />
                      </div>
                    )}
                    <span className="text-xs">
                      Helper: <span className="font-medium text-white/70">{task.assignedTo.first_name} {task.assignedTo.last_name}</span>
                    </span>
                  </div>
                )}

                {/* Awaiting Confirmation Banner */}
                {task.status === "awaiting-confirmation" && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
                      <Loader size={14} className="animate-spin" />
                      Helper says the work is done
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfirmCompletion(task._id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500/80 hover:bg-green-500 text-white rounded-lg text-xs font-semibold transition-all"
                      >
                        <CheckCircle size={14} />
                        Confirm Done
                      </button>
                      <button
                        onClick={() => handleDisputeCompletion(task._id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-semibold transition-all"
                      >
                        <XCircle size={14} />
                        Not Done Yet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTasks;
