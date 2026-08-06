import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Upload, Inbox, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI } from '../../services/api';
import { uploadDeliveryDocument, uploadRequirementsDocument } from '../../utils/projectDocument';
import RequirementsDocLinks from './RequirementsDocLinks';
import RequirementsDocumentField from './RequirementsDocumentField';
import CustomerRequirementsPanel from './CustomerRequirementsPanel';
import { usePermissions } from '../../hooks/usePermissions';

export default forwardRef(function ProjectDocumentsPanel({
  projectId,
  canSubmit = false,
  projectStatus,
  workflowStage = 'project_started',
  compact = false,
  initialRequirements = null,
  initialDelivery = null,
  showRequirementsSubmit = true,
}, ref) {
  const { isAdmin, isManager, isCustomer, isTechnical } = usePermissions();
  const managerView = (isAdmin || isManager) && !canSubmit;
  const technicalView = isTechnical && !canSubmit;
  const [requirements, setRequirements] = useState(initialRequirements || []);
  const [customerRequirements, setCustomerRequirements] = useState([]);
  const [deliveryDocs, setDeliveryDocs] = useState(initialDelivery || []);
  const [loading, setLoading] = useState(!initialRequirements && !initialDelivery);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [reqUploadFile, setReqUploadFile] = useState(null);
  const [uploadingReq, setUploadingReq] = useState(false);

  const showTechSubmissions = ['development', 'testing', 'deployment', 'delivered', 'support', 'completed'].includes(workflowStage);
  const canUploadRequirements = managerView && workflowStage === 'project_started';

  const loadDocs = () => {
    if (!projectId) return Promise.resolve();
    return Promise.all([
      projectsAPI.getRequirementsDocuments(projectId),
      projectsAPI.getDeliveryDocuments(projectId),
      managerView || isCustomer || technicalView ? projectsAPI.getCustomerRequirementsDocuments(projectId) : Promise.resolve({ data: [] }),
    ]).then(([reqRes, delRes, custRes]) => {
      setRequirements(Array.isArray(reqRes.data) ? reqRes.data : []);
      setDeliveryDocs(Array.isArray(delRes.data) ? delRes.data : []);
      setCustomerRequirements(Array.isArray(custRes.data) ? custRes.data : []);
    });
  };

  useEffect(() => {
    if (!projectId) return undefined;
    if (initialRequirements) setRequirements(initialRequirements);
    if (initialDelivery) setDeliveryDocs(initialDelivery);
    const needsCustomerReqs = managerView || isCustomer || technicalView;
    if (initialRequirements && initialDelivery && !needsCustomerReqs) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    loadDocs()
      .catch(() => toast.error('Failed to load project documents'))
      .finally(() => setLoading(false));
    return undefined;
  }, [projectId, initialRequirements, initialDelivery, managerView, isCustomer, technicalView]);

  const handleSubmit = async () => {
    if (!uploadFile) {
      toast.error('Select a file to submit');
      return;
    }
    setUploading(true);
    try {
      const doc = await uploadDeliveryDocument(projectId, uploadFile);
      if (doc) {
        setDeliveryDocs((prev) => [doc, ...prev]);
        setUploadFile(null);
        toast.success('Project document submitted — admin and manager notified');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit document');
    } finally {
      setUploading(false);
    }
  };

  const handleRequirementsUpload = async (silent = false) => {
    if (!reqUploadFile) {
      if (!silent) toast.error('Select a requirements document');
      return null;
    }
    setUploadingReq(true);
    try {
      const doc = await uploadRequirementsDocument(projectId, reqUploadFile);
      if (doc) {
        setRequirements((prev) => [doc, ...prev]);
        setReqUploadFile(null);
        if (!silent) toast.success('Requirements document sent to technical team');
      }
      return doc;
    } catch (err) {
      if (!silent) toast.error(err.response?.data?.message || 'Failed to upload requirements document');
      throw err;
    } finally {
      setUploadingReq(false);
    }
  };

  useImperativeHandle(ref, () => ({
    uploadRequirementsIfPending: () => (reqUploadFile ? handleRequirementsUpload(true) : Promise.resolve(null)),
    hasPendingRequirements: () => Boolean(reqUploadFile),
  }));

  const isCompleted = ['completed', 'delivered'].includes(projectStatus);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading documents…</p>;
  }

  if (isCustomer) {
    return (
      <CustomerRequirementsPanel
        projects={[{ _id: projectId, name: 'This project' }]}
        projectId={projectId}
        compact={compact}
        showProjectSelect={false}
      />
    );
  }

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      <div>
        <h3 className={`font-semibold text-white flex items-center gap-2 ${compact ? 'text-sm mb-2' : 'text-lg mb-4'}`}>
          <Inbox size={compact ? 16 : 18} className="text-cyan-400" />
          {managerView ? 'Requirements sent to technical team' : 'Requirements received'}
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          {managerView
            ? 'Upload requirements from the deal or attach new files before advancing to Development'
            : 'Documents from admin or manager when the project was assigned'}
        </p>
        <RequirementsDocLinks
          documents={requirements}
          compact={compact}
          emptyMessage="No requirements document received yet"
        />
        {canUploadRequirements && (
          <div className="mt-4 space-y-3">
            <RequirementsDocumentField
              label="Upload requirements document"
              file={reqUploadFile}
              onChange={setReqUploadFile}
            />
            {showRequirementsSubmit && (
              <button
                type="button"
                onClick={() => handleRequirementsUpload()}
                disabled={uploadingReq || !reqUploadFile}
                className="btn-primary text-sm inline-flex items-center gap-2"
              >
                <Upload size={14} />
                {uploadingReq ? 'Submitting…' : 'Submit'}
              </button>
            )}
          </div>
        )}
      </div>

      {managerView && (
        <div className={compact ? 'pt-3 border-t border-myth-border' : ''}>
          <h3 className={`font-semibold text-white flex items-center gap-2 ${compact ? 'text-sm mb-2' : 'text-lg mb-4'}`}>
            <Inbox size={compact ? 16 : 18} className="text-orange-400" /> Customer submitted requirements
          </h3>
          <p className="text-xs text-gray-500 mb-3">Documents uploaded by the customer from their portal</p>
          {customerRequirements.length > 0 ? (
            <RequirementsDocLinks documents={customerRequirements} compact={compact} emptyMessage="" />
          ) : (
            <p className="text-sm text-gray-500">No customer requirements submitted yet</p>
          )}
        </div>
      )}

      {showTechSubmissions && (
        <div className={compact ? 'pt-3 border-t border-myth-border' : ''}>
          <h3 className={`font-semibold text-white flex items-center gap-2 ${compact ? 'text-sm mb-2' : 'text-lg mb-4'}`}>
            <Send size={compact ? 16 : 18} className="text-green-400" />
            {managerView ? 'Technical team submissions' : 'Submit project documents'}
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            {managerView
              ? 'Completion files submitted by technical staff after delivery'
              : 'Upload completion files after delivery — source code, reports, manuals, etc. Admin and manager will be notified.'}
          </p>

          {canSubmit && (
            <div className="mb-4 space-y-3">
              <RequirementsDocumentField
                label="Project completion document"
                file={uploadFile}
                onChange={setUploadFile}
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={uploading || !uploadFile}
                className="btn-primary text-sm inline-flex items-center gap-2"
              >
                <Upload size={14} />
                {uploading ? 'Submitting…' : isCompleted ? 'Submit document' : 'Submit document (mark completed when done)'}
              </button>
            </div>
          )}

          {deliveryDocs.length > 0 ? (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                {managerView ? 'Submitted by technical team' : 'Submitted documents'}
              </p>
              <RequirementsDocLinks documents={deliveryDocs} compact={compact} emptyMessage="" />
            </div>
          ) : (
            !canSubmit && <p className="text-sm text-gray-500">{managerView ? 'Waiting for technical team to submit completion documents' : 'No delivery documents submitted yet'}</p>
          )}
        </div>
      )}
    </div>
  );
});
