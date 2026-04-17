import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Truck, Package, CircleDollarSign, Warehouse, PackageCheck, Building2 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const floatingBgIcons = [
  // Truck (Black body, gray details)
  { icon: Truck, left: "2%", top: "8%", size: 240, speed: 1.2, fillClass: "fill-slate-900 dark:fill-slate-100", strokeClass: "text-slate-500 dark:text-slate-400", className: "-rotate-12" },
  // Package (Purple body)
  { icon: Package, left: "85%", top: "18%", size: 300, speed: -0.8, fillClass: "fill-purple-500 dark:fill-purple-600", strokeClass: "text-purple-900 dark:text-purple-200", className: "rotate-6" },
  // Money (Golden body, dark dollar sign wrapper stroke)
  { icon: CircleDollarSign, left: "5%", top: "35%", size: 200, speed: 1.5, fillClass: "fill-yellow-400 dark:fill-yellow-500", strokeClass: "text-slate-900 dark:text-slate-900", className: "rotate-12" },
  // Warehouse (Blue body)
  { icon: Warehouse, left: "75%", top: "45%", size: 380, speed: -1.2, fillClass: "fill-blue-500 dark:fill-blue-600", strokeClass: "text-blue-900 dark:text-blue-200", className: "-rotate-6" },
  // PackageCheck (Purple body)
  { icon: PackageCheck, left: "4%", top: "62%", size: 280, speed: 0.9, fillClass: "fill-purple-500 dark:fill-purple-600", strokeClass: "text-purple-900 dark:text-purple-200", className: "rotate-45" },
  // Truck (Black body)
  { icon: Truck, left: "85%", top: "75%", size: 250, speed: -1.5, fillClass: "fill-slate-900 dark:fill-slate-100", strokeClass: "text-slate-500 dark:text-slate-400", className: "-rotate-12" },
  // Money (Golden body)
  { icon: CircleDollarSign, left: "8%", top: "85%", size: 220, speed: 1.1, fillClass: "fill-yellow-400 dark:fill-yellow-500", strokeClass: "text-slate-900 dark:text-slate-900", className: "rotate-12" },
  // Warehouse (Blue body)
  { icon: Building2, left: "80%", top: "95%", size: 360, speed: -1, fillClass: "fill-blue-500 dark:fill-blue-600", strokeClass: "text-blue-900 dark:text-blue-200", className: "-rotate-6" }
];

export default function FloatingBackground() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const triggers: ScrollTrigger[] = [];
    
    gsap.utils.toArray<HTMLElement>(".global-parallax-element").forEach((el) => {
      const speed = Number(el.dataset.speed || 1);
      
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.5,
        animation: gsap.to(el, {
          y: -350 * speed,
          ease: "none"
        })
      });
      triggers.push(st);
      
      const svg = el.querySelector("svg");
      if (svg) {
        gsap.to(svg, {
          y: "+=25",
          rotation: "+=8",
          duration: "random(3, 5)",
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut"
        });
      }
    });

    return () => {
      triggers.forEach(t => t.kill());
    };
  }, { scope: container });

  return (
    <div ref={container} className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-30 dark:opacity-40 rounded-3xl">
      {floatingBgIcons.map((item, i) => (
        <div 
          key={i} 
          className={`global-parallax-element absolute ${item.className}`}
          style={{ left: item.left, top: item.top }}
          data-speed={item.speed}
        >
          <item.icon className={`${item.fillClass} ${item.strokeClass}`} size={item.size} strokeWidth={2} />
        </div>
      ))}
    </div>
  );
}
