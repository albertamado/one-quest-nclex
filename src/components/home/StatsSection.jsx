import React from "react";
import { Users, Trophy, BookOpen, Award } from "lucide-react";

const stats = [
  {
    icon: Users,
    number: "5,000+",
    label: "Successful Graduates",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: Trophy,
    number: "98%",
    label: "First-Time Pass Rate", 
    color: "from-green-500 to-green-600"
  },
  {
    icon: BookOpen,
    number: "15+",
    label: "Years of Excellence",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: Award,
    number: "24/7",
    label: "Student Support",
    color: "from-orange-500 to-orange-600"
  }
];

export default function StatsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Trusted by Thousands of Nurses
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our proven track record speaks for itself. Join the community of successful NCLEX graduates.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="relative mb-6">
                <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${stat.color} rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 flex items-center justify-center group-hover:scale-105`}>
                  <stat.icon className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="text-4xl lg:text-5xl font-bold text-slate-900 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}