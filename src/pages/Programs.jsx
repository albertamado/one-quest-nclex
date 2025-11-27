
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Clock, Users, CheckCircle, Star, Award, Crown, Shield, X, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const subscriptionTiers = [
  {
    id: 'basic',
    name: 'BASIC',
    subtitle: 'FUNDAMENTALS',
    shortDescription: 'Essential NCLEX preparation',
    description: 'A streamlined program focused on core content and test preparation. This program is specifically designed for students who need focused preparation and prefer a self-directed approach to their NCLEX studies. It provides access to the most critical phases of learning with essential study materials, comprehensive video lectures, and practice quizzes to ensure you master the fundamental concepts needed to pass the NCLEX examination. Perfect for those with limited time who want to maximize their preparation efficiency.',
    icon: Award,
    gradient: 'from-amber-700 to-amber-900',
    borderColor: 'border-amber-700',
    bgColor: 'bg-white',
    includedBg: 'bg-gradient-to-br from-amber-700 to-amber-900',
    price: '$100',
    duration: '45 days',
    popular: false,
    features: [
      { name: 'Academic Phase', included: false },
      { name: 'Critical Phase', included: true },
      { name: 'Extensive Phase', included: true },
      { name: 'Counselor', included: false },
      { name: 'Mentor', included: false },
      { name: 'Guarantee', included: false },
      { name: '2 weeks plan', included: true },
      { name: 'UWorld', included: true }
    ]
  },
  {
    id: 'standard',
    name: 'STANDARD',
    subtitle: 'ADVANCED PREP',
    shortDescription: 'Comprehensive support for success',
    description: 'A well-rounded program that provides essential support and comprehensive content coverage for your NCLEX preparation journey. This program is designed for students who want a balanced approach with strong support systems in place. You will receive access to the Critical and Extensive phases with personalized counseling and mentorship to guide you through your studies. Our experienced counselors will help you develop effective study strategies and provide ongoing academic support. The program includes comprehensive study materials, interactive learning sessions, and regular progress assessments to keep you on track towards success.',
    icon: Shield,
    gradient: 'from-gray-400 to-gray-600',
    borderColor: 'border-gray-500',
    bgColor: 'bg-white',
    includedBg: 'bg-gradient-to-br from-gray-400 to-gray-600',
    price: '$200',
    duration: '90 days',
    popular: false,
    features: [
      { name: 'Academic Phase', included: false },
      { name: 'Critical Phase', included: true },
      { name: 'Extensive Phase', included: true },
      { name: 'Counselor', included: true },
      { name: 'Mentor', included: true },
      { name: 'Guarantee', included: false },
      { name: '6 weeks plan', included: true },
      { name: 'UWorld', included: true }
    ]
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    subtitle: 'COMPLETE MASTERY',
    shortDescription: 'All-inclusive with 100% guarantee',
    description: 'Our most comprehensive and highly recommended program designed for students who want complete support and guaranteed success in their NCLEX examination. This all-inclusive premium package provides unlimited access to all three phases of learning - Academic, Critical, and Extensive - ensuring you build a rock-solid foundation from the very beginning. You will receive personalized one-on-one mentorship from experienced NCLEX educators who will guide you every step of the way. With dedicated personal counseling sessions, customized study plans, and continuous progress monitoring, we ensure you are fully prepared and confident on exam day. This program comes with our exclusive 100% pass guarantee, giving you peace of mind and the assurance that you will succeed.',
    icon: Crown,
    gradient: 'from-yellow-500 to-amber-600',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-white',
    includedBg: 'bg-gradient-to-br from-yellow-600 to-amber-700',
    price: '$300',
    duration: '1 year',
    popular: true,
    features: [
      { name: 'Academic Phase', included: true },
      { name: 'Critical Phase', included: true },
      { name: 'Extensive Phase', included: true },
      { name: 'Counselor', included: true },
      { name: 'Mentor', included: true },
      { name: 'Guarantee', included: true },
      { name: '18 weeks plan', included: true },
      { name: 'UWorld', included: true }
    ]
  }
];

