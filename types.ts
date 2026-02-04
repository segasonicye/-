export interface Answer {
  questionNumber: number;
  selectedOption: string | null; // 'A', 'B', 'C', 'D', etc., or null if blank/invalid
}

export interface ExamData {
  studentId: string | null;
  studentName: string | null;
  answers: Answer[];
  rawText?: string; // Debugging
}

export interface GradedResult extends ExamData {
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongAnswers: number[];
  timestamp: number;
}

export enum AppMode {
  HOME = 'HOME',
  SETUP_KEY = 'SETUP_KEY', // Scanning the master key
  SCAN_PAPER = 'SCAN_PAPER', // Scanning student papers
  RESULTS = 'RESULTS',
}

export interface ProcessingState {
  isProcessing: boolean;
  statusMessage: string;
}