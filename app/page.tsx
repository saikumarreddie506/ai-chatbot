"use client";

import { useEffect, useRef, useState } from "react";

type Msg = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const msg = message.trim();
    if (!msg || loading) return;

    setLoading(true);
    setMessage("");

    const next: Msg[] = [...messages, { role: "user", content: msg }];
    setMessages(next);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-12) }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "No response" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
  }

  return (
    <div className="page">
      <div className="card">
        <div className="header">
          <h1>AI Chatbot</h1>
          <p>Smart conversational assistant</p>
          <button onClick={clearChat}>Clear chat</button>
        </div>

        <div className="chat">
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="inputRow">
          <input
            placeholder="Ask your question..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={loading}
          />
          <button onClick={send} disabled={loading}>
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .page {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top, #0f172a, #020617);
          color: white;
        }

        .card {
          width: 100%;
          max-width: 760px;
          height: 78vh;
          display: flex;
          flex-direction: column;
          background: #020617;
          border-radius: 18px;
          padding: 28px;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .header {
          text-align: center;
          margin-bottom: 24px;
        }

        .header h1 {
          margin: 0;
          font-size: 30px;
          font-weight: 700;
        }

        .header p {
          margin: 6px 0 14px;
          opacity: 0.7;
        }

        .header button {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
        }

        .chat {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          margin-bottom: 24px;
          border-radius: 12px;
          background: #020617;
        }

        .bubble {
          margin-bottom: 18px;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .bubble.user {
          align-self: flex-end;
          max-width: 60%;
          background: #1e293b;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          margin-left: auto;
        }

        .bubble.assistant {
          max-width: 95%;
          background: #0f172a;
          padding: 18px 20px;
          border-radius: 14px;
          font-size: 16px;
        }

        .inputRow {
          display: flex;
          gap: 12px;
        }

        .inputRow input {
          flex: 1;
          padding: 14px;
          border-radius: 12px;
          background: #020617;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          font-size: 15px;
          outline: none;
        }

        .inputRow button {
          padding: 14px 22px;
          border-radius: 12px;
          border: none;
          background: #2563eb;
          color: white;
          font-weight: 600;
          cursor: pointer;
        }

        .inputRow button:disabled {
          background: #334155;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}