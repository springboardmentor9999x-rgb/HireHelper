import { useEffect, useState } from "react";
import api from "../utils/api";
import { toast } from "react-hot-toast";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Inbox,
  Mail,
  MapPin,
  Briefcase,
} from "lucide-react";

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get("/requests/incoming");
      setRequests(res.data);
    } catch (err) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      await api.put(`/requests/${id}/accept`);
      toast.success("Request accepted!");
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to accept");
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/requests/${id}/reject`);
      toast.success("Request rejected");
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to reject");
    }
  };

  const formatDateTime = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  // Show pending requests first, then others
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const otherRequests = requests.filter((r) => r.status !== "pending");
  const sortedRequests = [...pendingRequests, ...otherRequests];

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
        <h1 className="text-3xl font-black tracking-tight">Requests</h1>
        <p className="text-white/50 text-sm mt-1">
          People who want to help with your tasks
        </p>
      </div>

      {/* Request List */}
      {sortedRequests.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <Mail size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-semibold">No requests yet</p>
          <p className="text-sm">
            Requests for your tasks will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedRequests.map((req) => (
            <div
              key={req._id}
              className="bg-[rgba(15,23,42,0.45)] backdrop-blur-xl border border-[rgba(255,255,255,0.18)] rounded-2xl p-6 hover:border-indigo-400/40 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            >
              {/* Requester Info */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {/* Avatar */}
                  {req.requester_id?.profile_picture ? (
                    <img
                      src={`http://localhost:5000/${req.requester_id.profile_picture}`}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center border-2 border-white/10 shrink-0">
                      <User size={20} className="text-indigo-300" />
                    </div>
                  )}

                  <div className="flex-1 space-y-3">
                    {/* Name */}
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">
                        {req.requester_id?.first_name}{" "}
                        {req.requester_id?.last_name}
                      </h3>
                      {req.requester_id?.is_verified && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                          Verified
                        </span>
                      )}
                    </div>

                    {/* Message */}
                    {req.message && (
                      <p className="text-white/60 text-sm leading-relaxed">
                        {req.message}
                      </p>
                    )}

                    {/* Requesting For section */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3">
                      <p className="text-xs text-white/40 mb-1">Requesting for:</p>
                      <div className="flex items-center gap-2">
                        <Briefcase size={14} className="text-indigo-400" />
                        <span className="text-sm font-semibold text-white">
                          {req.task_id?.title || "Unknown Task"}
                        </span>
                      </div>
                    </div>

                    {/* Timestamp & Location */}
                    <div className="flex items-center gap-3 text-xs text-white/30">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{formatDateTime(req.createdAt)}</span>
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
                </div>

                {/* Action Buttons — only for pending */}
                {req.status === "pending" ? (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAccept(req._id)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500/80 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
                    >
                      <CheckCircle size={16} />
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(req._id)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm font-semibold transition-all"
                    >
                      <XCircle size={16} />
                      Decline
                    </button>
                  </div>
                ) : (
                  <span
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold shrink-0 ${
                      req.status === "accepted"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {req.status === "accepted" ? "Accepted" : "Declined"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Requests;