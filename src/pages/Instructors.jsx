import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getUserRole } from '../components/utils/getUserRole';
import { ChevronLeft, ChevronRight, Mail, GraduationCap, Award, Briefcase, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Instructors() {
  const [currentUser, setCurrentUser] = useState(null);
  const [instructorProfiles, setInstructorProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    loadInstructors();
  }, []);

  const loadInstructors = async () => {
    setLoading(true);
    try {
      const profiles = await base44.entities.InstructorProfile.filter({ is_active: true });
      setInstructorProfiles(profiles);
    } catch (error) {
      console.error("Error loading instructors:", error);
      setInstructorProfiles([]);
    }
    setLoading(false);
  };

  const allInstructorData = instructorProfiles.map(profile => ({
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    bio: profile.bio,
    profile_photo_url: profile.profile_photo_url,
    specialization: profile.specialization,
    years_of_experience: profile.years_of_experience,
    education: profile.education,
    achievements: profile.achievements || []
  }));

  const currentInstructor = allInstructorData[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? allInstructorData.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === allInstructorData.length - 1 ? 0 : prev + 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (allInstructorData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
              Meet Our Expert Instructors
            </h1>
            <div className="mt-12 bg-white rounded-3xl shadow-2xl p-12 border-2 border-gray-200">
              <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600">No instructors available at the moment.</p>
              <p className="text-gray-500 mt-2">Check back soon to meet our expert team!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
            Meet Our Expert Instructors
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Learn from experienced healthcare professionals dedicated to your NCLEX success
          </p>
        </div>

        {currentInstructor && (
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden" style={{ height: '600px' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
              {/* Image Side */}
              <div className="relative h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-8">
                <div className="relative w-full h-full max-w-md mx-auto">
                  <img
                    src={currentInstructor.profile_photo_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800'}
                    alt={currentInstructor.full_name}
                    className="w-full h-full object-cover rounded-2xl shadow-2xl"
                  />
                </div>
              </div>

              {/* Info Side - Fixed Height, No Overflow */}
              <div className="h-full flex flex-col p-8 bg-gradient-to-br from-white to-gray-50 overflow-hidden">
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  <div className="overflow-hidden">
                    <h2 className="text-4xl font-bold text-gray-900 mb-2">{currentInstructor.full_name}</h2>
                    <p className="text-xl text-blue-600 font-semibold mb-6">{currentInstructor.specialization}</p>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center gap-4 bg-blue-50 rounded-xl p-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-600">Education</p>
                          <p className="font-bold text-gray-900 truncate">{currentInstructor.education}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 bg-purple-50 rounded-xl p-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Experience</p>
                          <p className="font-bold text-gray-900">{currentInstructor.years_of_experience}+ years</p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed mb-6 line-clamp-3">
                      {currentInstructor.bio}
                    </p>
                  </div>
                  
                  {currentInstructor.achievements && currentInstructor.achievements.length > 0 && (
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 border-2 border-yellow-200 flex-shrink-0">
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="w-5 h-5 text-yellow-600" />
                        <h3 className="font-bold text-gray-900">Key Achievements</h3>
                      </div>
                      <div className="space-y-2">
                        {currentInstructor.achievements.slice(0, 3).map((achievement, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700 line-clamp-1">{achievement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Controls */}
        {allInstructorData.length > 1 && (
          <>
            <div className="flex justify-center items-center gap-8 mt-12">
              <Button
                onClick={goToPrevious}
                variant="outline"
                size="lg"
                className="rounded-full w-14 h-14 p-0 border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-all shadow-lg"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>

              <div className="flex items-center gap-3">
                {allInstructorData.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`transition-all rounded-full ${
                      idx === currentIndex
                        ? 'w-12 h-3 bg-gradient-to-r from-blue-600 to-indigo-600'
                        : 'w-3 h-3 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={goToNext}
                variant="outline"
                size="lg"
                className="rounded-full w-14 h-14 p-0 border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-all shadow-lg"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>

            {/* Thumbnail Navigation */}
            <div className="mt-12">
              <div className="flex justify-center gap-4 flex-wrap max-w-4xl mx-auto">
                {allInstructorData.map((instructor, idx) => (
                  <button
                    key={instructor.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden transition-all transform hover:scale-110 ${
                      idx === currentIndex
                        ? 'ring-4 ring-blue-500 shadow-xl scale-110'
                        : 'ring-2 ring-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={instructor.profile_photo_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800'}
                      alt={instructor.full_name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}