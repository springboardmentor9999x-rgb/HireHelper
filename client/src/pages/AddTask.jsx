import { useState } from "react";
import api from "../utils/api";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  FileText,
  MapPin,
  Clock,
  Image,
  Tag,
  CheckCircle,
} from "lucide-react";

const CATEGORIES = [
  "General",
  "Delivery",
  "Cleaning",
  "Tutoring",
  "Tech Help",
  "Moving",
  "Errands",
  "Pet Care",
  "Cooking",
  "Other",
];

const AddTask = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "General",
    location: "",
    startTime: "",
    endTime: "",
  });
  const [picture, setPicture] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPicture(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    for (let key in formData) {
      data.append(key, formData[key]);
    }
    if (picture) {
      data.append("picture", picture);
    }

    try {
      await api.post("/tasks", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Task created successfully!");
      navigate("/dashboard/mytasks");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <Plus size={28} className="text-indigo-400" />
          Create New Task
        </h1>
        <p className="text-white/50 text-sm mt-1">
          Post a task and get help from the community
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[rgba(15,23,42,0.45)] backdrop-blur-xl border border-[rgba(255,255,255,0.18)] rounded-2xl p-6 space-y-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-white/70 flex items-center gap-2">
            <FileText size={14} /> Title <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="What do you need help with?"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 outline-none focus:border-indigo-400/50 transition-all"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-white/70 flex items-center gap-2">
            <FileText size={14} /> Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the task in detail..."
            required
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 outline-none focus:border-indigo-400/50 transition-all resize-none"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-white/70 flex items-center gap-2">
            <Tag size={14} /> Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-400/50 transition-all"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-gray-900">
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-white/70 flex items-center gap-2">
            <MapPin size={14} /> Location <span className="text-red-500">*</span>
          </label>
          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Where is this task?"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 outline-none focus:border-indigo-400/50 transition-all"
          />
        </div>

        {/* Date/Time Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/70 flex items-center gap-2">
              <Clock size={14} /> Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-400/50 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/70 flex items-center gap-2">
              <Clock size={14} /> End Time
            </label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-400/50 transition-all"
            />
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-white/70 flex items-center gap-2">
            <Image size={14} /> Task Image (optional)
          </label>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white/50 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-500/20 file:text-indigo-300 file:text-sm file:font-semibold file:cursor-pointer"
            />
          </div>
          {preview && (
            <div className="mt-2 rounded-xl overflow-hidden border border-white/10">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-40 object-cover"
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
        >
          <CheckCircle size={18} />
          {loading ? "Creating..." : "Create Task"}
        </button>
      </form>
    </div>
  );
};

export default AddTask;