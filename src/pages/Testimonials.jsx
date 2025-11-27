
import React from "react";
import { Star, Quote } from "lucide-react";
import { createPageUrl } from "@/utils";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "RN, Johns Hopkins Hospital",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
    content: "One Quest Review Center was instrumental in my NCLEX success. The instructors were knowledgeable and the practice questions were spot-on. I passed on my first try with confidence!",
    rating: 5,
    course: "NCLEX-RN Review Course"
  },
  {
    name: "Michael Rodriguez",
    role: "RN, Mayo Clinic",
    image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face", 
    content: "The personalized study plan made all the difference. I felt confident and well-prepared on exam day. The support system here is incredible. Highly recommend!",
    rating: 5,
    course: "NCLEX-RN Review Course"
  },
  {
    name: "Emily Johnson",
    role: "RN, Cleveland Clinic", 
    image: "https://images.unsplash.com/photo-1594824929818-a71b3c0b8810?w=150&h=150&fit=crop&crop=face",
    content: "Amazing support system and excellent resources. The instructors truly care about your success. Worth every penny for the quality of education you receive.",
    rating: 5,
    course: "NCLEX-RN Review Course"
  },
  {
    name: "David Kim",
    role: "LPN, Community Health Center",
    image: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&h=150&fit=crop&crop=face",
    content: "The NCLEX-PN program was exactly what I needed. Focused content, great instructors, and a supportive community. Passed on my first attempt!",
    rating: 5,
    course: "NCLEX-PN Review Course"
  },
  {
    name: "Jessica Martinez",
    role: "RN, Stanford Health",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
    content: "The intensive bootcamp was perfect for my tight schedule. Two weeks of focused study and I was ready. The mock exams were incredibly helpful.",
    rating: 5,
    course: "Intensive Bootcamp"
  },
  {
    name: "Robert Taylor",
    role: "RN, Massachusetts General",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    content: "Best decision I made for my nursing career. The comprehensive approach and expert guidance made all the difference. Thank you One Quest!",
    rating: 5,
    course: "NCLEX-RN Review Course"
  }
];

export default function Testimonials() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Student Success Stories
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what our successful graduates have to say about their experience with One Quest Review Center.
          </p>
          
          <div className="flex items-center justify-center gap-2 mt-8">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
              ))}
            </div>
            <span className="text-lg font-semibold text-gray-700">5.0 out of 5</span>
            <span className="text-gray-500">• Based on 500+ reviews</span>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="p-8">
                {/* Quote Icon */}
                <div className="flex items-center justify-between mb-6">
                  <Quote className="w-10 h-10 text-blue-500 opacity-50" />
                  <div className="flex items-center">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>

                {/* Content */}
                <p className="text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                  <img 
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <p className="text-xs text-blue-600 mt-1">{testimonial.course}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center bg-white rounded-2xl shadow-lg p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Write Your Success Story?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of successful nurses who chose One Quest Review Center
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={createPageUrl("Programs")}
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all duration-200 shadow-lg"
            >
              View Programs
            </a>
            <a
              href={createPageUrl("Contact")}
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all duration-200"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
