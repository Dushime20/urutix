import React, { useState, useEffect } from 'react';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import AIEmailAssistant from '../../components/Admin/AIEmailAssistant';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Mail, Send, History, Plus, Edit2, Trash2,
  Eye, FileText, Users, CheckCircle, XCircle,
  AlertCircle, ChevronRight, Filter, RefreshCw
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  description: string;
  category: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
}

interface BulkEmailLog {
  id: string;
  subject: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  status: string;
  createdAt: string;
  completedAt: string;
}

const BulkEmail: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'send' | 'templates' | 'logs'>('send');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<BulkEmailLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Send Email State
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customHtmlBody, setCustomHtmlBody] = useState('');
  const [customTextBody, setCustomTextBody] = useState('');
  const [useTemplate, setUseTemplate] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterTenantIds, setFilterTenantIds] = useState<string[]>([]);

  // Template Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    htmlBody: '',
    textBody: '',
    description: '',
    category: 'general',
    isActive: true,
  });

  // Preview Modal
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState({ subject: '', html: '' });

  // AI Assistant Handler
  const handleAISuggestion = (subject: string, body: string) => {
    setCustomSubject(subject);
    setCustomHtmlBody(body);
    toast.success('AI suggestion applied to your email!');
  };

  useEffect(() => {
    fetchTemplates();
    fetchLogs();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/admin/bulk-email/templates');
      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await api.get('/admin/bulk-email/logs');
      if (response.data.success) {
        setLogs(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const handleSendBulkEmail = async () => {
    setLoading(true);
    try {
      const filters = {
        status: filterStatus.length > 0 ? filterStatus : undefined,
        tenantIds: filterTenantIds.length > 0 ? filterTenantIds : undefined,
      };

      let response;
      if (useTemplate && selectedTemplate) {
        response = await api.post('/admin/bulk-email/send-template', {
          templateId: selectedTemplate,
          filters,
        });
      } else {
        response = await api.post('/admin/bulk-email/send-custom', {
          subject: customSubject,
          htmlBody: customHtmlBody,
          textBody: customTextBody,
          filters,
        });
      }

      if (response.data.success) {
        toast.success('Bulk email sending initiated!');
        fetchLogs();
        // Reset form
        setSelectedTemplate('');
        setCustomSubject('');
        setCustomHtmlBody('');
        setCustomTextBody('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send bulk email');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    setLoading(true);
    try {
      let response;
      if (editingTemplate) {
        response = await api.put(`/admin/bulk-email/templates/${editingTemplate.id}`, templateForm);
      } else {
        response = await api.post('/admin/bulk-email/templates', templateForm);
      }

      if (response.data.success) {
        toast.success(editingTemplate ? 'Template updated!' : 'Template created!');
        setIsTemplateModalOpen(false);
        setEditingTemplate(null);
        setTemplateForm({
          name: '',
          subject: '',
          htmlBody: '',
          textBody: '',
          description: '',
          category: 'general',
          isActive: true,
        });
        fetchTemplates();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await api.delete(`/admin/bulk-email/templates/${id}`);
      if (response.data.success) {
        toast.success('Template deleted!');
        fetchTemplates();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete template');
    }
  };

  const handlePreview = () => {
    if (useTemplate && selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        setPreviewContent({
          subject: template.subject,
          html: template.htmlBody,
        });
      }
    } else {
      setPreviewContent({
        subject: customSubject,
        html: customHtmlBody,
      });
    }
    setIsPreviewModalOpen(true);
  };

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'SUSPENDED', label: 'Suspended' },
    { value: 'PENDING_ACTIVATION', label: 'Pending Activation' },
    { value: 'DEACTIVATED', label: 'Deactivated' },
  ];

  const categoryOptions = [
    { value: 'general', label: 'General' },
    { value: 'announcement', label: 'Announcement' },
    { value: 'update', label: 'Update' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'notification', label: 'Notification' },
  ];

  return (
    <AdminPageLayout
      title="Bulk Email Management"
      description="Send marketing emails and notifications to tenants"
    >
      <div className="space-y-6">
        {/* Navigation Tabs - Enlite Prime Style */}
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-2 inline-flex gap-2">
          {[
            { id: 'send', label: 'Compose', icon: Send },
            { id: 'templates', label: 'Templates', icon: FileText },
            { id: 'logs', label: 'History', icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all ${isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-white' : ''}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8 min-h-[600px]">

          {/* Send Email Tab */}
          {activeTab === 'send' && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
                  <Mail className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Compose Campaign</h2>
                <p className="text-slate-500 mt-2">Send announcements or updates to your user base</p>
              </div>

              {/* Composition Type Toggle */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setUseTemplate(true)}
                  className={`p-6 border rounded-2xl transition-all text-left group ${useTemplate
                      ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-xl ${useTemplate ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                      <FileText size={20} />
                    </div>
                    {useTemplate && <CheckCircle className="text-indigo-600" size={20} />}
                  </div>
                  <h3 className="font-bold text-slate-800">Use Template</h3>
                  <p className="text-xs text-slate-500 mt-1">Select from pre-defined email templates</p>
                </button>

                <button
                  onClick={() => setUseTemplate(false)}
                  className={`p-6 border rounded-2xl transition-all text-left group ${!useTemplate
                      ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-xl ${!useTemplate ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                      <Edit2 size={20} />
                    </div>
                    {!useTemplate && <CheckCircle className="text-indigo-600" size={20} />}
                  </div>
                  <h3 className="font-bold text-slate-800">Custom Email</h3>
                  <p className="text-xs text-slate-500 mt-1">Write a new email from scratch</p>
                </button>
              </div>

              {/* Editor Area */}
              <div className="bg-slate-50/50 rounded-2xl border border-slate-200 p-6 space-y-6">
                {useTemplate ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Select Template</label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                    >
                      <option value="">Choose a template...</option>
                      {templates.filter(t => t.isActive).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Subject Line</label>
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder="Enter an engaging subject..."
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Email Content (HTML)</label>
                        <AIEmailAssistant
                          onApplySuggestion={handleAISuggestion}
                          currentSubject={customSubject}
                          currentBody={customHtmlBody}
                        />
                      </div>
                      <textarea
                        rows={8}
                        value={customHtmlBody}
                        onChange={(e) => setCustomHtmlBody(e.target.value)}
                        placeholder="<p>Write your email content here...</p>"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono text-sm text-slate-700"
                      />
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">
                        Available variables: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-600">{'{{tenantName}}'}</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-600">{'{{email}}'}</code>
                      </p>
                    </div>
                  </div>
                )}

                {/* Filters Section */}
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-4">
                    <Filter size={16} className="text-slate-400" />
                    Recipient Filters (Optional)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-3">Tenant Status</span>
                      <div className="space-y-2">
                        {statusOptions.map(option => (
                          <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                              <input
                                type="checkbox"
                                checked={filterStatus.includes(option.value)}
                                onChange={(e) => {
                                  if (e.target.checked) setFilterStatus([...filterStatus, option.value]);
                                  else setFilterStatus(filterStatus.filter(s => s !== option.value));
                                }}
                                className="peer w-4 h-4 opacity-0 absolute"
                              />
                              <div className="w-4 h-4 border-2 border-slate-300 rounded peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                                <CheckCircle size={10} className="text-white opacity-0 peer-checked:opacity-100" />
                              </div>
                            </div>
                            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={handlePreview}
                  disabled={useTemplate ? !selectedTemplate : !customSubject || !customHtmlBody}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <Eye size={16} /> Preview
                </button>
                <button
                  onClick={handleSendBulkEmail}
                  disabled={loading || (useTemplate ? !selectedTemplate : !customSubject || !customHtmlBody)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 hover:-translate-y-0.5"
                >
                  {loading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                  {loading ? 'Sending...' : 'Send Campaign'}
                </button>
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-800">Email Templates</h3>
                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setTemplateForm({ name: '', subject: '', htmlBody: '', textBody: '', description: '', category: 'general', isActive: true });
                    setIsTemplateModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
                >
                  <Plus size={16} /> New Template
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-100 shadow-sm">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left font-black text-[10px] text-slate-400 uppercase tracking-widest">Name</th>
                      <th className="px-6 py-4 text-left font-black text-[10px] text-slate-400 uppercase tracking-widest">Subject</th>
                      <th className="px-6 py-4 text-left font-black text-[10px] text-slate-400 uppercase tracking-widest">Category</th>
                      <th className="px-6 py-4 text-center font-black text-[10px] text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-right font-black text-[10px] text-slate-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {templates.map((template) => (
                      <tr key={template.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-700 text-sm">{template.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{template.description}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600 text-sm max-w-xs truncate">
                          {template.subject}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wide">
                            {template.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${template.isActive
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : 'bg-slate-50 text-slate-500 border-slate-100'
                            }`}>
                            {template.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingTemplate(template);
                                setTemplateForm({
                                  name: template.name,
                                  subject: template.subject,
                                  htmlBody: template.htmlBody,
                                  textBody: template.textBody || '',
                                  description: template.description,
                                  category: template.category,
                                  isActive: template.isActive,
                                });
                                setIsTemplateModalOpen(true);
                              }}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {templates.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-3">
                            <FileText className="text-slate-300" size={24} />
                          </div>
                          <p className="text-slate-500 font-medium">No templates found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <h3 className="text-lg font-black text-slate-800">Campaign History</h3>
              <div className="overflow-hidden rounded-xl border border-slate-100 shadow-sm">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left font-black text-[10px] text-slate-400 uppercase tracking-widest">Subject</th>
                      <th className="px-6 py-4 text-center font-black text-[10px] text-slate-400 uppercase tracking-widest">Recipients</th>
                      <th className="px-6 py-4 text-center font-black text-[10px] text-slate-400 uppercase tracking-widest">Success</th>
                      <th className="px-6 py-4 text-center font-black text-[10px] text-slate-400 uppercase tracking-widest">Failed</th>
                      <th className="px-6 py-4 text-center font-black text-[10px] text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-right font-black text-[10px] text-slate-400 uppercase tracking-widest">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-700 text-sm">{log.subject}</td>
                        <td className="px-6 py-4 text-center text-slate-600 font-mono text-xs">{log.totalRecipients}</td>
                        <td className="px-6 py-4 text-center text-emerald-600 font-bold text-xs">{log.successCount}</td>
                        <td className="px-6 py-4 text-center text-red-600 font-bold text-xs">{log.failureCount}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${log.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                              log.status === 'failed' ? 'bg-red-50 text-red-600' :
                                'bg-amber-50 text-amber-600'
                            }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500 text-xs">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-3">
                            <History className="text-slate-300" size={24} />
                          </div>
                          <p className="text-slate-500 font-medium">No email history found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-[24px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md px-8 py-6 border-b border-slate-100 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  {editingTemplate ? 'Edit Template' : 'Create Template'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">Configure email template details</p>
              </div>
              <button onClick={() => setIsTemplateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Template Name</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="e.g. Welcome Email"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Category</label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                  >
                    {categoryOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Subject Line</label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">HTML Content</label>
                <textarea
                  rows={6}
                  value={templateForm.htmlBody}
                  onChange={(e) => setTemplateForm({ ...templateForm, htmlBody: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono text-sm text-slate-700"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <input
                  type="checkbox"
                  checked={templateForm.isActive}
                  onChange={(e) => setTemplateForm({ ...templateForm, isActive: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-sm font-bold text-slate-700">Set as Active Template</span>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-8 py-6 flex items-center justify-end gap-3 z-10">
              <button onClick={() => setIsTemplateModalOpen(false)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleSaveTemplate} disabled={loading} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                {loading ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-lg font-black text-slate-800">Preview: {previewContent.subject}</h2>
                <p className="text-xs text-slate-500 mt-0.5">This is how your email will look to recipients</p>
              </div>
              <button onClick={() => setIsPreviewModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-0 bg-white h-[500px] overflow-y-auto">
              <iframe
                srcDoc={previewContent.html}
                className="w-full h-full border-0 block"
                title="Email Preview"
              />
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default BulkEmail;
