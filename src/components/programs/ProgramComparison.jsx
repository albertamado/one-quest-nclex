import React from "react";
import { CheckCircle, X } from "lucide-react";

export default function ProgramComparison({ programs }) {
  const comparisonFeatures = [
    { name: "Live Instruction Hours", key: "liveHours", values: ["72 hours", "48 hours", "40 hours"] },
    { name: "Practice Questions", key: "questions", values: ["10,000+", "5,000+", "3,000+"] },
    { name: "Study Materials", key: "materials", values: [true, true, true] },
    { name: "Small Group Sessions", key: "smallGroups", values: [true, true, false] },
    { name: "Unlimited Practice Tests", key: "unlimitedTests", values: [true, false, false] },
    { name: "24/7 Support", key: "support247", values: [true, false, false] },
    { name: "Money-back Guarantee", key: "guarantee", values: [true, true, true] },
    { name: "Duration", key: "duration", values: ["8 weeks", "6 weeks", "2 weeks"] }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Compare Our Programs
          </h2>
          <p className="text-gray-600">
            Find the perfect program that matches your learning style and timeline.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-2xl shadow-lg overflow-hidden">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-blue-50">
                <th className="px-6 py-4 text-left font-semibold text-slate-900">Features</th>
                {programs.map((program) => (
                  <th key={program.id} className="px-6 py-4 text-center">
                    <div className="font-semibold text-slate-900 mb-1">{program.title}</div>
                    <div className="text-2xl font-bold text-blue-600">${program.price}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((feature, index) => (
                <tr key={feature.key} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="px-6 py-4 font-medium text-slate-900">{feature.name}</td>
                  {feature.values.map((value, valueIndex) => (
                    <td key={valueIndex} className="px-6 py-4 text-center">
                      {typeof value === 'boolean' ? (
                        value ? (
                          <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-gray-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-slate-900 font-medium">{value}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}