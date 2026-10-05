import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/api";
import { getUser, messageFromError } from "../utils/app";

export default function AIChat() {
  const user = getUser();
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [mode, setMode] = useState("chat");
  const [foodOptions, setFoodOptions] = useState({ budget: "", category: "", vegOnly: false });
  const [loading, setLoading] = useState(false);

  const buildPayload = async () => {
    if (mode === "recommend-food") {
      return {
        budget: foodOptions.budget ? Number(foodOptions.budget) : undefined,
        category: foodOptions.category || undefined,
        vegOnly: foodOptions.vegOnly,
      };
    }

    if (mode === "hotel-assistant") {
      const { data } = await api.get("/api/hotels");
      const ownerId = user?.userId || user?._id;
      const hotel = (data.hotels || []).find((item) => item.ownerId === ownerId);
      return { message, hotelName: hotel?.hotelName, hotelData: hotel };
    }

    if (mode === "admin-assistant") {
      return { message };
    }

    return { message };
  };

  const submit = async (event) => {
    event.preventDefault();
    setReply("");
    setLoading(true);
    try {
      const payload = await buildPayload();
      const { data } = await api.post(`/api/ai/${mode}`, payload);
      if (mode === "recommend-food" && data.recommendedFoods?.length) {
        const names = data.recommendedFoods.map((food) => food.name || food.foodName).filter(Boolean).join(", ");
        setReply(`${data.aiReply || "Recommended foods ready."}\n\nFoods: ${names}`);
      } else {
        setReply(data.aiReply || "No reply returned.");
      }
    } catch (error) {
      toast.error(messageFromError(error, "AI service is not available"));
    } finally {
      setLoading(false);
    }
  };

  const ingestDocs = async () => {
    try {
      await api.post("/api/ai/ingest");
      toast.success("Support documents ingested");
    } catch (error) {
      toast.error(messageFromError(error, "Could not ingest support documents"));
    }
  };

  return (
    <main className="page">
      <section className="chatPanel">
        <span className="badge">GoEat AI</span>
        <h1>Ask about food, orders, or support</h1>
        <form className="chatForm" onSubmit={submit}>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="chat">General</option>
            <option value="rag-chat">Support RAG</option>
            <option value="recommend-food">Food recommendation</option>
            <option value="hotel-assistant">Hotel assistant</option>
            <option value="admin-assistant">Admin assistant</option>
          </select>
          <input placeholder="What should I eat under Rs 300?" value={message} onChange={(e) => setMessage(e.target.value)} required={mode !== "recommend-food"} />
          <button className="btn" disabled={loading}>{loading ? "Asking..." : "Ask"}</button>
        </form>
        {mode === "rag-chat" && <button className="btn ghost mt" onClick={ingestDocs}>Ingest support docs</button>}
        {mode === "recommend-food" && (
          <div className="filterBar compact">
            <input placeholder="Budget" value={foodOptions.budget} onChange={(event) => setFoodOptions({ ...foodOptions, budget: event.target.value })} />
            <input placeholder="Category" value={foodOptions.category} onChange={(event) => setFoodOptions({ ...foodOptions, category: event.target.value })} />
            <select value={foodOptions.vegOnly ? "true" : "false"} onChange={(event) => setFoodOptions({ ...foodOptions, vegOnly: event.target.value === "true" })}>
              <option value="false">All foods</option>
              <option value="true">Veg only</option>
            </select>
          </div>
        )}
        {reply && <div className="aiReply">{reply}</div>}
      </section>
    </main>
  );
}
