import { useEffect, useState } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import axios from "axios";

const GraphView = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    const fetchGraph = async () => {
      const res = await axios.get("http://localhost:5000/graph");

      // Convert backend format → React Flow format
      const rfNodes = res.data.nodes.map((n, index) => ({
        id: n.id,
        data: { label: n.label },
        position: {
          x: Math.random() * 500,
          y: Math.random() * 500,
        },
      }));

      const rfEdges = res.data.edges.map((e, index) => ({
        id: `${e.source}-${e.target}-${index}`,
        source: e.source,
        target: e.target,
        label: e.label,
      }));

      setNodes(rfNodes);
      setEdges(rfEdges);
    };

    fetchGraph();
  }, []);

  return (
    <div className="w-full h-full bg-gray-100">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default GraphView;
