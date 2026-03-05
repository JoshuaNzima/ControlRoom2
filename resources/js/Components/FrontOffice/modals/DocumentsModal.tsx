import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Card } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';
import axios from 'axios';
import { format } from 'date-fns';

interface Document {
  id: number;
  title: string;
  description: string | null;
  document_reference: string | null;
  confidentiality_level: string | null;
  status: string;
  priority: string;
  created_at: string;
}

interface DocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: 'executive' | 'personal';
}

export default function DocumentsModal({ open, onOpenChange, category }: { open: boolean; onOpenChange: (open: boolean) => void; category: 'executive' | 'personal' }) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_reference: '',
    confidentiality_level: 'normal',
    priority: 'medium',
  });

  const isExecutive = category === 'executive';
  const dutyType = isExecutive ? 'report_document' : 'document_organization';
  const apiEndpoint = isExecutive ? '/front-office/api/office-duties' : '/front-office/api/personal-duties';
  const modalTitle = isExecutive ? 'Reports & Documents' : 'Document Organization';
  const iconColor = isExecutive ? 'bg-purple-600' : 'bg-violet-600';

  useEffect(() => {
    if (open) fetchDocs();
  }, [open]);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(apiEndpoint, { params: { duty_type: dutyType } });
      setDocs(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        duty_type: dutyType,
        ...(isExecutive ? {} : { employer_name: 'Principal' }),
      };
      await axios.post(apiEndpoint, payload);
      setFormData({ title: '', description: '', document_reference: '', confidentiality_level: 'normal', priority: 'medium' });
      setShowForm(false);
      fetchDocs();
    } catch (error) {
      console.error('Failed to create document:', error);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await axios.put(`${apiEndpoint}/${id}`, { status });
      fetchDocs();
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const deleteDoc = async (id: number) => {
    if (!confirm('Delete this document entry?')) return;
    try {
      await axios.delete(`${apiEndpoint}/${id}`);
      fetchDocs();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const getConfidentialityBadge = (level: string | null) => {
    const badges: Record<string, string> = {
      normal: 'bg-gray-100 text-gray-700 dark:bg-gray-800',
      confidential: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30',
      strictly_confidential: 'bg-red-100 text-red-700 dark:bg-red-900/30',
      private: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30',
    };
    return badges[level || 'normal'] || badges.normal;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className={`p-2 ${iconColor} rounded-lg text-white`}>
              <IconMapper name="FileText" size={24} />
            </div>
            {modalTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Documents ({docs.length})</h3>
            <Button onClick={() => setShowForm(!showForm)} className={`${iconColor} hover:opacity-90 text-white`}>
              <IconMapper name="Plus" size={16} className="mr-2" />
              {showForm ? 'Cancel' : 'Add Document'}
            </Button>
          </div>

          {showForm && (
            <Card className={`p-4 ${isExecutive ? 'border-purple-200 dark:border-purple-800' : 'border-violet-200 dark:border-violet-800'}`}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Document Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Q1 Financial Report"
                    required
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Reference/File Number</Label>
                    <Input
                      value={formData.document_reference}
                      onChange={(e) => setFormData({ ...formData, document_reference: e.target.value })}
                      placeholder="e.g., DOC-2024-001"
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confidentiality</Label>
                    <Select 
                      value={formData.confidentiality_level} 
                      onValueChange={(value) => setFormData({ ...formData, confidentiality_level: value })}
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="confidential">Confidential</SelectItem>
                        <SelectItem value="strictly_confidential">Strictly Confidential</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description/Notes</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Document description, location, access instructions..."
                    rows={3}
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" className={`${iconColor} hover:opacity-90 text-white`}>Save Document</Button>
                </div>
              </form>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : docs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <IconMapper name="FileText" size={48} className="mx-auto mb-4 opacity-50" />
              <p>No documents yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {docs.map((doc) => (
                <Card key={doc.id} className="p-4 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{doc.title}</h4>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getConfidentialityBadge(doc.confidentiality_level)}`}>
                          {doc.confidentiality_level?.replace('_', ' ') || 'Normal'}
                        </span>
                      </div>
                      {doc.document_reference && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">Ref: {doc.document_reference}</p>
                      )}
                      {doc.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{doc.description}</p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {format(new Date(doc.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {doc.status !== 'completed' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(doc.id, 'completed')}
                          className="text-green-600 border-green-200 dark:border-green-800">
                          <IconMapper name="Check" size={16} />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => deleteDoc(doc.id)}
                        className="text-red-600 border-red-200 dark:border-red-800">
                        <IconMapper name="Trash2" size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
