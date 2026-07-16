import IconMapper from '@/Components/IconMapper';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  requiredRole?: string;
  requiredPermission?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface LayoutContext {
  roles: string[];
  isSuperAdmin: boolean;
  isAdminUser: boolean;
  isClientUser: boolean;
  isOpsManager: boolean;
  counters: Record<string, any>;
}

export interface LayoutShellConfig {
  sidebarTitle: string;
  sidebarIcon: string;
  showScanner: boolean;
  showBudget: boolean;
  showRequisition: boolean;
  showTasks: boolean;
  isSuperAdmin: boolean;
  aiContext: string;
}

/**
 * Return AppShellLayout props for a given role set.
 * Replaces all 15+ thin wrapper files with a single lookup.
 */
export function getLayoutConfig(roles: string[], counters?: Record<string, any>): LayoutShellConfig {
  if (roles.includes('super_admin')) {
    return {
      sidebarTitle: 'Super Admin',
      sidebarIcon: 'Shield',
      showScanner: false,
      showBudget: true,
      showRequisition: true,
      showTasks: true,
      isSuperAdmin: true,
      aiContext: 'superadmin',
    };
  }

  if (roles.includes('admin')) {
    return {
      sidebarTitle: 'Admin',
      sidebarIcon: 'LayoutDashboard',
      showScanner: false,
      showBudget: true,
      showRequisition: true,
      showTasks: true,
      isSuperAdmin: roles.includes('super_admin'),
      aiContext: 'admin',
    };
  }

  if (roles.includes('control_room_operator') || roles.includes('operations_officer')) {
    return {
      sidebarTitle: 'Control Room',
      sidebarIcon: 'Activity',
      showScanner: true,
      showBudget: true,
      showRequisition: true,
      showTasks: true,
      isSuperAdmin: roles.includes('super_admin'),
      aiContext: 'control-room',
    };
  }

  if (roles.includes('finance_officer') || roles.includes('accountant') || roles.includes('finance') || roles.includes('accounting')) {
    return {
      sidebarTitle: 'Finance',
      sidebarIcon: 'DollarSign',
      showScanner: false,
      showBudget: true,
      showRequisition: true,
      showTasks: true,
      isSuperAdmin: roles.includes('super_admin'),
      aiContext: 'finance',
    };
  }

  if (roles.includes('hr') || roles.includes('human_resources') || roles.includes('hr_manager')) {
    return {
      sidebarTitle: 'Human Resources',
      sidebarIcon: 'Users2',
      showScanner: false,
      showBudget: true,
      showRequisition: true,
      showTasks: true,
      isSuperAdmin: roles.includes('super_admin'),
      aiContext: 'hr',
    };
  }

  if (roles.includes('operations_manager')) {
    return {
      sidebarTitle: 'Field Ops',
      sidebarIcon: 'MapPin',
      showScanner: true,
      showBudget: true,
      showRequisition: true,
      showTasks: true,
      isSuperAdmin: roles.includes('super_admin'),
      aiContext: 'operations',
    };
  }

  if (roles.includes('asset_manager') || roles.includes('assets_manager')) {
    return {
      sidebarTitle: 'Assets',
      sidebarIcon: 'Boxes',
      showScanner: false,
      showBudget: true,
      showRequisition: true,
      showTasks: true,
      isSuperAdmin: roles.includes('super_admin'),
      aiContext: 'assets',
    };
  }

  if (roles.includes('supervisor') || roles.includes('sergeant')) {
    return {
      sidebarTitle: 'Supervisor',
      sidebarIcon: 'UserCheck',
      showScanner: true,
      showBudget: true,
      showRequisition: true,
      showTasks: true,
      isSuperAdmin: roles.includes('super_admin'),
      aiContext: 'supervisor',
    };
  }

  if (roles.includes('zone_commander')) {
    return {
      sidebarTitle: 'Zone Commander',
      sidebarIcon: 'MapPin',
      showScanner: false,
      showBudget: true,
      showRequisition: true,
      showTasks: true,
      isSuperAdmin: roles.includes('super_admin'),
      aiContext: 'zone-commander',
    };
  }

  if (roles.includes('training')) {
    return {
      sidebarTitle: 'Training',
      sidebarIcon: 'GraduationCap',
      showScanner: false,
      showBudget: true,
      showRequisition: true,
      showTasks: true,
      isSuperAdmin: roles.includes('super_admin'),
      aiContext: 'training',
    };
  }

  if (roles.includes('front_desk') || roles.includes('assistant')) {
    return {
      sidebarTitle: 'Assistant',
      sidebarIcon: 'users-2',
      showScanner: false,
      showBudget: true,
      showRequisition: true,
      showTasks: true,
      isSuperAdmin: roles.includes('super_admin'),
      aiContext: 'front-desk',
    };
  }

  if (roles.includes('marketing')) {
    return {
      sidebarTitle: 'Marketing',
      sidebarIcon: 'megaphone',
      showScanner: false,
      showBudget: true,
      showRequisition: true,
      showTasks: true,
      isSuperAdmin: roles.includes('super_admin'),
      aiContext: 'marketing',
    };
  }

  if (roles.includes('business_dev') || roles.includes('business_development')) {
    return {
      sidebarTitle: 'Business Dev',
      sidebarIcon: 'Briefcase',
      showScanner: false,
      showBudget: true,
      showRequisition: true,
      showTasks: true,
      isSuperAdmin: roles.includes('super_admin'),
      aiContext: 'business-dev',
    };
  }

  if (roles.includes('front_office') || roles.includes('executive_assistant') || roles.includes('receptionist')) {
    return {
      sidebarTitle: 'Front Office',
      sidebarIcon: 'ClipboardList',
      showScanner: false,
      showBudget: true,
      showRequisition: true,
      showTasks: true,
      isSuperAdmin: roles.includes('super_admin'),
      aiContext: 'front-office',
    };
  }

  if (roles.includes('client')) {
    return {
      sidebarTitle: 'Client Portal',
      sidebarIcon: 'Building2',
      showScanner: false,
      showBudget: false,
      showRequisition: false,
      showTasks: false,
      isSuperAdmin: false,
      aiContext: 'client',
    };
  }

  if (roles.includes('task_tracker') || roles.includes('task_manager')) {
    return {
      sidebarTitle: 'Task Tracker',
      sidebarIcon: 'check-square',
      showScanner: false,
      showBudget: false,
      showRequisition: false,
      showTasks: false,
      isSuperAdmin: roles.includes('super_admin'),
      aiContext: 'task-tracker',
    };
  }

  // Fallback
  return {
    sidebarTitle: 'Dashboard',
    sidebarIcon: 'LayoutDashboard',
    showScanner: false,
    showBudget: true,
    showRequisition: true,
    showTasks: true,
    isSuperAdmin: false,
    aiContext: 'default',
  };
}

