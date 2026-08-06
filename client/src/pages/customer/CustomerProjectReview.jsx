import { useEffect, useMemo, useState } from 'react';

import { Link, useParams } from 'react-router-dom';

import { ArrowLeft, CheckCircle2, FileEdit, Headphones, Ticket, Calendar, Tag, FileText } from 'lucide-react';

import { projectsAPI, formatDateTime } from '../../services/api';

import LoadingSpinner from '../../components/LoadingSpinner';

import { isPendingCustomerAcceptance } from '../../utils/customerAcceptance';
import CustomerAcceptProjectButton from '../../components/projects/CustomerAcceptProjectButton';

import RequirementsDocLinks from '../../components/projects/RequirementsDocLinks';
import { SUPPORT_REVIEW_STATUSES } from '../../constants/supportWorkflow';



const DOC_LABELS = {

  userManual: 'User Manual',

  releaseNotes: 'Release Notes',

  deploymentGuide: 'Deployment Guide',

};



function filterIncludedDocs(documents, included) {

  if (!included) return documents;

  const patterns = {

    userManual: ['user manual', 'manual'],

    releaseNotes: ['release notes', 'release note', 'release'],

    deploymentGuide: ['deployment guide', 'deployment'],

  };

  const activeKeys = Object.entries(included).filter(([, v]) => v).map(([k]) => k);

  if (!activeKeys.length) return [];

  return documents.filter((doc) => {

    const name = (doc.name || '').toLowerCase();

    const tags = (doc.tags || []).join(' ').toLowerCase();

    return activeKeys.some((key) => (patterns[key] || []).some((p) => name.includes(p) || tags.includes(p)));

  });

}



export default function CustomerProjectReview() {

  const { id } = useParams();

  const [project, setProject] = useState(null);

  const [deliveryDocs, setDeliveryDocs] = useState([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    Promise.all([

      projectsAPI.getOne(id),

      projectsAPI.getDeliveryDocuments(id),

    ])

      .then(([projectRes, docsRes]) => {

        setProject(projectRes.data);

        setDeliveryDocs(Array.isArray(docsRes.data) ? docsRes.data : []);

      })

      .finally(() => setLoading(false));

  }, [id]);



  const includedDocs = useMemo(

    () => filterIncludedDocs(deliveryDocs, project?.customerSubmission?.documentsIncluded || project?.deliveryChecklist),

    [deliveryDocs, project],

  );



  if (loading) return <LoadingSpinner />;

  if (!project) {

    return (

      <div className="text-center py-12">

        <p className="text-gray-400">Project not found</p>

        <Link to="/projects" className="text-myth-accent hover:underline text-sm mt-2 inline-block">Back to projects</Link>

      </div>

    );

  }



  const statusMeta = SUPPORT_REVIEW_STATUSES[project.supportReviewStatus] || {};

  const accepted = project.deliveryChecklist?.clientAcceptance;
  const canAccept = isPendingCustomerAcceptance(project);

  const submission = project.customerSubmission;



  return (

    <div className="space-y-6 max-w-2xl mx-auto">

      <Link to={`/projects/${id}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-myth-accent text-sm">

        <ArrowLeft size={16} /> Back to project

      </Link>



      <div className="card">

        <h1 className="text-2xl font-bold text-white">{project.name}</h1>

        <p className="text-gray-400 mt-2 text-sm">Your project has been delivered for review.</p>

        {statusMeta.label && (

          <span className={`inline-block mt-3 text-xs px-2 py-0.5 rounded-full ${statusMeta.color}`}>{statusMeta.label}</span>

        )}

      </div>



      {(submission || project.submittedToCustomerAt) && (

        <div className="card space-y-3 text-sm">

          <h2 className="text-white font-medium">Delivery details</h2>

          <div className="grid sm:grid-cols-2 gap-3">

            {submission?.deliveryVersion && (

              <div className="flex items-center gap-2 text-gray-300">

                <Tag size={14} className="text-gray-500" />

                Version {submission.deliveryVersion}

              </div>

            )}

            {(submission?.deliveryDate || project.deliveredAt) && (

              <div className="flex items-center gap-2 text-gray-300">

                <Calendar size={14} className="text-gray-500" />

                Delivered {formatDateTime(submission?.deliveryDate || project.deliveredAt)}

              </div>

            )}

          </div>

          {submission?.deliveryNotes && (

            <p className="text-gray-300 whitespace-pre-wrap border-t border-myth-border pt-3">{submission.deliveryNotes}</p>

          )}

          {includedDocs.length > 0 && (

            <div className="border-t border-myth-border pt-3">

              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">

                <FileText size={12} /> Documents

              </p>

              <RequirementsDocLinks documents={includedDocs} compact />

            </div>

          )}

          {submission?.documentsIncluded && (

            <ul className="text-xs text-gray-500 flex flex-wrap gap-2">

              {Object.entries(submission.documentsIncluded)

                .filter(([, included]) => included)

                .map(([key]) => (

                  <li key={key} className="px-2 py-0.5 rounded bg-myth-surface/60">{DOC_LABELS[key] || key}</li>

                ))}

            </ul>

          )}

        </div>

      )}



      {project.description && !submission?.deliveryNotes && (

        <div className="card">

          <p className="text-sm text-gray-300 whitespace-pre-wrap">{project.description}</p>

        </div>

      )}



      {accepted ? (

        <div className="card border-green-500/30 bg-green-500/10 text-center py-8">

          <CheckCircle2 size={32} className="text-green-400 mx-auto mb-2" />

          <p className="text-green-300 font-medium">Project accepted — support is active</p>

        </div>

      ) : canAccept ? (

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <div className="card hover:border-green-500/40 transition-colors text-center py-6 group flex flex-col items-center justify-center gap-3">
            <CheckCircle2 size={28} className="text-green-400 group-hover:scale-110 transition-transform" />
            <p className="text-white font-medium">Accept Project</p>
            <p className="text-xs text-gray-500">Confirm delivery meets your expectations</p>
            <CustomerAcceptProjectButton project={project} />
            <Link to={`/projects/accept?project=${id}`} className="text-xs text-myth-accent hover:underline">Add comments</Link>
          </div>



          <Link

            to={`/change-requests/new?project=${id}`}

            className="card hover:border-purple-500/40 transition-colors text-center py-6 group"

          >

            <FileEdit size={28} className="text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />

            <p className="text-white font-medium">Request Changes</p>

            <p className="text-xs text-gray-500 mt-1">Ask for modifications or enhancements</p>

          </Link>



          <Link

            to={`/tickets/create?project=${id}`}

            className="card hover:border-orange-500/40 transition-colors text-center py-6 group"

          >

            <Headphones size={28} className="text-orange-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />

            <p className="text-white font-medium">Create Support Ticket</p>

            <p className="text-xs text-gray-500 mt-1">Report an issue or ask for help</p>

          </Link>

        </div>

      ) : (
        <div className="card text-center py-8 text-gray-500 text-sm">
          This project is not awaiting your acceptance yet.
        </div>
      )}



      <div className="card text-sm text-gray-400">

        <p className="flex items-center gap-2 text-white font-medium mb-2">

          <Ticket size={16} /> Need help choosing?

        </p>

        <ul className="list-disc list-inside space-y-1">

          <li><strong className="text-gray-300">Accept</strong> — everything looks good</li>

          <li><strong className="text-gray-300">Request changes</strong> — you want something different in the product</li>

          <li><strong className="text-gray-300">Support ticket</strong> — something is broken or you need assistance using it</li>

        </ul>

      </div>

    </div>

  );

}

