import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import RoleLayout from '../layouts/RoleLayout';
import LegacyFollowUpRedirect from './LegacyFollowUpRedirect';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

import Dashboard from '../pages/dashboard/Dashboard';
import Leads from '../pages/Leads';
import LeadList from '../pages/leads/LeadList';
import LeadCreate from '../pages/leads/LeadCreate';
import LeadEdit from '../pages/leads/LeadEdit';
import LeadDetails from '../pages/leads/LeadDetails';
import LeadFollowUpsLayout from '../pages/leads/LeadFollowUpsLayout';
import DealFollowUpsLayout from '../pages/deals/DealFollowUpsLayout';
import FollowUpsLayout, { FollowUpsIndex } from '../pages/followups/FollowUpsLayout';
import AllLeadFollowUps from '../pages/followups/lead/AllLeadFollowUps';
import AddLeadFollowUp from '../pages/followups/lead/AddLeadFollowUp';
import LeadFollowUpDetails from '../pages/followups/lead/LeadFollowUpDetails';
import EditLeadFollowUp from '../pages/followups/lead/EditLeadFollowUp';
import LeadFollowUpHistory from '../pages/followups/lead/LeadFollowUpHistory';
import AllDealFollowUps from '../pages/followups/deal/AllDealFollowUps';
import AddDealFollowUp from '../pages/followups/deal/AddDealFollowUp';
import DealFollowUpDetails from '../pages/followups/deal/DealFollowUpDetails';
import EditDealFollowUp from '../pages/followups/deal/EditDealFollowUp';
import DealFollowUpHistory from '../pages/followups/deal/DealFollowUpHistory';
import DealOverdueFollowUps from '../pages/followups/deal/DealOverdueFollowUps';
import AllCustomerFollowUps from '../pages/followups/customer/AllCustomerFollowUps';
import AddCustomerFollowUp from '../pages/followups/customer/AddCustomerFollowUp';
import CustomerFollowUpDetails from '../pages/followups/customer/CustomerFollowUpDetails';
import EditCustomerFollowUp from '../pages/followups/customer/EditCustomerFollowUp';
import CustomerFollowUpHistory from '../pages/followups/customer/CustomerFollowUpHistory';
import TodayFollowUps from '../pages/followups/TodayFollowUps';
import UpcomingFollowUps from '../pages/followups/UpcomingFollowUps';
import OverdueFollowUps from '../pages/followups/OverdueFollowUps';
import CompletedFollowUps from '../pages/followups/CompletedFollowUps';
import CalendarView from '../pages/followups/CalendarView';
import FollowUpReports from '../pages/followups/FollowUpReports';
import SupportFollowUpsLayout, { SupportFollowUpsIndex } from '../pages/followups/support/SupportFollowUpsLayout';
import {
  SupportAllFollowUps,
  SupportTodayFollowUps,
  SupportUpcomingFollowUps,
  SupportOverdueFollowUps,
  SupportCompletedFollowUps,
  SupportFollowUpHistory,
} from '../pages/followups/support/SupportFollowUpPages';
import SupportAddCustomerFollowUp from '../pages/followups/support/SupportAddCustomerFollowUp';
import SupportCustomerFollowUpDetails from '../pages/followups/support/SupportCustomerFollowUpDetails';
import SupportEditCustomerFollowUp from '../pages/followups/support/SupportEditCustomerFollowUp';
import DealAssignment from '../pages/DealAssignment';
import AssignedDeals from '../pages/deals/AssignedDeals';
import DealPipeline from '../pages/deals/DealPipeline';
import DealList from '../pages/deals/DealList';
import UnassignedDeals from '../pages/deals/UnassignedDeals';
import DealCreate from '../pages/deals/DealCreate';
import DealDetails from '../pages/deals/DealDetails';
import CustomerList from '../pages/customers/CustomerList';
import CustomerCreate from '../pages/customers/CustomerCreate';
import CustomerDetails from '../pages/customers/CustomerDetails';
import CustomersLayout, { CustomersIndex } from '../pages/customers/CustomersLayout';
import CustomerSegmentList from '../pages/customers/CustomerSegmentList';
import ProjectsLayout from '../pages/projects/ProjectsLayout';
import ProjectList from '../pages/projects/ProjectList';
import ProjectCreate from '../pages/projects/ProjectCreate';
import ProjectDetails from '../pages/projects/ProjectDetails';
import ProjectTimeline from '../pages/projects/ProjectTimeline';
import ProjectStatusList from '../pages/projects/ProjectStatusList';
import ProjectOverdueList from '../pages/projects/ProjectOverdueList';
import Tasks from '../pages/Tasks';
import TaskCreate from '../pages/tasks/TaskCreate';
import TaskDetails from '../pages/tasks/TaskDetails';
import TicketList from '../pages/support/TicketList';
import TicketCreate from '../pages/support/TicketCreate';
import TicketDetails from '../pages/support/TicketDetails';
import SupportLogs from '../pages/support/SupportLogs';
import SalesReport from '../pages/reports/SalesReport';
import LeadReport from '../pages/reports/LeadReport';
import ProjectReport from '../pages/reports/ProjectReport';
import UserList from '../pages/users/UserList';
import UserCreate from '../pages/users/UserCreate';
import CompanySettings from '../pages/settings/CompanySettings';
import Profile from '../pages/Profile';
import Notifications from '../pages/notifications/Notifications';
import NotFound from '../pages/errors/NotFound';
import Unauthorized from '../pages/errors/Unauthorized';


import Permissions from '../pages/Permissions';
import Performance from '../pages/Performance';
import Calendar from '../pages/Calendar';
import Documents from '../pages/Documents';
import Deployment from '../pages/Deployment';
import BugTracker from '../pages/BugTracker';
import KnowledgeBase from '../pages/KnowledgeBase';
import LeadAssignment from '../pages/LeadAssignment';
import QualifiedLeads from '../pages/QualifiedLeads';
import ProjectDelivery from '../pages/ProjectDelivery';
import LeadManagerAssignment from '../pages/LeadManagerAssignment';
import AssignedLeads from '../pages/leads/AssignedLeads';
import ProjectAssignHub from '../pages/projects/ProjectAssignHub';
import ProjectAllocationHub from '../pages/projects/ProjectAllocationHub';
import ProjectMilestonesHub from '../pages/projects/ProjectMilestonesHub';
import ProjectMilestonesCompletedHub from '../pages/projects/ProjectMilestonesCompletedHub';
import ProjectActiveHub from '../pages/projects/ProjectActiveHub';
import ProjectTasksHub from '../pages/projects/ProjectTasksHub';
import TechSubmissionsHub from '../pages/projects/TechSubmissionsHub';
import CustomerRequirementsSubmit from '../pages/customer/CustomerRequirementsSubmit';
import CustomerProfile from '../pages/customer/CustomerProfile';
import AcceptProject from '../pages/customer/AcceptProject';
import CustomerProjectReview from '../pages/customer/CustomerProjectReview';
import RequestChange from '../pages/customer/RequestChange';
import CustomerChangeRequests from '../pages/customer/CustomerChangeRequests';
import CustomerChangeRequestDetail from '../pages/customer/CustomerChangeRequestDetail';
import CustomerDocuments from '../pages/customer/CustomerDocuments';
import CustomerRequirementsHub from '../pages/projects/CustomerRequirementsHub';
import TechManagerSupportHandoffHub from '../pages/projects/TechManagerSupportHandoffHub';
import SupportManagerReviewHub from '../pages/projects/SupportManagerReviewHub';
import SupportManagerActiveHub from '../pages/projects/SupportManagerActiveHub';
import SupportManagerClosedHub from '../pages/projects/SupportManagerClosedHub';
import SupportManagerOpenUpdatesHub from '../pages/projects/SupportManagerOpenUpdatesHub';
import TechManagerSupportUpdatesHub from '../pages/projects/TechManagerSupportUpdatesHub';
import TeamHubPage from '../pages/teams/TeamHubPage';
import TechManagerTeamManage from '../pages/teams/TechManagerTeamManage';
import SupportManagerTeamManage from '../pages/teams/SupportManagerTeamManage';
import TeamDetailPage from '../pages/teams/TeamDetailPage';
import Escalations from '../pages/Escalations';
import AssignedTickets from '../pages/AssignedTickets';
import DevTaskBoard from '../pages/DevTaskBoard';
import Invoices from '../pages/Invoices';
import TechnicalMyTasks from '../pages/technical/TechnicalMyTasks';
import TechnicalTaskWorkspace from '../pages/technical/TechnicalTaskWorkspace';
import TechnicalRequirements from '../pages/technical/TechnicalRequirements';
import TechnicalMilestones from '../pages/technical/TechnicalMilestones';
import TechnicalCodeReview from '../pages/technical/TechnicalCodeReview';
import TechnicalTesting from '../pages/technical/TechnicalTesting';
import TechnicalAssignedBugs from '../pages/technical/TechnicalAssignedBugs';
import TechnicalProjectView from '../pages/technical/TechnicalProjectView';
import SupportSubmittedProjects from '../pages/support-manager/SupportSubmittedProjects';
import SupportProjectDelivery from '../pages/support-manager/SupportProjectDelivery';
import SupportManagerCreateTask from '../pages/support-manager/SupportManagerCreateTask';
import SupportManagerTaskStatus from '../pages/support-manager/SupportManagerTaskStatus';
import SupportManagerTaskDetail from '../pages/support-manager/SupportManagerTaskDetail';
import SupportManagerMainTaskDetail from '../pages/support-manager/SupportManagerMainTaskDetail';
import SupportManagerSubmitToCustomer from '../pages/support-manager/SupportManagerSubmitToCustomer';
import TechnicalSupportTasks from '../pages/technical/TechnicalSupportTasks';
import SupportCustomerAcceptance from '../pages/support-manager/SupportCustomerAcceptance';
import SupportManagerChangeRequests from '../pages/support-manager/SupportManagerChangeRequests';
import SupportManagerTickets from '../pages/support-manager/SupportManagerTickets';
import SupportReportsHub from '../pages/support-manager/SupportReportsHub';
import SupportManagerCustomers from '../pages/support-manager/SupportManagerCustomers';
import SupportPersonMyProjects from '../pages/support-person/SupportPersonMyProjects';
import SupportPersonMyTasks from '../pages/support-person/SupportPersonMyTasks';
import SupportPersonTaskDetail from '../pages/support-person/SupportPersonTaskDetail';
import SupportPersonCustomerRequests from '../pages/support-person/SupportPersonCustomerRequests';
import SupportPersonDocuments from '../pages/support-person/SupportPersonDocuments';
import SupportPersonReports from '../pages/support-person/SupportPersonReports';
import SupportPersonMyCustomers from '../pages/support-person/SupportPersonMyCustomers';
import SupportPersonAssignedTickets from '../pages/support-person/SupportPersonAssignedTickets';

