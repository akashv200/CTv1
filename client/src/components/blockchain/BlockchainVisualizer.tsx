import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Layers, ShieldCheck, Zap, ChevronRight, Activity, Cpu, Hammer, Globe } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { cn } from '../../lib/utils';

interface BlockData {
  id: string;
  txHash: string;
  source: string;
  target: string;
  timestamp: string;
}

interface BlockchainVisualizerProps {
  isVisible: boolean;
  onClose: () => void;
  deployments: any[];
}

const PHASES = [
  "Forging Solidity Schema...",
  "Compiling EVM Bytecode...",
  "Deploying Governance Proxies...",
  "Mining Block on Ganache Node...",
  "Anchoring Immutable Relationships...",
  "Ecosystem Synchronized."
];

export default function BlockchainVisualizer({ isVisible, onClose, deployments }: BlockchainVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeBlocks, setActiveBlocks] = useState<BlockData[]>([]);
  const [currentPhase, setCurrentPhase] = useState(PHASES[0]);
  const [isForged, setIsForged] = useState(false);

  useEffect(() => {
    if (isVisible && deployments.length > 0) {
      let isMounted = true;
      setIsForged(false);
      
      const sequence = async () => {
        // Phase 1-3: Pre-deployment simulation
        for (let i = 0; i < 3; i++) {
          if (!isMounted) return;
          setCurrentPhase(PHASES[i]);
          await new Promise(r => setTimeout(r, 1200));
        }

        // Phase 4: Mining blocks
        setCurrentPhase(PHASES[3]);
        for (let i = 0; i < deployments.length; i++) {
          if (!isMounted) return;
          const d = deployments[i];
          const newBlock: BlockData = {
            id: `block-${Date.now()}-${i}`,
            txHash: d.txHash || '0x' + Math.random().toString(16).slice(2, 42),
            source: d.source || 'Genesis Node',
            target: d.target || 'Ecosystem Edge',
            timestamp: new Date().toLocaleTimeString()
          };
          
          setActiveBlocks(prev => [...prev, newBlock]);
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Final Phase
        if (isMounted) {
          setCurrentPhase(PHASES[PHASES.length - 1]);
          setIsForged(true);
        }
      };
      
      void sequence();
      return () => { isMounted = false; };
    } else {
      setActiveBlocks([]);
      setCurrentPhase(PHASES[0]);
    }
  }, [isVisible, deployments]);

  useGSAP(() => {
    if (isVisible) {
      // Header and background entry
      gsap.from(".forge-header", { y: -50, opacity: 0, duration: 1, ease: "expo.out" });
      gsap.from(".forge-footer", { y: 50, opacity: 0, duration: 1, ease: "expo.out" });
    }
  }, { scope: containerRef, dependencies: [isVisible] });

  // Handle individual block entry with GSAP
  useGSAP(() => {
    if (activeBlocks.length > 0) {
      const lastIdx = activeBlocks.length - 1;
      const blockEl = `.block-node-${lastIdx}`;
      
      const tl = gsap.timeline();
      tl.from(blockEl, {
        scale: 0.5,
        rotationX: -90,
        opacity: 0,
        duration: 1.2,
        ease: "back.out(1.7)"
      })
      .to(blockEl, {
        boxShadow: "0 0 50px rgba(99, 102, 241, 0.4)",
        duration: 0.8,
        repeat: 1,
        yoyo: true
      });
    }
  }, { scope: containerRef, dependencies: [activeBlocks.length] });

  return (
    <AnimatePresence>
      {isVisible && (
        <div ref={containerRef} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-3xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative h-[85vh] w-[95vw] max-w-7xl overflow-hidden rounded-[48px] border border-white/5 bg-slate-950 shadow-[0_0_100px_rgba(0,0,0,1)]"
          >
            {/* The Forge Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-emerald-500/5 opacity-50" />
            
            {/* Header */}
            <div className="forge-header relative z-10 flex items-center justify-between p-10 bg-slate-950/40 backdrop-blur-xl border-b border-white/5">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-2xl shadow-indigo-500/50">
                    <Hammer className="h-7 w-7" />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase italic italic-none">
                    The Forge <span className="text-indigo-400">V.1</span>
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{currentPhase}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-1">Ecosystem Status</p>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-4 py-1.5 uppercase font-black tracking-tighter">Synchronizing Ledger</Badge>
                </div>
                {isForged && (
                  <button 
                    onClick={onClose}
                    className="group relative px-8 py-3 bg-white text-slate-950 font-black text-sm uppercase tracking-widest rounded-2xl transition hover:scale-105 active:scale-95"
                  >
                    Enter Workspace
                  </button>
                )}
              </div>
            </div>

            {/* Central Viewport */}
            <div className="relative h-[calc(100%-240px)] w-full overflow-hidden p-16">
               <div className="flex flex-wrap items-center justify-center gap-16 perspective-[2500px]">
                  {activeBlocks.map((block, index) => (
                    <div key={block.id} className={cn("group relative block-node", `block-node-${index}`)} style={{ transformStyle: 'preserve-3d' }}>
                      <div className="relative flex h-60 w-52 flex-col rounded-3xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-xl shadow-2xl transition-all group-hover:border-indigo-500/50 group-hover:bg-white/[0.07]">
                        <div className="flex items-center justify-between mb-6">
                           <Box className="h-7 w-7 text-indigo-400" />
                           <Badge className="bg-white/5 border-none text-[9px] text-slate-500">#{block.txHash.slice(2, 8).toUpperCase()}</Badge>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1 leading-none">Source Entity</p>
                            <p className="text-sm font-bold text-white truncate leading-tight">{block.source}</p>
                          </div>
                          <div className="flex justify-center flex-col items-center py-1">
                             <div className="h-4 w-px bg-indigo-500/20" />
                             <ChevronRight className="h-4 w-4 text-indigo-500/40 rotate-90" />
                             <div className="h-4 w-px bg-indigo-500/20" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1 leading-none">Target Entity</p>
                            <p className="text-sm font-bold text-white truncate leading-tight">{block.target}</p>
                          </div>
                        </div>

                        <div className="mt-auto pt-5 border-t border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-[9px] font-black text-emerald-500 italic">IMMUTABLE PROOF</span>
                          </div>
                          <p className="text-[8px] font-mono text-slate-500 truncate leading-none">{block.txHash}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {activeBlocks.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                       <div className="relative mb-8">
                          <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse" />
                          <Cpu className="h-20 w-20 text-indigo-400 relative animate-spin-slow" />
                       </div>
                       <p className="text-xl font-black text-white uppercase tracking-[0.2em]">{currentPhase}</p>
                       <p className="mt-2 text-slate-500 font-bold uppercase tracking-widest text-xs">Awaiting Cryptographic Confirmations</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Footer Metrics */}
            <div className="forge-footer absolute bottom-0 left-0 right-0 p-10 border-t border-white/5 bg-slate-950/80 backdrop-blur-2xl flex items-center justify-between">
               <div className="flex gap-16">
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-2 block">Ledger Sync</label>
                    <div className="flex items-end gap-3">
                       <p className="text-3xl font-black text-white leading-none">{activeBlocks.length}</p>
                       <p className="text-sm font-bold text-slate-500 mb-0.5 leading-none">/ {deployments.length}</p>
                    </div>
                 </div>
                 <div className="hidden md:block">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-2 block">Compute Power</label>
                    <div className="flex items-end gap-2">
                       <p className="text-3xl font-black text-emerald-400 leading-none">High</p>
                       <p className="text-sm font-bold text-slate-500 mb-0.5 leading-none px-2 py-0.5 bg-emerald-500/10 rounded overflow-hidden">99%</p>
                    </div>
                 </div>
                 <div className="hidden lg:block">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-2 block">Network Latency</label>
                    <div className="flex items-end gap-2">
                       <p className="text-3xl font-black text-white leading-none">12</p>
                       <p className="text-sm font-bold text-slate-500 mb-0.5 leading-none uppercase">ms</p>
                    </div>
                 </div>
               </div>
               
               <div className="flex items-center gap-4 px-6 py-4 bg-indigo-500/10 rounded-[24px] border border-indigo-500/20">
                  <Globe className="h-6 w-6 text-indigo-400 animate-spin-slow" />
                  <div>
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] block mb-0.5">Anchoring Region</span>
                    <span className="text-sm font-extrabold text-white uppercase tracking-tighter">Global Ethereum Mainnet</span>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-xl border px-3 py-1 text-[10px] font-black transition-colors backdrop-blur-xl",
      className
    )}>
      {children}
    </span>
  );
}
