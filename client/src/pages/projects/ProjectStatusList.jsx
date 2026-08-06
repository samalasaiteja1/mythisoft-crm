import { useParams, Navigate } from 'react-router-dom';

import { useState } from 'react';

import { PROJECT_STATUS_KEYS, PROJECT_STATUSES } from '../../constants/projectStatuses';

import { DELIVERY_REVIEW_STATUSES } from '../../constants/deliveryWorkflow';

import { usePermissions } from '../../hooks/usePermissions';

import Projects from '../Projects';

import TechManagerProjectsHome from '../../components/projects/TechManagerProjectsHome';

import { ProjectReviewForm } from '../../components/techManager/TechManagerForms';



const TECH_MANAGER_STATUS_VIEWS = [

  ...DELIVERY_REVIEW_STATUSES,

  'completed',

];



export default function ProjectStatusList() {

  const { status } = useParams();

  const [listKey, setListKey] = useState(0);

  const { isTechManager } = usePermissions();



  if (!PROJECT_STATUS_KEYS.includes(status)) {

    return <Navigate to="/projects" replace />;

  }



  const showReviewForm = DELIVERY_REVIEW_STATUSES.includes(status);



  if (isTechManager && TECH_MANAGER_STATUS_VIEWS.includes(status)) {

    return (

      <div className="space-y-6">

        {showReviewForm && (

          <ProjectReviewForm mode={status} onDone={() => setListKey((k) => k + 1)} />

        )}

        <TechManagerProjectsHome filterMode={status} refreshKey={listKey} />

      </div>

    );

  }



  const label = PROJECT_STATUSES[status]?.label || status.replace(/_/g, ' ');



  return (

    <div className="space-y-6">

      {showReviewForm && (

        <ProjectReviewForm mode={status} onDone={() => setListKey((k) => k + 1)} />

      )}

      <Projects

        key={listKey}

        fixedStatus={status}

        pageTitle={`${label} Projects`}

        pageSubtitle={`Projects with status: ${label}`}

      />

    </div>

  );

}

