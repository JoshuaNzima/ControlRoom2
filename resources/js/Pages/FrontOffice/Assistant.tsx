import React, { useState, useEffect } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import FrontOfficeLayout from '@/Layouts/FrontOfficeLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';

// Import all modals
import CalendarModal from '@/Components/FrontOffice/modals/CalendarModal';
import DiaryModal from '@/Components/FrontOffice/modals/DiaryModal';
import CommunicationsModal from '@/Components/FrontOffice/modals/CommunicationsModal';
import MeetingsModal from '@/Components/FrontOffice/modals/MeetingsModal';
import PettyCashModal from '@/Components/FrontOffice/modals/PettyCashModal';
import ErrandsModal from '@/Components/FrontOffice/modals/ErrandsModal';
import RemindersModal from '@/Components/FrontOffice/modals/RemindersModal';
import TravelModal from '@/Components/FrontOffice/modals/TravelModal';
import CallsModal from '@/Components/FrontOffice/modals/CallsModal';
import DocumentsModal from '@/Components/FrontOffice/modals/DocumentsModal';
import EventsModal from '@/Components/FrontOffice/modals/EventsModal';
import HouseholdModal from '@/Components/FrontOffice/modals/HouseholdModal';
import ConfidentialModal from '@/Components/FrontOffice/modals/ConfidentialModal';
import CorrespondenceModal from '@/Components/FrontOffice/modals/CorrespondenceModal';
import AdminTasksModal from '@/Components/FrontOffice/modals/AdminTasksModal';

// Duty Card Component
interface DutyCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  actionLabel: string;
  onAction: () => void;
  count?: number;
  category: 'executive' | 'personal';
}

