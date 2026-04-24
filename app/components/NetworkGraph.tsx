'use client';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  NodeTypes,
  Handle,
  Position,
  NodeProps,
  BackgroundVariant,
  NodeDragHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Person, Meeting } from '@/lib/types';
import { useCallback, useEffect, useMemo } from 'react';

// ── Custom node ──────────────────────────────────────────────────────────────

function PersonNode({ data, selected }: NodeProps) {
  const initials = data.name
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={`rounded-2xl shadow-lg border-2 transition-all duration-150 cursor-pointer select-none ${
        selected
          ? 'border-indigo-500 shadow-indigo-200 shadow-xl scale-105'
          : 'border-white hover:border-indigo-300 hover:shadow-xl'
      }`}
      style={{ minWidth: 140, background: 'white' }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <span className="text-indigo-700 font-bold text-xs">{initials}</span>
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 text-sm leading-tight truncate">{data.name}</div>
          {data.company && (
            <div className="text-xs text-gray-400 truncate mt-0.5">{data.company}</div>
          )}
          {data.meetingCount > 0 && (
            <div className="text-xs text-indigo-500 mt-0.5">{data.meetingCount} meeting{data.meetingCount > 1 ? 's' : ''}</div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}

const nodeTypes: NodeTypes = { person: PersonNode };

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitialPosition(index: number, total: number) {
  if (total <= 1) return { x: 400, y: 300 };
  const radius = Math.max(200, total * 60);
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    x: 400 + radius * Math.cos(angle),
    y: 300 + radius * Math.sin(angle),
  };
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  people: Person[];
  meetings: Meeting[];
  highlightedId: string | null;
  selectedId: string | null;
  onSelectPerson: (id: string) => void;
  onNodePositionChange: (id: string, x: number, y: number) => void;
}

export default function NetworkGraph({
  people,
  meetings,
  highlightedId,
  selectedId,
  onSelectPerson,
  onNodePositionChange,
}: Props) {
  const meetingCountById = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of meetings) counts[m.personId] = (counts[m.personId] ?? 0) + 1;
    return counts;
  }, [meetings]);

  const initialNodes: Node[] = useMemo(
    () =>
      people.map((p, i) => ({
        id: p.id,
        type: 'person',
        position: {
          x: p.x ?? getInitialPosition(i, people.length).x,
          y: p.y ?? getInitialPosition(i, people.length).y,
        },
        data: {
          name: p.name,
          company: p.company,
          meetingCount: meetingCountById[p.id] ?? 0,
        },
        selected: p.id === selectedId,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [people, meetingCountById]
  );

  const initialEdges: Edge[] = useMemo(() => {
    const seen = new Set<string>();
    const edges: Edge[] = [];
    for (const p of people) {
      for (const connId of p.connections) {
        const key = [p.id, connId].sort().join('__');
        if (!seen.has(key) && people.find(x => x.id === connId)) {
          seen.add(key);
          edges.push({
            id: key,
            source: p.id,
            target: connId,
            style: { stroke: '#c7d2fe', strokeWidth: 2 },
            animated: false,
          });
        }
      }
    }
    return edges;
  }, [people]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Sync external changes (new people, selections)
  useEffect(() => {
    setNodes(
      people.map((p, i) => ({
        id: p.id,
        type: 'person',
        position: {
          x: p.x ?? getInitialPosition(i, people.length).x,
          y: p.y ?? getInitialPosition(i, people.length).y,
        },
        data: {
          name: p.name,
          company: p.company,
          meetingCount: meetingCountById[p.id] ?? 0,
        },
        selected: p.id === selectedId,
      }))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people, selectedId, meetingCountById]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => onSelectPerson(node.id),
    [onSelectPerson]
  );

  const onNodeDragStop: NodeDragHandler = useCallback(
    (_, node) => onNodePositionChange(node.id, node.position.x, node.position.y),
    [onNodePositionChange]
  );

  const highlightedNode = nodes.find(n => n.id === highlightedId);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#e2e8f0" />
        <Controls className="!shadow-lg !rounded-xl !border-slate-200" />
        <MiniMap
          nodeColor={() => '#6366f1'}
          maskColor="rgba(248,250,252,0.8)"
          className="!rounded-xl !shadow-lg !border !border-slate-200"
        />
      </ReactFlow>

      {people.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-4xl mb-3">🌐</div>
            <p className="text-slate-400 font-medium">Your network is empty</p>
            <p className="text-slate-300 text-sm mt-1">Add your first person to get started</p>
          </div>
        </div>
      )}

      {/* Pan to highlighted node */}
      {highlightedNode && (
        <div className="hidden">{highlightedNode.id}</div>
      )}
    </div>
  );
}
