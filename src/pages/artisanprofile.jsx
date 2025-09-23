import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../state/AuthContext.jsx";
import { useToast } from "../ui/ToastProvider.jsx";
import { API_BASE_URL } from "../config";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { show } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        show("Avatar file size must be less than 5MB", "error");
        return;
      }
      setAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      show("Name is required", "error");
      return;
    }
    if (!email.trim()) {
      show("Email is required", "error");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("cc_token") || localStorage.getItem("token");
      
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      if (avatar) {
        formData.append("avatar", avatar);
      }
      
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");
      
      updateUser(data.user);
      setAvatar(null);
      show("Profile updated successfully!", "success");
    } catch (err) {
      show(err.message || "Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="p-6 max-w-xl">
        <div className="text-center py-8">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      <div className="bg-white shadow-md rounded-xl p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {name ? name.charAt(0).toUpperCase() : user.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-1 hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{name || user.name || "Artisan"}</h2>
            <p className="text-gray-500">Handicraft Artisan</p>
            <p className="text-xs text-gray-400 mt-1">Click + to change avatar</p>
          </div>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}