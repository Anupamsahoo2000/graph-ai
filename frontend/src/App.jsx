import GraphView from "./components/GraphView";
import ChatBox from "./components/ChatBox";

function App() {
  return (
    <div className="flex h-screen">
      {/* LEFT: GRAPH */}
      <div className="w-2/3 border-r">
        <GraphView />
      </div>

      {/* RIGHT: CHAT */}
      <div className="w-1/3">
        <ChatBox />
      </div>
    </div>
  );
}

export default App;
