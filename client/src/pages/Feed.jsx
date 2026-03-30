import { useEffect, useState } from "react";
import api from "../utils/api";
import { toast } from "react-hot-toast";
import {
  MapPin,
  Clock,
  Search,
  User,
  Briefcase,
  X,
  Send,
} from "lucide-react";

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

const Feed = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [requestingId, setRequestingId] = useState(null);

  // Message modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [message, setMessage] = useState("");

  const currentUser =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get("/tasks");
      setTasks(res.data);
    } catch (err) {
      toast.error("Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  const openRequestModal = (task) => {
    setSelectedTask(task);
    setMessage("");
    setShowModal(true);
  };

  const handleRequest = async () => {
    if (!selectedTask) return;
    setRequestingId(selectedTask._id);
    try {
      await api.post("/requests", {
        task_id: selectedTask._id,
        message,
      });
      toast.success("Request sent successfully!");
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send request");
    } finally {
      setRequestingId(null);
    }
  };

  const filtered = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.location?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase())
  );

  const formatShortDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  const formatDateTime = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const formatTimeRange = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const dateStr = s.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const startTime = s.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    const endTime = e.toLocaleTimeString("en-US", {
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
          <h1 className="text-3xl font-black tracking-tight">Feed</h1>
          <p className="text-white/50 text-sm mt-1">
            Find tasks that need help
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full bg-[rgba(15,23,42,0.45)] backdrop-blur-xl border border-[rgba(255,255,255,0.18)] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-indigo-400/50 transition-all shadow-lg shadow-black/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Task Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-semibold">No tasks available</p>
          <p className="text-sm">Check back later for new tasks</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((task) => (
            <div
              key={task._id}
              className="bg-[rgba(15,23,42,0.45)] backdrop-blur-xl border border-[rgba(255,255,255,0.18)] rounded-2xl overflow-hidden hover:border-indigo-400/40 transition-all group shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            >
              {/* Task Image */}
              <div className="h-44 overflow-hidden bg-white/5">
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
              </div>

              <div className="p-5 space-y-3">
                {/* Category Badge + Date */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold ${getCategoryColor(
                      task.category
                    )}`}
                  >
                    {task.category || "General"}
                  </span>
                  <span className="text-xs text-white/30">
                    {formatShortDate(task.createdAt)}
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
                        {task.endTime
                          ? formatTimeRange(task.startTime, task.endTime)
                          : formatDateTime(task.startTime)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Posted By */}
                {task.createdBy && (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    {task.createdBy.profile_picture ? (
                      <img
                        src={`http://localhost:5000/${task.createdBy.profile_picture}`}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-indigo-500/30 flex items-center justify-center">
                        <User size={14} className="text-indigo-300" />
                      </div>
                    )}
                    <span className="text-sm text-white/50">
                      {task.createdBy.first_name} {task.createdBy.last_name}
                    </span>
                  </div>
                )}

                {/* Request Button — hide on own tasks */}
                {currentUser && task.createdBy?._id === currentUser.id ? (
                  <div className="w-full mt-2 bg-white/5 text-white/40 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border border-white/10">
                    Your Task
                  </div>
                ) : (
                  <button
                    onClick={() => openRequestModal(task)}
                    className="w-full mt-2 bg-indigo-500/80 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Request to Help
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Message Modal */}
      {showModal && selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-2xl border border-[rgba(255,255,255,0.18)] rounded-2xl w-full max-w-md shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold">Request to Help</h3>
                <p className="text-sm text-white/40 mt-0.5">
                  {selectedTask.title}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
              >
                <X size={18} className="text-white/50" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-white/70 mb-2 block">
                  Your message (optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell the task owner why you'd like to help..."
                  className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-indigo-400/50 resize-none transition-all"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-5 border-t border-white/10">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/5 text-white/60 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRequest}
                disabled={requestingId === selectedTask._id}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-500/80 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
              >
                <Send size={14} />
                {requestingId === selectedTask._id
                  ? "Sending..."
                  : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
