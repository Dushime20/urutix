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
      title: 'Smart Route Planning',
      description: 'We find the fastest and most cost-effective routes for your cargo, saving you time and money',
      icon: <Brain className="w-12 h-12 text-primary-600" />,
      color: 'green'
    },
    {
      title: 'Track Every Step',
      description: 'Know exactly where your cargo is at all times with real-time updates sent straight to your phone',
      icon: <Eye className="w-12 h-12 text-primary-600" />,
      color: 'green'
    },
    {
      title: 'Easy Payments',
      description: 'Pay securely online, get instant receipts, and manage all your shipping expenses in one place',
      icon: <DollarSign className="w-12 h-12 text-primary-600" />,
      color: 'green'
    }
  ];

  const competitiveAdvantages = [
    {
      title: 'Quick & Easy Booking',
      description: 'Get your cargo booked in just 2 minutes. No long forms or complicated processes',
      icon: <Timer className="w-8 h-8 text-primary-600" />,
      metric: '2 min'
    },
    {
      title: 'Great Prices',
      description: 'Save up to 30% on shipping costs with our smart pricing and route optimization',
      icon: <TrendingUp className="w-8 h-8 text-primary-600" />,
      metric: '30% savings'
    },
    {
      title: 'Always Know Where It Is',
      description: 'Get updates every 30 seconds so you always know your cargo is safe and on track',
      icon: <MapPin className="w-8 h-8 text-primary-600" />,
      metric: '99.9% accuracy'
    },
    {
      title: 'We Go Everywhere',
      description: 'Our network covers all major routes across East Africa, so we can reach your destination',
      icon: <Map className="w-8 h-8 text-primary-600" />,
      metric: '100% coverage'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Kimani',
      company: 'Kimani Exports Ltd',
      rating: 5,
      text: 'UrutiX made shipping so much easier for us. Our deliveries are faster and we\'re saving money too. Couldn\'t be happier!'
    },
    {
      name: 'David Mutua',
      company: 'East African Traders',
      rating: 5,
      text: 'The best part is how simple it is. We always find the right truck at a great price, and it only takes a few minutes.'
    },
    {
      name: 'Grace Wanjiku',
      company: 'Wanjiku Distributors',
      rating: 5,
      text: 'I love being able to see where my cargo is at any time. It gives me peace of mind, and my customers appreciate the updates too.'
    }
  ];

  const steps = [
    {
      step: '01',
      title: 'Tell Us What You Need',
      description: 'Simply enter your cargo details and we\'ll show you instant quotes from trusted carriers',
      icon: <Smartphone className="w-12 h-12 text-primary-600" />
    },
    {
      step: '02', 
      title: 'We Find the Perfect Match',
      description: 'Our system finds the best truck and route for your cargo, balancing speed and cost',
      icon: <Cpu className="w-12 h-12 text-primary-600" />
    },
    {
      step: '03',
      title: 'Track & Relax',
      description: 'Watch your cargo move in real-time and get notified when it safely arrives',
      icon: <Gauge className="w-12 h-12 text-primary-600" />
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
    <div className="min-h-screen bg-white  text-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-primary-50 to-primary-50">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 1000 600" fill="none">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#00897b" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Floating Elements */}
            <g className="animate-pulse">
              <circle cx="100" cy="100" r="20" fill="#00897b" opacity="0.1"/>
              <circle cx="900" cy="150" r="15" fill="#00897b" opacity="0.08"/>
              <circle cx="200" cy="400" r="25" fill="#00897b" opacity="0.05"/>
              <circle cx="800" cy="450" r="18" fill="#00897b" opacity="0.12"/>
            </g>
            
            {/* Route Lines */}
            <path d="M50 300 Q250 200 500 280 T950 320" stroke="#00897b" strokeWidth="2" opacity="0.1" fill="none"/>
            <path d="M80 350 Q300 250 600 330 T920 370" stroke="#00897b" strokeWidth="2" opacity="0.08" fill="none"/>
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-gray-900">
              <div className="inline-flex items-center px-4 py-2 bg-primary-100 rounded-full text-sm font-semibold mb-6 text-primary-700 border border-primary-200">
                <Award className="w-4 h-4 mr-2 text-primary-600" />
                Trusted by 10,000+ Businesses Across East Africa
              </div>
              
              <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight  text-gray-900">
                Ship Your Cargo
                <span className="block text-primary-600">
                  Simply & Safely
                </span>
              </h1>
              
              <p className="text-lg md:text-xl mb-8 text-gray-600 leading-relaxed font-normal">
                We make shipping easy. Get instant quotes, track your cargo in real-time, and enjoy peace of mind knowing your goods are in good hands. Join thousands of happy customers who trust us with their shipments.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={handleShowLogin}
                  className="group inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-primary-700 transition-all duration-300 transform hover:scale-105 text-base "
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button 
                  onClick={() => {
                    const element = document.getElementById('how-it-works');
                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-primary-600 text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-all duration-300 text-base "
                >
                  <PlayCircle className="mr-2 w-5 h-5" />
                  See How It Works
                </button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 ">
                {stats.map((stat, idx) => (
                  <div key={idx} className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-primary-100">
                    <div className="flex justify-center mb-2 text-primary-600">
                      {stat.icon}
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <svg width="500" height="400" viewBox="0 0 500 400" className="w-full max-w-lg">
                  {/* Dashboard Background */}
                  <rect x="50" y="50" width="400" height="300" rx="20" fill="url(#dashboardGradient)" stroke="#00897b" strokeWidth="2"/>
                  
                  {/* Header */}
                  <rect x="70" y="70" width="360" height="40" rx="8" fill="white" opacity="0.95"/>
                  <circle cx="90" cy="90" r="8" fill="#00897b"/>
                  <rect x="110" y="85" width="100" height="10" rx="5" fill="#6B7280"/>
                  <rect x="330" y="85" width="80" height="10" rx="5" fill="#00897b"/>
                  
                  {/* Map Section */}
                  <rect x="70" y="130" width="200" height="150" rx="12" fill="white" opacity="0.98"/>
                  <path d="M90 180 Q140 160 180 180 Q220 200 240 180" stroke="#00897b" strokeWidth="3" fill="none"/>
                  <circle cx="90" cy="180" r="6" fill="#ef4444"/>
                  <circle cx="180" cy="180" r="6" fill="#00897b"/>
                  <circle cx="240" cy="180" r="6" fill="#f59e0b"/>
                  
                  {/* Truck Animation */}
                  <g className="animate-pulse">
                    <rect x="130" y="170" width="20" height="12" rx="2" fill="#00897b"/>
                    <circle cx="135" cy="185" r="3" fill="#1F2937"/>
                    <circle cx="145" cy="185" r="3" fill="#1F2937"/>
                  </g>
                  
                  {/* Stats Cards */}
                  <rect x="290" y="130" width="140" height="60" rx="10" fill="white" opacity="0.98"/>
                  <rect x="310" y="145" width="100" height="8" rx="4" fill="#00897b"/>
                  <rect x="310" y="160" width="80" height="6" rx="3" fill="#6B7280"/>
                  
                  <rect x="290" y="210" width="140" height="70" rx="10" fill="white" opacity="0.98"/>
                  <circle cx="320" cy="235" r="15" fill="#00897b" opacity="0.2"/>
                  <CheckCircle className="w-6 h-6 text-primary-500" style={{transform: 'translate(308px, 223px)'}}/>
                  <rect x="310" y="255" width="100" height="6" rx="3" fill="#00897b"/>
                  <rect x="310" y="265" width="80" height="6" rx="3" fill="#6B7280"/>
                  
                  <defs>
                    <linearGradient id="dashboardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor: '#ffffff', stopOpacity: 0.95}} />
                      <stop offset="100%" style={{stopColor: '#b3e8e0', stopOpacity: 0.95}} />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Floating Elements */}
                <div className="absolute -top-4 -left-4 bg-white rounded-lg p-3 shadow-xl animate-bounce border border-primary-200">
                  <Zap className="w-6 h-6 text-primary-600" />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white rounded-lg p-3 shadow-xl animate-pulse border border-primary-200">
                  <Shield className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 ">
              Why People Love Us
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto font-normal">
              We're here to make shipping simple, reliable, and stress-free. No complicated processes, just straightforward solutions that work.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className={`relative p-8 rounded-2xl transition-all duration-300 cursor-pointer  border border-gray-100 hover:border-primary-500 hover:border-2 ${
                  activeFeature === idx 
                    ? 'bg-primary-50 shadow-2xl scale-105' 
                    : 'bg-white shadow-lg hover:shadow-xl'
                }`}
                onClick={() => setActiveFeature(idx)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`mb-6 p-4 rounded-xl ${activeFeature === idx ? 'bg-primary-100' : 'bg-primary-50'}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 ">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed font-normal">{feature.description}</p>
                </div>
                
                {activeFeature === idx && (
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-primary-600 text-white p-2 rounded-full shadow-lg">
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
      <section className="py-20 bg-primary-50 ">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 ">
              What Makes Us Different
            </h2>
            <p className="text-lg text-gray-600 font-normal">
              Simple, reliable, and built with you in mind
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {competitiveAdvantages.map((advantage, idx) => (
              <div key={idx} className="group relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-primary-100 hover:border-primary-300 ">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 p-3 bg-primary-100 rounded-xl group-hover:scale-110 transition-transform">
                    {advantage.icon}
                  </div>
                  <div className="text-2xl font-bold text-primary-600 mb-2">{advantage.metric}</div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3 ">{advantage.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed font-normal">{advantage.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white ">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 ">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 font-normal">
              Three simple steps to get your cargo moving
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-primary-300 to-primary-400 transform -translate-y-1/2"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {steps.map((step, idx) => (
                <div key={idx} className="relative flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-primary-50 rounded-full shadow-lg flex items-center justify-center border-4 border-primary-100 relative z-10">
                      {step.icon}
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 ">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed max-w-sm font-normal">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-primary-50 ">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 ">
              What Our Customers Say
            </h2>
            <p className="text-lg text-gray-600 font-normal">
              Real stories from people who use UrutiX every day
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-primary-100 hover:border-primary-300 ">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic leading-relaxed font-normal">"{testimonial.text}"</p>
                <div className="border-t border-primary-100 pt-4">
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700 relative overflow-hidden ">
        <div className="absolute inset-0 bg-white/5"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 ">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-white/90 mb-8 leading-relaxed font-normal">
            Join thousands of businesses who trust us with their shipments. 
            Start shipping today—it's free to get started!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleShowLogin}
              className="group inline-flex items-center justify-center px-10 py-4 bg-white text-primary-600 font-semibold rounded-xl shadow-2xl hover:shadow-white/25 transition-all duration-300 transform hover:scale-105 text-base "
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button className="inline-flex items-center justify-center px-10 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 text-base ">
              Schedule a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Contact Footer */}
      <section className="py-16 bg-gray-900 text-white ">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-xl font-bold mb-6  text-white">UrutiX</h3>
              <p className="text-gray-300 leading-relaxed mb-6 font-normal">
                Making shipping simple and reliable across East Africa. We're here to help your business grow.
              </p>
              <div className="flex space-x-4 ">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center hover:bg-primary-700 transition-colors cursor-pointer">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center hover:bg-primary-700 transition-colors cursor-pointer">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center hover:bg-primary-700 transition-colors cursor-pointer">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6  text-white">Quick Links</h4>
              <ul className="space-y-3 text-gray-300 font-normal">
                <li><span className="cursor-default">How It Works</span></li>
                <li><span className="cursor-default">Pricing</span></li>
                <li><span className="cursor-default">Support</span></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6  text-white">Contact Us</h4>
              <div className="space-y-4 text-gray-300 font-normal">
                <div className="flex items-center">
                  <Globe className="w-5 h-5 mr-3 text-primary-400" />
                  <a href="https://urutihub.com" className="hover:text-primary-400 transition-colors">urutihub.com</a>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-3 text-primary-400" />
                  <a href="mailto:info@urutihub.com" className="hover:text-primary-400 transition-colors">info@urutihub.com</a>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-3 text-primary-400" />
                  <span className="">East Africa Region</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400 ">
            <p>&copy; 2025 UrutiX. All rights reserved. Making shipping simple, one delivery at a time.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
