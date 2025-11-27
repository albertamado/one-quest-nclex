import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Clock, Users, CheckCircle, ArrowRight } from "lucide-react";

const programs = [
  {
    title: "NCLEX-RN Review Course",
    description: "Comprehensive review program for registered nurse candidates with expert-led sessions and personalized study plans.",
    duration: "8 weeks",
    students: "2,500+ enrolled",
    features: [
      "Live interactive sessions",
      "Unlimited practice questions",
      "Personalized study plan",
      "Expert instructors"
    ],
    price: "$599",
    popular: true,
    gradient: "from-blue-500 to-blue-600"
  },
  {
    title: "NCLEX-PN Review Course", 
    description: "Specialized program for practical nurse candidates with focused content review and test-taking strategies.",
    duration: "6 weeks",
    students: "1,200+ enrolled", 
    features: [
      "Content review sessions",
      "Practice examinations",
      "Study materials included",
      "Small class sizes"
    ],
    price: "$399",
    popular: false,
    gradient: "from-teal-500 to-teal-600"
  },
  {
    title: "Intensive Bootcamp",
    description: "Fast-track preparation for students who need to pass quickly with intensive study sessions and focused review.",
    duration: "2 weeks",
    students: "800+ enrolled",
    features: [
      "Intensive daily sessions",
      "Rapid content review",
      "Mock examinations",
      "Priority support"
    ],
    price: "$299",
    popular: false,
    gradient: "from-purple-500 to-purple-600"
  }
];

export default function ProgramsPreview() {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Choose Your Path to Success
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our expertly designed programs cater to different learning styles and timelines. 
            Find the perfect fit for your NCLEX preparation journey.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {programs.map((program, index) => (
            <div key={index} className={`relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group ${program.popular ? 'ring-2 ring-blue-500 ring-opacity-20' : ''}`}>
              {program.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 text-sm font-semibold rounded-bl-2xl">
                  Most Popular
                </div>
              )}
              
              <div className="p-8">
                <div className={`w-16 h-16 bg-gradient-to-br ${program.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300`}>
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-slate-900 mb-4">{program.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{program.description}</p>

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm">{program.duration}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">{program.students}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {program.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-slate-900">{program.price}</div>
                  <Link 
                    to={createPageUrl("Programs")}
                    className={`inline-flex items-center px-6 py-3 bg-gradient-to-r ${program.gradient} text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 group-hover:scale-105`}
                  >
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link 
            to={createPageUrl("Programs")}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
          >
            View All Programs
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}