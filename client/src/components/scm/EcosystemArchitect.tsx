import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap, 
  Connection, 
  Edge, 
  Node, 
  Panel,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Handle,
  Position
} from 'reactflow';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import 'reactflow/dist/style.css';
import { 
  Users2, 
  Network, 
  Box, 
  ShieldCheck, 
  Plus, 
  Save, 
  Trash2, 
  Search, 
  Zap,
  ChevronRight,
  Info,
  Layers,
  Factory,
  Truck,
  Building2,
  Store,
  User,
  Crown,
  ShoppingCart,
  Database,
  Briefcase
} from 'lucide-react';
import { api, type DirectoryCompany, type SupplyChainNetwork } from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { useToast } from '../common/Toast';
import { cn } from '../../lib/utils';
import BlockchainVisualizer from '../blockchain/BlockchainVisualizer';

// --- Custom Node Components ---

const ROLE_ICONS: Record<string, any> = {
  "super_admin": Crown,
  "raw_material_manufacturer": Factory,
  "distributor": Truck,
  "final_product_manufacturer": Database,
  "retailer": Store,
  "consumer": User
};

const ROLE_COLORS: Record<string, string> = {
  "super_admin": "indigo",
  "raw_material_manufacturer": "emerald",
  "distributor": "amber",
  "final_product_manufacturer": "rose",
  "retailer": "blue",
  "consumer": "slate"
};

