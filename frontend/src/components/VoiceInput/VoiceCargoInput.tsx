import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Play,
  Pause
} from 'lucide-react';

interface VoiceCargoInputProps {
  onDataCaptured: (data: Partial<CargoData>) => void;
  onClose: () => void;
}

interface CargoData {
  title: string;
  cargoType: string;
  weight: number;
  pickupLocation: string;
  deliveryLocation: string;
  pickupDate: string;
  urgencyLevel: string;
  specialInstructions?: string;
}

export const VoiceCargoInput: React.FC<VoiceCargoInputProps> = ({ onDataCaptured, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<Partial<CargoData>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');

  const recognitionRef = useRef<any>(null);

  const steps = [
    { 
      question: "What type of cargo are you shipping?",
      field: "cargoType",
      examples: ["Electronics", "Furniture", "Food items", "Construction materials"]
    },
    {
      question: "What is the approximate weight in kilograms?",
      field: "weight",
      examples: ["500 kg", "2 tons", "1500 kilograms"]
    },
    {
      question: "Where is the pickup location?",
      field: "pickupLocation",
      examples: ["New York, NY", "123 Main Street, Los Angeles", "Warehouse A, Chicago"]
    },
    {
      question: "Where is the delivery location?",
      field: "deliveryLocation",
      examples: ["Miami, FL", "456 Oak Avenue, Boston", "Distribution Center, Dallas"]
    },
    {
      question: "When do you need this picked up?",
      field: "pickupDate",
      examples: ["Tomorrow", "January 15th", "Next Monday", "As soon as possible"]
    },
    {
      question: "How urgent is this shipment?",
      field: "urgencyLevel",
      examples: ["Very urgent", "Standard", "Flexible", "Critical"]
    },
    {
      question: "Any special instructions? Say 'none' if not applicable.",
      field: "specialInstructions",
      examples: ["Fragile - handle with care", "Refrigeration required", "None"]
    }
  ];

  useEffect(() => {
    // Check for browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      if (finalTranscript) {
        processVoiceInput(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setError('');
      setTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const processVoiceInput = async (input: string) => {
    setIsProcessing(true);
    const currentField = steps[currentStep].field;

    try {
      // Process the input based on the current field
      let processedValue: any = input;

      switch (currentField) {
        case 'weight':
          // Extract numbers from the input
          const weightMatch = input.match(/(\d+)/);
          if (weightMatch) {
            processedValue = parseInt(weightMatch[1]);
          }
          break;

        case 'pickupDate':
          // Parse date from natural language (simplified)
          if (input.toLowerCase().includes('tomorrow')) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            processedValue = tomorrow.toISOString().split('T')[0];
          } else if (input.toLowerCase().includes('today')) {
            processedValue = new Date().toISOString().split('T')[0];
          } else {
            // Try to extract a date
            processedValue = input;
          }
          break;

        case 'urgencyLevel':
          // Map natural language to urgency levels
          const urgencyMap: Record<string, string> = {
            'urgent': 'HIGH',
            'very urgent': 'CRITICAL',
            'critical': 'CRITICAL',
            'asap': 'CRITICAL',
            'standard': 'STANDARD',
            'normal': 'STANDARD',
            'flexible': 'LOW',
            'not urgent': 'LOW'
          };
          
          const lowerInput = input.toLowerCase();
          for (const [key, value] of Object.entries(urgencyMap)) {
            if (lowerInput.includes(key)) {
              processedValue = value;
              break;
            }
          }
          break;

        case 'specialInstructions':
          if (input.toLowerCase() === 'none' || input.toLowerCase() === 'no') {
            processedValue = '';
          }
          break;
      }

      // Update extracted data
      const newData = {
        ...extractedData,
        [currentField]: processedValue
      };
      setExtractedData(newData);

      // Move to next step
      if (currentStep < steps.length - 1) {
        setTimeout(() => {
          setCurrentStep(currentStep + 1);
          setTranscript('');
          setIsProcessing(false);
        }, 1000);
      } else {
        // All steps completed
        setIsProcessing(false);
        setTimeout(() => {
          onDataCaptured(newData);
        }, 1500);
      }
    } catch (err) {
      console.error('Error processing input:', err);
      setError('Failed to process input. Please try again.');
      setIsProcessing(false);
    }
  };

  const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSkipStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setTranscript('');
    }
  };

  const handleUseData = () => {
    onDataCaptured(extractedData);
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isComplete = currentStep === steps.length - 1 && Object.keys(extractedData).length === steps.length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <Volume2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Voice Cargo Creation</h2>
                <p className="text-violet-100 text-sm">Speak naturally, we'll handle the rest</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-violet-100">Step {currentStep + 1} of {steps.length}</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">Error</p>
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            </div>
          )}

          {!isComplete ? (
            <>
              {/* Current Question */}
              <div className="mb-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-violet-100 rounded-xl p-3">
                    <Sparkles className="w-6 h-6 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{currentStepData.question}</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentStepData.examples.map((example, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                          e.g., {example}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => speakQuestion(currentStepData.question)}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Speak question"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Microphone Control */}
              <div className="flex flex-col items-center mb-8">
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={isProcessing}
                  className={`w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                    isListening
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 animate-pulse'
                      : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:scale-110'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProcessing ? (
                    <Loader2 className="w-16 h-16 text-white animate-spin" />
                  ) : isListening ? (
                    <MicOff className="w-16 h-16 text-white" />
                  ) : (
                    <Mic className="w-16 h-16 text-white" />
                  )}
                </button>

                <p className="mt-4 text-center">
                  {isListening ? (
                    <span className="text-rose-600 font-bold">🔴 Listening...</span>
                  ) : isProcessing ? (
                    <span className="text-violet-600 font-bold">Processing...</span>
                  ) : (
                    <span className="text-gray-600">Tap to start speaking</span>
                  )}
                </p>
              </div>

              {/* Live Transcript */}
              {transcript && (
                <div className="mb-6 p-4 bg-violet-50 border-2 border-violet-200 rounded-xl">
                  <p className="text-sm font-semibold text-violet-900 mb-2">You said:</p>
                  <p className="text-lg text-gray-900">{transcript}</p>
                </div>
              )}

              {/* Collected Data Preview */}
              {Object.keys(extractedData).length > 0 && (
                <div className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                  <p className="text-sm font-semibold text-emerald-900 mb-3">Captured Information:</p>
                  <div className="space-y-2">
                    {Object.entries(extractedData).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm text-gray-700">
                          <strong className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</strong> {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skip Button */}
              <button
                onClick={handleSkipStep}
                className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all"
              >
                Skip This Step
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="bg-emerald-100 rounded-full p-6 w-fit mx-auto mb-4">
                <CheckCircle className="w-16 h-16 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">All Done! 🎉</h3>
              <p className="text-gray-600 mb-6">Your cargo information has been captured successfully.</p>

              <div className="bg-gray-50 rounded-xl p-6 text-left mb-6">
                <h4 className="font-bold text-gray-900 mb-3">Captured Data:</h4>
                <div className="space-y-2">
                  {Object.entries(extractedData).map(([key, value]) => (
                    <div key={key} className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleUseData}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 font-bold shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Use This Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceCargoInput;

