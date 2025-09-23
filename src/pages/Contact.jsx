import React, { useState } from "react";
import { useToast } from "../ui/ToastProvider.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import { API_BASE_URL } from "../config";

export default function Contact() {
  const { show } = useToast();
  const { isAuthenticated } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      show("Please enter your name.", "error");
      return;
    }
    if (!message.trim()) {
      show("Please enter a message.", "error");
      return;
    }
    try {
      setSending(true);
      
      // Try authenticated request first, then fallback to public contact
      let res;
      const token = localStorage.getItem("cc_token");
      
      if (isAuthenticated && token) {
        res = await fetch(`${API_BASE_URL}/api/auth/contact`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ subject: `Contact from ${name}`, message }),
        });
      } else {
        // Public contact endpoint
        res = await fetch(`${API_BASE_URL}/api/contact/public`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            name: name.trim(), 
            email: email.trim() || "no-email@provided.com", 
            subject: `Public Contact from ${name}`, 
            message 
          }),
        });
      }
      
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to send");
      setName(""); setEmail(""); setMessage("");
      show("Message sent to admin!", "success");
    } catch (err) {
      show(String(err.message || err), "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact us</h1>
          <p className="mt-2 text-gray-600">We'd love to hear from you. Send questions or feedback.</p>

          <div className="mt-6 rounded-xl border border-gray-200 bg-white/70 backdrop-blur p-6 shadow-sm">
            <form className="space-y-4" onSubmit={onSubmit}>
              <input className="w-full px-4 py-2 border rounded-lg" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="w-full px-4 py-2 border rounded-lg" placeholder="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <textarea className="w-full px-4 py-2 border rounded-lg min-h-32" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
              <button disabled={sending} className="w-full px-4 py-2 rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60">
                {sending ? "Sending..." : "Send message"}
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white/70 backdrop-blur p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900">Support</h2>
          <div className="mt-3 text-sm text-gray-600 space-y-2">
            <p>Email: support@craftconnect.app</p>
            <p>Phone: +91-00000-00000</p>
            <p>Hours: Mon–Fri 9:00–18:00 IST</p>
          </div>
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900">Head Office</h3>
            <p className="mt-2 text-sm text-gray-600">123 Artisan Street, Jaipur, Rajasthan, India</p>
          </div>
        </div>
      </div>
    </main>
  );
}


