import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, CheckCircle, Star } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-teal-50 pt-20 pb-32">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      ></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="max-w-lg mx-auto lg:max-w-none lg:mx-0">
            <div className="flex items-center space-x-2 mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-600">Rated #1 NCLEX Review Center</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
              Pass Your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                NCLEX
              </span>{" "}
              with Confidence
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Join thousands of successful nurses who trusted One Quest Review Center. 
              Our proven methodology and expert instructors ensure your NCLEX success.
            </p>

            {/* Key Features */}
            <div className="space-y-4 mb-10">
              {[
                "98% First-Time Pass Rate",
                "Expert NCLEX Instructors", 
                "Personalized Study Plans",
                "Unlimited Practice Questions"
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to={createPageUrl("Programs")}
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
              >
                View Programs
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                to={createPageUrl("Contact")}
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-200"
              >
                Schedule Consultation
              </Link>
            </div>
          </div>

          {/* Right Content - Image/Visual */}
          <div className="mt-16 lg:mt-0 relative">
            <div className="relative">
              {/* Main Image Container */}
              <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-teal-100 rounded-3xl shadow-2xl overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=600&fit=crop&crop=face"
                    alt="Confident nurse celebrating NCLEX success"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Floating Success Badge */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-green-700">NCLEX Passed!</span>
                  </div>
                </div>

                {/* Floating Stats Card */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">98%</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                </div>
              </div>

              {/* Background Decorative Elements */}
              <div className="absolute -z-10 top-4 right-4 w-72 h-72 bg-gradient-to-br from-blue-200 to-teal-200 rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute -z-10 -bottom-8 -left-8 w-64 h-64 bg-gradient-to-br from-teal-200 to-blue-200 rounded-full opacity-20 blur-3xl"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}