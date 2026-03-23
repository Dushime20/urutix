import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Search,
  Book,
  Video,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Zap,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';

interface HelpTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  content?: string;
  videoUrl?: string;
  relatedArticles?: string[];
}

interface ContextualHelpProps {
  context?: string; // e.g., 'dashboard', 'cargo-create', 'tracking'
}

const ContextualHelp: React.FC<ContextualHelpProps> = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);

  const helpTopics: HelpTopic[] = [
    {
      id: 'quick-start',
      title: 'Quick Start Guide',
      description: 'Get started with UrutiX in 5 minutes',
      category: 'Getting Started',
      content: `
# Quick Start Guide

## 1. Create Your First Cargo
Click the "Quick Action" button on your dashboard or use the ⚡ FAB in the bottom-right corner.

## 2. Choose Your Journey
- **Smart Matching**: Get instant AI-matched trucks (best for urgent shipments)
- **Bidding**: Let carriers compete for your shipment (best for cost savings)

## 3. Track Your Shipment
Once confirmed, track in real-time from the Tracking page. You'll see:
- Live GPS location
- ETA predictions
- Milestone updates
- Driver contact info

## 4. Complete & Pay
Confirm delivery, rate the service, and complete payment through the platform.

That's it! You're ready to ship with UrutiX. 🚀
      `,
      relatedArticles: ['smart-matching', 'bidding-guide', 'payment-methods']
    },
    {
      id: 'smart-matching',
      title: 'Understanding Smart Matching',
      description: 'How our AI finds the best trucks for your cargo',
      category: 'Features',
      content: `
# Smart Matching Explained

## What is Smart Matching?
Smart Matching uses AI to instantly find the best available trucks for your shipment based on:
- Location compatibility
- Vehicle type and capacity
- Carrier ratings and history
- Price competitiveness
- Availability and timing

## Match Scores
Each match gets a score from 0-100:
- **90-100**: Excellent match (highly recommended)
- **80-89**: Very good match
- **70-79**: Good match
- **Below 70**: Acceptable but review carefully

## How to Use
1. Create cargo with Quick Action
2. Choose "Smart Matching"
3. Review matches (list, table, or comparison view)
4. Filter by score, price, rating, or features
5. Select and book your preferred carrier

## Pro Tips
✓ Higher match scores typically mean smoother deliveries
✓ Use comparison view to evaluate up to 3 carriers
✓ Check carrier ratings and delivery history
✓ Enable GPS and refrigeration filters if needed
      `,
      videoUrl: 'https://youtube.com/watch?v=demo',
      relatedArticles: ['bidding-guide', 'carrier-ratings', 'booking-process']
    },
    {
      id: 'bidding-guide',
      title: 'Bidding System Guide',
      description: 'How to get the best prices through competitive bidding',
      category: 'Features',
      content: `
# Bidding System Guide

## How It Works
1. Create and publish your cargo
2. Carriers view and submit competitive bids
3. Review bids, negotiate if needed
4. Accept the best offer

## Setting Up a Bid
- **Budget**: Set your maximum acceptable price
- **Timeline**: Bidding duration (12h, 24h, 48h)
- **Requirements**: Specify must-haves (GPS, insurance, etc.)
- **Visibility**: Choose public or private auction

## Evaluating Bids
Consider:
- **Price**: Not always the cheapest is best
- **Carrier Rating**: 4.5+ stars recommended
- **Delivery History**: Check on-time percentage
- **Vehicle Type**: Ensure it matches your cargo needs
- **Insurance Coverage**: Verify adequate protection

## Best Practices
✓ Allow 24+ hours for maximum participation
✓ Provide detailed cargo information
✓ Respond to carrier questions promptly
✓ Counter-offer when appropriate
✓ Read carrier profiles before accepting
      `,
      relatedArticles: ['smart-matching', 'payment-terms', 'dispute-resolution']
    },
    {
      id: 'tracking-features',
      title: 'Live Tracking Features',
      description: 'Monitor your shipments in real-time',
      category: 'Tracking',
      content: `
# Live Tracking Features

## Real-Time Updates
- **GPS Location**: Updated every 5 minutes
- **ETA Predictions**: AI-calculated with confidence score
- **Milestone Tracking**: Pickup, checkpoints, delivery
- **Delay Alerts**: Automatic notifications if issues arise

## Communication Tools
- **Driver Messaging**: In-app chat (no phone numbers needed)
- **Status Updates**: Push notifications for key events
- **Photo Proof**: Delivery confirmation with photos
- **Document Sharing**: Share invoices, receipts during transit

## Proactive Alerts
You'll be notified about:
- Route deviations
- Traffic delays
- Weather impacts
- Early/late delivery predictions
- Delivery completion

## Map View
- See all active shipments on one map
- Click markers for details
- View estimated routes
- Track multiple shipments simultaneously
      `,
      relatedArticles: ['driver-communication', 'delivery-proof', 'issue-reporting']
    },
    {
      id: 'payment-methods',
      title: 'Payment Methods & Terms',
      description: 'How payments work on UrutiX',
      category: 'Payments',
      content: `
# Payment Methods & Terms

## Supported Payment Methods
- Credit/Debit Cards (Visa, Mastercard, Amex)
- Bank Transfer (ACH)
- Mobile Money (M-Pesa, Airtel Money)
- Digital Wallets (PayPal, Stripe)

## Payment Terms
- **Prepaid**: Pay 100% upfront (fastest processing)
- **COD**: Cash on delivery (limited carriers)
- **Net 7/15/30**: Payment due 7, 15, or 30 days after delivery
- **Split Payment**: 50% upfront, 50% on delivery

## Payment Protection
✓ Escrow system holds payment until delivery confirmed
✓ Refund policy for failed/cancelled shipments
✓ Dispute resolution process
✓ Insurance coverage available

## Invoicing
- Automatic invoice generation
- Downloadable receipts
- Payment history tracking
- Tax-compliant documentation
      `,
      relatedArticles: ['refund-policy', 'insurance-options', 'tax-documents']
    }
  ];

  const filteredTopics = searchQuery
    ? helpTopics.filter(topic =>
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : helpTopics;

  const categories = Array.from(new Set(helpTopics.map(t => t.category)));

  return (
    <>
      {/* Enhanced Help Button - Enlite Prime Style */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2.5 px-4 py-2 bg-white hover:bg-[#345E85] text-slate-600 hover:text-white rounded-xl transition-all duration-300 shadow-sm border border-slate-100 group overflow-hidden relative"
        title="Help & Support Hub"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <HelpCircle size={18} className="relative z-10 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline text-xs font-black uppercase tracking-widest relative z-10">Help</span>
      </button>

      {/* Help Modal - Enlite Prime Aesthetic */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-[#F8FAFC] border-none rounded-[40px] shadow-2xl">
          {/* Header - Enlite Style */}
          <DialogHeader className="p-8 md:p-10 pb-8 bg-white border-b border-slate-50 relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 p-10 opacity-5 scale-[2] pointer-events-none">
              <HelpCircle size={120} className="text-[#345E85]" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#345E85] shadow-inner">
                  <HelpCircle size={20} />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#345E85]">Knowledge Repository</h2>
              </div>
              <DialogTitle className="text-3xl md:text-3xl font-black text-slate-900 tracking-tight leading-[1.2] mb-1">
                Help & <span className="text-[#345E85]">Support</span>
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 md:p-10 pt-6">
            <AnimatePresence mode="wait">
              {!selectedTopic ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Search Bar */}
                  <div className="mb-10 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#345E85] transition-colors" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Query the assistance database..."
                      className="w-full bg-white border border-slate-100 rounded-3xl py-6 pl-16 pr-8 text-slate-900 font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all shadow-sm"
                    />
                  </div>

                  {/* Core Action Vectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                    {[
                      { icon: Book, label: 'Archives', detail: 'User Guides', color: 'blue', path: '/dashboard/fleet/docs' },
                      { icon: MessageCircle, label: 'Liaison', detail: 'Support Desk', color: 'emerald', path: '/dashboard/fleet/support' },
                      { icon: Video, label: 'Visuals', detail: 'Video Tutorials', color: 'purple', path: '#' }
                    ].map((vector, idx) => (
                      <button
                        key={idx}
                        onClick={() => vector.path !== '#' && navigate(vector.path)}
                        className="flex items-center gap-4 p-6 bg-white border border-slate-100 rounded-[32px] hover:shadow-lg hover:shadow-blue-50 transition-all text-left group"
                      >
                        <div className={`w-12 h-12 bg-${vector.color}-50 rounded-2xl flex items-center justify-center text-${vector.color}-600 group-hover:scale-110 transition-transform shadow-inner`}>
                          <vector.icon size={22} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-[#345E85] transition-colors">{vector.label}</p>
                          <p className="font-black text-slate-900 leading-tight">{vector.detail}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Operational Domains */}
                  <div className="space-y-10">
                    {categories.map(category => {
                      const categoryTopics = filteredTopics.filter(t => t.category === category);
                      if (categoryTopics.length === 0) return null;

                      return (
                        <div key={category} className="space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#345E85]">{category} Mapping</h3>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            {categoryTopics.map(topic => (
                              <button
                                key={topic.id}
                                onClick={() => setSelectedTopic(topic)}
                                className="w-full flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[32px] hover:border-[#345E85] hover:shadow-md transition-all text-left group"
                              >
                                <div className="flex-1 pr-6">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="h-2 w-2 rounded-full bg-blue-400 group-hover:scale-150 transition-transform" />
                                    <p className="font-black text-slate-800 text-lg tracking-tight group-hover:text-[#345E85]">
                                      {topic.title}
                                    </p>
                                  </div>
                                  <p className="text-sm text-slate-500 font-medium pl-4">{topic.description}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#345E85] group-hover:text-white transition-all shadow-inner">
                                  <ChevronRight size={18} />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {filteredTopics.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                      <Zap size={40} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No Match Found in Registry</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="article"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Article View - High Precision Layout */}
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#345E85] hover:translate-x-[-4px] transition-transform mb-8"
                  >
                    <ChevronLeft size={14} /> Back to Registry
                  </button>

                  <article className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] scale-[1.5] pointer-events-none rotate-12">
                      <Book size={100} className="text-[#345E85]" />
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-6">
                        <span className="px-3 py-1 bg-blue-50 text-[#345E85] text-[9px] font-black uppercase tracking-widest rounded-full">{selectedTopic.category}</span>
                      </div>

                      <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">{selectedTopic.title}</h1>
                      <p className="text-lg text-slate-500 font-medium leading-relaxed mb-10 pb-8 border-b border-slate-50">{selectedTopic.description}</p>

                      {selectedTopic.videoUrl && (
                        <div className="bg-[#345E85] rounded-[32px] p-8 mb-10 text-white shadow-xl shadow-blue-100 flex items-center justify-between group overflow-hidden relative">
                          <div className="absolute -right-6 -top-6 opacity-10 group-hover:scale-125 transition-transform duration-700">
                            <Video size={100} />
                          </div>
                          <div className="flex items-center gap-6 relative z-10">
                            <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                              <Video size={24} className="text-white" />
                            </div>
                            <div>
                              <p className="font-black uppercase tracking-widest text-[10px] opacity-70">Visual Synchronization</p>
                              <p className="text-lg font-black tracking-tight">Watch Tutorial Interface</p>
                            </div>
                          </div>
                          <a
                            href={selectedTopic.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-[#345E85] shadow-lg active:scale-95 transition-all relative z-10"
                          >
                            <ExternalLink size={20} />
                          </a>
                        </div>
                      )}

                      <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-[1.8] space-y-4">
                        {selectedTopic.content?.split('\n').map((line, i) => {
                          if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-black text-slate-900 mt-8 mb-4 uppercase tracking-tight">{line.replace('# ', '')}</h1>;
                          if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-black text-slate-900 mt-8 mb-3 uppercase tracking-tight flex items-center gap-2"><div className="h-4 w-1 bg-[#345E85] rounded-full" /> {line.replace('## ', '')}</h2>;
                          if (line.startsWith('- ')) return <div key={i} className="flex gap-3 mb-2 ps-4"><div className="h-1.5 w-1.5 rounded-full bg-[#345E85] mt-2.5 shrink-0" /><p>{line.replace('- ', '')}</p></div>;
                          if (line.trim() === '') return <div key={i} className="h-4" />;
                          return <p key={i}>{line}</p>;
                        })}
                      </div>

                      {selectedTopic.relatedArticles && selectedTopic.relatedArticles.length > 0 && (
                        <div className="mt-16 pt-10 border-t border-slate-50">
                          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6">Cross-Reference Registry</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedTopic.relatedArticles.map(articleId => {
                              const article = helpTopics.find(t => t.id === articleId);
                              if (!article) return null;
                              return (
                                <button
                                  key={articleId}
                                  onClick={() => setSelectedTopic(article)}
                                  className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-[#345E85] hover:shadow-sm transition-all text-left group"
                                >
                                  <span className="text-sm font-bold text-slate-700 group-hover:text-[#345E85]">{article.title}</span>
                                  <ArrowRight size={14} className="text-slate-300 group-hover:translate-x-1 group-hover:text-[#345E85] transition-all" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>

                  {/* Feedback Hub */}
                  <div className="mt-8 p-10 bg-white rounded-[40px] border border-slate-100 shadow-sm text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Efficiency Assessment</p>
                    <div className="flex items-center justify-center gap-6">
                      <button className="flex items-center gap-3 px-8 py-3 bg-emerald-50 text-emerald-600 rounded-[24px] font-black uppercase tracking-widest text-[9px] hover:bg-emerald-100 active:scale-95 transition-all outline-none border border-emerald-100/50">
                        Logic Validated <ThumbsUp size={16} />
                      </button>
                      <button className="flex items-center gap-3 px-8 py-3 bg-rose-50 text-rose-600 rounded-[24px] font-black uppercase tracking-widest text-[9px] hover:bg-rose-100 active:scale-95 transition-all outline-none border border-rose-100/50">
                        Logic Inaccurate <ThumbsDown size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer - Persist Action */}
          <div className="p-8 bg-white border-t border-slate-50 flex items-center justify-center relative shrink-0">
            <div className="flex items-center gap-2 group cursor-pointer hover:scale-105 transition-transform">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Still seeking synchronization?</span>
              <button className="text-[10px] font-black uppercase tracking-[0.2em] text-[#345E85] underline decoration-blue-100 underline-offset-4 hover:decoration-[#345E85] transition-all">
                Escalate to Support Vector
              </button>
            </div>

            {/* Glossy close helper */}
            <div className="absolute right-8 hidden md:block">
              <button
                onClick={() => setIsOpen(false)}
                className="text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-900 transition-colors"
              >
                Terminate Session [Esc]
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContextualHelp;
