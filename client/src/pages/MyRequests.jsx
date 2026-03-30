import { useEffect, useState } from "react";
import api from "../utils/api";
import { toast } from "react-hot-toast";
import {
  Clock,
  MapPin,
  Send,
  CheckCircle,
  XCircle,
  Loader,
  Briefcase,
  User,
  CircleCheckBig,
} from "lucide-react";

const STATUS_BADGE = {
  pending: "bg-yellow-500/20 text-yellow-400",
  accepted: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
};

const STATUS_LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
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

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingDone, setMarkingDone] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get("/requests/my");
      setRequests(res.data);
    } catch (err) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async (requestId) => {
    if (!window.confirm("Mark this task as done? The owner will be asked to confirm.")) return;
    setMarkingDone(requestId);
    try {
      await api.put(`/requests/${requestId}/mark-done`);
      toast.success("Marked as done — waiting for owner confirmation");
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to mark as done");
    } finally {
      setMarkingDone(null);
    }
  };

  const formatDateTime = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

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
      <div>
        <h1 className="text-3xl font-black tracking-tight">My Requests</h1>
        <p className="text-white/50 text-sm mt-1">
          Track the help requests you've sent
        </p>
      </div>

      {/* Request List */}
      {requests.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <Send size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-semibold">No requests sent yet</p>
          <p className="text-sm">
            Browse the feed and request to help with tasks
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req._id}
              className="bg-[rgba(15,23,42,0.45)] backdrop-blur-xl border border-[rgba(255,255,255,0.18)] rounded-2xl overflow-hidden hover:border-indigo-400/40 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            >
              <div className="p-6 space-y-4">
                {/* Task Title + Category + Status */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                      <Briefcase size={18} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">
                        {req.task_id?.title || "Unknown Task"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {req.task_id?.category && (
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getCategoryColor(
                              req.task_id.category
                            )}`}
                          >
                            {req.task_id.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold shrink-0 ${
                      STATUS_BADGE[req.status]
                    }`}
                  >
                    {STATUS_LABELS[req.status] || req.status}
                  </span>
                </div>

                {/* Mark as Done button — only for accepted requests that haven't been marked */}
                {req.status === "accepted" && !req.helper_marked_done && (
                  <button
                    onClick={() => handleMarkDone(req._id)}
                    disabled={markingDone === req._id}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/80 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                  >
                    <CircleCheckBig size={16} />
                    {markingDone === req._id ? "Submitting..." : "Mark as Done"}
                  </button>
                )}

                {/* Awaiting confirmation badge */}
                {req.status === "accepted" && req.helper_marked_done && req.task_id?.status !== "completed" && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/15 text-amber-400 rounded-xl text-sm font-semibold border border-amber-500/20">
                    <Loader size={14} className="animate-spin" />
                    Awaiting Owner Confirmation
                  </div>
                )}

                {/* Task completed badge */}
                {req.task_id?.status === "completed" && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-green-500/15 text-green-400 rounded-xl text-sm font-semibold border border-green-500/20">
                    <CheckCircle size={14} />
                    Task Completed
                  </div>
                )}

                {/* Task Owner */}
                {req.task_id?.createdBy && (
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <User size={14} className="text-white/30" />
                    <span>
                      Task owner:{" "}
                      <span className="font-medium text-white/70">
                        {req.task_id.createdBy.first_name}{" "}
                        {req.task_id.createdBy.last_name}
                      </span>
                    </span>
                  </div>
                )}

                {/* Your Message */}
                {req.message && (
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3.5">
                    <p className="text-xs text-white/40 mb-1.5 font-medium">
                      Your message:
                    </p>
                    <p className="text-sm text-white/60 leading-relaxed">
                      {req.message}
                    </p>
                  </div>
                )}

                {/* Timestamp & Location */}
                <div className="flex items-center gap-3 text-xs text-white/30">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>Sent {formatDateTime(req.createdAt)}</span>
                  </div>
                  {req.task_id?.location && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        <span>{req.task_id.location}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Task Image */}
              {req.task_id?.picture && (
                <div className="h-40 overflow-hidden border-t border-white/5">
                  <img
                    src={`http://localhost:5000/${req.task_id.picture}`}
                    alt={req.task_id?.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequests;