// CRM Status Badges
export {
  ContactStatusBadge,
  LeadStatusBadge,
  CustomerStatusBadge,
  ProspectStatusBadge,
  LeadSourceBadge,
  CustomerTypeBadge,
  PipelineStageBadge,
  ContactSourceBadge,
  getContactStatusOptions,
  getLeadStatusOptions,
  getCustomerStatusOptions,
  getProspectStatusOptions,
  getLeadSourceOptions,
  getCustomerTypeOptions,
  getPipelineStageOptions,
  getContactSourceOptions,
} from './CRMStatusBadges';

export type {
  ContactStatus,
  LeadStatus,
  CustomerStatus,
  ProspectStatus,
  LeadSource,
  CustomerType,
  PipelineStage,
  ContactSource,
} from './CRMStatusBadges';

// CRM Assignment Selector
export {
  CRMAssignmentSelector,
  QuickUserSelector,
  DetailedUserSelector,
} from './CRMAssignmentSelector';

// CRM Tags Manager
export {
  CRMTagsManager,
  QuickTagsManager,
  InlineTagsManager,
  CONTACT_TAGS,
  LEAD_TAGS,
  CUSTOMER_TAGS,
} from './CRMTagsManager';

// CRM Activity Feed
export {
  CRMActivityFeed,
  EntityActivityFeed,
} from './CRMActivityFeed';

export type {
  ActivityType,
  ActivityStatus,
  CRMActivity,
} from './CRMActivityFeed';

// CRM Notifications
export {
  CRMNotifications,
  NotificationBell,
  NotificationPanel,
  createFollowUpNotification,
  createMeetingReminderNotification,
  createHotLeadNotification,
} from './CRMNotifications';

export type {
  CRMNotificationType,
  NotificationPriority,
  NotificationStatus,
  CRMNotification,
} from './CRMNotifications';

// CRM Task Integration
export {
  CRMTaskIntegration,
  QuickTaskButton,
} from './CRMTaskIntegration';