export default function Programs() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      }
      setCheckingAuth(false);
    };
    checkUser();
  }, []);

  const handleEnrollClick = (tier) => {
    if (!currentUser) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    setSelectedTier(tier);
    setIsEnrollModalOpen(true);
  };

  const handleSubmitEnrollment = async () => {
    if (!currentUser || !selectedTier) return;
    
    setIsSubmitting(true);
    try {
      await base44.entities.EnrollmentRequest.create({
        student_id: currentUser.id,
        subscription_tier: selectedTier.id,
        status: 'pending',
        requested_date: new Date().toISOString()
      });

      alert('Enrollment request submitted successfully! An admin will review your request shortly.');
      setIsEnrollModalOpen(false);
    } catch (error) {
      console.error('Error submitting enrollment:', error);
      alert('Failed to submit enrollment request. Please try again.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-20">
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced Title */}
          <div className="text-center mb-12">
            <h1 className="text-5xl lg:text-6xl font-black text-[#0077B6] mb-4 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Programs Offered
            </h1>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto font-medium text-justify">
              Choose the perfect subscription plan that fits your learning needs and timeline. All programs include comprehensive NCLEX preparation materials designed to maximize your success.
            </p>
          </div>

          {/* Subscription Tiers - Compressed */}
          <div className="space-y-6 mb-12">
            {subscriptionTiers.map((tier) => (
              <div key={tier.id} className="relative">
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className={`bg-gradient-to-r ${tier.gradient} text-white px-6 py-2 rounded-full font-bold shadow-xl flex items-center gap-2 text-sm`}>
                      <Sparkles className="w-4 h-4 fill-current" />
                      <span>MOST POPULAR CHOICE</span>
                      <Sparkles className="w-4 h-4 fill-current" />
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
                  {/* Left Box - Program Info */}
                  <div className={`${tier.bgColor} rounded-2xl shadow-xl border-3 ${tier.borderColor} p-6 relative overflow-hidden`}>
                    {/* Decorative corner elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-200/30 to-transparent rounded-bl-full"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-gray-200/30 to-transparent rounded-tr-full"></div>
                    
                    <div className="relative z-10">
                      {/* Header with Icon */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-16 h-16 bg-gradient-to-br ${tier.gradient} rounded-xl flex items-center justify-center shadow-lg transform rotate-3`}>
                          <tier.icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-black text-slate-900">{tier.name} : {tier.subtitle}</h2>
                        </div>
                      </div>

                      {/* Short Description */}
                      <div className="mb-3">
                        <p className="text-sm font-bold text-blue-600 uppercase tracking-wide">{tier.shortDescription}</p>
                      </div>
                      
                      {/* Description */}
                      <div className="mb-6">
                        <p className="text-slate-700 text-sm leading-relaxed text-justify">
                          {tier.description}
                        </p>
                      </div>

                      {/* Goal Section */}
                      <div className="mb-6">
                        <h3 className="text-xl font-black text-slate-900 mb-2">GOAL:</h3>
                        <div className="space-y-1">
                          <div className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span className="text-xs font-semibold text-slate-800">
                              Master all NCLEX concepts and test-taking strategies
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span className="text-xs font-semibold text-slate-800">
                              Achieve 100% pass rate on first attempt with confidence
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Price and CTA */}
                      <div className="flex items-center justify-between">
                        <div className="text-6xl font-black text-slate-900">{tier.price}</div>
                        <Button
                          onClick={() => handleEnrollClick(tier)}
                          disabled={checkingAuth}
                          className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white font-bold px-10 py-5 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
                        >
                          ENROLL NOW!
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Right Box - What's Included (Tier Color) */}
                  <div className={`${tier.includedBg} rounded-2xl shadow-xl p-6 min-w-[240px]`}>
                    <div className="bg-black/20 rounded-xl px-5 py-3 mb-4 text-center shadow-lg">
                      <h3 className="text-xl font-black text-white">What's Included?</h3>
                    </div>
                    <div className="space-y-2">
                      {tier.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          {feature.included ? (
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                              <X className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <span className="text-white font-bold text-xs uppercase tracking-wide">
                            {feature.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Chart - Navy Blue Theme */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-[#001F3F]">
            <div className="bg-gradient-to-r from-[#001F3F] via-[#003366] to-[#001F3F] py-6 px-8">
              <h2 className="text-3xl font-black text-center text-white">
                A.C.E. PROGRAM COMPARISON CHART
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#001F3F] border-b-2 border-[#003366]">
                    <th className="py-4 px-6 text-left font-bold text-white text-base"></th>
                    <th className="py-4 px-6 text-center font-bold text-white bg-[#003366] text-base">
                      <div className="flex items-center justify-center gap-2">
                        <Crown className="w-6 h-6 text-yellow-400" />
                        PREMIUM
                      </div>
                    </th>
                    <th className="py-4 px-6 text-center font-bold text-white bg-[#001F3F] text-base">
                      <div className="flex items-center justify-center gap-2">
                        <Shield className="w-6 h-6 text-gray-300" />
                        STANDARD
                      </div>
                    </th>
                    <th className="py-4 px-6 text-center font-bold text-white bg-[#00152A] text-base">
                      <div className="flex items-center justify-center gap-2">
                        <Award className="w-6 h-6 text-amber-700" />
                        BASIC
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-3 px-6 font-bold text-gray-900 text-sm">Academic Phase</td>
                    <td className="py-3 px-6 text-center bg-slate-50">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="py-3 px-6 text-center">
                      <X className="w-5 h-5 text-red-500 mx-auto" />
                    </td>
                    <td className="py-3 px-6 text-center bg-slate-50">
                      <X className="w-5 h-5 text-red-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-3 px-6 font-bold text-gray-900 text-sm">Critical Phase</td>
                    <td className="py-3 px-6 text-center bg-slate-50">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="py-3 px-6 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="py-3 px-6 text-center bg-slate-50">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-3 px-6 font-bold text-gray-900 text-sm">Extensive Phase</td>
                    <td className="py-3 px-6 text-center bg-slate-50">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="py-3 px-6 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="py-3 px-6 text-center bg-slate-50">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-3 px-6 font-bold text-gray-900 text-sm">Personal Student Counsellor</td>
                    <td className="py-3 px-6 text-center bg-slate-50">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="py-3 px-6 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="py-3 px-6 text-center bg-slate-50">
                      <X className="w-5 h-5 text-red-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-3 px-6 font-bold text-gray-900 text-sm">Personal Mentor</td>
                    <td className="py-3 px-6 text-center bg-slate-50">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="py-3 px-6 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="py-3 px-6 text-center bg-slate-50">
                      <X className="w-5 h-5 text-red-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-3 px-6 font-bold text-gray-900 text-sm">100% PASS Guarantee</td>
                    <td className="py-3 px-6 text-center bg-slate-50">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="py-3 px-6 text-center">
                      <span className="text-xs text-gray-600 font-medium">Not included</span>
                    </td>
                    <td className="py-3 px-6 text-center bg-slate-50">
                      <span className="text-xs text-gray-600 font-medium">Not included</span>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-3 px-6 font-bold text-gray-900 text-sm">Study Plan</td>
                    <td className="py-3 px-6 text-center bg-slate-50 font-bold text-slate-900">18 weeks</td>
                    <td className="py-3 px-6 text-center font-bold text-slate-900">6 weeks</td>
                    <td className="py-3 px-6 text-center bg-slate-50 font-bold text-slate-900">2 weeks</td>
                  </tr>
                  <tr className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-3 px-6 font-bold text-gray-900 text-sm">UWorld</td>
                    <td className="py-3 px-6 text-center bg-slate-50 text-slate-900 font-medium text-sm">Optional</td>
                    <td className="py-3 px-6 text-center text-slate-900 font-medium text-sm">Optional</td>
                    <td className="py-3 px-6 text-center bg-slate-50 text-slate-900 font-medium text-sm">Optional</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-6 font-bold text-gray-900 text-sm">Duration</td>
                    <td className="py-3 px-6 text-center bg-slate-50 font-bold text-slate-900">1 year</td>
                    <td className="py-3 px-6 text-center font-bold text-slate-900">90 days</td>
                    <td className="py-3 px-6 text-center bg-slate-50 font-bold text-slate-900">45 days</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-6 font-bold text-gray-900 text-sm">Pricing</td>
                    <td className="py-3 px-6 text-center bg-slate-50 font-bold text-slate-900">$300</td>
                    <td className="py-3 px-6 text-center font-bold text-slate-900">$200</td>
                    <td className="py-3 px-6 text-center bg-slate-50 font-bold text-slate-900">$100</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Enrollment Confirmation Modal */}
      <Dialog open={isEnrollModalOpen} onOpenChange={setIsEnrollModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Confirm Enrollment Request
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="text-center mb-6">
              <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${selectedTier?.gradient} rounded-full flex items-center justify-center mb-4 shadow-xl`}>
                {selectedTier && <selectedTier.icon className="w-10 h-10 text-white" />}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedTier?.name}</h3>
              <p className="text-gray-600 text-justify">{selectedTier?.subtitle}</p>
              <p className="text-sm text-gray-500 mt-2">Duration: {selectedTier?.duration}</p>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900 text-justify">
                Your enrollment request will be sent to our admin team for approval. You'll receive a notification once your request has been reviewed.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEnrollModalOpen(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitEnrollment}
                disabled={isSubmitting}
                className={`flex-1 bg-gradient-to-r ${selectedTier?.gradient}`}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
