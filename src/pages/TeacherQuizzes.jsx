import React from 'react';
import { FileText } from 'lucide-react';

export default function TeacherQuizzes() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Quiz Management</h3>
                <p className="mt-1 text-sm text-gray-500">This feature is under construction.</p>
            </div>
        </div>
    );
}