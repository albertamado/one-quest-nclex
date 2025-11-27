import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingScreen({ message = "Loading..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto">
            <Loader2 className="w-full h-full text-blue-600 animate-spin" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3 whitespace-nowrap">
          {message}
        </h2>
        <p className="text-lg text-gray-600 whitespace-nowrap">Please wait while we prepare everything for you</p>
      </div>
    </div>
  );
}