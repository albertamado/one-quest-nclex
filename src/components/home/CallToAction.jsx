import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function CallToAction() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      ></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Ready to Start Your NCLEX Journey?
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-10">
            Join thousands of successful nurses who chose One Quest Review Center. 
            Your nursing career starts with passing the NCLEX - we'll help you get there.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <div className="flex items-center text-white">
              <CheckCircle className="w-6 h-6 mr-3 text-green-300" />
              <span className="text-lg font-medium">98% Success Rate</span>
            </div>
            <div className="flex items-center text-white">
              <CheckCircle className="w-6 h-6 mr-3 text-green-300" />
              <span className="text-lg font-medium">Expert Instructors</span>
            </div>
            <div className="flex items-center text-white">
              <CheckCircle className="w-6 h-6 mr-3 text-green-300" />
              <span className="text-lg font-medium">24/7 Support</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to={createPageUrl("Programs")}
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl group"
            >
              Explore Programs
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              to={createPageUrl("Contact")}
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-200"
            >
              Get Free Consultation
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}