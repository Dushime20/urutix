import React, { useState, useEffect } from 'react';
import { 
  Truck, Package, MapPin, Brain, Receipt, ShoppingCart, ShieldCheck, 
  ArrowRight, Mail, Globe, Map, Star, Users, Clock, BarChart3, 
  Zap, Shield, CheckCircle, PlayCircle, TrendingUp, Award, 
  Smartphone, Cpu, Eye, DollarSign, Timer, Gauge 
} from 'lucide-react';

interface HomeProps {
  onShowLogin?: () => void;
  onShowFreeTrial?: () => void;
}

const Home: React.FC<HomeProps> = ({ onShowLogin, onShowFreeTrial }) => {
  const [activeFeature, setActiveFeature] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { number: '10K+', label: 'Active Trucks', icon: <Truck className="w-6 h-6" /> },
    { number: '50K+', label: 'Shipments Delivered', icon: <Package className="w-6 h-6" /> },
    { number: '99.8%', label: 'On-Time Delivery', icon: <Clock className="w-6 h-6" /> },
    { number: '24/7', label: 'Customer Support', icon: <Users className="w-6 h-6" /> }
  ];

  const features = [
    {
      title: 'AI-Powered Route Optimization',
      description: 'Our advanced AI reduces delivery time by 40% and fuel costs by 25%',
      icon: <Brain className="w-12 h-12 text-purple-500" />,
      color: 'purple'
    },
    {
      title: 'Real-Time Cargo Intelligence',
      description: 'Live tracking with predictive analytics and automated alerts',
      icon: <Eye className="w-12 h-12 text-blue-500" />,
      color: 'blue'
    },
    {
      title: 'Integrated Payment Ecosystem',
      description: 'Seamless payments, instant invoicing, and financial insights',
      icon: <DollarSign className="w-12 h-12 text-green-500" />,
      color: 'green'
    }
  ];

  const competitiveAdvantages = [
    {
      title: 'Fastest Booking',
      description: 'Book cargo in under 2 minutes vs industry average of 15 minutes',
      icon: <Timer className="w-8 h-8 text-orange-500" />,
      metric: '2 min'
    },
    {
      title: 'Best Pricing',
      description: 'Up to 30% cost savings through smart route optimization',
      icon: <TrendingUp className="w-8 h-8 text-green-500" />,
      metric: '30% savings'
    },
    {
      title: 'Superior Tracking',
      description: 'Real-time updates every 30 seconds with 99.9% accuracy',
      icon: <MapPin className="w-8 h-8 text-blue-500" />,
      metric: '99.9% accuracy'
    },
    {
      title: 'Comprehensive Coverage',
      description: 'Largest network covering all major East African routes',
      icon: <Map className="w-8 h-8 text-purple-500" />,
      metric: '100% coverage'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Kimani',
      company: 'Kimani Exports Ltd',
      rating: 5,
      text: 'Uruti Cargo transformed our logistics. 40% faster deliveries and incredible cost savings!'
    },
    {
      name: 'David Mutua',
      company: 'East African Traders',
      rating: 5,
      text: 'The AI matching is genius. Always gets us the perfect truck at the best price.'
    },
    {
      name: 'Grace Wanjiku',
      company: 'Wanjiku Distributors',
      rating: 5,
      text: 'Real-time tracking gives us complete peace of mind. Our customers love the transparency.'
    }
  ];

  // Helper to handle login button click
  const handleShowLogin = () => {
    if (onShowLogin) {
      onShowLogin();
    } else {
      window.location.href = '/auth';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e293b] via-[#7c3aed] to-[#f59e42] font-[Poppins] text-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1e293b] via-[#7c3aed] to-[#f59e42]">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Animated Background SVG */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1000 600" fill="none">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Floating Elements */}
            <g className="animate-pulse">
              <circle cx="100" cy="100" r="20" fill="white" opacity="0.3"/>
              <circle cx="900" cy="150" r="15" fill="white" opacity="0.2"/>
              <circle cx="200" cy="400" r="25" fill="white" opacity="0.1"/>
              <circle cx="800" cy="450" r="18" fill="white" opacity="0.25"/>
            </g>
            
            {/* Route Lines */}
            <path d="M50 300 Q250 200 500 280 T950 320" stroke="white" strokeWidth="2" opacity="0.3" fill="none"/>
            <path d="M80 350 Q300 250 600 330 T920 370" stroke="white" strokeWidth="2" opacity="0.2" fill="none"/>
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <div className="inline-flex items-center px-4 py-2 bg-[#f59e42]/80 backdrop-blur-sm rounded-full text-sm font-semibold mb-6 text-[#1e293b]">
                <Award className="w-4 h-4 mr-2" />
                #1 Digital Logistics Platform in East Africa
              </div>
              
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight font-[Poppins] text-[#f59e42] drop-shadow-lg">
                UrutiX, The Future of
                <span className="block bg-gradient-to-r from-[#f59e42] to-[#7c3aed] bg-clip-text text-transparent">
                  Cargo Logistics
                </span>
                is Here
              </h1>
              
              <p className="text-xl md:text-2xl mb-8 text-[#f3f4f6] leading-relaxed font-medium">
                Experience lightning-fast bookings, AI-powered matching, and real-time tracking. 
                Join 10,000+ businesses already moving smarter with Uruti Cargo.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={handleShowLogin}
                  className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#f59e42] to-[#7c3aed] text-white font-bold rounded-xl shadow-2xl hover:shadow-[#f59e42]/25 transition-all duration-300 transform hover:scale-105 text-lg font-[Poppins]"
                >
                  Start Shipping Now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button className="inline-flex items-center justify-center px-8 py-4 bg-[#1e293b]/20 backdrop-blur-sm border border-[#f59e42]/30 text-white font-semibold rounded-xl hover:bg-[#1e293b]/30 transition-all duration-300 text-lg font-[Poppins]">
                  <PlayCircle className="mr-2 w-5 h-5" />
                  Watch Demo
                </button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-[Poppins]">
                {stats.map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <div className="flex justify-center mb-2 text-orange-300">
                      {stat.icon}
                    </div>
                    <div className="text-2xl md:text-3xl font-bold">{stat.number}</div>
                    <div className="text-sm text-blue-200">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <svg width="500" height="400" viewBox="0 0 500 400" className="w-full max-w-lg">
                  {/* Dashboard Background */}
                  <rect x="50" y="50" width="400" height="300" rx="20" fill="url(#dashboardGradient)" stroke="white" strokeWidth="2"/>
                  
                  {/* Header */}
                  <rect x="70" y="70" width="360" height="40" rx="8" fill="white" opacity="0.9"/>
                  <circle cx="90" cy="90" r="8" fill="#3B82F6"/>
                  <rect x="110" y="85" width="100" height="10" rx="5" fill="#6B7280"/>
                  <rect x="330" y="85" width="80" height="10" rx="5" fill="#10B981"/>
                  
                  {/* Map Section */}
                  <rect x="70" y="130" width="200" height="150" rx="12" fill="white" opacity="0.95"/>
                  <path d="M90 180 Q140 160 180 180 Q220 200 240 180" stroke="#3B82F6" strokeWidth="3" fill="none"/>
                  <circle cx="90" cy="180" r="6" fill="#EF4444"/>
                  <circle cx="180" cy="180" r="6" fill="#10B981"/>
                  <circle cx="240" cy="180" r="6" fill="#F59E0B"/>
                  
                  {/* Truck Animation */}
                  <g className="animate-pulse">
                    <rect x="130" y="170" width="20" height="12" rx="2" fill="#3B82F6"/>
                    <circle cx="135" cy="185" r="3" fill="#1F2937"/>
                    <circle cx="145" cy="185" r="3" fill="#1F2937"/>
                  </g>
                  
                  {/* Stats Cards */}
                  <rect x="290" y="130" width="140" height="60" rx="10" fill="white" opacity="0.95"/>
                  <rect x="310" y="145" width="100" height="8" rx="4" fill="#3B82F6"/>
                  <rect x="310" y="160" width="80" height="6" rx="3" fill="#6B7280"/>
                  
                  <rect x="290" y="210" width="140" height="70" rx="10" fill="white" opacity="0.95"/>
                  <circle cx="320" cy="235" r="15" fill="#10B981" opacity="0.2"/>
                  <CheckCircle className="w-6 h-6 text-green-500" style={{transform: 'translate(308px, 223px)'}}/>
                  <rect x="310" y="255" width="100" height="6" rx="3" fill="#10B981"/>
                  <rect x="310" y="265" width="80" height="6" rx="3" fill="#6B7280"/>
                  
                  <defs>
                    <linearGradient id="dashboardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor: '#1E40AF', stopOpacity: 0.9}} />
                      <stop offset="100%" style={{stopColor: '#7C3AED', stopOpacity: 0.9}} />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Floating Elements */}
                <div className="absolute -top-4 -left-4 bg-white rounded-lg p-3 shadow-xl animate-bounce">
                  <Zap className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white rounded-lg p-3 shadow-xl animate-pulse">
                  <Shield className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-20 bg-[#f3f4f6]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#1e293b] mb-4 font-[Poppins]">
              Why Choose UrutiX?
            </h2>
            <p className="text-xl text-[#7c3aed] max-w-3xl mx-auto font-medium">
              We don't just move cargo—we revolutionize how logistics works with cutting-edge technology and unmatched service.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className={`relative p-8 rounded-2xl transition-all duration-300 cursor-pointer font-[Poppins] ${
                  activeFeature === idx 
                    ? 'bg-white shadow-2xl scale-105 border-2 border-[#f59e42]' 
                    : 'bg-white shadow-lg hover:shadow-xl'
                }`}
                onClick={() => setActiveFeature(idx)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`mb-6 p-4 rounded-xl bg-[#f3f4f6]`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-[#1e293b] mb-4 font-[Poppins]">{feature.title}</h3>
                  <p className="text-[#7c3aed] leading-relaxed font-medium">{feature.description}</p>
                </div>
                
                {activeFeature === idx && (
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-gradient-to-r from-orange-400 to-pink-500 text-white p-2 rounded-full">
                      <Star className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive Advantages */}
      <section className="py-20 bg-white font-[Poppins]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#1e293b] mb-4 font-[Poppins]">
              We Outperform the Competition
            </h2>
            <p className="text-xl text-[#7c3aed] font-medium">
              Here's how we stack up against other logistics platforms
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {competitiveAdvantages.map((advantage, idx) => (
              <div key={idx} className="group relative bg-gradient-to-br from-[#f3f4f6] to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-[#f59e42]/20 font-[Poppins]">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 p-3 bg-[#f3f4f6] rounded-xl shadow-md group-hover:scale-110 transition-transform">
                    {advantage.icon}
                  </div>
                  <div className="text-3xl font-bold text-[#f59e42] mb-2">{advantage.metric}</div>
                  <h3 className="text-lg font-semibold text-[#1e293b] mb-3 font-[Poppins]">{advantage.title}</h3>
                  <p className="text-[#7c3aed] text-sm leading-relaxed font-medium">{advantage.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-[#f3f4f6] via-[#ede9fe] to-[#f3f4f6] font-[Poppins]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#1e293b] mb-4 font-[Poppins]">
              Ship in 3 Simple Steps
            </h2>
            <p className="text-xl text-[#7c3aed] font-medium">
              From booking to delivery, we make logistics effortless
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 transform -translate-y-1/2"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  step: '01',
                  title: 'Book Instantly',
                  description: 'Enter your cargo details and get instant quotes from verified carriers',
                  icon: <Smartphone className="w-12 h-12 text-blue-500" />
                },
                {
                  step: '02', 
                  title: 'AI Matches',
                  description: 'Our AI finds the perfect truck and route for optimal cost and delivery time',
                  icon: <Cpu className="w-12 h-12 text-purple-500" />
                },
                {
                  step: '03',
                  title: 'Track & Deliver',
                  description: 'Monitor your cargo in real-time until safe delivery with proof of delivery',
                  icon: <Gauge className="w-12 h-12 text-green-500" />
                }
              ].map((step, idx) => (
                <div key={idx} className="relative flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-gray-100 relative z-10">
                      {step.icon}
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-[#1e293b] mb-4 font-[Poppins]">{step.title}</h3>
                  <p className="text-[#7c3aed] leading-relaxed max-w-sm font-medium">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white font-[Poppins]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#1e293b] mb-4 font-[Poppins]">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-[#7c3aed] font-medium">
              See what our customers say about their experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-gradient-to-br from-[#f3f4f6] to-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-[#f59e42]/20 font-[Poppins]">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-[#7c3aed] mb-6 italic leading-relaxed font-medium">"{testimonial.text}"</p>
                <div className="border-t pt-4">
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#1e293b] via-[#7c3aed] to-[#f59e42] relative overflow-hidden font-[Poppins]">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 font-[Poppins]">
            Ready to Transform Your Logistics?
          </h2>
          <p className="text-xl text-[#f3f4f6] mb-8 leading-relaxed font-medium">
            Join thousands of businesses already saving time and money with Uruti Cargo. 
            Start your first shipment today—it's free to get started!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onShowFreeTrial || onShowLogin}
              className="group inline-flex items-center justify-center px-10 py-4 bg-gradient-to-r from-[#f59e42] to-[#7c3aed] text-white font-bold rounded-xl shadow-2xl hover:shadow-[#f59e42]/25 transition-all duration-300 transform hover:scale-105 text-lg font-[Poppins]"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button className="inline-flex items-center justify-center px-10 py-4 bg-[#1e293b]/20 backdrop-blur-sm border border-[#f59e42]/30 text-white font-semibold rounded-xl hover:bg-[#1e293b]/30 transition-all duration-300 text-lg font-[Poppins]">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Contact Footer */}
      <section className="py-16 bg-[#1e293b] text-white font-[Poppins]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-2xl font-extrabold mb-6 font-[Poppins]">Uruti Cargo</h3>
              <p className="text-[#f3f4f6] leading-relaxed mb-6 font-medium">
                East Africa's most advanced digital logistics platform. Moving cargo smarter, faster, safer.
              </p>
              <div className="flex space-x-4 font-[Poppins]">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6 font-[Poppins]">Quick Links</h4>
              <ul className="space-y-3 text-[#7c3aed] font-medium">
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6 font-[Poppins]">Contact Us</h4>
              <div className="space-y-4 text-[#f3f4f6] font-medium">
                <div className="flex items-center">
                  <Globe className="w-5 h-5 mr-3 text-blue-400" />
                  <a href="https://urutihub.com" className="hover:text-white transition-colors">urutihub.com</a>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-3 text-purple-400" />
                  <a href="mailto:info@urutihub.com" className="hover:text-white transition-colors">info@urutihub.com</a>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-3 text-green-400" />
                  <span className="font-[Poppins]">East Africa Region</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-[#7c3aed] mt-12 pt-8 text-center text-[#7c3aed] font-[Poppins]">
            <p>&copy; 2025 UrutiX. All rights reserved. Built for the future of logistics.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
