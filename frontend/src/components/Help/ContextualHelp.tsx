import { useState } from 'react';
import { HelpCircle, X, Search, Book, Video, MessageCircle, ExternalLink, ChevronRight } from 'lucide-react';
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

const ContextualHelp: React.FC<ContextualHelpProps> = ({ context = 'general' }) => {
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
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium relative group"
        title="Help & Support"
      >
        <HelpCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-semibold">Help</span>
        {/* Subtle pulse effect */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
        </span>
      </button>

      {/* Help Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="relative pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-bold text-gray-900">Help & Support</DialogTitle>
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-0 right-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {!selectedTopic ? (
              <>
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search help articles..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Book className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Documentation</p>
                      <p className="text-xs text-gray-500">Detailed guides</p>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Video className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Video Tutorials</p>
                      <p className="text-xs text-gray-500">Watch & learn</p>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Live Chat</p>
                      <p className="text-xs text-gray-500">24/7 support</p>
                    </div>
                  </button>
                </div>

                {/* Topics by Category */}
                {categories.map(category => {
                  const categoryTopics = filteredTopics.filter(t => t.category === category);
                  if (categoryTopics.length === 0) return null;

                  return (
                    <div key={category} className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">{category}</h3>
                      <div className="space-y-2">
                        {categoryTopics.map(topic => (
                          <button
                            key={topic.id}
                            onClick={() => setSelectedTopic(topic)}
                            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                          >
                            <div>
                              <p className="font-medium text-gray-900 group-hover:text-blue-600">
                                {topic.title}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">{topic.description}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {filteredTopics.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No articles found. Try a different search term.</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Article View */}
                <button
                  onClick={() => setSelectedTopic(null)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 text-sm font-medium"
                >
                  ← Back to all topics
                </button>

                <article className="prose prose-sm max-w-none">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedTopic.title}</h1>
                  <p className="text-gray-600 mb-6">{selectedTopic.description}</p>

                  {selectedTopic.videoUrl && (
                    <div className="bg-gray-100 rounded-lg p-4 mb-6 flex items-center gap-3">
                      <Video className="w-6 h-6 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Video Tutorial Available</p>
                        <a
                          href={selectedTopic.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          Watch now <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap text-gray-700">{selectedTopic.content}</div>

                  {selectedTopic.relatedArticles && selectedTopic.relatedArticles.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Articles</h3>
                      <div className="space-y-2">
                        {selectedTopic.relatedArticles.map(articleId => {
                          const article = helpTopics.find(t => t.id === articleId);
                          if (!article) return null;
                          return (
                            <button
                              key={articleId}
                              onClick={() => setSelectedTopic(article)}
                              className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                            >
                              <span className="text-sm text-gray-700">{article.title}</span>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </article>

                {/* Feedback */}
                <div className="mt-8 pt-8 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600 mb-3">Was this article helpful?</p>
                  <div className="flex items-center justify-center gap-3">
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      👍 Yes
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      👎 No
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-200 mt-4">
            <p className="text-xs text-gray-500 text-center">
              Still need help?{' '}
              <button className="text-blue-600 hover:underline font-medium">
                Contact Support
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContextualHelp;

