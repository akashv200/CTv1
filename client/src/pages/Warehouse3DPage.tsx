import React, { useEffect, useState } from 'react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { api } from '../services/api';
import { Box, Package, Thermometer, Droplets, Info, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WarehouseProduct {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  category: string;
  metadata?: {
    temperature?: number;
    humidity?: number;
    aisle?: string;
    shelf?: string;
  };
}

export default function Warehouse3DPage() {
  const [products, setProducts] = useState<WarehouseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WarehouseProduct | null>(null);

  useEffect(() => {
    async function loadWarehouseData() {
      try {
        const data = await api.listProducts('warehouse');
        setProducts(data);
      } catch (e) {
        console.error('Failed to load warehouse data', e);
      } finally {
        setLoading(false);
      }
    }
    loadWarehouseData();
  }, []);

  const gridRows = 5;
  const gridCols = 5;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-slate-900 dark:text-slate-100">3D Smart Warehouse</h1>
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Warehouse Floor */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="relative min-h-[600px] overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 p-0 shadow-2xl border-none">
            {/* Warehouse Header Overlay */}
            <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Zone A-1 Visualization</h2>
              <div className="flex gap-2">
                <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">System Active</Badge>
                <Badge variant="info" className="bg-blue-500/10 text-blue-400 border-blue-500/20">{products.length} Batches Tracked</Badge>
              </div>
            </div>

            {/* Isometric Scene Container */}
            <div className="relative h-[650px] w-full flex items-center justify-center">
              <div className="isometric-scene scale-75 md:scale-100">
                {/* Grid Floor */}
                <div className="relative isometric-grid origin-center">
                  <div 
                    className="grid border border-slate-700/50"
                    style={{ 
                      gridTemplateColumns: `repeat(${gridCols}, 80px)`,
                      gridTemplateRows: `repeat(${gridRows}, 80px)`,
                      background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)'
                    }}
                  >
                    {Array.from({ length: gridRows * gridCols }).map((_, i) => (
                      <div key={i} className="border border-slate-700/30 w-[80px] h-[80px]" />
                    ))}
                  </div>

                  {/* Render 3D Blocks for Products */}
                  {products.map((product, idx) => {
                    const row = Math.floor(idx / gridCols);
                    const col = idx % gridCols;
                    if (row >= gridRows) return null;

                    return (
                      <IsometricBlock 
                        key={product.id}
                        product={product}
                        row={row}
                        col={col}
                        onClick={() => setSelectedItem(product)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Floor Controls Overlay */}
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" /> Optimal
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                  <div className="h-2 w-2 rounded-full bg-amber-500" /> Check Needed
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info size={18} className="text-blue-500" />
              <h3 className="font-bold text-slate-900 dark:text-white">Batch Intelligence</h3>
            </div>
            
            <AnimatePresence mode='wait'>
              {selectedItem ? (
                <motion.div
                  key={selectedItem.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Selected Unit</span>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedItem.productName}</h4>
                    <p className="text-xs text-slate-500">{selectedItem.productId}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                      <Thermometer size={14} className="text-blue-600 mb-1" />
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Temp</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">22.4°C</span>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/10">
                      <Droplets size={14} className="text-purple-600 mb-1" />
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Humidity</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">45%</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900">
                    <div className="flex justify-between items-center text-xs mb-2">
                       <span className="text-slate-500">Utilization</span>
                       <span className="font-bold text-slate-900 dark:text-white">{selectedItem.quantity} {selectedItem.unit}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[65%]" />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="py-12 text-center">
                  <Box className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={48} />
                  <p className="text-sm text-slate-500 italic">Select a storage block to view real-time analytics.</p>
                </div>
              )}
            </AnimatePresence>
          </Card>

          <Card className="p-6 bg-slate-900 text-white border-none overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="font-bold mb-1">Stock Overview</h3>
              <p className="text-xs text-slate-400 mb-4">Total Inventory Value</p>
              <div className="text-3xl font-bold tracking-tighter">$142.8k</div>
              <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> +4.2% Optimization
              </div>
            </div>
            <Package className="absolute -bottom-4 -right-4 text-white/5" size={120} />
          </Card>
        </div>
      </div>

      <style>{`
        .isometric-scene {
          perspective: 1000px;
        }
        .isometric-grid {
          transform: rotateX(60deg) rotateZ(45deg);
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
}

function IsometricBlock({ product, row, col, onClick }: { product: WarehouseProduct, row: number, col: number, onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const height = Math.min(100, (product.quantity / 500) * 80 + 20);

  return (
    <div 
      className="absolute cursor-pointer transition-all duration-300"
      style={{
        left: col * 80,
        top: row * 80,
        width: 80,
        height: 80,
        transformStyle: 'preserve-3d',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Front Face */}
      <div 
        className={`absolute bg-blue-600/90 border border-white/10 transition-all ${hovered ? 'brightness-125' : ''}`}
        style={{
          width: 80,
          height: height,
          transform: `rotateX(-90deg) translateZ(80px)`,
          transformOrigin: 'bottom',
          bottom: 0
        }}
      />
      {/* Right Face */}
      <div 
        className={`absolute bg-blue-800/90 border border-white/10 transition-all ${hovered ? 'brightness-125' : ''}`}
        style={{
          width: 80,
          height: height,
          transform: `rotateX(-90deg) rotateY(90deg) translateZ(80px)`,
          transformOrigin: 'bottom left',
          bottom: 0,
          left: 0
        }}
      />
      {/* Top Face */}
      <div 
        className={`absolute bg-blue-400 border border-white/20 transition-all flex items-center justify-center ${hovered ? 'brightness-125' : ''}`}
        style={{
          width: 80,
          height: 80,
          transform: `translateZ(${height}px)`,
          boxShadow: hovered ? '0 10px 30px rgba(0,0,0,0.5)' : 'none'
        }}
      >
         <span className="text-[10px] font-bold text-white/40">{product.productId.slice(-3)}</span>
      </div>
    </div>
  );
}
