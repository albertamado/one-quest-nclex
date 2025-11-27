import React from "react";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "RN, Johns Hopkins Hospital",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
    content: "One Quest Review Center was instrumental in my NCLEX success. The instructors were knowledgeable and the practice questions were spot-on. I passed on my first try!",
    rating: 5
  },
  {
    name: "Michael Rodriguez",
    role: "RN, Mayo Clinic",
    image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face", 
    content: "The personalized study plan made all the difference. I felt confident and well-prepared on exam day. Highly recommend this program to any nursing student.",
    rating: 5
  },
  {
    name: "Emily Johnson",
    role: "RN, Cleveland Clinic", 
    image: "https://images.unsplash.com/photo-1594824929818-a71b3c0b8810?w=150&h=150&fit=crop&crop=face",
    content: "Amazing support system and excellent resources. The instructors truly care about your success. Worth every penny for the quality of education you receive.",
    rating: 5
  }
];

export default function TestimonialSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            What Our Graduates Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what our successful graduates have to say about their experience.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <Quote className="w-8 h-8 text-blue-500 opacity-50" />
                </div>

                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center">
                  <img 
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-slate-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}