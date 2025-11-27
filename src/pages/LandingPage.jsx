
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { 
  GraduationCap, 
  Star, 
  Users, 
  CheckCircle, 
  ArrowRight,
  BookOpen,
  Award,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Quote,
  Target,
  Clock,
  Shield
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getUserRole } from "../components/utils/getUserRole";

const testimonials = [
  {
    name: "Clydenn T. Torcelino, RN",
    role: "RN, Johns Hopkins Hospital",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
    content: "One Quest Review Center was instrumental in my NCLEX success. The instructors were knowledgeable and the practice questions were spot-on. I passed on my first try!",
    rating: 5
  },
  {
    name: "Pamella Mae M. Hernandez, RN",
    role: "RN, Mayo Clinic",
    image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face",
    content: "The personalized study plan made all the difference. I felt confident and well-prepared on exam day. The support system here is incredible!",
    rating: 5
  },
  {
    name: "Emily Johnson",
    role: "RN, Cleveland Clinic",
    image: "https://images.unsplash.com/photo-1594824929818-a71b3c0b8810?w=150&h=150&fit=crop&crop=face",
    content: "Amazing support system and excellent resources. The instructors truly care about your success. Worth every penny!",
    rating: 5
  }
];

const features = [
  {
    image: "https://i.pinimg.com/736x/27/e8/21/27e8211db7a630552fc7dcf78d098f6b.jpg",
    title: "Expert-Led Training",
    description: "Learn from experienced nurses with proven NCLEX success records"
  },
  {
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop",
    title: "Comprehensive Study Materials",
    description: "Access 10,000+ practice questions and detailed study guides"
  },
  {
    image: "https://i.pinimg.com/736x/72/e5/4c/72e54c076b6cce1685c8ce679d8be97b.jpg",
    title: "Personalized Learning",
    description: "Get customized study plans tailored to your learning style"
  }
];

