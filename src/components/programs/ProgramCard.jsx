import React from "react";
import { Clock, Users, CheckCircle, Star, Award } from "lucide-react";

export default function ProgramCard({ program }) {
  return (
    <div className={`bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${program.popular ? 'ring-2 ring-blue-500 ring-opacity-30' : ''}`}>
      {program.popular && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center py-3 font-semibold">
          🏆 Most Popular Choice
        </div>
      )}
      
      <div className="p-8 lg:p-12">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
          {/* Left Content */}
          <div>
            <div className={`inline-flex items-center px-4 py-2 bg-gradient-to-r ${program.gradient} bg-opacity-10 rounded-full mb-6`}>
              <Award className={`w-5 h-5 mr-2 bg-gradient-to-r ${program.gradient} bg-clip-text text-transparent`} />
              <span className={`font-semibold bg-gradient-to-r ${program.gradient} bg-clip-text text-transparent`}>
                {program.passRate} Success Rate
              </span>
            </div>

            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              {program.title}
            </h2>
            <p className="text-lg text-gray-600 mb-6">{program.subtitle}</p>
            
            <p className="text-gray-700 leading-relaxed mb-8">
              {program.description}
            </p>

            {/* Program Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center text-gray-600">
                <Clock className="w-5 h-5 mr-3 text-blue-500" />
                <div>
                  <div className="font-medium text-slate-900">{program.duration}</div>
                  <div className="text-sm">Duration</div>
                </div>
              </div>
              <div className="flex items-center text-gray-600">
                <Users className="w-5 h-5 mr-3 text-green-500" />
                <div>
                  <div className="font-medium text-slate-900">{program.students}</div>
                  <div className="text-sm">Enrolled</div>
                </div>
              </div>
              <div className="flex items-center text-gray-600">
                <Star className="w-5 h-5 mr-3 text-yellow-500" />
                <div>
                  <div className="font-medium text-slate-900">{program.format}</div>
                  <div className="text-sm">Format</div>
                </div>
              </div>
            </div>

            {/* Highlights */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {program.highlights.map((highlight, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{highlight}</span>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-slate-900">${program.price}</div>
                <div className="text-gray-600">One-time payment</div>
              </div>
              <button className={`px-8 py-4 bg-gradient-to-r ${program.gradient} text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200`}>
                Enroll Now
              </button>
            </div>
          </div>

          {/* Right Content - Features List */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-6">What's Included:</h3>
            <div className="space-y-4">
              {program.features.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}