const PartnerNode = ({ data }: { data: any }) => {
  const Icon = ROLE_ICONS[data.role] || Building2;
  const color = ROLE_COLORS[data.role] || "slate";

  return (
    <div className={cn(
      "group relative min-w-[220px] rounded-[24px] border-2 bg-white p-5 shadow-2xl transition-all hover:scale-105 dark:bg-slate-900",
      `border-${color}-500/30`
    )}>
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !bg-slate-300 dark:!bg-slate-700 !border-2 !border-white dark:!border-slate-900" />
      
      <div className="flex items-center gap-4">
        <div className={cn(
          "grid h-12 w-12 place-items-center rounded-2xl shadow-inner",
          `bg-${color}-500/10 text-${color}-600`
        )}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">{data.label}</h4>
          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 italic">{data.role?.replace(/_/g, ' ') || 'Partner'}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-50 dark:border-slate-800 pt-3">
        <Badge variant={data.domain === 'agriculture' ? 'success' : 'info' as any} className="text-[8px] px-2 py-0 uppercase font-black">
          {data.domain}
        </Badge>
        {data.country && (
          <Badge variant="info" className="text-[8px] px-2 py-0 bg-slate-50 border-slate-200 text-slate-500 uppercase font-black">
            {data.country}
          </Badge>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !bg-slate-300 dark:!bg-slate-700 !border-2 !border-white dark:!border-slate-900" />
    </div>
  );
};

const nodeTypes = {
  partner: PartnerNode,
};

// --- Main Architect Component ---

export default function EcosystemArchitect() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [companies, setCompanies] = useState<DirectoryCompany[]>([]);
  const [networks, setNetworks] = useState<SupplyChainNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<SupplyChainNetwork | null>(null);
  const [activeTab, setActiveTab] = useState<'partners' | 'networks' | 'blueprints'>('partners');
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [currentDeployments, setCurrentDeployments] = useState<any[]>([]);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    tl.from(".architect-sidebar", {
      x: -30,
      opacity: 0,
      duration: 1,
      ease: "power4.out"
    });

    tl.from(".architect-canvas", {
      opacity: 0,
      scale: 0.98,
      duration: 1.2,
      ease: "power3.out"
    }, "-=0.6");

    tl.from(".network-item", {
       opacity: 0,
       y: 15,
       stagger: 0.08,
       duration: 0.6,
       ease: "power2.out"
    }, "-=1");
  }, { scope: containerRef });

  // Load Initial Data
  useEffect(() => {
    async function init() {
      try {
        const [dir, nets] = await Promise.all([
          api.listB2bDirectory(),
          api.listSupplyChainNetworks()
        ]);
        setCompanies(dir);
        setNetworks(nets);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ 
      ...params, 
      animated: true, 
      style: { strokeWidth: 3, stroke: '#6366f1', filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))' },
      className: 'edge-animate'
    }, eds)),
    [setEdges]
  );

  const onDragStart = (event: React.DragEvent, nodeData: any, role: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ ...nodeData, role }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const dataStr = event.dataTransfer.getData('application/reactflow');
      if (!dataStr) return;
      
      const payload = JSON.parse(dataStr);
      const position = { x: event.clientX - 500, y: event.clientY - 200 };

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'partner',
        position,
        data: { 
          label: payload.company_name, 
          domain: payload.domain,
          country: payload.country,
          role: payload.role,
          companyId: payload.id
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleApprove = async () => {
    if (!selectedNetwork) return;
    
    try {
      const result = await api.approveNetwork(selectedNetwork.id);
      toast(result.message, result.status === 'active' ? 'success' : 'info');
      
      if (result.status === 'active') {
        setCurrentDeployments([{
           source: 'Governance Authority',
           target: selectedNetwork.name,
           txHash: result.blockchainAddress || '0xDeploying...'
        }]);
        setIsVisualizerOpen(true);
      }

      const nets = await api.listSupplyChainNetworks();
      setNetworks(nets);
      setSelectedNetwork(nets.find(n => n.id === selectedNetwork.id) || null);
    } catch (e: any) {
      toast(e.message || "Approval failed", "error");
    }
  };

  const handleDeploy = async () => {
    if (nodes.length === 0) {
      toast("Add at least one node to deploy.", "error");
      return;
    }

    if (!selectedNetwork || selectedNetwork.status !== 'active') {
      toast("Select an active, approved network to deploy.", "error");
      return;
    }
    
    toast("Packaging supply chain nodes for Blockchain deployment...", "info");
    
    try {
      const result = await api.deployNetwork(selectedNetwork.id, { nodes, edges });
      if (result.deployments.length > 0) {
        setCurrentDeployments(result.deployments);
        setIsVisualizerOpen(true);
        toast(`Success! Anchored ${result.deployments.length} relationships to Ganache.`, "success");
      } else {
        toast("Visual model validated. No new links to anchor.", "info");
      }
    } catch (e: any) {
      toast(e.message || "Blockchain deployment failed", "error");
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div ref={containerRef} className="mt-6 flex h-[800px] gap-6 overflow-hidden rounded-[40px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      <BlockchainVisualizer 
        isVisible={isVisualizerOpen} 
        onClose={() => setIsVisualizerOpen(false)} 
        deployments={currentDeployments} 
      />
      
      {/* Sidebar: Resources */}
      <div className="architect-sidebar flex w-88 flex-col border-r border-slate-100 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="p-8 pb-4">
           <div className="flex items-center gap-3 mb-6">
             <div className="h-10 w-10 rounded-2xl bg-indigo-500 grid place-items-center text-white shadow-lg shadow-indigo-500/20">
               <Layers className="h-5 w-5" />
             </div>
             <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Architect Toolkit</h3>
           </div>
           
           <div className="flex gap-1.5 mb-6 bg-slate-200/50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200/50 dark:border-white/5">
             {(['partners', 'networks', 'blueprints'] as const).map(tab => (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={cn(
                   "flex-1 py-2 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all",
                   activeTab === tab ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-md scale-[1.02]" : "text-slate-500 hover:text-slate-800"
                 )}
               >
                 {tab}
               </button>
             ))}
           </div>

           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Registry query..."
               className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
             />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
          <div className="space-y-4">
             {activeTab === 'partners' && (
               <div className="space-y-6">
                  {Object.entries(ROLE_ICONS).map(([role, icon]) => (
                     <div key={role} className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic flex items-center gap-2">
                           <div className="h-1 w-4 bg-indigo-500/20 rounded-full" />
                           {role.replace(/_/g, ' ')}s
                        </p>
                        <div className="grid gap-3">
                           {filteredCompanies.slice(0, 3).map(company => (
                              <div
                                key={`${role}-${company.id}`}
                                draggable
                                onDragStart={(e) => onDragStart(e, company, role)}
                                className="network-item cursor-grab active:cursor-grabbing group flex items-center justify-between p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-[22px] hover:border-indigo-500/50 hover:shadow-xl transition-all"
                              >
                                <div className="flex items-center gap-4">
                                  <div className={cn(
                                     "h-10 w-10 rounded-xl grid place-items-center transition-colors group-hover:scale-110",
                                     `bg-${ROLE_COLORS[role]}-500/10 text-${ROLE_COLORS[role]}-600`
                                  )}>
                                     {React.createElement(icon, { size: 18 })}
                                  </div>
                                  <div>
                                    <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">{company.company_name}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">{company.domain}</p>
                                  </div>
                                </div>
                                <Plus size={14} className="text-slate-200 group-hover:text-indigo-500" />
                              </div>
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
             )}

             {activeTab === 'networks' && networks.map(net => (
               <div 
                 key={net.id} 
                 onClick={() => setSelectedNetwork(net)}
                 className={cn(
                   "cursor-pointer group p-5 border-2 rounded-[28px] transition-all shadow-sm mb-4",
                   selectedNetwork?.id === net.id 
                     ? "bg-indigo-500/5 border-indigo-500 shadow-indigo-500/10" 
                     : "bg-white dark:bg-slate-950 border-slate-100 dark:border-white/5 hover:border-indigo-500/30"
                 )}
               >
                 <div className="flex items-center justify-between mb-3">
                   <p className="text-sm font-black text-slate-900 dark:text-white truncate">{net.name}</p>
                   {net.status === 'active' ? (
                     <div className="h-6 w-6 rounded-lg bg-emerald-500/10 grid place-items-center text-emerald-500">
                        <ShieldCheck size={14} />
                     </div>
                   ) : (
                     <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                   )}
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">
                     {net.status === 'active' ? 'Ledger Active' : 'Governance Phase'}
                   </p>
                   <Badge variant={net.status === 'active' ? 'success' : 'warning' as any} className="text-[9px] px-2 py-0.5 font-black uppercase tracking-tighter">
                     {net.governance_approvals?.length || 0}/2 SIGNED
                   </Badge>
                 </div>

                 {selectedNetwork?.id === net.id && net.status === 'pending_approval' && (
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       void handleApprove();
                     }}
                     className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-[0.15em] rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-500/20"
                   >
                     Authorize Broadcast
                   </button>
                 )}
               </div>
             ))}

             {activeTab === 'blueprints' && (
               <div className="space-y-4">
                  {[
                    { label: "Vertical Pharma Chain", nodes: 6, mode: "Standard" },
                    { label: "Agriculture Hub", nodes: 4, mode: "Cross-Border" },
                    { label: "E-Commerce Fulfillment", nodes: 7, mode: "Hyper-Local" }
                  ].map((bp, i) => (
                    <div key={i} className="group p-5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-[28px] opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                       <div className="flex justify-between items-start mb-3">
                          <p className="text-xs font-black text-slate-900 dark:text-white">{bp.label}</p>
                          <Badge className="bg-slate-100 text-slate-400 border-none text-[8px] font-black">{bp.mode}</Badge>
                       </div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{bp.nodes} System Nodes</p>
                    </div>
                  ))}
               </div>
             )}
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl">
           <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             Cross-Chain Registry Active
           </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="architect-canvas relative flex-1 bg-slate-50 dark:bg-slate-950">
        <ReactFlowProvider>
          <div className="h-full w-full" onDrop={onDrop} onDragOver={onDragOver}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              defaultEdgeOptions={{
                 animated: true,
                 style: { strokeWidth: 3, stroke: '#6366f1' }
              }}
            >
              <Background color="#cbd5e1" gap={24} size={1} />
              <Controls className="!bg-white dark:!bg-slate-900 !border-none !shadow-2xl !rounded-2xl overflow-hidden !m-6" />
              <MiniMap 
                nodeStrokeColor={(n) => n.type === 'partner' ? '#6366f1' : '#ccc'}
                nodeColor={(n) => n.type === 'partner' ? '#6366f1' : '#fff'}
                maskColor="rgba(241, 245, 249, 0.3)"
                className="!bg-white/50 dark:!bg-slate-900/50 !backdrop-blur-md !rounded-3xl !border-slate-200 dark:!border-white/5 !m-6"
              />
              
              <Panel position="top-left" className="m-6 p-6 bg-white/90 dark:bg-slate-950/90 backdrop-blur-3xl border border-slate-200 dark:border-white/5 rounded-[32px] shadow-2xl max-w-sm pointer-events-auto">
                <div className="flex items-center gap-4 mb-6">
                  <div className={cn(
                    "h-12 w-12 rounded-2xl grid place-items-center shadow-lg",
                    selectedNetwork?.status === 'active' ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-amber-500 text-white shadow-amber-500/20"
                  )}>
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tighter">
                      {selectedNetwork ? selectedNetwork.name : "Unclaimed Model"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                      {selectedNetwork?.status === 'active' ? "Consensus Validated" : "Awaiting Signatures"}
                    </p>
                  </div>
                </div>

                {selectedNetwork ? (
                  <div className="space-y-6">
                    <div className="space-y-3">
                       <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 italic">
                         <span>Consensus Progress</span>
                         <span className={selectedNetwork.status === 'active' ? "text-emerald-500" : "text-amber-500"}>
                           {selectedNetwork.governance_approvals?.length || 0}/2 Verified
                         </span>
                       </div>
                       <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-white/5">
                         <div 
                           className={cn(
                             "h-full rounded-full transition-all duration-1000 ease-out",
                             selectedNetwork.status === 'active' ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" : "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                           )}
                           style={{ width: `${Math.min(100, ((selectedNetwork.governance_approvals?.length || 0) / 2) * 100)}%` }}
                         />
                       </div>
                    </div>

                    {selectedNetwork.blockchain_address && (
                      <div className="p-4 bg-slate-900/5 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                        <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest italic">Immutable Anchor</p>
                        <div className="flex items-center gap-2">
                           <ShieldCheck size={14} className="text-indigo-500" />
                           <p className="text-[10px] font-mono text-slate-600 dark:text-indigo-300 truncate">{selectedNetwork.blockchain_address}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2.5">
                       {selectedNetwork.governance_approvals?.map((sig, i) => (
                         <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-50 dark:border-white/5 shadow-sm">
                           <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                           <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tighter">
                              {sig.action} - <span className="text-indigo-500 italic">{sig.role}</span>
                           </p>
                           <span className="text-[9px] text-slate-400 font-medium ml-auto">
                             {new Date(sig.timestamp).toLocaleDateString()}
                           </span>
                         </div>
                       ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl">
                     <Database size={24} className="mx-auto text-slate-200 mb-3" />
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-4 leading-relaxed">Initialization Required. Select a Governance Network to load the architect's trail.</p>
                  </div>
                )}
              </Panel>

              <Panel position="top-right" className="m-6 flex gap-3">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-none shadow-2xl rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest"
                  onClick={() => { setNodes([]); setEdges([]); }}
                >
                  <Trash2 size={16} className="mr-2 text-rose-500" /> Reset
                </Button>
                <Button 
                  size="sm" 
                  className="bg-slate-950 dark:bg-white text-white dark:text-slate-900 shadow-2xl rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest group"
                  onClick={handleDeploy}
                >
                  <Zap size={16} className="mr-2 text-indigo-500 group-hover:animate-pulse" /> Forge On-Chain
                </Button>
              </Panel>

              <Panel position="bottom-left" className="m-6 p-6 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl rounded-[28px] border border-slate-200 dark:border-white/5 pointer-events-none">
                <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] italic mb-3">Modeling Protocol</h4>
                <div className="space-y-2">
                   {[
                     "Drag verified entities to the canvas",
                     "Define cryptographic links via ports",
                     "Commit architecture to the immutable ledger"
                   ].map((step, i) => (
                     <div key={i} className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500/40" />
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{step}</p>
                     </div>
                   ))}
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </ReactFlowProvider>
      </div>
    </div>
  );
}
