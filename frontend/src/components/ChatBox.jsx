import { useState } from "react";
import axios from "axios";

const ChatBox = () => {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);

  const sendQuery = async () => {
    if (!question) return;

    const res = await axios.post("http://localhost:5000/query", {
      question,
    });

    setMessages([
      ...messages,
      { role: "user", text: question },
      { role: "bot", text: res.data.answer },
    ]);

    setQuestion("");
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-2 ${
              msg.role === "user" ? "text-right" : "text-left"
            }`}
          >
            <span className="bg-gray-200 px-3 py-1 rounded">{msg.text}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="border p-2 flex-1"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about orders, invoices..."
        />
        <button onClick={sendQuery} className="bg-blue-500 text-white px-4">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
