import { useState, useRef, useEffect } from "react";
import axios from "axios";

// Modern chat component
const ChatBox = ({ onBotResponse }) => {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I can help you analyze the Order to Cash process.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);

  // Auto scroll and trigger highlight updates when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    
    // Pass the entire aggregated text to the Graph to dynamically detect node matches
    if (onBotResponse) {
      const allText = messages.map(m => m.text).join(" ");
      onBotResponse(allText);
    }
  }, [messages, isLoading, onBotResponse]);

  const sendQuery = async (e) => {
    e?.preventDefault();
    if (!question.trim() || isLoading) return;

    const userMessage = question;
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setQuestion("");
    setIsLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/query", {
        question: userMessage,
      });

      setMessages((prev) => [
        ...prev,
        { role: "bot", text: res.data.answer },
      ]);
    } catch (error) {
       console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "I encountered an error trying to process your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col pt-4">
      {/* Sidebar Header */}
      <div className="px-6 pb-4 border-b">
        <h2 className="text-gray-900 font-semibold mb-0.5 tracking-tight">Chat with Graph</h2>
        <p className="text-xs text-gray-500">Order to Cash</p>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "bot" && (
              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center shrink-0 mr-3 mt-1 shadow-sm">
                <span className="text-white text-xs font-bold leading-none">D</span>
              </div>
            )}

            <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {msg.role === "user" ? (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-700">You</span>
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                  </div>
                </div>
              ) : (
                <div className="mb-1">
                  <span className="text-xs font-medium text-gray-900">Dodge AI</span>
                  <p className="text-[10px] text-gray-400 leading-none">Graph Agent</p>
                </div>
              )}

              <div
                className={`py-2.5 px-3.5 rounded-2xl max-w-[280px] break-words text-[13px] leading-relaxed transition-all ${
                  msg.role === "user"
                    ? "bg-gray-900 text-white rounded-tr-sm shadow-md"
                    : "bg-transparent text-gray-800"
                }`}
              >
                {/* Basic markdown parsing for bold text */}
                {msg.text.split(/\\*\\*(.*?)\\*\\*/g).map((part, index) =>
                  index % 2 === 1 ? <strong key={index} className="font-semibold text-gray-950">{part}</strong> : part
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center shrink-0 shadow-sm opacity-50">
                <span className="text-white text-xs font-bold leading-none">D</span>
              </div>
             <div className="flex gap-1 bg-gray-100 p-3 rounded-2xl rounded-tl-sm">
               <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
               <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
               <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
             </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-gray-50/50">
        <div className="bg-white border rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-gray-200 transition-shadow overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50/80 border-b">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]"></span>
            <span className="text-[11px] text-gray-500 font-medium">Dodge AI is awaiting instructions</span>
          </div>
          <form className="flex bg-white" onSubmit={sendQuery}>
            <input
              className="flex-1 bg-transparent p-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
              placeholder="Analyze anything"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isLoading}
            />
            <div className="p-2">
              <button
                type="submit"
                disabled={!question.trim() || isLoading}
                className="bg-gray-500 hover:bg-gray-600 disabled:opacity-50 disabled:hover:bg-gray-500 text-white text-sm font-medium py-1.5 px-4 rounded-lg transition-colors cursor-pointer"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
