import { Lightbulb, Info, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react';

const SmartInsightsWidget = () => {
    // Mock insights derived from CargoAnalytics logic
    const insights = [
        {
            id: 1,
            type: 'opportunity',
            icon: <Lightbulb size={16} className="text-amber-500" />,
            title: 'Publish Drafs',
            description: 'You have 3 draft loads worth $12k waiting to be published.',
            action: 'Review Drafts',
            impact: 'High'
        },
        {
            id: 2,
            type: 'warning',
            icon: <AlertTriangle size={16} className="text-red-500" />,
            title: 'Price Alert',
            description: 'Your offer for "Accra -> Kumasi" is 15% below market rate.',
            action: 'Adjust Price',
            impact: 'Medium'
        },
        {
            id: 3,
            type: 'trend',
            icon: <TrendingUp size={16} className="text-blue-500" />,
            title: 'Market Trend',
            description: 'Demand for flatbeds in Greater Accra is up 20% this week.',
            action: 'View Rates',
            impact: 'Low'
        }
    ];

    return (
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Lightbulb size={20} />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-[#0f172a] text-base">Smart Insights</h3>
                        <p className="text-slate-400 text-xs font-medium">AI-driven recommendations</p>
                    </div>
                </div>
                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg uppercase tracking-wide">
                    {insights.length} New
                </span>
            </div>

            <div className="space-y-4">
                {insights.map((insight) => (
                    <div key={insight.id} className="group relative p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/50 transition-all">
                        <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg shrink-0 ${insight.type === 'opportunity' ? 'bg-amber-50' : insight.type === 'warning' ? 'bg-red-50' : 'bg-blue-50'}`}>
                                {insight.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-sm text-[#0f172a] truncate">{insight.title}</h4>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${insight.impact === 'High' ? 'bg-red-100 text-red-600' :
                                            insight.impact === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        {insight.impact}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed mb-3 pr-2">
                                    {insight.description}
                                </p>
                                <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group/btn">
                                    {insight.action}
                                    <ChevronRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full mt-5 py-3 rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2">
                <Info size={14} /> View All 12 Insights
            </button>
        </div>
    );
};

export default SmartInsightsWidget;
