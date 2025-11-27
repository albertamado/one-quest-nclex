
import React, { useState, useEffect } from "react";
import { Award, Users, Target, TrendingUp, Heart, BookOpen } from "lucide-react";
import { User } from "@/api/entities";

export default function About() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Try to get current user but don't redirect if not logged in
    const checkUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        // User not logged in - this is fine for public pages
        setCurrentUser(null);
      }
    };
    checkUser();
  }, []);

  const stats = [
    { number: "15+", label: "Years of Experience", icon: Award },
    { number: "5,000+", label: "Successful Graduates", icon: Users },
    { number: "98%", label: "First-Time Pass Rate", icon: Target },
    { number: "50+", label: "Expert Instructors", icon: BookOpen }
  ];

  const values = [
    {
      icon: Target,
      title: "Excellence in Education",
      description: "We maintain the highest standards in NCLEX preparation with continuously updated curriculum and proven teaching methods."
    },
    {
      icon: Heart,
      title: "Student-Centered Approach", 
      description: "Every student receives personalized attention and support tailored to their unique learning style and needs."
    },
    {
      icon: TrendingUp,
      title: "Continuous Improvement",
      description: "We constantly evolve our programs based on student feedback and the latest NCLEX developments to ensure maximum success."
    }
  ];

  const team = [
    {
      name: "Dr. Maria Santos",
      role: "Director & Lead NCLEX Instructor",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face",
      credentials: "MSN, RN, CCRN",
      experience: "20+ years nursing education"
    },
    {
      name: "James Wilson", 
      role: "Senior NCLEX-RN Instructor",
      image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&h=300&fit=crop&crop=face",
      credentials: "BSN, RN, CEN",
      experience: "15+ years clinical & teaching"
    },
    {
      name: "Dr. Sarah Johnson",
      role: "NCLEX-PN Program Coordinator", 
      image: "https://images.unsplash.com/photo-1594824929818-a71b3c0b8810?w=300&h=300&fit=crop&crop=face",
      credentials: "PhD, RN, CNE",
      experience: "12+ years nursing education"
    }
  ];

  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                About One Quest Review Center
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                For over 15 years, we've been dedicated to helping nursing students achieve their dreams 
                of becoming licensed professionals. Our proven methodology and expert instructors have 
                guided thousands to NCLEX success.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Founded by experienced nurse educators, One Quest Review Center combines innovative 
                teaching methods with personalized support to create the most effective NCLEX 
                preparation experience available.
              </p>
            </div>
            
            <div className="mt-12 lg:mt-0">
              <div className="relative">
                <img 
                  src="https://i.pinimg.com/736x/27/e8/21/27e8211db7a630552fc7dcf78d098f6b.jpg"
                  alt="Nursing students studying together"
                  className="rounded-2xl shadow-xl"
                />
                <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">98%</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Our Mission & Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're committed to empowering future nurses with the knowledge, confidence, 
              and skills needed to excel in their NCLEX examinations and nursing careers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Meet Our Expert Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our instructors are experienced nurses and educators who are passionate about 
              helping students succeed in their NCLEX examinations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-6">
                  <img 
                    src={member.image}
                    alt={member.name}
                    className="w-48 h-48 rounded-2xl object-cover mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300"
                  />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{member.name}</h3>
                <p className="text-blue-600 font-semibold mb-2">{member.role}</p>
                <p className="text-gray-600 mb-1">{member.credentials}</p>
                <p className="text-sm text-gray-500">{member.experience}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-teal-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-8">
            Why Choose One Quest Review Center?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              "Proven track record of success",
              "Personalized learning approach",
              "Expert nurse educators",
              "Comprehensive support system"
            ].map((reason, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">{index + 1}</span>
                </div>
                <p className="text-white font-medium">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
