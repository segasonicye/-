import React from 'react';
import { Answer } from '../types';

interface AnswerGridProps {
  studentAnswers: Answer[];
  keyMap?: Record<number, string>;
}

export const AnswerGrid: React.FC<AnswerGridProps> = ({ studentAnswers, keyMap }) => {
  return (
    <div className="grid grid-cols-5 gap-2 w-full">
      {studentAnswers.map((ans) => {
        const correctVal = keyMap ? keyMap[ans.questionNumber] : null;
        const isCorrect = correctVal ? correctVal === ans.selectedOption : null;
        const isKeyMode = !keyMap; // If no key map, we are just displaying the key itself

        let bgClass = "bg-slate-100 border-slate-200";
        let textClass = "text-slate-700";
        
        if (!isKeyMode && correctVal) {
          if (isCorrect) {
            bgClass = "bg-green-100 border-green-200";
            textClass = "text-green-700 font-bold";
          } else {
            bgClass = "bg-red-100 border-red-200";
            textClass = "text-red-700 font-bold";
          }
        } else if (isKeyMode) {
             bgClass = "bg-blue-50 border-blue-100";
             textClass = "text-blue-700 font-medium";
        }

        return (
          <div 
            key={ans.questionNumber} 
            className={`flex flex-col items-center justify-center p-1.5 rounded border ${bgClass} text-xs`}
          >
            <span className="text-[10px] text-slate-400 mb-0.5">{ans.questionNumber}</span>
            <span className={`text-base ${textClass}`}>
              {ans.selectedOption || '-'}
            </span>
            {!isKeyMode && !isCorrect && correctVal && (
               <span className="text-[10px] text-green-600 font-medium mt-0.5">
                 {correctVal}
               </span>
            )}
          </div>
        );
      })}
    </div>
  );
};