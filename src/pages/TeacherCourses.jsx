
import React, { useState, useEffect } from 'react';
import { Course } from '@/api/entities';
import { User } from '@/api/entities';
import { Enrollment } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getUserRole } from '../components/utils/getUserRole';
import { BookOpen, Users, PlusCircle, BarChart3, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TeacherCourses() {
    const [courses, setCourses] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [enrollmentCounts, setEnrollmentCounts] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const user = await User.me();
            setCurrentUser(user);

            // Verify user is a teacher
            if (getUserRole(user) !== 'teacher') {
                window.location.href = '/';
                return;
            }

            const teacherCourses = await Course.filter({ instructor_id: user.id });
            setCourses(teacherCourses);

            const counts = {};
            for (const course of teacherCourses) {
                const enrollments = await Enrollment.filter({ course_id: course.id });
                counts[course.id] = enrollments.length;
            }
            setEnrollmentCounts(counts);

        } catch (error) {
            console.error("Error loading data:", error);
        }
        setLoading(false);
    };

    if (loading) {
        return <div className="text-center p-10">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
                    <Button disabled>
                        <PlusCircle className="w-4 h-4 mr-2" /> Add Course
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
                            <div className="p-6 flex-grow">
                                <div className="flex items-start justify-between">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    <Link 
                                      to={createPageUrl(`TeacherCourseDetail?id=${course.id}`)}
                                      className="hover:text-blue-600"
                                    >
                                      {course.title}
                                    </Link>
                                  </h3>
                                  <div className="flex items-center text-sm text-gray-500">
                                      <Users className="w-4 h-4 mr-1"/>
                                      {enrollmentCounts[course.id] || 0}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-3">{course.description}</p>
                            </div>
                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-2">
                                <Link to={createPageUrl(`TeacherCourseDetail?id=${course.id}`)}>
                                  <Button variant="outline" size="sm">Manage Course</Button>
                                </Link>
                                <Link to={createPageUrl(`TeacherCourseDetail?id=${course.id}`)}>
                                  <Button size="sm">View Analytics</Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
                {courses.length === 0 && !loading && (
                    <div className="text-center bg-white p-12 rounded-xl shadow-sm border border-gray-100">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
                        <p className="mt-1 text-sm text-gray-500">Contact an admin to have courses assigned to you.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
