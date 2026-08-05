import React, { useState, useEffect } from 'react';
import { FaRobot, FaMagic, FaLightbulb, FaChartLine, FaSpinner, FaEnvelope } from 'react-icons/fa';
import { Button, Modal, Input, Textarea, Select } from '../EnliteUI';
import type { SelectOption } from '../EnliteUI';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface AIEmailAssistantProps {
  onApplySuggestion: (subject: string, body: string) => void;
  currentSubject?: string;
  currentBody?: string;
}

const AIEmailAssistant: React.FC<AIEmailAssistantProps> = ({
  onApplySuggestion,
  currentSubject = '',
  currentBody = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState<'generate' | 'improve' | 'subjects' | 'analyze'>('generate');

  // Generate Email State
  const [purpose, setPurpose] = useState('');
  const [tone, setTone] = useState('professional');
  const [keyPoints, setKeyPoints] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');

  // Improve Email State
  const [improvementType, setImprovementType] = useState<'subject' | 'body' | 'both'>('both');

  // Results
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [generatedBody, setGeneratedBody] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [subjectLines, setSubjectLines] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    checkAIStatus();
  }, []);

  const checkAIStatus = async () => {
    try {
      const response = await api.get('/admin/bulk-email/ai/status');
      setAiAvailable(response.data.data.available);
    } catch (error) {
      console.error('Failed to check AI status:', error);
      setAiAvailable(false);
    }
  };

  const handleGenerate = async () => {
    if (!keyPoints.trim()) {
      toast.error('Please enter at least one key point');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/admin/bulk-email/ai/generate', {
        purpose,
        tone,
        keyPoints: keyPoints.split('\n').filter(p => p.trim()),
        targetAudience: 'logistics companies',
        additionalContext,
      });

      const { subject, body, reasoning: aiReasoning } = response.data.data;
      setGeneratedSubject(subject);
      setGeneratedBody(body);
      setReasoning(aiReasoning);
      toast.success('Email generated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate email');
    } finally {
      setLoading(false);
    }
  };

  const handleImprove = async () => {
    if (!currentSubject && !currentBody) {
      toast.error('Please enter email content to improve');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/admin/bulk-email/ai/improve', {
        currentSubject,
        currentBody,
        improvementType,
        tone,
      });

      const { subject, body, reasoning: aiReasoning } = response.data.data;
      setGeneratedSubject(subject);
      setGeneratedBody(body);
      setReasoning(aiReasoning);
      toast.success('Email improved successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to improve email');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSubjects = async () => {
    const context = currentBody || keyPoints;
    if (!context.trim()) {
      toast.error('Please provide context for subject line generation');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/admin/bulk-email/ai/subject-lines', {
        context,
        count: 5,
      });

      setSubjectLines(response.data.data);
      toast.success('Subject lines generated!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate subject lines');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!currentSubject || !currentBody) {
      toast.error('Please enter both subject and body to analyze');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/admin/bulk-email/ai/analyze', {
        subject: currentSubject,
        body: currentBody,
      });

      setAnalysis(response.data.data);
      toast.success('Email analyzed!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to analyze email');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    onApplySuggestion(generatedSubject, generatedBody);
    setIsOpen(false);
    toast.success('AI suggestion applied!');
  };

  const purposeOptions: SelectOption[] = [
    { value: 'announcement', label: 'Announcement' },
    { value: 'update', label: 'Update' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'notification', label: 'Notification' },
    { value: 'newsletter', label: 'Newsletter' },
  ];

  const toneOptions: SelectOption[] = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'casual', label: 'Casual' },
    { value: 'formal', label: 'Formal' },
  ];

  const improvementOptions: SelectOption[] = [
    { value: 'both', label: 'Subject & Body' },
    { value: 'subject', label: 'Subject Only' },
    { value: 'body', label: 'Body Only' },
  ];

  if (!aiAvailable) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <FaRobot className="text-amber-600 text-xl mt-1" />
          <div>
            <h4 className="font-semibold text-amber-900">AI Assistant Not Available</h4>
            <p className="text-sm text-amber-700 mt-1">
              Configure ANTHROPIC_API_KEY in your environment to enable AI-powered email assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="secondary"
        icon={<FaRobot />}
        onClick={() => setIsOpen(true)}
      >
        AI Assistant
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="AI Email Assistant"
        size="xl"
        headerColor="secondary"
      >
        <div className="space-y-6">
          {/* Feature Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setActiveFeature('generate')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeFeature === 'generate'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FaMagic className="inline mr-2" />
              Generate
            </button>
            <button
              onClick={() => setActiveFeature('improve')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeFeature === 'improve'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FaLightbulb className="inline mr-2" />
              Improve
            </button>
            <button
              onClick={() => setActiveFeature('subjects')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeFeature === 'subjects'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FaEnvelope className="inline mr-2" />
              Subject Lines
            </button>
            <button
              onClick={() => setActiveFeature('analyze')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeFeature === 'analyze'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FaChartLine className="inline mr-2" />
              Analyze
            </button>
          </div>

          {/* Generate Email */}
          {activeFeature === 'generate' && (
            <div className="space-y-4">
              <Select
                label="Purpose"
                options={purposeOptions}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Select email purpose"
              />
              <Select
                label="Tone"
                options={toneOptions}
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              />
              <Textarea
                label="Key Points"
                placeholder="Enter key points (one per line)&#10;• New feature launch&#10;• Improved performance&#10;• Special offer"
                rows={6}
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                helperText="Enter each key point on a new line"
              />
              <Textarea
                label="Additional Context (Optional)"
                placeholder="Any additional information..."
                rows={3}
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
              />
              <Button
                variant="secondary"
                icon={loading ? <FaSpinner className="animate-spin" /> : <FaMagic />}
                onClick={handleGenerate}
                loading={loading}
                fullWidth
              >
                Generate Email
              </Button>
            </div>
          )}

          {/* Improve Email */}
          {activeFeature === 'improve' && (
            <div className="space-y-4">
              <Select
                label="What to Improve"
                options={improvementOptions}
                value={improvementType}
                onChange={(e) => setImprovementType(e.target.value as any)}
              />
              <Select
                label="Desired Tone"
                options={toneOptions}
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              />
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Current Content:</strong>
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Subject: {currentSubject || '(empty)'}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Body: {currentBody ? `${currentBody.substring(0, 100)}...` : '(empty)'}
                </p>
              </div>
              <Button
                variant="secondary"
                icon={loading ? <FaSpinner className="animate-spin" /> : <FaLightbulb />}
                onClick={handleImprove}
                loading={loading}
                fullWidth
              >
                Improve Email
              </Button>
            </div>
          )}

          {/* Generate Subject Lines */}
          {activeFeature === 'subjects' && (
            <div className="space-y-4">
              <Button
                variant="secondary"
                icon={loading ? <FaSpinner className="animate-spin" /> : <FaMagic />}
                onClick={handleGenerateSubjects}
                loading={loading}
                fullWidth
              >
                Generate 5 Subject Lines
              </Button>

              {subjectLines.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Generated Subject Lines:</h4>
                  {subjectLines.map((line, index) => (
                    <div
                      key={index}
                      className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 cursor-pointer transition-colors"
                      onClick={() => {
                        onApplySuggestion(line, currentBody);
                        toast.success('Subject line applied!');
                      }}
                    >
                      <p className="text-sm font-medium text-purple-900">{line}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analyze Email */}
          {activeFeature === 'analyze' && (
            <div className="space-y-4">
              <Button
                variant="secondary"
                icon={loading ? <FaSpinner className="animate-spin" /> : <FaChartLine />}
                onClick={handleAnalyze}
                loading={loading}
                fullWidth
              >
                Analyze Email Effectiveness
              </Button>

              {analysis && (
                <div className="space-y-4">
                  {/* Score */}
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6 rounded-xl">
                    <h4 className="text-sm font-semibold mb-2">Effectiveness Score</h4>
                    <p className="text-4xl font-bold">{analysis.score}/100</p>
                  </div>

                  {/* Strengths */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Strengths</h4>
                    <ul className="space-y-1">
                      {analysis.strengths.map((strength: string, i: number) => (
                        <li key={i} className="text-sm text-green-800">• {strength}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvements */}
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-amber-900 mb-2">Areas to Improve</h4>
                    <ul className="space-y-1">
                      {analysis.improvements.map((improvement: string, i: number) => (
                        <li key={i} className="text-sm text-amber-800">• {improvement}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {analysis.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="text-sm text-blue-800">• {rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generated Results */}
          {(generatedSubject || generatedBody) && activeFeature !== 'subjects' && activeFeature !== 'analyze' && (
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">AI Suggestion:</h4>
              
              {generatedSubject && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Subject:</label>
                  <p className="p-3 bg-purple-50 rounded-lg text-purple-900">{generatedSubject}</p>
                </div>
              )}

              {generatedBody && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Body Preview:</label>
                  <div 
                    className="p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg max-h-64 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: generatedBody }}
                  />
                </div>
              )}

              {reasoning && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-blue-900 mb-2">AI Reasoning:</h5>
                  <p className="text-sm text-blue-800">{reasoning}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleApply} fullWidth>
                  Apply Suggestion
                </Button>
                <Button variant="outline" onClick={() => {
                  setGeneratedSubject('');
                  setGeneratedBody('');
                  setReasoning('');
                }} fullWidth>
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default AIEmailAssistant;
