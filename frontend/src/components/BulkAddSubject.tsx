import React, { useMemo, useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Modal from './Modal';
import api from '../services/api';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
};

const BulkAddSubject: React.FC<Props> = ({ isOpen, onClose, onCreated }) => {
  const [std, setStd] = useState<string>('');
  const [medium, setMedium] = useState<string>('English');
  const [stream, setStream] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [serverErrors, setServerErrors] = useState<Array<{ index: number; message: string }>>([]);

  const getSubjectLevel = (stdValue: string) => {
    const standardNum = Number(stdValue);
    if (standardNum >= 11) return 'Higher Secondary';
    if (standardNum >= 9) return 'Secondary';
    if (standardNum >= 1) return 'Primary';
    return 'Secondary';
  };

  const subject_level = useMemo(() => getSubjectLevel(std), [std]);
  const stdNum = Number(std);

  const getStreamOptions = (stdValue: string) => {
    const standardNum = Number(stdValue);
    if (standardNum >= 11) {
      return [
        { value: 'Science-Maths', label: 'Sci-Maths' },
        { value: 'Science-Bio', label: 'Sci-Bio' },
        { value: 'Commerce', label: 'Commerce' },
        { value: 'Higher Secondary', label: 'Higher Sec' },
      ];
    } else if (standardNum >= 9) {
      return [
        { value: 'Foundation', label: 'Foundation' },
        { value: 'Secondary', label: 'Secondary' },
      ];
    } else if (standardNum >= 6) {
      return [{ value: 'Upper Primary', label: 'Upper Primary' }];
    }
    return [];
  };

  const streamOptions = useMemo(() => getStreamOptions(std), [std]);
  const isSubjectCodeRequired = stdNum >= 10;
  const isStreamRequired = stdNum >= 11;

  const parsedSubjects = useMemo(() => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    return lines.map((line) => {
      const comma = line.split(',').map((s) => s.trim()).filter(Boolean);
      if (comma.length >= 2) {
        return { subject_code: comma[0], subject_name: comma.slice(1).join(', ') };
      }

      const dash = line.split(' - ').map((s) => s.trim()).filter(Boolean);
      if (dash.length >= 2) {
        return { subject_code: dash[0], subject_name: dash.slice(1).join(' - ') };
      }

      const parts = line.split(/\s+-\s+/).map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        return { subject_code: parts[0], subject_name: parts.slice(1).join(' - ') };
      }

      return { subject_name: line };
    });
  }, [text]);

  const reset = () => {
    setStd('');
    setMedium('English');
    setStream('');
    setText('');
    setSubmitting(false);
    setServerErrors([]);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerErrors([]);

    if (!std) {
      toast.error('Please select class');
      return;
    }
    if (!medium) {
      toast.error('Please select medium');
      return;
    }
    if (isStreamRequired && !stream) {
      toast.error('Stream required for class 11-12');
      return;
    }

    if (parsedSubjects.length === 0) {
      toast.error('Please enter at least 1 subject');
      return;
    }

    if (isSubjectCodeRequired) {
      const missingCode = parsedSubjects.findIndex((s) => !s.subject_code);
      if (missingCode !== -1) {
        toast.error(`Subject code required for class 10-12 (line ${missingCode + 1})`);
        return;
      }
    }

    const missingName = parsedSubjects.findIndex((s) => !s.subject_name);
    if (missingName !== -1) {
      toast.error(`Subject name required (line ${missingName + 1})`);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        std,
        medium,
        subject_level,
        stream: stream || undefined,
        subjects: parsedSubjects,
      };

      const r = await api.post('/subject/bulk', payload);
      const createdCount = r.data?.count ?? r.data?.data?.length ?? 0;
      const errs = Array.isArray(r.data?.errors) ? r.data.errors : [];

      if (errs.length > 0) {
        setServerErrors(errs);
      }

      if (createdCount > 0) {
        toast.success(`${createdCount} subject${createdCount === 1 ? '' : 's'} created`);
        await onCreated();
      }

      if (errs.length === 0) {
        handleClose();
      } else if (createdCount === 0) {
        toast.error('No subjects created');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creating subjects');
      const errs = Array.isArray(err.response?.data?.errors) ? err.response.data.errors : [];
      if (errs.length > 0) setServerErrors(errs);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Add Subjects" size="lg">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">Class *</label>
            <select
              className="w-full px-2 py-1.5 text-sm border rounded-lg"
              required
              value={std}
              onChange={(e) => {
                setStd(e.target.value);
                setStream('');
              }}
              disabled={submitting}
            >
              <option value="">Select</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => (
                <option key={s} value={s}>
                  Class {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">Medium *</label>
            <select
              className="w-full px-2 py-1.5 text-sm border rounded-lg"
              required
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
              disabled={submitting}
            >
              <option value="English">English</option>
              <option value="Gujarati">Gujarati</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">Level</label>
            <input className="w-full px-2 py-1.5 text-sm border rounded-lg bg-gray-50" value={subject_level} disabled />
          </div>
          {streamOptions.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Stream {isStreamRequired && '*'}</label>
              <select
                className="w-full px-2 py-1.5 text-sm border rounded-lg"
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                required={isStreamRequired}
                disabled={submitting}
              >
                <option value="">Select</option>
                {streamOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-700">Subjects</label>
            <span className="text-[10px] text-gray-500">{parsedSubjects.length} line{parsedSubjects.length === 1 ? '' : 's'}</span>
          </div>
          <textarea
            className="w-full px-2 py-1.5 text-sm border rounded-lg font-mono"
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isSubjectCodeRequired ? 'CODE, Subject Name\nCODE - Subject Name' : 'Subject Name\n(optional) CODE, Subject Name'}
            disabled={submitting}
          />
          <div className="mt-1 text-[10px] text-gray-500">
            {isSubjectCodeRequired ? 'Format: CODE, Name (required for class 10-12)' : 'Format: Name OR CODE, Name'}
          </div>
        </div>

        {serverErrors.length > 0 && (
          <div className="border border-red-200 bg-red-50 rounded-lg p-2">
            <div className="text-xs font-semibold text-red-700 mb-1">Errors</div>
            <div className="max-h-32 overflow-y-auto space-y-0.5">
              {serverErrors.slice(0, 50).map((e, i) => (
                <div key={`${e.index}-${i}`} className="text-[11px] text-red-700">
                  Line {e.index + 1}: {e.message}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="flex-1 bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary-700 flex items-center justify-center gap-2"
            disabled={submitting}
          >
            <FaPlus className="text-xs" />
            <span>{submitting ? 'Creating...' : 'Create'}</span>
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-300"
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BulkAddSubject;