export default function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<RoleRoute module="leads" />}>
            <Route path="/leads" element={<LeadList />} />
            <Route path="/leads/assigned" element={<AssignedLeads />} />
            <Route path="/leads/unsigned" element={<Leads unsignedOnly />} />
            <Route path="/leads/create" element={<LeadCreate />} />
            <Route path="/leads/assign-manager" element={<LeadManagerAssignment />} />
            <Route path="/leads/assign" element={<LeadAssignment />} />
            <Route path="/leads/:id" element={<LeadDetails />} />
            <Route path="/leads/:id/edit" element={<LeadEdit />} />
            <Route path="/qualified-leads" element={<QualifiedLeads />} />
          </Route>

          <Route element={<RoleRoute module="followups" />}>
            <Route path="/leads/follow-ups" element={<LeadFollowUpsLayout />}>
              <Route index element={<AllLeadFollowUps />} />
              <Route path="add" element={<AddLeadFollowUp />} />
              <Route path="history" element={<LeadFollowUpHistory />} />
              <Route path=":id/edit" element={<EditLeadFollowUp />} />
              <Route path=":id" element={<LeadFollowUpDetails />} />
            </Route>

            <Route path="/deals/follow-ups" element={<DealFollowUpsLayout />}>
              <Route index element={<AllDealFollowUps />} />
              <Route path="add" element={<AddDealFollowUp />} />
              <Route path="overdue" element={<DealOverdueFollowUps />} />
              <Route path="history" element={<DealFollowUpHistory />} />
              <Route path=":id/edit" element={<EditDealFollowUp />} />
              <Route path=":id" element={<DealFollowUpDetails />} />
            </Route>

            <Route path="/customers/follow-ups" element={<CustomersLayout />}>
              <Route index element={<AllCustomerFollowUps />} />
              <Route path="add" element={<AddCustomerFollowUp />} />
              <Route path="history" element={<CustomerFollowUpHistory />} />
              <Route path=":id/edit" element={<EditCustomerFollowUp />} />
              <Route path=":id" element={<CustomerFollowUpDetails />} />
            </Route>

            <Route path="/follow-ups" element={<FollowUpsLayout />}>
              <Route index element={<FollowUpsIndex />} />
              <Route path="today" element={<TodayFollowUps />} />
              <Route path="upcoming" element={<UpcomingFollowUps />} />
              <Route path="overdue" element={<OverdueFollowUps />} />
              <Route path="completed" element={<CompletedFollowUps />} />
              <Route path="calendar" element={<CalendarView />} />
              <Route path="reports" element={<FollowUpReports />} />
            </Route>

            <Route path="/follow-ups/lead/*" element={<LegacyFollowUpRedirect module="lead" />} />
            <Route path="/follow-ups/deal/*" element={<LegacyFollowUpRedirect module="deal" />} />
            <Route path="/follow-ups/customer/*" element={<LegacyFollowUpRedirect module="customer" />} />

            <Route path="/support/follow-ups" element={<SupportFollowUpsLayout />}>
              <Route index element={<SupportFollowUpsIndex />} />
              <Route path="today" element={<SupportTodayFollowUps />} />
              <Route path="upcoming" element={<SupportUpcomingFollowUps />} />
              <Route path="overdue" element={<SupportOverdueFollowUps />} />
              <Route path="completed" element={<SupportCompletedFollowUps />} />
              <Route path="history" element={<SupportFollowUpHistory />} />
              <Route path="add" element={<SupportAddCustomerFollowUp />} />
              <Route path=":id/edit" element={<SupportEditCustomerFollowUp />} />
              <Route path=":id" element={<SupportCustomerFollowUpDetails />} />
            </Route>
          </Route>

          <Route element={<RoleRoute module="deals" />}>
            <Route path="/deals" element={<DealPipeline />} />
            <Route path="/deals/assign" element={<DealAssignment />} />
            <Route path="/deals/assigned" element={<AssignedDeals />} />
            <Route path="/deals/unassigned" element={<UnassignedDeals />} />
            <Route path="/deals/list" element={<DealList />} />
            <Route path="/deals/create" element={<DealCreate />} />
            <Route path="/deals/:id" element={<DealDetails />} />
          </Route>

          <Route element={<RoleRoute module="customers" />}>
            <Route path="/customers/create" element={<CustomerCreate />} />
            <Route path="/customers" element={<CustomersLayout />}>
              <Route index element={<CustomersIndex />} />
              <Route path="all" element={<CustomerSegmentList segment="all" />} />
              <Route path="new" element={<CustomerSegmentList segment="new" />} />
              <Route path="active" element={<CustomerSegmentList segment="active" />} />
              <Route path="inactive" element={<CustomerSegmentList segment="inactive" />} />
              <Route path="project" element={<CustomerSegmentList segment="project" />} />
              <Route path="vip" element={<CustomerSegmentList segment="vip" />} />
              <Route path="tech-assigned" element={<CustomerSegmentList segment="tech-assigned" />} />
              <Route path="tech-unassigned" element={<CustomerSegmentList segment="tech-unassigned" />} />
              <Route path="support-assigned" element={<CustomerSegmentList segment="support-assigned" />} />
              <Route path="support-unassigned" element={<CustomerSegmentList segment="support-unassigned" />} />
              <Route path="assigned" element={<CustomerSegmentList segment="tech-assigned" />} />
              <Route path="unassigned" element={<CustomerSegmentList segment="tech-unassigned" />} />
            </Route>
            <Route path="/customers/:id" element={<CustomerDetails />} />
            <Route path="/support/customers" element={<SupportManagerCustomers />} />
            <Route path="/support/my-customers" element={<SupportPersonMyCustomers />} />
          </Route>

          <Route element={<RoleRoute module="projects" />}>
            <Route path="/projects" element={<ProjectsLayout />}>
              <Route index element={<ProjectList />} />
              <Route path="active" element={<ProjectActiveHub />} />
              <Route path="status/:status" element={<ProjectStatusList />} />
              <Route path="overdue" element={<ProjectOverdueList />} />
              <Route path="assign" element={<ProjectAssignHub />} />
              <Route path="team-allocation" element={<ProjectAllocationHub />} />
              <Route path="milestones/completed" element={<ProjectMilestonesCompletedHub />} />
              <Route path="milestones" element={<ProjectMilestonesHub />} />
              <Route path="tasks" element={<ProjectTasksHub />} />
              <Route path="tech-submissions" element={<TechSubmissionsHub />} />
              <Route path="customer-requirements" element={<CustomerRequirementsHub />} />
              <Route path="support-handoff" element={<TechManagerSupportHandoffHub />} />
              <Route path="support-review" element={<SupportManagerReviewHub />} />
              <Route path="support-active" element={<SupportManagerActiveHub />} />
              <Route path="support-closed" element={<SupportManagerClosedHub />} />
              <Route path="support-open-updates" element={<SupportManagerOpenUpdatesHub />} />
              <Route path="support-updates" element={<TechManagerSupportUpdatesHub />} />
            </Route>
            <Route path="/requirements/submit" element={<CustomerRequirementsSubmit />} />
            <Route path="/projects/accept" element={<AcceptProject />} />
            <Route path="/projects/:id/review" element={<CustomerProjectReview />} />
            <Route path="/projects/create" element={<ProjectCreate />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/projects/:id/timeline" element={<ProjectTimeline />} />
            <Route path="/project-delivery" element={<ProjectDelivery />} />
            <Route path="/support/submitted-projects" element={<SupportSubmittedProjects />} />
            <Route path="/support/project-delivery" element={<SupportProjectDelivery />} />
            <Route path="/support/create-task" element={<SupportManagerCreateTask />} />
            <Route path="/support/submit-to-customer/:projectId" element={<SupportManagerSubmitToCustomer />} />
            <Route path="/support/task-status" element={<SupportManagerTaskStatus />} />
            <Route path="/support/task-status/:projectId/batch/:batchId" element={<SupportManagerMainTaskDetail />} />
            <Route path="/support/task-status/:projectId/:taskId" element={<SupportManagerTaskDetail />} />
            <Route path="/support/customer-acceptance" element={<SupportCustomerAcceptance />} />
            <Route path="/support/my-projects" element={<SupportPersonMyProjects />} />
            <Route path="/support/my-tasks" element={<SupportPersonMyTasks />} />
            <Route path="/support/my-tasks/:projectId/:taskId" element={<SupportPersonTaskDetail />} />
            <Route path="/support/customer-requests" element={<SupportPersonCustomerRequests />} />
            <Route path="/support/customer-replies" element={<Navigate to="/support/customer-requests" replace />} />
            <Route path="/support/reports" element={<SupportPersonReports />} />
            <Route path="/support/tickets/assigned" element={<SupportPersonAssignedTickets />} />
          </Route>

          <Route element={<RoleRoute module="tasks" />}>
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/overdue" element={<Tasks overdueOnly />} />
            <Route path="/tasks/create" element={<TaskCreate />} />
            <Route path="/tasks/:id" element={<TaskDetails />} />
            <Route path="/dev-board" element={<DevTaskBoard />} />
            <Route path="/technical/tasks" element={<TechnicalMyTasks />} />
            <Route path="/technical/support-tasks" element={<TechnicalSupportTasks />} />
            <Route path="/technical/support-tasks/:projectId/:taskId" element={<SupportPersonTaskDetail />} />
            <Route path="/technical/tasks/:id" element={<TechnicalTaskWorkspace />} />
            <Route path="/technical/code-review" element={<TechnicalCodeReview />} />
            <Route path="/technical/testing" element={<TechnicalTesting />} />
          </Route>

          <Route element={<RoleRoute module="projects" />}>
            <Route path="/technical/requirements" element={<TechnicalRequirements />} />
            <Route path="/technical/milestones" element={<TechnicalMilestones />} />
            <Route path="/technical/projects/:id" element={<TechnicalProjectView />} />
          </Route>

          <Route element={<RoleRoute module="tickets" />}>
            <Route path="/tickets" element={<TicketList />} />
            <Route path="/tickets/create" element={<TicketCreate />} />
            <Route path="/tickets/:id" element={<TicketDetails />} />
            <Route path="/support-logs" element={<SupportLogs />} />
            <Route path="/change-requests" element={<CustomerChangeRequests />} />
            <Route path="/change-requests/new" element={<RequestChange />} />
            <Route path="/change-requests/:id" element={<CustomerChangeRequestDetail />} />
            <Route path="/assigned-tickets" element={<AssignedTickets />} />
            <Route path="/escalations" element={<Escalations />} />
            <Route path="/support/tickets/:view" element={<SupportManagerTickets />} />
            <Route path="/support/change-requests" element={<SupportManagerChangeRequests />} />
          </Route>

          <Route element={<RoleRoute module="invoices" />}>
            <Route path="/invoices" element={<Invoices />} />
          </Route>

          <Route path="/teams/detail/:staffRoleId" element={<TeamDetailPage />} />
          <Route path="/teams/detail/:staffRoleId/:section" element={<TeamDetailPage />} />
          <Route path="/teams/technical/manage" element={<TechManagerTeamManage />} />
          <Route path="/teams/support/manage" element={<SupportManagerTeamManage />} />
          <Route path="/teams/:team" element={<TeamHubPage />} />
          <Route path="/teams/:team/:section" element={<TeamHubPage />} />

          <Route element={<RoleRoute module="reports" />}>
            <Route path="/reports" element={<SalesReport />} />
            <Route path="/reports/sales" element={<SalesReport />} />
            <Route path="/reports/leads" element={<LeadReport />} />
            <Route path="/reports/projects" element={<ProjectReport />} />
            <Route path="/support/reports" element={<SupportReportsHub />} />
          </Route>

          <Route element={<RoleRoute module="users" />}>
            <Route path="/users" element={<UserList />} />
            <Route path="/users/create" element={<UserCreate />} />
          </Route>

          <Route element={<RoleRoute module="roles" />}>
            <Route path="/permissions" element={<Permissions />} />
          </Route>

          <Route path="/profile" element={<Profile />} />
          <Route path="/settings/profile" element={<Navigate to="/profile" replace />} />

          <Route element={<RoleRoute module="settings" />}>
            <Route path="/settings" element={<CompanySettings />} />
          </Route>

          <Route path="/notifications" element={<Notifications />} />

          <Route element={<RoleRoute module="calendar" />}>
            <Route path="/calendar" element={<Calendar />} />
          </Route>

          <Route element={<RoleRoute module="performance" />}>
            <Route path="/performance" element={<Performance />} />
          </Route>

          <Route element={<RoleRoute module="documents" />}>
            <Route path="/documents" element={<Documents />} />
            <Route path="/support/documents" element={<SupportPersonDocuments />} />
          </Route>

          <Route element={<RoleRoute module="deployment" />}>
            <Route path="/deployment" element={<Deployment />} />
          </Route>

          <Route element={<RoleRoute module="bugtracker" />}>
            <Route path="/bug-tracker" element={<BugTracker />} />
            <Route path="/technical/bugs" element={<TechnicalAssignedBugs />} />
          </Route>

          <Route element={<RoleRoute module="knowledgebase" />}>
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
