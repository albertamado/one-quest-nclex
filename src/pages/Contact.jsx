
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities"; // Import User entity
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from "lucide-react";

export default function Contact() {
  const [currentUser, setCurrentUser] = useState(null); // State to store current user, initialized to null
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    program: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Try to get current user but don't redirect if not logged in
    const checkUser = async () => {
      try {
        // Attempt to fetch the current user
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        // User not logged in - this is fine for public pages.
        // Set currentUser to null explicitly to reflect no logged-in user.
        setCurrentUser(null);
        // Optionally log the error if debugging is needed, but don't block the page.
        // console.error("Failed to fetch current user:", error);
      }
    };
    checkUser();
  }, []); // Run once on component mount

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      // Optionally clear form data after submission
      setFormData({
        name: '',
        email: '',
        phone: '',
        program: '',
        message: ''
      });
    }, 3000);
    // In a real application, you would send formData to a backend here.
    console.log("Form submitted:", formData);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      content: "(555) 123-4567",
      subtitle: "Mon-Fri 9AM-6PM EST"
    },
    {
      icon: Mail,
      title: "Email", 
      content: "info@onequestrc.com",
      subtitle: "We reply within 24 hours"
    },
    {
      icon: MapPin,
      title: "Address",
      content: "123 Education Avenue",
      subtitle: "New York, NY 10001"
    },
    {
      icon: Clock,
      title: "Office Hours",
      content: "Monday - Friday",
      subtitle: "9:00 AM - 6:00 PM EST"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-20">
      {/* Hero Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              Get In Touch
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ready to start your NCLEX journey? Contact us today for a free consultation 
              and learn how we can help you achieve your nursing career goals.
            </p>
          </div>

          <div className="lg:grid lg:grid-cols-2 lg:gap-16">
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-8">Contact Information</h2>
              
              <div className="space-y-6 mb-12">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <info.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{info.title}</h3>
                      <p className="text-gray-900 font-medium">{info.content}</p>
                      <p className="text-gray-600 text-sm">{info.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Quick Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Free Consultation</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Flexible Payment Plans</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Money-back Guarantee</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">24/7 Student Support</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-8">Send us a Message</h2>
                
                {isSubmitted && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-green-700">Thank you! We'll get back to you soon.</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Program Interest
                      </label>
                      <select
                        name="program"
                        value={formData.program}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      >
                        <option value="">Select a program</option>
                        <option value="nclex-rn">NCLEX-RN Review Course</option>
                        <option value="nclex-pn">NCLEX-PN Review Course</option>
                        <option value="bootcamp">Intensive Bootcamp</option>
                        <option value="consultation">Free Consultation</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Message
                    </label>
                    <textarea
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 resize-none"
                      placeholder="Tell us about your NCLEX preparation needs..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center group"
                  >
                    <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map or Additional Info Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">
              Ready to Begin Your NCLEX Success Journey?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of successful nurses who chose One Quest Review Center
            </p>
            <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg">
              <Phone className="w-5 h-5 mr-2" />
              Call Now: (555) 123-4567
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
