import React, { useRef } from 'react';
import { Button } from './Button';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  label: string;
  subLabel?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, label, subLabel }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Content = base64String.split(',')[1];
        onCapture(base64Content);
        
        // Reset inputs to allow selecting the same file again if needed
        if (cameraInputRef.current) cameraInputRef.current.value = '';
        if (galleryInputRef.current) galleryInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        ref={cameraInputRef}
        onChange={handleFileChange}
      />
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={galleryInputRef}
        onChange={handleFileChange}
      />
      
      <div 
        className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" 
        onClick={() => cameraInputRef.current?.click()}
      >
        <div className="w-16 h-16 bg-blue-100 text-primary rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">{label}</h3>
        {subLabel && <p className="text-sm text-slate-500 text-center">{subLabel}</p>}
        <Button variant="ghost" className="mt-4 pointer-events-none">Tap to Open Camera</Button>
      </div>

      <Button 
        variant="secondary" 
        onClick={() => galleryInputRef.current?.click()}
        className="w-full"
        icon={
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        }
      >
        Select from Album
      </Button>
    </div>
  );
};