const DutyCard: React.FC<DutyCardProps> = ({ icon, title, description, color, actionLabel, onAction, count = 0, category }) => {
  return (
    <Card 
      className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={onAction}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${color} text-white shadow-md shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${category === 'executive' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
              {category}
            </span>
          </div>
          {count > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 shrink-0 mb-1">
              {count}
            </span>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={(e) => { e.stopPropagation(); onAction(); }}
          className={`text-xs ${category === 'executive' ? 'border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
        >
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
};

// Quick Stats
const StatBadge: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${color}`}>
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}:</span>
    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</span>
  </div>
);

type PageProps = {
  auth?: any;
  stats?: {
    // Executive
    calendar_events_today: number;
    pending_communications: number;
    upcoming_meetings: number;
    pending_reports: number;
    petty_cash_pending: number;
    events_this_week: number;
    // Personal
    diary_entries_today: number;
    pending_calls: number;
    upcoming_travel: number;
    pending_errands: number;
    documents_to_file: number;
    upcoming_reminders: number;
    // Combined
    total_office_duties: number;
    total_personal_duties: number;
  };
};

export default function Assistant() {
  const { auth, stats = {
    calendar_events_today: 0,
    pending_communications: 0,
    upcoming_meetings: 0,
    pending_reports: 0,
    petty_cash_pending: 0,
    events_this_week: 0,
    diary_entries_today: 0,
    pending_calls: 0,
    upcoming_travel: 0,
    pending_errands: 0,
    documents_to_file: 0,
    upcoming_reminders: 0,
    total_office_duties: 0,
    total_personal_duties: 0,
  } } = usePage<PageProps>().props as any;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState<'all' | 'executive' | 'personal'>('all');

  // Modal states
  const [modals, setModals] = useState({
    calendar: false,
    diary: false,
    communications: false,
    meetings: false,
    travel: false,
    reports: false,
    pettyCash: false,
    confidential: false,
    events: false,
    officeAdmin: false,
    calls: false,
    personalTravel: false,
    errands: false,
    documents: false,
    household: false,
    correspondence: false,
    reminders: false,
    generalAdmin: false,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const openModal = (modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  };

  const allDuties = [
    // Executive duties
    { icon: <IconMapper name="CalendarDays" size={22} />, title: 'Calendar & Schedule', description: 'Organize and maintain executive meetings, appointments, and events.', color: 'bg-blue-600', actionLabel: 'Manage', count: stats.calendar_events_today, category: 'executive' as const, modal: 'calendar' as const },
    { icon: <IconMapper name="Mail" size={22} />, title: 'Communications', description: 'Screen phone calls, emails, and correspondence on behalf of the executive.', color: 'bg-amber-600', actionLabel: 'View', count: stats.pending_communications, category: 'executive' as const, modal: 'communications' as const },
    { icon: <IconMapper name="Users" size={22} />, title: 'Meetings', description: 'Prepare agendas, take minutes, and follow up on action points.', color: 'bg-emerald-600', actionLabel: 'View', count: stats.upcoming_meetings, category: 'executive' as const, modal: 'meetings' as const },
    { icon: <IconMapper name="Plane" size={22} />, title: 'Travel Arrangements', description: 'Book flights, accommodation, and prepare travel itineraries.', color: 'bg-cyan-600', actionLabel: 'Manage', count: 0, category: 'executive' as const, modal: 'travel' as const },
    { icon: <IconMapper name="FileText" size={22} />, title: 'Reports & Documents', description: 'Prepare reports, documents, and presentations for the executive.', color: 'bg-purple-600', actionLabel: 'View', count: stats.pending_reports, category: 'executive' as const, modal: 'reports' as const },
    { icon: <IconMapper name="Banknote" size={22} />, title: 'Petty Cash', description: 'Manage petty cash expenses and maintain accurate records.', color: 'bg-rose-600', actionLabel: 'Manage', count: stats.petty_cash_pending, category: 'executive' as const, modal: 'pettyCash' as const },
    { icon: <IconMapper name="Lock" size={22} />, title: 'Confidential Info', description: 'Manage sensitive information with high levels of confidentiality.', color: 'bg-slate-600', actionLabel: 'Vault', count: 0, category: 'executive' as const, modal: 'confidential' as const },
    { icon: <IconMapper name="PartyPopper" size={22} />, title: 'Event Planning', description: 'Organize executive meetings, board meetings, and corporate events.', color: 'bg-pink-600', actionLabel: 'Plan', count: stats.events_this_week, category: 'executive' as const, modal: 'events' as const },
    { icon: <IconMapper name="Network" size={22} />, title: 'Office Admin Support', description: 'Act as a link between the executive and staff, managing office operations.', color: 'bg-teal-600', actionLabel: 'Manage', count: 0, category: 'executive' as const, modal: 'officeAdmin' as const },
    // Personal duties
    { icon: <IconMapper name="CalendarDays" size={22} />, title: 'Diary Management', description: "Manage the employer's daily schedule and personal appointments.", color: 'bg-violet-600', actionLabel: 'Open', count: stats.diary_entries_today, category: 'personal' as const, modal: 'diary' as const },
    { icon: <IconMapper name="Phone" size={22} />, title: 'Calls & Messages', description: 'Receive calls, take messages, and respond when necessary.', color: 'bg-fuchsia-600', actionLabel: 'View', count: stats.pending_calls, category: 'personal' as const, modal: 'calls' as const },
    { icon: <IconMapper name="Car" size={22} />, title: 'Personal Travel', description: 'Organize personal travel plans, bookings, and transportation.', color: 'bg-pink-600', actionLabel: 'Manage', count: stats.upcoming_travel, category: 'personal' as const, modal: 'personalTravel' as const },
    { icon: <IconMapper name="ShoppingBag" size={22} />, title: 'Personal Errands', description: 'Run errands such as shopping, paying bills, or arranging services.', color: 'bg-rose-600', actionLabel: 'View', count: stats.pending_errands, category: 'personal' as const, modal: 'errands' as const },
    { icon: <IconMapper name="FolderOpen" size={22} />, title: 'Document Organization', description: 'Filing, organizing, and maintaining important personal documents.', color: 'bg-purple-600', actionLabel: 'Organize', count: stats.documents_to_file, category: 'personal' as const, modal: 'documents' as const },
    { icon: <IconMapper name="Home" size={22} />, title: 'Household Coordination', description: 'Manage personal commitments such as family events or home services.', color: 'bg-indigo-600', actionLabel: 'Manage', count: 0, category: 'personal' as const, modal: 'household' as const },
    { icon: <IconMapper name="Mail" size={22} />, title: 'Personal Correspondence', description: 'Write and respond to emails, letters, and other personal communication.', color: 'bg-cyan-600', actionLabel: 'View', count: 0, category: 'personal' as const, modal: 'correspondence' as const },
    { icon: <IconMapper name="Bell" size={22} />, title: 'Reminders & Follow-ups', description: 'Remind the employer about important deadlines or commitments.', color: 'bg-amber-600', actionLabel: 'Set', count: stats.upcoming_reminders, category: 'personal' as const, modal: 'reminders' as const },
    { icon: <IconMapper name="ClipboardList" size={22} />, title: 'General Admin Support', description: 'Performing clerical tasks and maintaining records.', color: 'bg-lime-600', actionLabel: 'View', count: 0, category: 'personal' as const, modal: 'generalAdmin' as const },
  ];

  const filteredDuties = activeFilter === 'all' 
    ? allDuties 
    : allDuties.filter(d => d.category === activeFilter);

  return (
    <FrontOfficeLayout title="Assistant Dashboard" user={auth?.user}>
      <Head title="Assistant Dashboard" />
      
      {/* All Modals */}
      <CalendarModal open={modals.calendar} onOpenChange={(open) => !open && closeModal('calendar')} />
      <DiaryModal open={modals.diary} onOpenChange={(open) => !open && closeModal('diary')} />
      <CommunicationsModal open={modals.communications} onOpenChange={(open) => !open && closeModal('communications')} />
      <MeetingsModal open={modals.meetings} onOpenChange={(open) => !open && closeModal('meetings')} />
      <PettyCashModal open={modals.pettyCash} onOpenChange={(open) => !open && closeModal('pettyCash')} />
      <ErrandsModal open={modals.errands} onOpenChange={(open) => !open && closeModal('errands')} />
      <RemindersModal open={modals.reminders} onOpenChange={(open) => !open && closeModal('reminders')} />
      <TravelModal open={modals.travel} onOpenChange={(open) => !open && closeModal('travel')} category="executive" />
      <TravelModal open={modals.personalTravel} onOpenChange={(open) => !open && closeModal('personalTravel')} category="personal" />
      <CallsModal open={modals.calls} onOpenChange={(open) => !open && closeModal('calls')} />
      <DocumentsModal open={modals.reports} onOpenChange={(open) => !open && closeModal('reports')} category="executive" />
      <DocumentsModal open={modals.documents} onOpenChange={(open) => !open && closeModal('documents')} category="personal" />
      <EventsModal open={modals.events} onOpenChange={(open) => !open && closeModal('events')} />
      <HouseholdModal open={modals.household} onOpenChange={(open) => !open && closeModal('household')} />
      <ConfidentialModal open={modals.confidential} onOpenChange={(open) => !open && closeModal('confidential')} />
      <CorrespondenceModal open={modals.correspondence} onOpenChange={(open) => !open && closeModal('correspondence')} />
      <AdminTasksModal open={modals.officeAdmin} onOpenChange={(open) => !open && closeModal('officeAdmin')} category="executive" />
      <AdminTasksModal open={modals.generalAdmin} onOpenChange={(open) => !open && closeModal('generalAdmin')} category="personal" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-purple-600 to-pink-600 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
          
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                  <IconMapper name="Briefcase" size={32} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    Assistant Dashboard
                  </h1>
                  <p className="text-indigo-100 mt-1">Executive & Personal Support Portal</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-xs text-indigo-200">System Time</p>
                  <p className="text-lg font-mono font-semibold">
                    {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                  </p>
                </div>
                <Link
                  href={route('front-office.dashboard')}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm text-sm font-medium transition-colors"
                >
                  ← Back to Hub
                </Link>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 flex flex-wrap gap-3">
              <StatBadge label="Executive Tasks" value={stats.total_office_duties} color="bg-blue-500/20" />
              <StatBadge label="Personal Tasks" value={stats.total_personal_duties} color="bg-purple-500/20" />
              <StatBadge label="Today's Events" value={stats.calendar_events_today + stats.diary_entries_today} color="bg-white/10" />
              <StatBadge label="Pending Items" value={stats.pending_communications + stats.pending_calls + stats.pending_errands} color="bg-white/10" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            All Duties
          </button>
          <button
            onClick={() => setActiveFilter('executive')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'executive' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            Executive
          </button>
          <button
            onClick={() => setActiveFilter('personal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'personal' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            Personal
          </button>
        </div>

        {/* Duties Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {activeFilter === 'all' ? 'All Duties & Responsibilities' : activeFilter === 'executive' ? 'Executive Duties' : 'Personal Duties'}
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">{filteredDuties.length} functions</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredDuties.map((duty, idx) => (
              <DutyCard
                key={idx}
                icon={duty.icon}
                title={duty.title}
                description={duty.description}
                color={duty.color}
                actionLabel={duty.actionLabel}
                onAction={() => openModal(duty.modal)}
                count={duty.count}
                category={duty.category}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Button className="h-auto py-4 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => openModal('calendar')}>
            <IconMapper name="CalendarPlus" size={18} className="mr-2" />
            Calendar Event
          </Button>
          <Button className="h-auto py-4 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => openModal('meetings')}>
            <IconMapper name="Users" size={18} className="mr-2" />
            Meeting
          </Button>
          <Button className="h-auto py-4 bg-rose-600 hover:bg-rose-700 text-white" onClick={() => openModal('errands')}>
            <IconMapper name="ShoppingBag" size={18} className="mr-2" />
            Errand
          </Button>
          <Button className="h-auto py-4 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => openModal('reminders')}>
            <IconMapper name="BellPlus" size={18} className="mr-2" />
            Reminder
          </Button>
        </div>

        {/* Assigned Users Management */}
        <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <IconMapper name="Users" size={24} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assistant Assignments</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                  Manage which users this assistant supports. Assign to single or multiple users with executive, personal, or both support types.
                </p>
              </div>
            </div>
            <Link
              href={route('front-office.assignments.index')}
              className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              <IconMapper name="Settings" size={16} className="mr-2" />
              Manage Assignments
            </Link>
          </div>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <IconMapper name="Building2" size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Executive Support</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                  Manage executive calendars, meetings, travel arrangements, communications, 
                  petty cash, confidential information, and corporate events.
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-950/20 dark:to-fuchsia-950/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <IconMapper name="Heart" size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Personal Support</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                  Handle personal diary, calls, errands, travel, documents, household 
                  coordination, correspondence, and reminders.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </FrontOfficeLayout>
  );
}
