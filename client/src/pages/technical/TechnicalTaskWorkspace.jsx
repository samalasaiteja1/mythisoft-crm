import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload, ListTodo } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import {
  tasksAPI, documentsAPI, projectsAPI, formatDate, TASK_PRIORITIES,
} from '../../services/api';
import {
  TASK_STATUS_OPTIONS, normalizeTaskStatus, taskStatusLabel,
} from '../../constants/taskForm';
import { TECH_WORK_TYPES } from '../../constants/technicalPersonForm';
import { TechPersonPageHeader } from '../../components/technical/technicalPersonUi';

const sectionTitle = (text) => (
  <h3 className="text-sm font-semibold text-white border-b border-myth-border pb-2 mb-3">{text}</h3>
);

export default function TechnicalTaskWorkspace() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'details';
  const [tab, setTab] = useState(initialTab);
  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [statusForm, setStatusForm] = useState({ status: '', comments: '', file: null });
  const [uploadForm, setUploadForm] = useState({ workType: 'Code', comments: '', file: null });
  const [resubmitForm, setResubmitForm] = useState({ changesMade: '', comments: '', file: null });
  const [testForm, setTestForm] = useState({ status: 'passed', comments: '', bugCreated: false });

  const load = () => {
    setLoading(true);
    tasksAPI.getOne(id)
      .then(async ({ data }) => {
        setTask(data);
        const pid = data.relatedTo?.type === 'project' ? data.relatedTo.id?._id || data.relatedTo.id : null;
        if (pid) {
          const { data: p } = await projectsAPI.getOne(pid);
          setProject(p);
        }
        setStatusForm({ status: normalizeTaskStatus(data.status), comments: '', file: null });
      })
      .catch(() => toast.error('Task not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && ['details', 'status', 'upload', 'review', 'testing'].includes(t)) setTab(t);
  }, [searchParams]);

  const projectName = project?.name || task?.milestone?.project?.name || '—';

  const handleStartTask = async () => {
    setSubmitting(true);
    try {
      const { data } = await tasksAPI.update(id, { status: 'in_progress' });
      setTask(data);
      toast.success('Task started');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusForm.status) return toast.error('Select a status');
    setSubmitting(true);
    try {
      let workUpload = null;
      if (statusForm.file) {
        const fd = new FormData();
        fd.append('file', statusForm.file);
        fd.append('name', statusForm.file.name);
        fd.append('folder', 'Tasks');
        fd.append('relatedType', 'task');
        fd.append('relatedId', id);
        const { data: doc } = await documentsAPI.create(fd);
        workUpload = {
          workType: 'Document',
          name: doc.name || statusForm.file.name,
          fileUrl: doc.fileUrl,
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          comments: statusForm.comments,
        };
      }
      const payload = {
        status: statusForm.status,
        statusComment: statusForm.comments,
      };
      if (workUpload) payload.workUpload = workUpload;
      const { data } = await tasksAPI.update(id, payload);
      setTask(data);
      setStatusForm((f) => ({ ...f, comments: '', file: null }));
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadWork = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) return toast.error('Choose a file');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadForm.file);
      fd.append('name', uploadForm.file.name);
      fd.append('folder', 'Tasks');
      fd.append('relatedType', 'task');
      fd.append('relatedId', id);
      const { data: doc } = await documentsAPI.create(fd);
      const { data } = await tasksAPI.update(id, {
        workUpload: {
          workType: uploadForm.workType,
          name: doc.name || uploadForm.file.name,
          fileUrl: doc.fileUrl,
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          comments: uploadForm.comments,
        },
      });
      setTask(data);
      setUploadForm({ workType: 'Code', comments: '', file: null });
      toast.success('Work uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        workStatus: 'code_review',
        codeReview: {
          status: 'pending',
          resubmitNotes: resubmitForm.changesMade,
          reply: resubmitForm.comments,
          resubmitDate: new Date(),
        },
      };
      if (resubmitForm.file) {
        const fd = new FormData();
        fd.append('file', resubmitForm.file);
        fd.append('name', resubmitForm.file.name);
        fd.append('folder', 'Tasks');
        fd.append('relatedType', 'task');
        fd.append('relatedId', id);
        const { data: doc } = await documentsAPI.create(fd);
        payload.workUpload = {
          workType: 'Code',
          name: doc.name || resubmitForm.file.name,
          fileUrl: doc.fileUrl,
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          comments: resubmitForm.comments,
        };
      }
      const { data } = await tasksAPI.update(id, payload);
      setTask(data);
      setResubmitForm({ changesMade: '', comments: '', file: null });
      toast.success('Submitted for review');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestResult = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await tasksAPI.update(id, {
        testResult: {
          status: testForm.status,
          comments: testForm.comments,
          bugCreated: testForm.bugCreated,
        },
      });
      setTask(data);
      toast.success('Test result saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!task) return <p className="text-gray-500">Task not found</p>;

  const taskStatus = normalizeTaskStatus(task.status);
  const tabs = [
    { key: 'details', label: 'Task Details' },
    { key: 'status', label: 'Update Status' },
    { key: 'upload', label: 'Upload Work' },
    { key: 'review', label: 'Code Review' },
    { key: 'testing', label: 'Testing' },
  ];

  return (
    <div className="space-y-6">
      <Link to="/technical/tasks" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
        <ArrowLeft size={16} /> Back to tasks
      </Link>
      <TechPersonPageHeader
        icon={ListTodo}
        title={task.title}
        subtitle={projectName}
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              tab === t.key
                ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200'
                : 'border-myth-border bg-myth-surface text-gray-400 hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <div className="card space-y-4">
          {sectionTitle('Task Details')}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Project</span><p className="text-white">{projectName}</p></div>
            <div><span className="text-gray-500">Milestone</span><p className="text-white">{task.milestone?.name || '—'}</p></div>
            <div><span className="text-gray-500">Assigned By</span><p className="text-white">{task.createdBy ? `${task.createdBy.firstName} ${task.createdBy.lastName}` : '—'}</p></div>
            <div><span className="text-gray-500">Priority</span><p><StatusBadge status={task.priority} config={TASK_PRIORITIES} /></p></div>
            <div><span className="text-gray-500">Start Date</span><p className="text-white">{task.startDate ? formatDate(task.startDate) : '—'}</p></div>
            <div><span className="text-gray-500">Due Date</span><p className="text-white">{task.dueDate ? formatDate(task.dueDate) : '—'}</p></div>
            <div><span className="text-gray-500">Status</span><p className="text-white">{taskStatusLabel(task.status)}</p></div>
            <div><span className="text-gray-500">Team</span><p className="text-white">{task.staffRole?.name || '—'}</p></div>
          </div>
          <div>
            <span className="text-gray-500 text-sm">Description</span>
            <p className="text-gray-300 mt-1">{task.description || '—'}</p>
          </div>
          {task.attachments?.length > 0 && (
            <div>
              <span className="text-gray-500 text-sm">Attachments</span>
              <ul className="mt-1 space-y-1">
                {task.attachments.map((a) => (
                  <li key={a._id || a.fileUrl}>
                    <a href={a.fileUrl} target="_blank" rel="noreferrer" className="text-myth-accent text-sm hover:underline">{a.name || 'File'}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            {(taskStatus === 'new' || taskStatus === 'pending') && (
              <button type="button" onClick={handleStartTask} disabled={submitting} className="btn-primary text-sm">Start Task</button>
            )}
            <button type="button" onClick={() => setTab('status')} className="btn-secondary text-sm">Update Status</button>
          </div>
        </div>
      )}

      {tab === 'status' && (
        <form onSubmit={handleUpdateStatus} className="card space-y-4">
          {sectionTitle('Update Task Status')}
          <p className="text-xs text-gray-500">
            Task status tracks your daily work — separate from project or milestone status.
          </p>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Task</label>
            <p className="text-white">{task.title}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Current Status</label>
            <p className="text-gray-400">{taskStatusLabel(task.status)}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Change Status *</label>
            <select
              value={statusForm.status}
              onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
              className="input-field w-full sm:w-64"
              required
            >
              {TASK_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Comments</label>
            <textarea value={statusForm.comments} onChange={(e) => setStatusForm({ ...statusForm, comments: e.target.value })} className="input-field h-20 w-full" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Upload File</label>
            <input type="file" onChange={(e) => setStatusForm({ ...statusForm, file: e.target.files?.[0] || null })} className="text-sm text-gray-400" />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary text-sm">{submitting ? 'Updating…' : 'Update'}</button>
        </form>
      )}

      {tab === 'upload' && (
        <form onSubmit={handleUploadWork} className="card space-y-4">
          {sectionTitle('Upload Work')}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Work Type</label>
            <select value={uploadForm.workType} onChange={(e) => setUploadForm({ ...uploadForm, workType: e.target.value })} className="input-field w-full sm:w-64">
              {TECH_WORK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1 flex items-center gap-1"><Upload size={14} /> Upload File *</label>
            <input type="file" required onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })} className="text-sm text-gray-400" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Comments</label>
            <textarea value={uploadForm.comments} onChange={(e) => setUploadForm({ ...uploadForm, comments: e.target.value })} className="input-field h-20 w-full" />
          </div>
          {task.workUploads?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Previous uploads</p>
              <ul className="space-y-1 text-sm text-gray-400">
                {task.workUploads.map((w, i) => (
                  <li key={i}>{w.workType}: <a href={w.fileUrl} className="text-myth-accent hover:underline">{w.name}</a></li>
                ))}
              </ul>
            </div>
          )}
          <button type="submit" disabled={submitting} className="btn-primary text-sm">{submitting ? 'Uploading…' : 'Upload'}</button>
        </form>
      )}

      {tab === 'review' && (
        <div className="space-y-4">
          <div className="card space-y-3">
            {sectionTitle('Review Comments')}
            {task.codeReview?.comments ? (
              <>
                <p className="text-sm text-gray-400">Reviewer: {task.codeReview.reviewer ? `${task.codeReview.reviewer.firstName} ${task.codeReview.reviewer.lastName}` : 'Technical Manager'}</p>
                <p className="text-sm text-white">Status: <span className="capitalize">{task.codeReview.status?.replace(/_/g, ' ')}</span></p>
                <p className="text-gray-300">{task.codeReview.comments}</p>
                {task.codeReview.reviewDate && <p className="text-xs text-gray-500">{formatDate(task.codeReview.reviewDate)}</p>}
              </>
            ) : (
              <p className="text-gray-500 text-sm">No review comments yet</p>
            )}
          </div>
          <form onSubmit={handleResubmit} className="card space-y-4">
            {sectionTitle('Resubmit Task')}
            <div>
              <label className="block text-sm text-gray-300 mb-1">Changes Made</label>
              <textarea value={resubmitForm.changesMade} onChange={(e) => setResubmitForm({ ...resubmitForm, changesMade: e.target.value })} className="input-field h-20 w-full" required />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Upload Updated Code</label>
              <input type="file" onChange={(e) => setResubmitForm({ ...resubmitForm, file: e.target.files?.[0] || null })} className="text-sm text-gray-400" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Comments</label>
              <textarea value={resubmitForm.comments} onChange={(e) => setResubmitForm({ ...resubmitForm, comments: e.target.value })} className="input-field h-20 w-full" />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary text-sm">{submitting ? 'Submitting…' : 'Submit For Review'}</button>
          </form>
        </div>
      )}

      {tab === 'testing' && (
        <form onSubmit={handleTestResult} className="card space-y-4">
          {sectionTitle('Testing Result')}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Test Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="radio" checked={testForm.status === 'passed'} onChange={() => setTestForm({ ...testForm, status: 'passed' })} /> Passed
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="radio" checked={testForm.status === 'failed'} onChange={() => setTestForm({ ...testForm, status: 'failed' })} /> Failed
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Tester Comments</label>
            <textarea value={testForm.comments} onChange={(e) => setTestForm({ ...testForm, comments: e.target.value })} className="input-field h-20 w-full" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={testForm.bugCreated} onChange={(e) => setTestForm({ ...testForm, bugCreated: e.target.checked })} />
            Bug Created
          </label>
          {task.testResult?.status && task.testResult.status !== 'pending' && (
            <p className="text-xs text-gray-500">Last result: {task.testResult.status} — {task.testResult.comments || 'No comments'}</p>
          )}
          <button type="submit" disabled={submitting} className="btn-primary text-sm">{submitting ? 'Saving…' : 'Save Test Result'}</button>
        </form>
      )}

      {task.statusComments?.length > 0 && (
        <div className="card">
          {sectionTitle('Status History')}
          <ul className="space-y-2 text-sm text-gray-400">
            {task.statusComments.map((c, i) => (
              <li key={i} className="border-l-2 border-myth-border pl-3">{c.text} <span className="text-gray-600 text-xs">{formatDate(c.createdAt)}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
