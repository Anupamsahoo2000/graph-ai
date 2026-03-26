import { useEffect, useState, useMemo, useCallback } from "react";
import ReactFlow, { Background, Controls, useNodesState, useEdgesState, Handle, Position } from "reactflow";
import "reactflow/dist/style.css";
import axios from "axios";

// Advanced Custom Node matching the image (small crisp ringed dots)
const MinimalNode = ({ data }) => {
  const isSelected = data.isSelected;
  // Pick color based on entity type heuristically
  const getColors = () => {
    if (!data.label) return { fill: "#3b82f6", stroke: "#2563eb", ring: "#93c5fd" }; // default blue
    if (data.label.includes("Invoice") || data.label.includes("Payment")) return { fill: "#f87171", stroke: "#dc2626", ring: "#fca5a5" }; // red
    if (data.label.includes("Delivery") || data.label.includes("Product")) return { fill: "#a78bfa", stroke: "#8b5cf6", ring: "#ddd6fe" }; // purple
    return { fill: "#60a5fa", stroke: "#3b82f6", ring: "#bfdbfe" }; // light blue
  };
  const colors = getColors();

  return (
    <div className="relative group flex items-center justify-center">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      {/* The node dot */}
      <div 
        className="w-4 h-4 rounded-full z-10 transition-all duration-300 shadow-sm cursor-pointer"
        style={{ 
          backgroundColor: colors.fill, 
          border: `1px solid ${colors.stroke}`,
          boxShadow: isSelected ? `0 0 0 4px ${colors.ring}` : 'none',
          transform: isSelected ? 'scale(1.5)' : 'scale(1)'
        }} 
      />
      
      {/* Label only shows on hover tightly if user really wants to see without clicking */}
      <div className="absolute left-4 opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur border text-[9px] px-1.5 py-0.5 rounded text-gray-700 whitespace-nowrap shadow-sm pointer-events-none transition-opacity z-50">
        {data.id}
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

const nodeTypes = {
  minimal: MinimalNode,
};

// Generates a nice radial distribution around central hubs
const applyForceLayout = (nodes, edges) => {
    // Very simple clustering algorithm:
    // 1. Find root nodes (high out-degree)
    // 2. Place them dynamically around a big circle
    // 3. Place their children in smaller clusters around them
    
    const nodeMap = new Map();
    nodes.forEach(n => nodeMap.set(n.id, { ...n, children: [], degree: 0 }));
    
    edges.forEach(e => {
      if(nodeMap.has(e.source)) {
        nodeMap.get(e.source).degree += 1;
        nodeMap.get(e.source).children.push(e.target);
      }
      if(nodeMap.has(e.target)) {
        nodeMap.get(e.target).degree += 1;
      }
    });

    const rootNodes = Array.from(nodeMap.values()).sort((a,b) => b.degree - a.degree).slice(0, 15);
    const rootIds = new Set(rootNodes.map(n => n.id));

    let angle = 0;
    const radius = 800; // Large spread
    const cx = 1000;
    const cy = 1000;

    const placed = new Set();
    const finalNodes = [];

    // Place roots
    rootNodes.forEach((root) => {
        if (placed.has(root.id)) return;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        
        finalNodes.push({
            ...root,
            position: { x, y }
        });
        placed.add(root.id);

        // Place its direct satellites around it
        let childAngle = 0;
        const cRadius = Math.max(100, Math.min(300, root.degree * 10)); // cluster size
        
        root.children.forEach(childId => {
            if (placed.has(childId) || rootIds.has(childId)) return;
            const childNode = nodeMap.get(childId);
            if (!childNode) return;

            finalNodes.push({
                ...childNode,
                position: {
                    x: x + Math.cos(childAngle) * cRadius + (Math.random() * 50 - 25),
                    y: y + Math.sin(childAngle) * cRadius + (Math.random() * 50 - 25)
                }
            });
            placed.add(childId);
            childAngle += (Math.PI * 2) / root.children.length;
        });

        angle += (Math.PI * 2) / rootNodes.length;
    });

    // Place anything left randomly in the massive center
    nodeMap.forEach(n => {
        if(!placed.has(n.id)) {
            finalNodes.push({
                ...n,
                position: {
                    x: cx + (Math.random() * radius * 1.5 - radius * 0.75),
                    y: cy + (Math.random() * radius * 1.5 - radius * 0.75),
                }
            })
        }
    });

    return finalNodes;
};

const GraphView = ({ chatContextText = "" }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [overlayActive, setOverlayActive] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await axios.get(`${API_URL}/graph`);

        // Convert backend format → React Flow custom node format
        const rawNodes = res.data.nodes.map((n) => ({
          id: n.id,
          type: "minimal",
          data: { id: n.id, label: n.label, isSelected: false, raw: n },
          position: { x: 0, y: 0 },
        }));

        const rfEdges = res.data.edges.map((e, index) => ({
          id: `${e.source}-${e.target}-${index}`,
          source: e.source,
          target: e.target,
          animated: false,
          style: { stroke: "#bfdbfe", strokeWidth: 1.5, opacity: 0.6 },
        }));

        // Apply our aesthetic radial distribution
        const layedOutNodes = applyForceLayout(rawNodes, rfEdges);

        setNodes(layedOutNodes);
        setEdges(rfEdges);
      } catch (err) {
        console.error("Graph fetch error", err);
      }
    };

    fetchGraph();
  }, [setNodes, setEdges]);

  // Handle node clicking to show overlay and highlight connections
  const onNodeClick = useCallback((event, node) => {
      setSelectedNode(node);
      
      // Highlight selected node
      setNodes((nds) => nds.map((n) => {
          if (n.id === node.id) return { ...n, data: { ...n.data, isSelected: true } };
          return { ...n, data: { ...n.data, isSelected: false } };
      }));

      // Highlight edges
      setEdges((eds) => eds.map((e) => {
          if (e.source === node.id || e.target === node.id) {
              return { ...e, style: { stroke: "#3b82f6", strokeWidth: 3, opacity: 1 }, animated: true };
          }
          return { ...e, style: { stroke: "#bfdbfe", strokeWidth: 1.5, opacity: 0.2 }, animated: false };
      }));
  }, [setNodes, setEdges]);

  // Click on background removes selection
  const onPaneClick = useCallback(() => {
      setSelectedNode(null);
      setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, isSelected: false } })));
      setEdges((eds) => eds.map((e) => ({ ...e, style: { stroke: "#bfdbfe", strokeWidth: 1.5, opacity: 0.6 }, animated: false })));
  }, [setNodes, setEdges]);

  // Listen for text responses and highlight nodes referenced directly by their exact IDs
  useEffect(() => {
    if (!chatContextText || nodes.length === 0) return;
    
    // Determine which node IDs are explicitly mentioned in the text block
    const highlightedIds = new Set();
    nodes.forEach(n => {
      // The Graph ID has prefixes like "product_FACESERUM", "invoice_905041", so we strip it to get the raw db entity ID
      const rawId = n.id.replace(/^[a-z]+_/, "");

      // Check if the LLM output explicitly mentions the Primary Key or the Entity Name!
      if (rawId.length > 3 && chatContextText.includes(rawId)) {
        highlightedIds.add(n.id);
      }
      if (n.data.raw.name && n.data.raw.name.length > 3 && chatContextText.includes(n.data.raw.name)) {
        highlightedIds.add(n.id);
      }
    });

    if (highlightedIds.size === 0) return;

    setNodes((nds) => nds.map((n) => {
      if (highlightedIds.has(n.id)) {
        return { ...n, data: { ...n.data, isSelected: true } };
      }
      return { ...n, data: { ...n.data, isSelected: false } };
    }));
    
    setEdges((eds) => eds.map((e) => {
      if (highlightedIds.has(e.source) || highlightedIds.has(e.target)) {
        return { ...e, style: { stroke: "#3b82f6", strokeWidth: 3, opacity: 1 }, animated: true };
      }
      return { ...e, style: { stroke: "#bfdbfe", strokeWidth: 1.5, opacity: 0.2 }, animated: false };
    }));
  }, [chatContextText]);

  return (
    <div className="w-full h-full relative" style={{ backgroundColor: "#fafafa" }}>
      


      {/* Floating Meta Overlay */}
      {selectedNode && overlayActive && (
        <div className="absolute top-20 left-1/4 z-50 bg-white border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-6 w-72 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-200">
          <h3 className="font-semibold text-gray-900 mb-4">{selectedNode.data.label}</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex flex-col">
              <span className="text-gray-400 font-medium text-[10px] uppercase tracking-wide">Entity ID</span>
              <span className="font-mono mt-0.5 text-gray-800">{selectedNode.data.id}</span>
            </div>
            
            {/* Compute degrees live for the overlay */}
            <div className="flex flex-col pt-2 border-t mt-2">
              <span className="text-gray-400 font-medium text-[10px] uppercase tracking-wide">Connections</span>
              <span className="mt-0.5 font-semibold text-gray-800">
                {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length} links
              </span>
            </div>
            <p className="pt-2 text-[10px] italic text-gray-400">Additional metadata hidden for readability</p>
          </div>
        </div>
      )}

      {/* React Flow Canvas */}
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        minZoom={0.05}
        maxZoom={3}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="[&_.react-flow__background]:bg-transparent"
      >
        <Background color="#ccc" gap={20} size={1} />
        <Controls showInteractive={false} className="bg-white shadow-md border rounded-lg overflow-hidden [&>button]:border-b [&>button]:border-gray-100 [&>button]:hover:bg-gray-50" />
      </ReactFlow>
    </div>
  );
};

export default GraphView;
