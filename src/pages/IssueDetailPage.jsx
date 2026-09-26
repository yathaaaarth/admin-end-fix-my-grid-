import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getIssue, transitionIssue, resolveIssue, assignIssue, addIssueNote, getStaff, requestCitizenVerification } from '../api/authority';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import {
  ArrowLeft, MapPin, Calendar, User, CheckCircle2,
  XCircle, Play, RotateCcw, Upload, MessageSquare, Clock
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Which actions are available for each status
const ACTIONS = {
  reported: [
    { label: 'Verify', status: 'verified', icon: CheckCircle2, primary: true },
    { label: 'Reject', status: 'rejected', icon: XCircle, primary: false },
  ],
  verified: [
    { label: 'Start Work', status: 'in_progress', icon: Play, primary: true },
    { label: 'Reject', status: 'rejected', icon: XCircle, primary: false },
  ],
  assigned: [
    { label: 'Start Work', status: 'in_progress', icon: Play, primary: true },
    { label: 'Reject', status: 'rejected', icon: XCircle, primary: false },
  ],
  in_progress: [
    { label: 'Reject', status: 'rejected', icon: XCircle, primary: false },
  ],
  resolved: [
    { label: 'Re-open', status: 'in_progress', icon: RotateCcw, primary: false },
  ],
  rejected: [
    { label: 'Re-open', status: 'reported', icon: RotateCcw, primary: false },
  ],
};

export default function IssueDetailPage() {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [message, setMessage] = useState(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  // Resolution form
  const [resImage, setResImage] = useState(null);
  const [resNotes, setResNotes] = useState('');
  const [resLoading, setResLoading] = useState(false);

  // Note form
  const [newNote, setNewNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  const load = async () => {
    try {
      const [issueData, staffData] = await Promise.all([getIssue(id), getStaff()]);
      setIssue(issueData);
      setStaff(staffData);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleTransition = async (newStatus) => {
    if (newStatus === 'rejected' && !showRejectConfirm) {
      setShowRejectConfirm(true);
      return;
    }
    setShowRejectConfirm(false);
    setActionLoading(newStatus);
    setMessage(null);
    try {
      const updated = await transitionIssue(id, newStatus);
      setIssue(updated);
      setMessage({ type: 'success', text: `Status changed to "${newStatus.replace('_', ' ')}"` });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Transition failed.',
      });
    } finally {
      setActionLoading('');
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resImage) return;
    setResLoading(true);
    setMessage(null);
    try {
      const updated = await resolveIssue(id, resImage, resNotes);
      setIssue(updated);
      setResImage(null);
      setResNotes('');
      setMessage({
        type: 'success',
        text: `Issue resolved successfully.`,
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Resolution failed.',
      });
    } finally {
      setResLoading(false);
    }
  };

  const handleVerificationRequest = async () => {
    setActionLoading('verify_req');
    setMessage(null);
    try {
      const updated = await requestCitizenVerification(id);
      setIssue(updated);
      setMessage({ type: 'success', text: 'Verification request sent to the citizen.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to send verification request.' });
    } finally {
      setActionLoading('');
    }
  };

  const handleAssign = async (e) => {
    const userId = e.target.value;
    try {
      const updated = await assignIssue(id, userId || null);
      setIssue(updated);
    } catch (err) {
      console.error("Assign failed", err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNoteLoading(true);
    try {
      await addIssueNote(id, newNote);
      setNewNote('');
      const updated = await getIssue(id); // Reload to get new note and activity log
      setIssue(updated);
    } catch (err) {
      console.error("Failed to add note", err);
    } finally {
      setNoteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!issue) return <div className="p-8 text-center text-muted">Issue not found.</div>;

  const actions = ACTIONS[issue.status] || [];
  const analysis = issue.analysis || {};
  const showResolveForm = (issue.status === 'in_progress' || issue.status === 'resolved') && !issue.resolution_image_url;
  
  const createdDate = new Date(issue.created_at);
  const now = new Date();
  const daysOpen = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
  const isOverdue = issue.status !== 'resolved' && issue.status !== 'rejected' && daysOpen > 7;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <Link to="/issues" className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary-500 mb-4">
        <ArrowLeft size={16} /> Back to issues
      </Link>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Images */}
          <div className="flex gap-4">
            {issue.image_url && (
              <div>
                <a href={issue.image_url} target="_blank" rel="noreferrer">
                  <img src={issue.image_url} alt="Reported" className="w-56 h-40 object-cover rounded-xl border border-line" />
                </a>
                <p className="text-xs text-muted mt-1">Before (reported)</p>
              </div>
            )}
            {issue.resolution_image_url && (
              <div>
                <a href={issue.resolution_image_url} target="_blank" rel="noreferrer">
                  <img src={issue.resolution_image_url} alt="Resolution" className="w-56 h-40 object-cover rounded-xl border border-line" />
                </a>
                <p className="text-xs text-muted mt-1">After (resolution)</p>
              </div>
            )}
          </div>

          {/* Title + badges */}
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-3">
              Issue #{issue.id}
              <StatusBadge status={issue.status} />
              <SeverityBadge severity={issue.severity} />
              {isOverdue && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12}/> Overdue ({daysOpen} days)</span>}
            </h1>
            <div className="flex flex-wrap gap-4 text-xs text-muted mt-2">
              <span className="flex items-center gap-1">
                <Calendar size={13} /> {createdDate.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <User size={13} /> {issue.reporter_email}
              </span>
              {issue.resolved_at && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-green-600" /> Resolved {new Date(issue.resolved_at).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-line p-5">
            <h3 className="text-xs font-semibold text-muted uppercase mb-2">Description</h3>
            <p className="text-sm text-ink">{issue.description || 'No description provided.'}</p>
          </div>
          
          {/* Civic Analysis */}
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-5">
             <h3 className="text-xs font-semibold text-primary-700 uppercase mb-3">Civic Analysis</h3>
             <ul className="space-y-1.5 text-sm text-ink">
               <li>Category: <strong className="capitalize">{(issue.category || '').replace('_', ' ')}</strong></li>
               <li>Department: <strong>{issue.department || 'Unassigned'}</strong></li>
               <li>Severity: <strong className="uppercase">{issue.severity}</strong></li>
               {analysis.duplicate && analysis.duplicate.is_duplicate && (
                 <li>Duplicate: <strong>Yes</strong> (Multiple reports nearby)</li>
               )}
             </ul>
          </div>
          
          {/* Mini-map */}
          {issue.latitude && issue.longitude && (
             <div className="bg-white rounded-xl border border-line p-5">
                <h3 className="text-xs font-semibold text-muted uppercase mb-3"><MapPin size={14} className="inline mr-1" />Location</h3>
                <p className="text-sm text-ink mb-2">{issue.address}</p>
                <div className="h-48 w-full rounded-lg overflow-hidden border border-line z-0 relative">
                  <MapContainer center={[issue.latitude, issue.longitude]} zoom={15} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                    <TileLayer 
                      url="https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoieWF0aHUxMTExIiwiYSI6ImNtdWlteGs5OTAzcTEyd3B5NXgxa3VsYjMifQ.n9wAJSOr7BNy6NXbOd11KA" 
                      attribution='Map data &copy; <a href="https://www.mapbox.com/">Mapbox</a>'
                    />
                    <Marker position={[issue.latitude, issue.longitude]} />
                  </MapContainer>
                </div>
             </div>
          )}

          {/* Internal Notes */}
          <div className="bg-white rounded-xl border border-line p-5">
            <h3 className="text-xs font-semibold text-muted uppercase mb-3">Internal Notes</h3>
            <div className="space-y-4 mb-4">
              {issue.notes && issue.notes.length > 0 ? issue.notes.map(note => (
                <div key={note.id} className="bg-gray-50 p-3 rounded-lg border border-line">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold">{note.author_name}</span>
                    <span className="text-xs text-muted">{new Date(note.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-ink">{note.text}</p>
                </div>
              )) : (
                <p className="text-sm text-muted">No internal notes yet.</p>
              )}
            </div>
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add an internal note..." className="flex-1 px-3 py-2 text-sm rounded-lg border border-line focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <button type="submit" disabled={noteLoading || !newNote.trim()} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-ink text-sm font-medium rounded-lg transition-colors">
                {noteLoading ? '...' : 'Add Note'}
              </button>
            </form>
          </div>
          
          {/* Activity Timeline */}
          {issue.activity_log && issue.activity_log.length > 0 && (
            <div className="bg-white rounded-xl border border-line p-5">
              <h3 className="text-xs font-semibold text-muted uppercase mb-4">Activity Timeline</h3>
              <div className="space-y-4">
                {issue.activity_log.map(log => (
                  <div key={log.id} className="flex gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 shrink-0"></div>
                    <div>
                      <p className="text-ink"><strong>{log.actor_name}</strong> {log.action.toLowerCase()}</p>
                      {log.description && <p className="text-muted text-xs mt-0.5">{log.description}</p>}
                      <p className="text-muted text-xs mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          
          {/* Assignee */}
          <div className="bg-white rounded-xl border border-line p-5">
             <h3 className="text-xs font-semibold text-muted uppercase mb-3">Assignee</h3>
             <select value={issue.assigned_to || ''} onChange={handleAssign} className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-background focus:outline-none focus:ring-2 focus:ring-primary-500">
               <option value="">Unassigned</option>
               {staff.map(user => (
                 <option key={user.id} value={user.id}>{user.name}</option>
               ))}
             </select>
          </div>

          {/* Lifecycle actions */}
          <div className="bg-white rounded-xl border border-line p-5">
            <h3 className="text-xs font-semibold text-muted uppercase mb-3">Lifecycle</h3>
            <p className="text-sm text-muted mb-4">
              Current: <strong className="text-ink capitalize">{(issue.status || '').replace('_', ' ')}</strong>
            </p>
            {showRejectConfirm && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 mb-2 font-medium">Are you sure you want to reject this issue?</p>
                <div className="flex gap-2">
                  <button onClick={() => handleTransition('rejected')} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded text-sm font-medium">Yes, Reject</button>
                  <button onClick={() => setShowRejectConfirm(false)} className="flex-1 bg-white border border-line text-ink hover:bg-gray-50 py-1.5 rounded text-sm font-medium">Cancel</button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {actions.map(({ label, status, icon: Icon, primary }) => (
                <button
                  key={status}
                  onClick={() => handleTransition(status)}
                  disabled={!!actionLoading || (showRejectConfirm && status === 'rejected')}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    primary
                      ? 'bg-primary-500 hover:bg-primary-600 text-white'
                      : 'bg-white border border-line hover:bg-gray-50 text-ink'
                  }`}
                >
                  {actionLoading === status ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Icon size={16} />
                  )}
                  {label}
                </button>
              ))}
            </div>
            
            {showResolveForm && (
              <div className="mt-4 pt-4 border-t border-line">
                <button
                  onClick={handleVerificationRequest}
                  disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-primary-500 text-primary-600 hover:bg-primary-50 disabled:opacity-50"
                >
                  {actionLoading === 'verify_req' ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <MessageSquare size={16} />
                  )}
                  Ask Citizen to Verify
                </button>
              </div>
            )}
          </div>

          {/* Resolution form */}
          {showResolveForm && (
            <div className="bg-white rounded-xl border border-line p-5">
              <h3 className="text-xs font-semibold text-muted uppercase mb-3">
                Resolve with Evidence
              </h3>
              <p className="text-xs text-muted mb-3">
                Upload a "completed" photo.
              </p>
              <form onSubmit={handleResolve} className="space-y-3">
                <div>
                  <label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-line rounded-lg cursor-pointer hover:border-primary-400 transition-colors">
                    <Upload size={18} className="text-muted" />
                    <span className="text-sm text-muted">
                      {resImage ? resImage.name : 'Choose photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setResImage(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  value={resNotes}
                  onChange={(e) => setResNotes(e.target.value)}
                  placeholder="Resolution notes (optional)"
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-background focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={!resImage || resLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-success-500 hover:bg-success-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {resLoading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  Record Resolution
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
