import { useState } from "react";
import GraphView from "./components/GraphView";
import ChatBox from "./components/ChatBox";

function App() {
  const [chatContextText, setChatContextText] = useState("");

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50 font-sans overflow-hidden text-sm">
      {/* Main Dashboard Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Side: Graph Canvas */}
        <main className="flex-1 relative bg-white m-4 rounded-xl border shadow-sm flex flex-col overflow-hidden">
            <GraphView chatContextText={chatContextText} />
        </main>

        {/* Right Side: Chat Sidebar */}
        <aside className="w-[400px] bg-white border-l flex flex-col shrink-0 z-10 shadow-[-4px_0_15px_rgba(0,0,0,0.02)]">
          <ChatBox onBotResponse={setChatContextText} />
        </aside>
        
      </div>
    </div>
  );
}

export default App;
