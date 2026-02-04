import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { CameraCapture } from './components/CameraCapture';
import { Button } from './components/Button';
import { AnswerGrid } from './components/AnswerGrid';
import { analyzeAnswerSheet } from './services/geminiService';
import { AppMode, ExamData, GradedResult, ProcessingState, Answer } from './types';

export default function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [answerKey, setAnswerKey] = useState<ExamData | null>(null);
  const [currentGraded, setCurrentGraded] = useState<GradedResult | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({ isProcessing: false, statusMessage: '' });
  const [history, setHistory] = useState<GradedResult[]>([]);

  // Memoize the answer key map for O(1) lookups
  const answerKeyMap = useMemo(() => {
    if (!answerKey) return {};
    const map: Record<number, string> = {};
    answerKey.answers.forEach(a => {
      if (a.selectedOption) map[a.questionNumber] = a.selectedOption;
    });
    return map;
  }, [answerKey]);

  // Handle Scanning Answer Key
  const handleScanKey = async (base64: string) => {
    setProcessing({ isProcessing: true, statusMessage: 'Analyzing Master Key...' });
    try {
      const data = await analyzeAnswerSheet(base64, true);
      
      if (!data.answers || data.answers.length === 0) {
        throw new Error("No answers detected. Please try again with a clearer image.");
      }

      setAnswerKey(data);
      setMode(AppMode.HOME);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessing({ isProcessing: false, statusMessage: '' });
    }
  };

  // Handle Scanning Student Paper
  const handleScanPaper = async (base64: string) => {
    if (!answerKey) return;
    setProcessing({ isProcessing: true, statusMessage: 'Grading Student Paper...' });
    try {
      const studentData = await analyzeAnswerSheet(base64, false);
      
      // Grading Logic: Iterate over the KEY, not the student answers.
      // This ensures we catch missing answers (unanswered questions) properly.
      let correct = 0;
      const wrong: number[] = [];
      const normalizedAnswers: Answer[] = [];
      
      const keyQuestions = answerKey.answers.sort((a, b) => a.questionNumber - b.questionNumber);
      
      keyQuestions.forEach(keyQ => {
        const qNum = keyQ.questionNumber;
        const correctOpt = keyQ.selectedOption;
        
        // Find what the student answered for this specific question
        const studentAnsObj = studentData.answers.find(a => a.questionNumber === qNum);
        const studentOpt = studentAnsObj ? studentAnsObj.selectedOption : null;

        if (studentOpt === correctOpt) {
          correct++;
        } else {
          wrong.push(qNum);
        }

        // Build a normalized list of answers for display (fills in gaps if student missed a question)
        normalizedAnswers.push({
          questionNumber: qNum,
          selectedOption: studentOpt
        });
      });

      const total = keyQuestions.length;
      const score = total > 0 ? Math.round((correct / total) * 100) : 0;

      const result: GradedResult = {
        studentId: studentData.studentId,
        studentName: studentData.studentName,
        answers: normalizedAnswers, // Use the normalized list for the grid
        score,
        correctCount: correct,
        totalQuestions: total,
        wrongAnswers: wrong,
        timestamp: Date.now()
      };

      setCurrentGraded(result);
      setHistory(prev => [result, ...prev]);
      setMode(AppMode.RESULTS);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessing({ isProcessing: false, statusMessage: '' });
    }
  };

  // Render Logic
  const renderContent = () => {
    if (processing.isProcessing) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-primary rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">{processing.statusMessage}</h2>
          <p className="text-slate-500">This uses AI vision, so it might take a few seconds.</p>
        </div>
      );
    }

    switch (mode) {
      case AppMode.HOME:
        return (
          <div className="flex flex-col gap-6 p-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20">
              <h2 className="text-2xl font-bold mb-2">Welcome to SmartGrader</h2>
              <p className="opacity-90 mb-6">Automate your grading process with AI. Set an answer key and start scanning.</p>
              <div className="flex gap-3">
                <Button 
                  onClick={() => setMode(AppMode.SETUP_KEY)}
                  className="bg-white text-blue-600 hover:bg-blue-50 flex-1 border-0"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                    </svg>
                  }
                >
                  {answerKey ? 'Update Key' : 'Set Answer Key'}
                </Button>
                {answerKey && (
                  <Button 
                     variant="ghost" 
                     className="text-white hover:text-white hover:bg-white/20"
                     onClick={() => setAnswerKey(null)}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {answerKey ? (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Ready to Grade</h3>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Key Active: {answerKey.answers.length} Qs</span>
                </div>
                
                <CameraCapture 
                  label="Scan Student Answer Sheet" 
                  subLabel="Ensure the paper is flat and well-lit"
                  onCapture={handleScanPaper}
                />

                {history.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-3">Recent Scans</h3>
                    <div className="space-y-3">
                      {history.map((h, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center" onClick={() => { setCurrentGraded(h); setMode(AppMode.RESULTS); }}>
                          <div>
                            <p className="font-semibold text-slate-800">Student: {h.studentName || h.studentId || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">{new Date(h.timestamp).toLocaleTimeString()}</p>
                          </div>
                          <div className={`text-xl font-bold ${h.score >= 60 ? 'text-green-600' : 'text-red-500'}`}>
                            {h.score}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 bg-white rounded-xl border border-slate-200 border-dashed">
                <p className="text-slate-400">Please set up an answer key to start grading.</p>
              </div>
            )}
          </div>
        );

      case AppMode.SETUP_KEY:
        return (
          <div className="p-6 h-full flex flex-col">
            <div className="mb-4">
               <button onClick={() => setMode(AppMode.HOME)} className="text-blue-600 text-sm font-medium flex items-center mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                 Back
               </button>
               <h2 className="text-xl font-bold text-slate-800">Set Answer Key</h2>
               <p className="text-slate-500 text-sm mt-1">Take a photo of a correctly filled answer sheet.</p>
            </div>
            
            <CameraCapture 
              label="Capture Master Sheet" 
              subLabel="Make sure all correct bubbles are clearly filled"
              onCapture={handleScanKey}
            />
          </div>
        );

      case AppMode.RESULTS:
        if (!currentGraded) return null;
        return (
          <div className="p-6 pb-24">
             <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-50 pt-2 pb-4 z-10">
               <button onClick={() => setMode(AppMode.HOME)} className="text-blue-600 text-sm font-medium flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                 Back to Home
               </button>
               <h2 className="font-bold text-slate-800">Result</h2>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
              <div className="bg-slate-800 p-6 text-white text-center">
                <div className="text-sm opacity-80 mb-1">Total Score</div>
                <div className="text-5xl font-bold mb-2">{currentGraded.score}</div>
                <div className="text-sm opacity-80 flex justify-center gap-4">
                   <span>Correct: {currentGraded.correctCount}</span>
                   <span>Total: {currentGraded.totalQuestions}</span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between text-sm">
                <span className="text-slate-500">Student ID:</span>
                <span className="font-semibold text-slate-800">{currentGraded.studentId || "Not detected"}</span>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between text-sm">
                 <span className="text-slate-500">Name:</span>
                 <span className="font-semibold text-slate-800">{currentGraded.studentName || "Not detected"}</span>
              </div>
            </div>

            <h3 className="font-bold text-slate-800 mb-3">Answer Detail</h3>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <AnswerGrid studentAnswers={currentGraded.answers} keyMap={answerKeyMap} />
            </div>

             <div className="fixed bottom-6 left-0 right-0 px-6">
                <Button onClick={() => setMode(AppMode.HOME)} className="w-full shadow-xl">
                  Scan Next Paper
                </Button>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 overflow-y-auto no-scrollbar">
        {renderContent()}
      </main>
    </div>
  );
}