import { Link } from 'react-router-dom';
import { Bus, Shield, Clock, MapPin, Users, ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  const features = [
    { icon: Bus, title: 'Vehicle Booking', desc: 'Easy online booking for official visits and field trips' },
    { icon: Shield, title: 'Multi-Level Approval', desc: 'HOD approval and Transport Officer allocation workflow' },
    { icon: Clock, title: 'Real-Time Tracking', desc: 'Track trip status from assignment to completion' },
    { icon: MapPin, title: 'Fleet Management', desc: 'Comprehensive vehicle and driver management' },
    { icon: Users, title: 'Role-Based Access', desc: 'Secure access for Faculty, HOD, Transport & Admin' },
    { icon: CheckCircle, title: 'Conflict Detection', desc: 'Automatic detection of booking conflicts' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">BIT Fleet Portal</h1>
              <p className="text-xs text-slate-400">Vehicle Booking System</p>
            </div>
          </div>
          <Link
            to="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/20 text-blue-300 text-xs font-medium mb-6 border border-blue-500/20">
            <Bus className="w-3.5 h-3.5" />
            Bannari Amman Institute of Technology
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight max-w-3xl mx-auto">
            Centralized Vehicle Fleet
            <span className="text-blue-400"> Booking Portal</span>
          </h2>
          <p className="text-lg text-slate-300 mt-6 max-w-2xl mx-auto">
            Streamlined vehicle booking, approval, allocation, and tracking
            for faculty official visits and field trips.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-600/30"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">Key Features</h3>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Everything you need to manage your institution's vehicle fleet efficiently
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all group">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                  <f.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{f.title}</h4>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">How It Works</h3>
            <p className="text-gray-500 mt-3">Simple 5-step booking workflow</p>
          </div>
          <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Request', desc: 'Faculty submits booking' },
              { step: '2', title: 'Approve', desc: 'HOD reviews & approves' },
              { step: '3', title: 'Allocate', desc: 'Transport assigns vehicle' },
              { step: '4', title: 'Travel', desc: 'Driver updates trip status' },
              { step: '5', title: 'Complete', desc: 'Trip recorded in history' },
            ].map((s, i) => (
              <div key={i} className="flex-1 text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-3">
                  {s.step}
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">{s.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
                {i < 4 && <div className="hidden md:block mt-6 border-t-2 border-dashed border-blue-200 mx-4" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-400">
            © 2026 Bannari Amman Institute of Technology, Sathyamangalam. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
