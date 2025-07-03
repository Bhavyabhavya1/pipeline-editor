import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [];
const initialEdges = [];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [status, setStatus] = useState('');

  const isValidConnection = ({ source, target }) => {
    if (source === target) return false; // no self-loop
    const from = nodes.find(n => n.id === source);
    const to = nodes.find(n => n.id === target);
    return from && to;
  };

  const onConnect = useCallback(
    (params) => {
      if (isValidConnection(params)) {
        setEdges((eds) =>
          addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds)
        );
      }
    },
    [nodes, setEdges]
  );

  const addNode = () => {
    const label = prompt("Enter node label");
    if (!label) return;
    const id = `${+new Date()}`;
    const newNode = {
      id,
      data: { label },
      position: { x: Math.random() * 400, y: Math.random() * 300 },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
  }, [setNodes, setEdges]);

  useEffect(() => {
    const keyDown = (e) => {
      if (e.key === 'Delete') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', keyDown);
    return () => window.removeEventListener('keydown', keyDown);
  }, [handleDelete]);

  const validateDAG = () => {
    if (nodes.length < 2) return 'Invalid: Need at least 2 nodes';

    const adj = {};
    nodes.forEach((n) => (adj[n.id] = []));
    edges.forEach((e) => {
      adj[e.source].push(e.target);
      if (e.source === e.target) return 'Invalid: Self-loop';
    });

    let visited = {};
    let recStack = {};

    const hasCycle = (node) => {
      visited[node] = true;
      recStack[node] = true;

      for (let neighbor of adj[node]) {
        if (!visited[neighbor] && hasCycle(neighbor)) return true;
        else if (recStack[neighbor]) return true;
      }
      recStack[node] = false;
      return false;
    };

    for (let node of nodes) {
      if (!visited[node.id] && hasCycle(node.id)) {
        return 'Invalid: Cycle detected';
      }
    }

    const nodeIds = new Set(nodes.map((n) => n.id));
    const connectedIds = new Set();
    edges.forEach((e) => {
      connectedIds.add(e.source);
      connectedIds.add(e.target);
    });

    for (let id of nodeIds) {
      if (!connectedIds.has(id)) {
        return 'Invalid: All nodes must be connected';
      }
    }

    return 'Valid DAG';
  };

  useEffect(() => {
    setStatus(validateDAG());
  }, [nodes, edges]);

  return (
    <div style={{ height: '100vh' }}>
      <button onClick={addNode} style={{ position: 'absolute', zIndex: 10 }}>
        Add Node
      </button>
      <div style={{ position: 'absolute', top: 40, zIndex: 10, background: '#fff', padding: 8 }}>
        Status: <strong>{status}</strong>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
      <div style={{ position: 'absolute', bottom: 0, zIndex: 10, background: '#fff', padding: 8, width: '100%' }}>
        <h4>Graph JSON:</h4>
        <pre style={{ maxHeight: 200, overflowY: 'scroll' }}>{JSON.stringify({ nodes, edges }, null, 2)}</pre>
      </div>
    </div>
  );
}

export default App;
