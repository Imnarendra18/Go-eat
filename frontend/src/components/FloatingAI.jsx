import { useState } from "react";
import { Bot, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/api";
import { messageFromError } from "../utils/app";

export default function FloatingAI() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setReply("");
    try {
      const { data } = await api.post("/api/ai/chat", { message });
      setReply(data.aiReply || "No reply returned.");
    } catch (error) {
      toast.error(messageFromError(error, "AI service is not available"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="floatingAi">
      {open && (
        <section className="floatingAiPanel">
          <div className="between">
            <div>
              <span className="badge">GoEat AI</span>
              <h2>Food assistant</h2>
            </div>
            <button className="iconBtn" onClick={() => setOpen(false)} title="Close AI">
              <X size={18} />
            </button>
          </div>
          <form className="floatingAiForm" onSubmit={submit}>
            <input
              placeholder="Ask for dishes, orders, refunds..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
            />
            <button className="roundBtn" disabled={loading} title="Send">
              <Send size={17} />
            </button>
          </form>
          {reply && <div className="aiReply compactReply">{reply}</div>}
        </section>
      )}
      <button className="floatingAiButton" onClick={() => setOpen((value) => !value)} title="Open GoEat AI">
        <Bot size={24} />
      </button>
    </div>
  );
}
