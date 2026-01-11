import { CheckCircle, Clock, Plus, MoreHorizontal, X, Check } from 'lucide-react';

const RecentActivity = () => {
    const activities = [
        {
            id: 1,
            title: 'Offer from',
            highlight: 'Global Haulage',
            description: 'Accra → Lagos Corridor • $1,800 USD',
            time: '2 MINS AGO',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Global',
            type: 'offer',
            unread: true
        },
        {
            id: 2,
            title: 'Customs Clearance Success',
            highlight: '',
            description: 'UTX-84562-GA cleared Seme border point',
            time: '45 MINS AGO',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Customs',
            type: 'success',
            unread: true
        },
        {
            id: 3,
            title: 'Liquidity Approved',
            highlight: '',
            description: '$5,000 Invoice Discounting ready',
            time: '2 HOURS AGO',
            icon: CheckCircle,
            iconBg: 'bg-teal-50',
            iconColor: 'text-teal-600',
            type: 'approval',
            unread: false
        },
        {
            id: 4,
            title: 'Route Hazard Alert',
            highlight: '',
            description: 'Mombasa route: Heavy rain near Nakuru',
            time: '3 HOURS AGO',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alert',
            type: 'alert',
            unread: false
        },
    ];

    return (
        <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 md:mb-8">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg md:text-xl font-black text-[#0f172a] tracking-tight">Recent Activity</h3>
                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">2</span>
                </div>
                <button className="text-slate-400 hover:text-teal-600 transition-colors">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            <div className="space-y-6 md:space-y-8 flex-1">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3 md:gap-4 items-start group relative">
                        {activity.unread && (
                            <div className="absolute -left-2 top-1.5 size-1.5 bg-red-500 rounded-full"></div>
                        )}

                        <div className="size-9 md:size-10 rounded-full border-2 border-slate-50 shadow-sm flex items-center justify-center bg-white overflow-hidden shrink-0 mt-0.5 group-hover:border-teal-400 transition-colors duration-300">
                            {activity.icon ? (
                                <activity.icon size={18} className={activity.iconColor} />
                            ) : (
                                <div
                                    className="size-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                    style={{ backgroundImage: `url("${activity.avatar}")` }}
                                />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-start">
                                <p className="text-xs md:text-sm font-bold text-[#0f172a] truncate pr-2">
                                    {activity.title} {activity.highlight && <span className="text-teal-600">{activity.highlight}</span>}
                                </p>
                            </div>
                            <p className="text-[10px] md:text-xs text-slate-500 mt-1 truncate">{activity.description}</p>

                            <div className="flex items-center justify-between mt-1.5 md:mt-2">
                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Clock size={10} /> {activity.time}
                                </p>

                                {activity.type === 'offer' && (
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1 rounded bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-500 transition-colors" title="Decline">
                                            <X size={12} />
                                        </button>
                                        <button className="p-1 rounded bg-teal-100 hover:bg-teal-500 text-teal-600 hover:text-white transition-colors" title="Accept">
                                            <Check size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-slate-50 relative z-10">
                <button className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white font-bold hover:shadow-lg hover:shadow-teal-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base group">
                    <span className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
                        <Plus size={16} className="md:w-5 md:h-5" />
                    </span>
                    Post New Cargo Request
                </button>
            </div>

            {/* Decorative blurs */}
            <div className="absolute -bottom-10 -right-10 size-40 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
        </div>
    );
};

export default RecentActivity;