export default function LandingPage() {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasCheckedUser, setHasCheckedUser] = useState(false);
  
  // Signup form state
  const [signupData, setSignupData] = useState({
    school_graduated: "",
    has_att_permit: false
  });
  const [signupError, setSignupError] = useState("");

  useEffect(() => {
    // Only check user once to prevent loops
    if (!hasCheckedUser) {
      checkUser();
      setHasCheckedUser(true);
    }

    // Auto-rotate testimonials
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    // Auto-rotate feature carousel
    const featureInterval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => {
      clearInterval(testimonialInterval);
      clearInterval(featureInterval);
    };
  }, [hasCheckedUser]);

  const checkUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      
      if (isAuth) {
        const user = await base44.auth.me();
        const userRole = getUserRole(user);
        
        // Only show modal if user just signed up and doesn't have school info AND is a student
        if (!user.school_graduated && userRole === 'student') {
          setCurrentUser(user);
          setIsSignupModalOpen(true);
        } else {
          setCurrentUser(user);
        }
      }
    } catch (error) {
      console.log("No authenticated user");
      setCurrentUser(null);
    }
    setCheckingAuth(false);
  };

  const handleSaveSignupInfo = async () => {
    if (!signupData.school_graduated.trim()) {
      setSignupError("Please enter your school/university");
      return;
    }

    try {
      await base44.auth.updateMe({
        school_graduated: signupData.school_graduated,
        has_att_permit: signupData.has_att_permit,
        att_permit_date: signupData.has_att_permit ? new Date().toISOString().split('T')[0] : null
      });
      
      // Close modal and redirect to appropriate dashboard after saving info
      setIsSignupModalOpen(false);
      window.location.href = createPageUrl("StudentDashboard");
    } catch (error) {
      console.error("Error saving signup info:", error);
      setSignupError("Failed to save information. Please try again.");
    }
  };

  const handleLoginClick = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const nextFeature = () => {
    setCurrentFeature((prev) => (prev + 1) % features.length);
  };

  const prevFeature = () => {
    setCurrentFeature((prev) => (prev - 1 + features.length) % features.length);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Enhanced Design */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-600 text-white">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center bg-white/20 backdrop-blur-md px-6 py-3 rounded-full mb-8 shadow-lg hover:bg-white/30 transition-all duration-300">
                <Star className="w-6 h-6 text-yellow-300 mr-3 animate-pulse" />
                <span className="text-base font-semibold">Trusted by Thousands of Nursing Students</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-extrabold mb-8 leading-tight">
                Your Path to <span className="text-yellow-300 animate-pulse">NCLEX Success</span> Starts Here
              </h1>
              
              <p className="text-xl lg:text-2xl mb-10 text-blue-100 leading-relaxed">
                Join One Quest Review Center and achieve your nursing dreams with expert instruction and proven methods.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Link
                  to={createPageUrl("Programs")}
                  className="group inline-flex items-center justify-center px-10 py-5 bg-white text-blue-600 font-bold text-lg rounded-xl hover:bg-yellow-300 hover:text-blue-900 transition-all duration-300 shadow-2xl hover:shadow-yellow-300/50 transform hover:-translate-y-1 hover:scale-105"
                >
                  Explore Programs
                  <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                </Link>
                
                {!currentUser && (
                  <button
                    onClick={handleLoginClick}
                    className="inline-flex items-center justify-center px-10 py-5 border-3 border-white text-white font-bold text-lg rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300 shadow-xl transform hover:scale-105"
                  >
                    Sign In / Sign Up
                  </button>
                )}
              </div>

              {/* Trust Indicators with Enhanced Design */}
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center lg:text-left bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                  <div className="text-4xl font-black mb-1 text-yellow-300">Expert</div>
                  <div className="text-sm text-blue-100 font-medium">Instructors</div>
                </div>
                <div className="text-center lg:text-left bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                  <div className="text-4xl font-black mb-1 text-yellow-300">Proven</div>
                  <div className="text-sm text-blue-100 font-medium">Methods</div>
                </div>
                <div className="text-center lg:text-left bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                  <div className="text-4xl font-black mb-1 text-yellow-300">15+</div>
                  <div className="text-sm text-blue-100 font-medium">Years</div>
                </div>
              </div>
            </div>

            {/* Right Content - Image with Enhanced Card */}
            <div className="relative hidden lg:block">
              <div className="relative w-full">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-pink-400 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
                <img 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&h=600&fit=crop"
                  alt="Happy nursing students celebrating success"
                  className="relative rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
                />
                
                {/* Floating Success Card */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-2xl p-6 text-gray-900 transform hover:scale-110 transition-transform duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-bounce">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="font-black text-xl text-green-600">NCLEX Passed!</div>
                      <div className="text-sm text-gray-600 font-medium">Join them today</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Carousel Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Students Choose Us</h2>
            <p className="text-xl text-gray-600">Experience excellence in NCLEX preparation</p>
          </div>

          <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-1000 ${
                  index === currentFeature ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
              >
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end">
                  <div className="p-12 text-white">
                    <h3 className="text-4xl font-bold mb-4">{feature.title}</h3>
                    <p className="text-xl text-gray-200">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Navigation Buttons */}
            <button
              onClick={prevFeature}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button
              onClick={nextFeature}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl hover:scale-110"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeature(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentFeature ? 'bg-white w-8' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Carousel Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Students Say</h2>
            <p className="text-xl text-gray-600">Real success stories from real students</p>
          </div>

          <div className="relative bg-white rounded-3xl shadow-2xl p-12">
            <Quote className="absolute top-8 left-8 w-12 h-12 text-blue-200" />
            
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              <img 
                src={testimonials[currentTestimonial].image}
                alt={testimonials[currentTestimonial].name}
                className="w-24 h-24 rounded-full mb-6 border-4 border-blue-600 shadow-lg"
              />
              
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              <p className="text-xl text-gray-700 italic mb-6 leading-relaxed">
                "{testimonials[currentTestimonial].content}"
              </p>
              
              <div>
                <p className="font-bold text-lg text-gray-900">{testimonials[currentTestimonial].name}</p>
                <p className="text-gray-600">{testimonials[currentTestimonial].role}</p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevTestimonial}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-all duration-300 shadow-lg hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button
              onClick={nextTestimonial}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-all duration-300 shadow-lg hover:scale-110"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentTestimonial ? 'bg-blue-600 w-8' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section with Enhanced Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Why Choose One Quest Review Center?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're not just another review center. We're your partner in achieving your nursing dreams.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Award,
                title: "Expert Instructors",
                description: "Learn from experienced nurse educators with proven NCLEX expertise",
                color: "blue",
                gradient: "from-blue-500 to-blue-600"
              },
              {
                icon: Target,
                title: "Focused Curriculum",
                description: "Structured learning paths designed specifically for NCLEX success",
                color: "green",
                gradient: "from-green-500 to-green-600"
              },
              {
                icon: Shield,
                title: "Proven Results",
                description: "98% first-time pass rate with our comprehensive program",
                color: "purple",
                gradient: "from-purple-500 to-purple-600"
              }
            ].map((feature, index) => (
              <div key={index} className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 text-center border-2 border-gray-100 hover:border-blue-300 transform hover:-translate-y-2">
                <div className={`w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats Section with Enhanced Design */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: "Expert", label: "Instructors", icon: Users },
              { number: "Proven", label: "Success Record", icon: TrendingUp },
              { number: "15+", label: "Years of Excellence", icon: Award },
              { number: "24/7", label: "Student Support", icon: Clock }
            ].map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all transform hover:scale-105 duration-300">
                <stat.icon className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
                <div className="text-5xl font-black mb-2 text-yellow-300">{stat.number}</div>
                <div className="text-base font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-6xl font-extrabold mb-8">
            Ready to Start Your NCLEX Journey?
          </h2>
          <p className="text-2xl mb-12 text-blue-100">
            Join thousands of successful nurses. Your future starts today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to={createPageUrl("Programs")}
              className="group inline-flex items-center justify-center px-12 py-6 bg-white text-blue-600 font-bold text-xl rounded-xl hover:bg-yellow-300 hover:text-blue-900 transition-all duration-300 shadow-2xl transform hover:-translate-y-1 hover:scale-105"
            >
              View Programs
              <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
            </Link>
            
            <Link
              to={createPageUrl("Contact")}
              className="inline-flex items-center justify-center px-12 py-6 border-3 border-white text-white font-bold text-xl rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300 shadow-xl transform hover:scale-105"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Signup Info Modal - Only for new students without school info */}
      <Dialog 
        open={isSignupModalOpen} 
        onOpenChange={(open) => {
          // Prevent closing modal if school info is required for a student
          if (!open && currentUser && !currentUser.school_graduated && getUserRole(currentUser) === 'student') {
            return;
          }
          setIsSignupModalOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Complete Your Profile</DialogTitle>
            <p className="text-sm text-gray-600 text-center mt-2">
              Please provide the following information to continue
            </p>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            {signupError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {signupError}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="school" className="text-base font-semibold">
                  School/University Graduated *
                </Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="school"
                    type="text"
                    placeholder="e.g., University of California"
                    value={signupData.school_graduated}
                    onChange={(e) => setSignupData({...signupData, school_graduated: e.target.value})}
                    className="pl-10 text-base"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Enter the name of the school or university where you graduated
                </p>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox
                  id="att-permit-modal"
                  checked={signupData.has_att_permit}
                  onCheckedChange={(checked) => setSignupData({...signupData, has_att_permit: checked})}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="att-permit-modal"
                    className="text-sm font-medium leading-none cursor-pointer flex items-center"
                  >
                    <Award className="w-4 h-4 mr-2 text-blue-600" />
                    I have authorization to take the ATT (Authorization to Test)
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Check this if you already have your Authorization to Test permit for NCLEX
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This information is required to access the platform. You can update it later in your profile settings.
              </p>
            </div>

            <Button 
              onClick={handleSaveSignupInfo}
              className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 mt-6"
              size="lg"
            >
              Save & Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