/**
 * Resolve the appropriate profile route for the user's primary role/path prefix.
 */
export function getProfileRoute(roles: string[]): string {
  const p = typeof window !== 'undefined' ? window.location.pathname : '';

  if (p.startsWith('/superadmin')) return 'superadmin.profile';
  if (p.startsWith('/admin/front-desk')) return 'admin.front-desk.profile';
  if (p.startsWith('/admin/marketing')) return 'admin.marketing.profile';
  if (p.startsWith('/admin/business-dev')) return 'admin.business-dev.profile';
  if (p.startsWith('/admin')) return 'admin.profile';
  if (p.startsWith('/control-room')) return 'control-room.profile';
  if (p.startsWith('/operations')) return 'operations.profile';
  if (p.startsWith('/finance')) return 'finance.profile' as unknown as string;
  if (p.startsWith('/hr')) return 'hr.profile';
  if (p.startsWith('/assets')) return 'assets.profile';
  if (p.startsWith('/training')) return 'training.profile';
  if (p.startsWith('/front-office')) return 'front-office.profile';
  if (p.startsWith('/zone')) return 'zone.profile';
  if (p.startsWith('/supervisor')) return 'supervisor.profile';
  if (p.startsWith('/client')) return 'client.profile';

  return 'profile.dashboard';
}

/**
 * Human-readable display label for the user's primary role.
 */
export function getRoleDisplay(roles: string[]): string {
  const r = roles.length > 0 ? roles[0].replace(/_/g, ' ') : 'User';
  return r.charAt(0).toUpperCase() + r.slice(1);
}

/**
 * AI assistant context string per role area.
 */
export function getAIContext(roles: string[]): string {
  if (roles.includes('super_admin')) return 'superadmin';
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('control_room_operator') || roles.includes('operations_officer')) return 'control-room';
  if (roles.includes('finance_officer') || roles.includes('accountant') || roles.includes('finance') || roles.includes('accounting')) return 'finance';
  if (roles.includes('hr') || roles.includes('human_resources') || roles.includes('hr_manager')) return 'hr';
  if (roles.includes('operations_manager') || roles.includes('operations_officer')) return 'operations';
  if (roles.includes('asset_manager') || roles.includes('assets_manager')) return 'assets';
  if (roles.includes('supervisor') || roles.includes('sergeant')) return 'supervisor';
  if (roles.includes('zone_commander')) return 'zone-commander';
  if (roles.includes('training')) return 'training';
  if (roles.includes('business_dev') || roles.includes('business_development')) return 'business-dev';
  if (roles.includes('client')) return 'client';
  if (roles.includes('front_office') || roles.includes('executive_assistant') || roles.includes('receptionist')) return 'front-office';
  if (roles.includes('marketing')) return 'marketing';
  return 'default';
}

