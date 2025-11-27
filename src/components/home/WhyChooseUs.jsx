import React from "react";
import { Target, Award, Heart, TrendingUp, Users, BookOpen } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Proven Methodology",
    description: "Our time-tested approach has helped thousands pass their NCLEX on the first try.",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: Award,
    title: "Expert Instructors",
    description: "Learn from experienced nurses and educators who know exactly what it takes to succeed.",
    color: "from-green-500 to-green-600"
  },
  {
    icon: Heart,
    title: "Personalized Support",
    description: "Get individualized attention and support tailored to your specific learning needs.",
    color: "from-red-500 to-red-600"
  },
  {
    icon: TrendingUp,
    title: "Continuous Progress Tracking",
    description: "Monitor your improvement with detailed analytics and performance insights.",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: Users,
    title: "Study Community",
    description: "Connect with fellow students for motivation, support, and collaborative learning.",
    color: "from-orange-500 to-orange-600"
  },
  {
    icon: BookOpen,
    title: "Comprehensive Resources",
    description: "Access extensive study materials, practice questions, and reference guides.",
    color: "from-teal-500 to-teal-600"
  }
];

export default function WhyChooseUs() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Why Choose One Quest Review Center?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We go beyond traditional test preparation to provide a comprehensive learning experience 
            that sets you up for long-term success in your nursing career.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group">
              <div className="relative bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}