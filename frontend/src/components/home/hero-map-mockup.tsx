import { useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

// Simplified world map points (abstract representation)
const locations = [
    { id: 1, x: 20, y: 40, label: "New York", status: "hub" },
    { id: 2, x: 45, y: 30, label: "London", status: "hub" },
    { id: 3, x: 75, y: 45, label: "Singapore", status: "hub" },
    { id: 4, x: 85, y: 35, label: "Tokyo", status: "hub" },
    { id: 5, x: 30, y: 70, label: "Sao Paulo", status: "spoke" },
    { id: 6, x: 55, y: 65, label: "Cape Town", status: "spoke" },
];

const routes = [
    { from: 1, to: 2, curvature: -0.2 }, // NY -> London
    { from: 2, to: 3, curvature: 0.2 }, // London -> Singapore
    { from: 3, to: 4, curvature: -0.1 }, // Singapore -> Tokyo
    { from: 1, to: 5, curvature: 0.1 }, // NY -> Sao Paulo
    { from: 2, to: 6, curvature: 0.1 }, // London -> Cape Town
];

export function HeroMapMockup() {
    return (
        <div className="relative w-full h-full bg-slate-900 overflow-hidden rounded-xl">
            {/* Grid Background */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: "linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                }}
            />

            {/* Abstract World Shadows */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900/0 to-transparent"
                />
            </div>

            <div className="absolute inset-0">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {routes.map((route, i) => {
                        const start = locations.find(l => l.id === route.from)!;
                        const end = locations.find(l => l.id === route.to)!;

                        // Calculate Control Point for Curve
                        const midX = (start.x + end.x) / 2;
                        const midY = (start.y + end.y) / 2;
                        const cpX = midX + (end.y - start.y) * route.curvature;
                        const cpY = midY - (end.x - start.x) * route.curvature;

                        const pathD = `M ${start.x} ${start.y} Q ${cpX} ${cpY} ${end.x} ${end.y}`;

                        return (
                            <g key={i}>
                                {/* Route Line */}
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke="rgba(99, 102, 241, 0.2)"
                                    strokeWidth="0.5"
                                />

                                {/* Animated Particle */}
                                <motion.circle
                                    r="0.8"
                                    fill="#818cf8"
                                    initial={{ offsetDistance: "0%" }}
                                    animate={{ offsetDistance: "100%" }}
                                    transition={{
                                        duration: 3 + Math.random() * 2,
                                        repeat: Infinity,
                                        ease: "linear",
                                        delay: Math.random() * 2
                                    }}
                                    style={{ offsetPath: `path("${pathD}")` }}
                                />
                            </g>
                        );
                    })}

                    {locations.map((loc) => (
                        <g key={loc.id}>
                            {/* Pulse Effect */}
                            <motion.circle
                                cx={loc.x}
                                cy={loc.y}
                                r="1"
                                fill={loc.status === "hub" ? "#3b82f6" : "#10b981"}
                                initial={{ opacity: 0.5, scale: 1 }}
                                animate={{ opacity: 0, scale: 3 }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeOut"
                                }}
                            />
                            {/* Core Dot */}
                            <circle
                                cx={loc.x}
                                cy={loc.y}
                                r="0.8"
                                fill={loc.status === "hub" ? "#60a5fa" : "#34d399"}
                                stroke="#0f172a"
                                strokeWidth="0.2"
                            />
                        </g>
                    ))}
                </svg>
            </div>

            {/* Floating UI Elements on Map */}
            <div className="absolute top-3 right-3 flex flex-col gap-2">
                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2"
                >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-medium text-slate-200">New Match Found</span>
                </motion.div>
            </div>

            {/* Map Overlay Stats */}
            <div className="absolute bottom-3 left-3 right-3 grid grid-cols-2 gap-2">
                <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-2 rounded-lg">
                    <div className="text-[8px] text-slate-400 uppercase tracking-wider">Active Fleet</div>
                    <div className="text-sm font-bold text-white">1,248</div>
                </div>
                <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-2 rounded-lg">
                    <div className="text-[8px] text-slate-400 uppercase tracking-wider">On Time</div>
                    <div className="text-sm font-bold text-emerald-400">98.2%</div>
                </div>
            </div>
        </div>
    );
}