/**
 * Get navigation config filtered by user's roles/permissions.
 * The single source of truth for all role-based navigation.
 */
export function getNavConfig(ctx: LayoutContext): NavSection[] {
  const { roles, isSuperAdmin, isAdminUser, isClientUser, counters } = ctx;

  const sections: NavSection[] = [];

  // ============================
  // SUPER ADMIN
  // ============================
  if (isSuperAdmin) {
    sections.push(
      {
        title: 'Main',
        items: [
          { name: 'Dashboard', href: route('superadmin.dashboard'), icon: <IconMapper name="LayoutDashboard" size={20} /> },
        ],
      },
      {
        title: 'Modules',
        items: [
          { name: 'HR', href: route('superadmin.hr.index'), icon: <IconMapper name="Users2" size={20} /> },
          { name: 'Finance', href: route('superadmin.finance.index'), icon: <IconMapper name="Wallet" size={20} /> },
          { name: 'Clients', href: route('superadmin.clients.index'), icon: <IconMapper name="Building2" size={20} /> },
          { name: 'Control Room', href: route('superadmin.control-room.index'), icon: <IconMapper name="Monitor" size={20} />, badge: counters?.control_downs_active },
          { name: 'Assets', href: route('superadmin.assets.index'), icon: <IconMapper name="Boxes" size={20} /> },
          { name: 'Reports', href: route('superadmin.reports.index'), icon: <IconMapper name="BarChart3" size={20} /> },
          { name: 'Modules', href: route('superadmin.modules'), icon: <IconMapper name="Puzzle" size={20} /> },
        ],
      },
      {
        title: 'Management',
        items: [
          { name: 'Users', href: route('superadmin.users'), icon: <IconMapper name="Users" size={20} /> },
          { name: 'Client Users', href: route('admin.client-users.index'), icon: <IconMapper name="UserCog" size={20} /> },
          { name: 'Security', href: route('superadmin.security'), icon: <IconMapper name="Shield" size={20} /> },
          { name: 'Support Chats', href: route('control-room.chats.index'), icon: <IconMapper name="Headphones" size={20} />, badge: counters?.chat_transfers_pending },
          { name: 'AI Settings', href: route('superadmin.ai-settings'), icon: <IconMapper name="Bot" size={20} /> },
          { name: 'Settings', href: route('superadmin.settings'), icon: <IconMapper name="Settings" size={20} /> },
          { name: 'Backup', href: route('superadmin.backup'), icon: <IconMapper name="HardDrive" size={20} /> },
        ],
      },
      {
        title: 'Tools',
        items: [
          { name: 'System Health', href: route('superadmin.maintenance'), icon: <IconMapper name="Server" size={20} /> },
          { name: 'Logs', href: route('superadmin.logs'), icon: <IconMapper name="FileText" size={20} /> },
          { name: 'Audit Trail', href: route('superadmin.audit'), icon: <IconMapper name="Search" size={20} /> },
          { name: 'Cache', href: route('superadmin.cache'), icon: <IconMapper name="Trash2" size={20} /> },
        ],
      }
    );
  }

  // ============================
  // ADMIN
  // ============================
  if (roles.includes('admin')) {
    if (isClientUser) {
      sections.push({
        title: 'Client Portal',
        items: [
          { name: 'Dashboard', href: route('client.dashboard'), icon: <IconMapper name="LayoutDashboard" size={20} /> },
          { name: 'My Sites', href: route('client.sites'), icon: <IconMapper name="Building" size={20} /> },
          { name: 'Reports', href: route('client.reports'), icon: <IconMapper name="FileText" size={20} /> },
          { name: 'Invoices', href: route('client.invoices'), icon: <IconMapper name="CreditCard" size={20} /> },
          { name: 'Support', href: 'mailto:support@coinsec.com', icon: <IconMapper name="Headphones" size={20} /> },
        ],
      });
    } else {
      const isAssetManager = roles.includes('asset_manager') || isSuperAdmin;
      sections.push(
        {
          title: 'Main',
          items: [
            { name: 'Dashboard', href: route('admin.dashboard'), icon: <IconMapper name="LayoutDashboard" size={20} /> },
            { name: 'Documents', href: route('documents.index'), icon: <IconMapper name="FileText" size={20} /> },
          ],
        },
        {
          title: 'Operations',
          items: [
            { name: 'Guards', href: route('admin.guards.index'), icon: <IconMapper name="ShieldCheck" size={20} /> },
            { name: 'Clients', href: route('admin.clients.index'), icon: <IconMapper name="Building2" size={20} /> },
            { name: 'Services', href: route('admin.services.index'), icon: <IconMapper name="Package" size={20} /> },
            { name: 'Downs', href: route('admin.downs.index'), icon: <IconMapper name="AlertTriangle" size={20} />, badge: counters?.control_downs_active },
            { name: 'Approvals', href: route('admin.approvals.index'), icon: <IconMapper name="CheckCircle" size={20} />, badge: (() => { const n = (Number(counters?.requisitions_pending_admin || 0) + Number(counters?.finance_approvals_pending || 0)); return n > 0 ? n : undefined; })() },
            ...(isAssetManager ? [{ name: 'Assets', href: route('assets.index'), icon: <IconMapper name="Boxes" size={20} />, badge: counters?.assets_handovers_outstanding }] : []),
          ],
        },
        {
          title: 'Finance',
          items: [
            { name: 'Payments', href: route('admin.payments.index'), icon: <IconMapper name="Wallet" size={20} /> },
            ...(!isAdminUser ? [{ name: 'Requisitions', href: route('requisitions.index'), icon: <IconMapper name="ClipboardList" size={20} />, badge: counters?.requisitions_my_open }] : []),
            { name: 'Budgets', href: route('budgets.index'), icon: <IconMapper name="PieChart" size={20} /> },
          ],
        },
        {
          title: 'Loyalty',
          items: [
            { name: 'Dashboard', href: route('admin.loyalty.dashboard'), icon: <IconMapper name="Gift" size={20} /> },
            { name: 'Rules', href: route('admin.loyalty.rules'), icon: <IconMapper name="Settings2" size={20} /> },
            { name: 'Tiers', href: route('admin.loyalty.tiers'), icon: <IconMapper name="Award" size={20} /> },
            { name: 'Rewards', href: route('admin.loyalty.rewards'), icon: <IconMapper name="Ticket" size={20} /> },
          ],
        },
        {
          title: 'Management',
          items: [
            { name: 'Users', href: route('admin.users.index'), icon: <IconMapper name="Users" size={20} /> },
            { name: 'Reports', href: route('admin.reports.index'), icon: <IconMapper name="BarChart3" size={20} /> },
            { name: 'Settings', href: route('admin.settings.index'), icon: <IconMapper name="Settings" size={20} /> },
          ],
        },
        {
          title: 'Tools',
          items: [
            { name: 'QR Codes', href: route('admin.qr-codes.index'), icon: <IconMapper name="QrCode" size={20} /> },
            { name: 'Messaging', href: route('messages.conversations.index'), icon: <IconMapper name="MessageSquareText" size={20} />, badge: counters?.notifications_unread },
          ],
        },
      );
    }
  }

  // ============================
  // CONTROL ROOM
  // ============================
  if (roles.includes('control_room_operator') || roles.includes('operations_officer')) {
    const controlRoomLinks: NavItem[] = [
      { name: 'Dashboard', href: route('control-room.dashboard'), icon: <IconMapper name="LayoutDashboard" size={20} /> },
      ...(!isClientUser ? [{ name: 'Documents', href: route('documents.index'), icon: <IconMapper name="FileText" size={20} /> }] : []),
      { name: 'Live Monitoring', href: route('control-room.monitoring'), icon: <IconMapper name="Activity" size={20} /> },
      { name: 'GPS Mismatch Incidents', href: route('control-room.gps-mismatch-incidents.index'), icon: <IconMapper name="MapPin" size={20} /> },
      { name: 'Incident Management', href: route('control-room.incidents.index'), icon: <IconMapper name="AlertTriangle" size={20} />, badge: counters?.control_incidents_open },
      { name: 'Camera Systems', href: route('control-room.cameras.index'), icon: <IconMapper name="Camera" size={20} /> },
      { name: 'Zone Management', href: route('control-room.zones.index'), icon: <IconMapper name="MapPin" size={20} /> },
      { name: 'Shift Management', href: route('control-room.shifts.index'), icon: <IconMapper name="Clock" size={20} /> },
      { name: 'Roster', href: route('control-room.roster.index'), icon: <IconMapper name="Calendar" size={20} /> },
      { name: 'Attendance History', href: route('control-room.attendance.index'), icon: <IconMapper name="ClipboardList" size={20} /> },
      { name: 'Tickets', href: route('control-room.tickets.index'), icon: <IconMapper name="Briefcase" size={20} />, badge: counters?.control_tickets_open },
      { name: 'Flags', href: route('control-room.flags.index'), icon: <IconMapper name="Flag" size={20} />, badge: counters?.control_flags_pending },
      { name: 'Downs', href: route('control-room.downs.index'), icon: <IconMapper name="Activity" size={20} />, badge: counters?.control_downs_active },
      { name: 'Public Intake Triage', href: route('control-room.triage.intakes.index'), icon: <IconMapper name="Inbox" size={20} /> },
    ];

    const communicationLinks: NavItem[] = [
      { name: 'Messaging', href: route('messages.conversations.index'), icon: <IconMapper name="MessageSquareText" size={20} /> },
      { name: 'Emergency Alerts', href: route('control-room.alerts'), icon: <IconMapper name="AlertTriangle" size={20} />, badge: counters?.alerts_active },
      { name: 'Support Chats', href: route('control-room.chats.index'), icon: <IconMapper name="Headphones" size={20} />, badge: counters?.chat_transfers_pending },
    ];

    const systemLinks: NavItem[] = [
      { name: 'Guards', href: route('control-room.guards'), icon: <IconMapper name="ShieldCheck" size={20} /> },
      { name: 'Assignments', href: route('control-room.assignments.index'), icon: <IconMapper name="Briefcase" size={20} /> },
      { name: 'Clients', href: route('control-room.clients'), icon: <IconMapper name="Building2" size={20} /> },
      { name: 'Checkpoints', href: route('control-room.checkpoints.index'), icon: <IconMapper name="MapPin" size={20} /> },
      { name: 'QR Codes', href: route('control-room.qr-codes.index'), icon: <IconMapper name="QrCode" size={20} /> },
      { name: 'Reports', href: route('control-room.reports'), icon: <IconMapper name="BarChart2" size={20} /> },
      { name: 'Settings', href: route('control-room.settings'), icon: <IconMapper name="Settings" size={20} /> },
      ...(!isAdminUser ? [{ name: 'My Requisitions', href: route('requisitions.index'), icon: <IconMapper name="ClipboardList" size={20} />, badge: counters?.requisitions_my_open }] : []),
      { name: 'Budgets', href: route('budgets.index'), icon: <IconMapper name="PieChart" size={20} /> },
    ];

    sections.push(
      { title: 'Control Room', items: controlRoomLinks },
      { title: 'Communication', items: communicationLinks },
      { title: 'System', items: systemLinks },
    );
  }

  // ============================
  // FINANCE
  // ============================
  if (roles.includes('finance_officer') || roles.includes('accountant') || roles.includes('finance') || roles.includes('accounting')) {
    sections.push(
      {
        title: 'Finance',
        items: [
          { name: 'Dashboard', href: route('finance.dashboard'), icon: <IconMapper name="LayoutDashboard" size={20} /> },
          ...(!isClientUser ? [{ name: 'Documents', href: route('documents.index'), icon: <IconMapper name="FileText" size={20} /> }] : []),
          { name: 'Invoices', href: route('finance.invoices.index'), icon: <IconMapper name="FileText" size={20} /> },
          { name: 'Expenses', href: route('finance.expenses.index'), icon: <IconMapper name="CreditCard" size={20} /> },
          { name: 'Payroll', href: route('finance.payroll.index'), icon: <IconMapper name="Banknote" size={20} /> },
        ],
      },
      {
        title: 'Management',
        items: [
          { name: 'Approvals', href: route('finance.approvals.index'), icon: <IconMapper name="CheckCircle" size={20} />, badge: counters?.finance_approvals_pending },
          { name: 'Budgets', href: route('finance.budgets.index'), icon: <IconMapper name="PieChart" size={20} /> },
          { name: 'Loyalty', href: route('finance.loyalty.dashboard'), icon: <IconMapper name="Gift" size={20} /> },
        ],
      },
      {
        title: 'Directory',
        items: [],
      },
      {
        title: 'Tools',
        items: [
          ...(!isAdminUser ? [{ name: 'My Requisitions', href: route('requisitions.index'), icon: <IconMapper name="ClipboardList" size={20} />, badge: counters?.requisitions_my_open }] : []),
        ],
      },
    );
  }

  // ============================
  // HR
  // ============================
  if (roles.includes('hr') || roles.includes('human_resources') || roles.includes('hr_manager')) {
    sections.push(
      {
        title: 'HR',
        items: [
          { name: 'Dashboard', href: route('hr.dashboard'), icon: <IconMapper name="LayoutDashboard" size={20} /> },
          ...(!isClientUser ? [{ name: 'Documents', href: route('documents.index'), icon: <IconMapper name="FileText" size={20} /> }] : []),
          { name: 'Employees', href: route('hr.employees.index'), icon: <IconMapper name="Users" size={20} /> },
          { name: 'Downs', href: route('hr.downs.index'), icon: <IconMapper name="AlertTriangle" size={20} />, badge: counters?.control_downs_active },
          { name: 'Roster', href: route('hr.leaves'), icon: <IconMapper name="Calendar" size={20} /> },
          { name: 'Careers', href: route('hr.jobs.index'), icon: <IconMapper name="Megaphone" size={20} /> },
        ],
      },
      {
        title: 'Development & Benefits',
        items: [
          { name: 'Training', href: route('hr.training'), icon: <IconMapper name="GraduationCap" size={20} /> },
          { name: 'Benefits', href: route('hr.benefits.index'), icon: <IconMapper name="Gift" size={20} /> },
          { name: 'Medical', href: route('hr.medical.index'), icon: <IconMapper name="Stethoscope" size={20} /> },
          { name: 'Pensions', href: route('hr.pensions.index'), icon: <IconMapper name="Banknote" size={20} /> },
        ],
      },
      {
        title: 'Management & Compliance',
        items: [
          { name: 'Policies', href: route('hr.policies.index'), icon: <IconMapper name="FileText" size={20} /> },
          { name: 'Disciplinary', href: route('hr.disciplinary.index'), icon: <IconMapper name="AlertTriangle" size={20} /> },
        ],
      },
      {
        title: 'Tools',
        items: [
          ...(!isAdminUser ? [{ name: 'My Requisitions', href: route('requisitions.index'), icon: <IconMapper name="ClipboardList" size={20} />, badge: counters?.requisitions_my_open }] : []),
          { name: 'Budgets', href: route('budgets.index'), icon: <IconMapper name="PieChart" size={20} /> },
        ],
      },
    );
  }

  // ============================
  // OPERATIONS
  // ============================
  if (roles.includes('operations_manager')) {
    sections.push({
      title: 'Field Operations',
      items: [
        { name: 'Dashboard', href: route('operations.dashboard'), icon: <IconMapper name="LayoutDashboard" size={20} /> },
        ...(!isClientUser ? [{ name: 'Documents', href: route('documents.index'), icon: <IconMapper name="FileText" size={20} /> }] : []),
        { name: 'Site Coverage', href: route('operations.coverage.index'), icon: <IconMapper name="Building" size={20} /> },
        { name: 'Deployments', href: route('operations.coverage.sites'), icon: <IconMapper name="MapPin" size={20} /> },
        { name: 'Guard Roster', href: route('operations.guards.index'), icon: <IconMapper name="Shield" size={20} /> },
        { name: 'Shift Roster', href: route('operations.shifts.index'), icon: <IconMapper name="Calendar" size={20} /> },
        { name: 'Incidents', href: route('operations.reports.incidents'), icon: <IconMapper name="AlertTriangle" size={20} /> },
        { name: 'Reports', href: route('operations.reports.attendance'), icon: <IconMapper name="FileText" size={20} /> },
        { name: 'Requisitions', href: route('requisitions.index'), icon: <IconMapper name="ClipboardList" size={20} /> },
      ],
    });
  }

  // ============================
  // ASSET MANAGEMENT
  // ============================
  if (roles.includes('asset_manager') || roles.includes('assets_manager')) {
    sections.push(
      {
        title: 'Main',
        items: [
          { name: 'Overview', href: route('assets.index'), icon: <IconMapper name="LayoutDashboard" size={20} />, badge: counters?.assets_handovers_outstanding },
          ...(!isClientUser ? [{ name: 'Documents', href: route('documents.index'), icon: <IconMapper name="FileText" size={20} /> }] : []),
        ],
      },
      {
        title: 'Assets',
        items: [
          { name: 'Vehicles', href: route('assets.vehicles.index'), icon: <IconMapper name="Truck" size={20} /> },
          { name: 'Equipment', href: route('assets.equipment.index'), icon: <IconMapper name="Wrench" size={20} /> },
          { name: 'Handovers', href: route('assets.handovers.index'), icon: <IconMapper name="Hand" size={20} />, badge: counters?.assets_handovers_outstanding },
          { name: 'Uniforms', href: route('assets.equipment.index', { category: 'uniform' } as any), icon: <IconMapper name="Shirt" size={20} /> },
          { name: 'Weapons', href: route('assets.equipment.index', { category: 'weapon' } as any), icon: <IconMapper name="Target" size={20} /> },
          { name: 'Utilization', href: route('assets.utilization.index'), icon: <IconMapper name="Activity" size={20} /> },
          { name: 'Fuel', href: route('assets.fuel.index'), icon: <IconMapper name="Flame" size={20} /> },
          { name: 'Maintenance', href: route('assets.maintenance.index'), icon: <IconMapper name="Tool" size={20} /> },
          { name: 'Dispatches', href: route('assets.dispatches.index'), icon: <IconMapper name="Navigation" size={20} /> },
        ],
      },
      {
        title: 'Tools',
        items: [
          ...(!isAdminUser ? [{ name: 'My Requisitions', href: route('requisitions.index'), icon: <IconMapper name="ClipboardList" size={20} />, badge: counters?.requisitions_my_open }] : []),
          { name: 'Budgets', href: route('budgets.index'), icon: <IconMapper name="PieChart" size={20} /> },
          { name: 'Settings', href: route('assets.settings'), icon: <IconMapper name="Settings" size={20} /> },
        ],
      },
    );
  }

  // ============================
  // SUPERVISOR
  // ============================
  if (roles.includes('supervisor') || roles.includes('sergeant')) {
    sections.push({
      title: 'Navigation',
      items: [
        { name: 'Overview', href: route('supervisor.overview'), icon: <IconMapper name="LayoutDashboard" size={20} /> },
        { name: 'Guards', href: route('supervisor.guards'), icon: <IconMapper name="Users" size={20} /> },
        { name: 'Analytics', href: route('supervisor.analytics'), icon: <IconMapper name="BarChart3" size={20} /> },
        { name: 'Attendance', href: route('supervisor.attendance'), icon: <IconMapper name="ClipboardList" size={20} /> },
        { name: 'Reports', href: route('supervisor.reports'), icon: <IconMapper name="FileText" size={20} /> },
      ],
    });
  }

  // ============================
  // ZONE COMMANDER
  // ============================
  if (roles.includes('zone_commander')) {
    sections.push({
      title: 'Zone Management',
      items: [
        { name: 'Dashboard', href: route('zone.dashboard'), icon: <IconMapper name="LayoutDashboard" size={20} /> },
        { name: 'Clients', href: route('zone.clients.index'), icon: <IconMapper name="Building2" size={20} /> },
        { name: 'Sites', href: route('zone.sites.index'), icon: <IconMapper name="MapPin" size={20} /> },
        { name: 'Checkpoints', href: route('zone.checkpoints.index'), icon: <IconMapper name="QrCode" size={20} /> },
        { name: 'Guards', href: route('zone.guards.index'), icon: <IconMapper name="Shield" size={20} /> },
        { name: 'Supervisors', href: route('zone.supervisors.index'), icon: <IconMapper name="UserCog" size={20} /> },
        { name: 'Patrols', href: route('zone.patrols.index'), icon: <IconMapper name="ScanLine" size={20} /> },
        { name: 'Attendance', href: route('zone.attendance.index'), icon: <IconMapper name="ClipboardList" size={20} /> },
        { name: 'Downs', href: route('zone.downs.index'), icon: <IconMapper name="AlertTriangle" size={20} /> },
        { name: 'Reports', href: route('zone.reports.index'), icon: <IconMapper name="BarChart3" size={20} /> },
        { name: 'Requisitions', href: route('requisitions.index'), icon: <IconMapper name="FileText" size={20} /> },
      ],
    });
  }

  // ============================
  // CLIENT
  // ============================
  if (roles.includes('client')) {
    sections.push(
      {
        title: 'Main',
        items: [
          { name: 'Dashboard', href: route('client.dashboard'), icon: <IconMapper name="LayoutDashboard" size={20} /> },
          { name: 'My Sites', href: route('client.sites'), icon: <IconMapper name="Building" size={20} /> },
          { name: 'Reports', href: route('client.reports'), icon: <IconMapper name="FileText" size={20} /> },
          { name: 'Schedules', href: route('client.schedules'), icon: <IconMapper name="Calendar" size={20} /> },
          { name: 'Loyalty', href: route('client.loyalty.dashboard'), icon: <IconMapper name="Gift" size={20} /> },
        ],
      },
      {
        title: 'Financial',
        items: [
          { name: 'Invoices', href: route('client.invoices'), icon: <IconMapper name="Receipt" size={20} /> },
        ],
      },
      {
        title: 'Support',
        items: [
          { name: 'Support', href: route('client.support'), icon: <IconMapper name="Headphones" size={20} /> },
        ],
      },
      {
        title: 'Account',
        items: [
          { name: 'Profile', href: route('client.profile'), icon: <IconMapper name="User" size={20} /> },
          { name: 'Settings', href: route('client.settings'), icon: <IconMapper name="Settings" size={20} /> },
        ],
      },
    );
  }

  // ============================
  // BUSINESS DEV
  // ============================
  if (roles.includes('business_dev') || roles.includes('business_development')) {
    const bizSections: NavSection[] = [
      {
        title: 'Business',
        items: [
          { name: 'Overview', href: route('admin.business-dev'), icon: <IconMapper name="Handshake" size={20} /> },
          { name: 'Ops', href: route('admin.business-dev.ops'), icon: <IconMapper name="Activity" size={20} /> },
          { name: 'Events', href: route('admin.business-dev'), icon: <IconMapper name="Calendar" size={20} /> },
          { name: 'Contracts', href: route('admin.business-dev.contracts.index'), icon: <IconMapper name="FileText" size={20} /> },
          { name: 'Settings', href: route('admin.business-dev.settings'), icon: <IconMapper name="Settings" size={20} /> },
        ],
      },
      {
        title: 'K9 Unit',
        items: [
          { name: 'K9 Dashboard', href: route('admin.business-dev.k9.dashboard'), icon: <IconMapper name="LayoutDashboard" size={20} /> },
          { name: 'K9 Dogs', href: route('admin.business-dev.k9.dogs'), icon: <IconMapper name="Dog" size={20} /> },
          { name: 'K9 Handlers', href: route('admin.business-dev.k9.handlers'), icon: <IconMapper name="User" size={20} /> },
        ],
      },
    ];
    if (!isAdminUser) {
      bizSections.push({
        title: 'Requisitions',
        items: [
          { name: 'My Requisitions', href: route('requisitions.index'), icon: <IconMapper name="ClipboardList" size={20} />, badge: counters?.requisitions_my_open },
        ],
      });
    }
    sections.push(...bizSections);
  }

  // ============================
  // TRAINING
  // ============================
  if (roles.includes('training')) {
    sections.push(
      {
        title: 'Training',
        items: [
          { name: 'Dashboard', href: route('training.dashboard'), icon: <IconMapper name="LayoutDashboard" size={20} /> },
          { name: 'Trainees', href: route('training.trainees.index'), icon: <IconMapper name="GraduationCap" size={20} /> },
          { name: 'Attendance', href: route('training.attendance.index'), icon: <IconMapper name="CalendarCheck" size={20} /> },
        ],
      },
      {
        title: 'Programs',
        items: [
          { name: 'Crash Courses', href: route('training.crash-courses.index'), icon: <IconMapper name="Zap" size={20} /> },
          { name: 'Refreshers', href: route('training.refreshers.index'), icon: <IconMapper name="RefreshCw" size={20} /> },
          { name: 'Regimens', href: route('training.regimens.index'), icon: <IconMapper name="ClipboardList" size={20} /> },
          { name: 'Refresher Guards', href: route('training.trainer-guards.index'), icon: <IconMapper name="UserCheck" size={20} /> },
          { name: 'Guards Directory', href: route('training.guards.index'), icon: <IconMapper name="Shield" size={20} /> },
        ],
      },
      {
        title: 'Tools',
        items: [
          ...(!isAdminUser ? [{ name: 'My Requisitions', href: route('requisitions.index'), icon: <IconMapper name="ClipboardList" size={20} />, badge: counters?.requisitions_my_open }] : []),
          { name: 'Budgets', href: route('budgets.index'), icon: <IconMapper name="PieChart" size={20} /> },
        ],
      },
    );
  }

  // ============================
  // FRONT DESK
  // ============================
  if (roles.includes('front_desk') || roles.includes('assistant')) {
    sections.push({
      title: 'Assistant',
      items: [
        { name: 'Overview', href: route('admin.front-desk'), icon: <IconMapper name="users-2" size={20} /> },
        { name: 'Visitors', href: route('admin.front-desk.visitors.index'), icon: <IconMapper name="id-card" size={20} /> },
        { name: 'Tickets', href: route('admin.front-desk.tickets.index'), icon: <IconMapper name="ticket" size={20} />, badge: (() => { const n = Number(counters?.control_tickets_open || 0); return n > 0 ? String(n) : undefined; })() },
        ...(!isAdminUser ? [{ name: 'My Requisitions', href: route('requisitions.index'), icon: <IconMapper name="clipboard-list" size={20} />, badge: (() => { const n = Number(counters?.requisitions_my_open || 0); return n > 0 ? String(n) : undefined; })() }] : []),
        { name: 'Settings', href: route('admin.front-desk.settings'), icon: <IconMapper name="settings" size={20} /> },
      ],
    });
  }

  // ============================
  // MARKETING
  // ============================
  if (roles.includes('marketing')) {
    sections.push({
      title: 'Marketing',
      items: [
        { name: 'Overview', href: route('admin.marketing'), icon: <IconMapper name="megaphone" size={20} /> },
        { name: 'Leads', href: route('admin.marketing.leads.index'), icon: <IconMapper name="users" size={20} /> },
        { name: 'Analytics', href: route('admin.marketing.analytics'), icon: <IconMapper name="bar-chart-2" size={20} /> },
        ...(!isAdminUser ? [{ name: 'My Requisitions', href: route('requisitions.index'), icon: <IconMapper name="clipboard-list" size={20} />, badge: (() => { const n = Number(counters?.requisitions_my_open || 0); return n > 0 ? String(n) : undefined; })() }] : []),
        { name: 'Settings', href: route('admin.marketing.settings'), icon: <IconMapper name="settings" size={20} /> },
      ],
    });
  }

  // ============================
  // TASK TRACKER
  // ============================
  if (roles.includes('task_tracker') || roles.includes('task_manager')) {
    sections.push({
      title: 'Tasks',
      items: [
        { name: 'Tasks', href: route('tasks.dashboard'), icon: <IconMapper name="clipboard-list" size={20} />, badge: (() => { const n = Number(counters?.tasks_my_open || 0); return n > 0 ? String(n) : undefined; })() },
      ],
    });
  }

  return sections;
}
