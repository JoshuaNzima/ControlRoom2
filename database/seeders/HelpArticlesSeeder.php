<?php

namespace Database\Seeders;

use App\Models\HelpArticle;
use Illuminate\Database\Seeder;

class HelpArticlesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Comprehensive help articles covering all ControlRoom workflows.
     */
    public function run(): void
    {
        // Replace placeholder contact details inside article content.
        $helpPhone = env('HELP_CONTACT_PHONE', '+265 999 611 711');
        $helpEmail = env('HELP_CONTACT_EMAIL', 'info@coinsecuritymw.com');

        $placeholderToReal = [
            '+265 XXX XXX XXX' => $helpPhone,
            'info@... ' => $helpEmail,
            'info@...' => $helpEmail,
            'sales@coinsecuritymw.com' => 'sales@coinsecuritymw.com',
            'sales@...' => 'sales@coinsecuritymw.com',
        ];

        $articles = [
            // ============================================
            // VISITOR/GUEST ARTICLES (target_roles = null)
            // ============================================
            [
                'title' => 'Welcome to Coin Security',
                'slug' => 'welcome-to-coin-security',
                'content' => '# Welcome to Coin Security

Coin Security is a leading security services provider in Malawi, offering comprehensive security solutions for businesses and organizations.

## Our Services

- **Manned Guarding**: Professional security guards for your premises
- **Mobile Patrols**: Regular patrol services for multiple sites
- **Event Security**: Security personnel for events and gatherings
- **CCTV Monitoring**: 24/7 surveillance and monitoring
- **Alarm Response**: Rapid response to security alerts

## Why Choose Us?

- **Experienced Team**: Trained and professional security personnel
- **Modern Technology**: GPS tracking, real-time monitoring, digital reporting
- **Reliable Service**: 24/7 operations center support
- **Custom Solutions**: Tailored security plans for your needs

## Contact Us

- **Phone**: +265 XXX XXX XXX
- **Email**: info@coinsecuritymw.com
- **Address**: Lilongwe, Malawi

Interested in our services? Use the contact form or call us for a free consultation!',
                'category' => 'general',
                'tags' => ['welcome', 'services', 'about', 'contact'],
                'target_roles' => null,
                'is_published' => true,
                'featured' => true,
            ],
            [
                'title' => 'Our Security Services',
                'slug' => 'our-security-services',
                'content' => '# Security Services We Offer

Coin Security provides a wide range of professional security services tailored to protect your business, assets, and people.

## Manned Guarding

Our trained security guards provide:
- 24/7 site protection
- Access control and visitor management
- Regular patrols and inspections
- Incident reporting and response

## Mobile Patrols

For clients with multiple locations:
- Scheduled patrol visits
- Random security checks
- Quick response capability
- Detailed patrol reports

## Event Security

Specialized event security services:
- Crowd management
- Access control
- VIP protection
- Emergency response coordination

## CCTV & Monitoring

State-of-the-art surveillance:
- 24/7 monitoring center
- Real-time alerts
- Video recording and storage
- Remote viewing capability

## Get a Quote

Contact us today for a customized security solution:
- Email: sales@coinsecuritymw.com
- Phone: +265 XXX XXX XXX',
                'category' => 'general',
                'tags' => ['services', 'security', 'guarding', 'patrols'],
                'target_roles' => null, // Visitors only
                'is_published' => true,
            ],
            [
                'title' => 'How to Request a Quote',
                'slug' => 'how-to-request-a-quote',
                'content' => '# Requesting a Security Quote

Getting a quote for security services is easy. Follow these steps:

## Step 1: Prepare Your Requirements

Before contacting us, consider:
- **Number of sites** needing security
- **Hours of coverage** required (24/7, business hours, etc.)
- **Type of security** needed (guards, patrols, CCTV)
- **Special requirements** (armed guards, specific training)

## Step 2: Contact Us

Choose your preferred method:

### Online Form
1. Go to our Contact page
2. Fill in the inquiry form
3. Select "Quote Request" as the subject
4. Submit and we\'ll respond within 24 hours

### Phone Call
- Call us at +265 XXX XXX XXX
- Speak with our sales team
- Get an initial estimate immediately

### Email
- Send details to sales@coinsecuritymw.com
- Include site addresses and requirements
- Receive a formal proposal within 48 hours

## Step 3: Site Survey

For accurate quotes, we may:
- Visit your premises
- Assess security risks
- Recommend optimal coverage
- Provide detailed proposal

## What\'s Included in a Quote

- Number of guards recommended
- Shift schedules and coverage
- Equipment and technology included
- Monthly pricing breakdown
- Contract terms and conditions

Ready to secure your business? Contact us today!',
                'category' => 'general',
                'tags' => ['quote', 'pricing', 'contact', 'services'],
                'target_roles' => null, // Visitors only
                'is_published' => true,
            ],

            // === AUTHENTICATED USER ARTICLES (target_roles = []) ===
            [
                'title' => 'Getting Started with ControlRoom',
                'slug' => 'getting-started-with-controlroom',
                'content' => '# Welcome to ControlRoom

ControlRoom is a comprehensive security management system designed to help you manage guards, sites, attendance, and operations efficiently.

## Key Features

- **Guard Management**: Add, edit, and manage security personnel
- **Site Management**: Configure client sites and checkpoints
- **Attendance Tracking**: Real-time check-ins via QR codes and GPS
- **Control Room Operations**: Monitor guards and respond to incidents
- **Finance & Payroll**: Process salaries and manage requisitions
- **Asset Management**: Track vehicles and equipment

## Quick Start

1. Log in with your credentials
2. Navigate to your dashboard using the sidebar
3. Use the AI Assistant (floating button) for help anytime
4. Check the Help Center for detailed guides

Need more help? Click the AI Assistant button in the bottom right corner!',
                'category' => 'getting-started',
                'tags' => ['beginner', 'introduction', 'overview'],
                'target_roles' => [], // All authenticated users
                'is_published' => true,
            ],
            [
                'title' => 'How to Add a New Guard',
                'slug' => 'how-to-add-a-new-guard',
                'content' => '# Adding a New Guard

Follow these steps to add a security guard to the system.

## Prerequisites

- Admin or HR role required
- Guard\'s personal information ready

## Steps

1. Navigate to **Admin > Guards** or **HR > Guards**
2. Click the **Add Guard** button
3. Fill in the required information:
   - Full name
   - Phone number
   - Email (optional)
   - Zone assignment
   - Employee role (guard or driver)
4. Upload a profile photo (optional)
5. Click **Save**

## After Adding

- The guard will appear in the guards list
- You can now assign them to sites
- They can check in using their credentials

## Tips

- Ensure phone numbers are in correct format
- Assign to the correct zone for proper scheduling
- Add emergency contact information for safety',
                'category' => 'guards',
                'tags' => ['guards', 'add', 'create', 'new'],
                'target_roles' => ['admin', 'hr', 'super_admin'], // Admin/HR only
                'is_published' => true,
            ],
            [
                'title' => 'Assigning Guards to Sites',
                'slug' => 'assigning-guards-to-sites',
                'content' => '# Assigning Guards to Sites

This guide explains how to assign security guards to client sites.

## Prerequisites

- Guard must be created in the system
- Site must be configured with checkpoints
- Admin or Operations role required

## Assignment Steps

1. Go to **Admin > Guards** or **Operations > Assignments**
2. Find the guard you want to assign
3. Click the **Assign** button
4. Select the following:
   - **Site**: The client site location
   - **Shift**: The shift schedule
   - **Start Date**: When the assignment begins
   - **End Date**: When it ends (optional)
5. Click **Confirm Assignment**

## Managing Assignments

- View current assignments in Operations > Assignments
- End assignments early if needed
- Transfer guards between sites
- View assignment history

## Best Practices

- Check guard availability before assigning
- Ensure guards have proper training for the site
- Consider travel time between sites
- Review assignments regularly',
                'category' => 'guards',
                'tags' => ['guards', 'assignment', 'sites', 'scheduling'],
                'target_roles' => ['admin', 'operations_manager', 'super_admin'], // Admin/Ops
                'is_published' => true,
            ],
            [
                'title' => 'Processing Payroll',
                'slug' => 'processing-payroll',
                'content' => '# Processing Payroll

Learn how to process monthly payroll for security personnel.

## Prerequisites

- Finance or Admin role required
- Attendance data must be complete
- Pay profiles configured for each guard

## Payroll Process

1. Navigate to **Finance > Payroll**
2. Select the **Pay Period** (month/year)
3. Review the payroll summary:
   - Total guards
   - Days worked
   - Overtime hours
   - Deductions
   - Bonuses
4. Make adjustments if needed:
   - Add overtime
   - Apply deductions
   - Add bonuses
5. Click **Process Payroll**
6. Review and confirm the final amounts

## Payroll Components

- **Base Salary**: From guard\'s pay profile
- **Overtime**: Extra hours worked
- **Allowances**: Transport, housing, etc.
- **Deductions**: Advances, loans

## Reports

After processing, you can:
- Print payslips
- Export to Excel
- Generate payroll reports
- View payment history

## Tips

- Process payroll after all attendance is verified
- Check for missing check-outs
- Review overtime approvals
- Confirm bank details are correct',
                'category' => 'finance',
                'tags' => ['payroll', 'salary', 'finance', 'payment'],
                'target_roles' => ['admin', 'finance', 'super_admin'], // Finance/Admin
                'is_published' => true,
            ],
            [
                'title' => 'Using the Control Room Dashboard',
                'slug' => 'using-the-control-room-dashboard',
                'content' => '# Control Room Dashboard Guide

The Control Room is the central hub for monitoring security operations in real-time.

## Dashboard Overview

The dashboard shows:
- **Active Guards**: Currently on duty
- **Sites Status**: All site statuses at a glance
- **Recent Check-ins**: Latest attendance updates
- **Alerts**: Incidents and exceptions

## Key Features

### Real-Time Monitoring

- View guard locations on the map
- See checkpoint scan history
- Monitor shift progress

### Attendance Management

- Manual check-in for guards
- View attendance exceptions
- Handle missed check-outs

### Incident Response

- Create incident reports
- Assign response teams
- Track incident resolution

### Zone Management

- View zones and commanders
- Assign guards to zones
- Monitor zone coverage

## Quick Actions

- **Scan QR**: Open QR scanner for check-ins
- **Manual Check-In**: Check in guards manually
- **Create Incident**: Report an incident
- **View Reports**: Access operational reports

## Tips

- Keep the dashboard open during shifts
- Respond to alerts promptly
- Verify GPS locations regularly
- Document all incidents',
                'category' => 'attendance',
                'tags' => ['control-room', 'monitoring', 'dashboard', 'operations'],
                'target_roles' => [], // All authenticated users
                'is_published' => true,
            ],
            [
                'title' => 'Managing Vehicles and Equipment',
                'slug' => 'managing-vehicles-and-equipment',
                'content' => '# Asset Management Guide

Learn how to manage vehicles and equipment in the Assets module.

## Vehicle Management

### Adding a Vehicle

1. Go to **Assets > Vehicles**
2. Click **Add Vehicle**
3. Enter vehicle details:
   - Registration number
   - Make and model
   - Year
   - Status (active/maintenance)
4. Click **Save**

### Dispatching Vehicles

1. Select an available vehicle
2. Click **Dispatch**
3. Choose:
   - Driver
   - Destination site
   - Purpose
   - Expected return
4. Confirm dispatch

### Vehicle Handover

When transferring vehicles between drivers:
1. Go to vehicle details
2. Click **Handover**
3. Select new driver
4. Record condition notes
5. Confirm handover

## Equipment Management

### Adding Equipment

1. Go to **Assets > Equipment**
2. Click **Add Equipment**
3. Enter details:
   - Name
   - Type (radio, torch, etc.)
   - Serial number
   - Condition
4. Save the equipment

### Assigning Equipment

- Assign to guards or sites
- Track equipment location
- Schedule maintenance
- Record handovers

## Reports

- Vehicle utilization reports
- Equipment inventory
- Maintenance schedules
- Handover history',
                'category' => 'assets',
                'tags' => ['vehicles', 'equipment', 'assets', 'dispatch'],
                'target_roles' => ['asset_manager', 'admin', 'super_admin'], // Asset managers
                'is_published' => true,
            ],
            [
                'title' => 'Troubleshooting Common Issues',
                'slug' => 'troubleshooting-common-issues',
                'content' => '# Troubleshooting Guide

Solutions to common problems you may encounter.

## Login Issues

### Cannot Log In

- Check your email and password
- Ensure caps lock is off
- Try resetting your password
- Contact admin if account is locked

### Session Expired

- Log in again
- Check your internet connection
- Clear browser cache

## Attendance Issues

### Check-in Failed

- Ensure GPS is enabled
- Check internet connection
- Try manual check-in via Control Room
- Verify you\'re at the correct site

### Missing Check-out

- Contact Control Room operator
- Request manual check-out
- Explain the situation

## Report Issues

### Data Not Loading

- Refresh the page
- Check date range filters
- Verify you have permission
- Try a different browser

### Export Failed

- Check popup blocker
- Try a smaller date range
- Contact support if persistent

## Mobile App Issues

### App Crashes

- Update to latest version
- Clear app cache
- Reinstall if needed

### GPS Not Working

- Enable location permissions
- Check GPS is on
- Move to open area for signal

## Need More Help?

- Use the AI Assistant button
- Contact your supervisor
- Email support@coinsecurity.com
- Call the helpdesk',
                'category' => 'troubleshooting',
                'tags' => ['help', 'issues', 'problems', 'solutions'],
                'target_roles' => [], // All authenticated users
                'is_published' => true,
                'featured' => true,
            ],

            // ============================================
            // GETTING STARTED - All Authenticated Users
            // ============================================
            [
                'title' => 'Getting Started with ControlRoom',
                'slug' => 'getting-started-with-controlroom',
                'content' => '# Welcome to ControlRoom

ControlRoom is a comprehensive security management system designed to help you manage guards, sites, attendance, and operations efficiently.

## Key Features

- **Guard Management**: Add, edit, and manage security personnel
- **Site Management**: Configure client sites and checkpoints
- **Attendance Tracking**: Real-time check-ins via QR codes and GPS
- **Control Room Operations**: Monitor guards and respond to incidents
- **Finance & Payroll**: Process salaries and manage requisitions
- **Asset Management**: Track vehicles and equipment
- **HR Management**: Handle training, benefits, and employee records

## Quick Start

1. Log in with your credentials
2. Navigate to your dashboard using the sidebar
3. Use the AI Assistant (floating button) for help anytime
4. Check the Help Center for detailed guides

## Navigation

- **Sidebar**: Main navigation menu on the left
- **Top Bar**: Quick actions and user menu
- **AI Assistant**: Floating help button (bottom right)
- **Notifications**: Bell icon for alerts

## Your Dashboard

Your dashboard shows information relevant to your role:
- Quick stats and metrics
- Recent activity
- Shortcuts to common actions
- Alerts and notifications

Need more help? Click the AI Assistant button in the bottom right corner!',
                'category' => 'getting-started',
                'tags' => ['beginner', 'introduction', 'overview', 'navigation'],
                'target_roles' => [],
                'is_published' => true,
                'featured' => true,
            ],
            [
                'title' => 'Understanding User Roles',
                'slug' => 'understanding-user-roles',
                'content' => '# User Roles in ControlRoom

ControlRoom uses role-based access control to ensure users see only what they need.

## Available Roles

### Super Admin
Full system access. Can manage all users, settings, modules, and data.

### Admin
Administrative access. Can manage users, clients, guards, sites, and view all reports.

### HR
Human resources access. Can manage employees, training, benefits, medical claims, and HR reports.

### Finance
Financial access. Can process payroll, manage invoices, budgets, and view financial reports.

### Asset Manager
Assets module access. Can manage vehicles, equipment, dispatches, and maintenance.

### Control Room Operator
Operations monitoring. Can handle check-ins, incidents, and real-time monitoring.

### Operations Manager
Operations management. Can manage assignments, scheduling, and incidents across sites.

### Zone Commander
Zone management. Can manage guards and operations within their assigned zone.

### Supervisor
Zone supervision. Can view and manage attendance for guards in their zone.

### Client
Client portal access. Can view their sites, assigned guards, and invoices.

### Guard
Basic access. Can check in/out, view schedule, and update profile.

### Marketing
Marketing access. Can manage campaigns, leads, and marketing analytics.

### Training
Training access. Can manage trainees, trainers, and training programs.

## Switching Views

Some users may have multiple roles. Use the role switcher in the top bar to change your active view.',
                'category' => 'getting-started',
                'tags' => ['roles', 'permissions', 'access', 'users'],
                'target_roles' => [],
                'is_published' => true,
            ],
            [
                'title' => 'Using the AI Assistant',
                'slug' => 'using-the-ai-assistant',
                'content' => '# AI Assistant Guide

The AI Assistant is your intelligent helper available throughout ControlRoom.

## Accessing the AI Assistant

Click the floating button in the bottom right corner of any page.

## What Can It Help With?

- **Navigation**: "Where do I add a new guard?"
- **Instructions**: "How do I process payroll?"
- **Troubleshooting**: "Why is check-in failing?"
- **Information**: "How many guards are on duty today?"
- **Contextual Help**: It knows which page you\'re on and provides relevant help

## Tips for Best Results

1. **Be specific**: "How do I assign a guard to Site A?" works better than "How do I assign?"
2. **Ask follow-ups**: The AI remembers your conversation
3. **Request human help**: Type "speak to human" if you need personal assistance
4. **Use natural language**: Ask questions as you would a colleague

## Example Questions

- "Show me how to add a new client"
- "What\'s the difference between a zone and a site?"
- "How do I export attendance data?"
- "My GPS isn\'t working, what should I do?"
- "Explain the payroll process"

## Transfer to Human Agent

If the AI can\'t help, type "speak to human" or "transfer to agent" to connect with a support agent.',
                'category' => 'getting-started',
                'tags' => ['ai', 'assistant', 'help', 'chat'],
                'target_roles' => [],
                'is_published' => true,
                'featured' => true,
            ],

            // ============================================
            // GUARD MANAGEMENT
            // ============================================
            [
                'title' => 'Adding a New Guard',
                'slug' => 'adding-a-new-guard',
                'content' => '# Adding a New Guard

Follow these steps to add a security guard to the system.

## Prerequisites

- Admin, HR, or Super Admin role required
- Guard\'s personal information ready

## Steps

1. Navigate to **Admin > Guards** or **HR > Guards**
2. Click the **Add Guard** button
3. Fill in the required information:
   - **Full Name**: Guard\'s complete name
   - **Phone Number**: Primary contact number
   - **Email** (optional): For system notifications
   - **Zone**: Geographic zone assignment
   - **Employee Role**: Guard or Driver
   - **Grade**: Guard grade/level (if applicable)
4. Upload a profile photo (optional but recommended)
5. Add emergency contact information
6. Click **Save**

## After Adding

- The guard appears in the guards list
- You can now assign them to sites
- They can check in using their credentials
- A profile is created for self-service access

## Tips

- Ensure phone numbers are in correct format (+265...)
- Assign to the correct zone for proper scheduling
- Add emergency contacts for safety purposes
- Upload a clear photo for identification
- Set the correct grade for payroll calculations',
                'category' => 'guards',
                'tags' => ['guards', 'add', 'create', 'new', 'employee'],
                'target_roles' => ['admin', 'hr', 'super_admin'],
                'is_published' => true,
                'featured' => true,
            ],
            [
                'title' => 'Assigning Guards to Sites',
                'slug' => 'assigning-guards-to-sites',
                'content' => '# Assigning Guards to Sites

This guide explains how to assign security guards to client sites.

## Prerequisites

- Guard must be created in the system
- Site must be configured with checkpoints
- Admin, Operations Manager, or Zone Commander role required

## Assignment Steps

1. Go to **Admin > Guards** or **Operations > Assignments**
2. Find the guard you want to assign
3. Click the **Assign** button (or **Quick Assign** in guard details)
4. Select the following:
   - **Site**: The client site location
   - **Shift**: The shift schedule
   - **Start Date**: When the assignment begins
   - **End Date**: When it ends (optional for ongoing assignments)
5. Click **Confirm Assignment**

## Managing Assignments

- **View assignments**: Operations > Assignments
- **End assignments**: Find assignment, click End
- **Transfer guards**: End current, create new assignment
- **View history**: Assignment history in guard profile

## Assignment Rules

- A guard can only have one active assignment at a time
- Assignments must not overlap
- Zone commanders can only assign within their zone
- End dates help with relief planning

## Best Practices

- Check guard availability before assigning
- Ensure guards have proper training for the site
- Consider travel time between sites
- Review assignments regularly for optimization
- Use end dates for temporary coverage',
                'category' => 'guards',
                'tags' => ['guards', 'assignment', 'sites', 'scheduling', 'deployment'],
                'target_roles' => ['admin', 'operations_manager', 'zone_commander', 'super_admin'],
                'is_published' => true,
            ],
            [
                'title' => 'Managing Guard Profiles',
                'slug' => 'managing-guard-profiles',
                'content' => '# Managing Guard Profiles

Complete guide to maintaining guard information in ControlRoom.

## Accessing Guard Profiles

1. Navigate to **Admin > Guards** or **HR > Guards**
2. Click on a guard\'s name or the View/Edit button
3. Profile opens in a modal with all details

## Profile Sections

### Personal Information
- Full name and contact details
- Date of birth and national ID
- Emergency contacts
- Profile photo

### Employment Details
- Employee role (Guard/Driver)
- Grade and salary band
- Zone assignment
- Hire date

### Current Assignment
- Active site assignment
- Shift schedule
- Assignment dates

### Compliance & Documents
- Training certificates
- Medical records
- Disciplinary records
- Document uploads

### Attendance History
- Recent check-ins/outs
- Attendance statistics
- Exceptions and flags

## Editing Profiles

1. Open the guard profile
2. Click **Edit** button
3. Update the required fields
4. Click **Save Changes**

## Guard Statuses

- **Active**: Currently employed and available
- **On Leave**: Temporarily unavailable
- **Dismissed**: Employment terminated
- **Absconded**: Left without notice

## Profile Actions

- **Suspend**: Temporarily deactivate
- **Promote**: Change grade/role
- **Transfer**: Move to different zone
- **Terminate**: End employment',
                'category' => 'guards',
                'tags' => ['guards', 'profile', 'edit', 'details', 'records'],
                'target_roles' => ['admin', 'hr', 'super_admin'],
                'is_published' => true,
            ],

            // ============================================
            // ATTENDANCE & CHECK-INS
            // ============================================
            [
                'title' => 'Guard Check-In Process',
                'slug' => 'guard-check-in-process',
                'content' => '# Guard Check-In Process

How security guards check in at their assigned sites.

## Check-In Methods

### QR Code Scanning (Primary Method)
1. Open the mobile app or web portal
2. Navigate to Scanner or Check-In
3. Point camera at the site\'s QR code
4. GPS location is verified automatically
5. Check-in is recorded with timestamp

### Manual Check-In (Control Room)
Used when QR scanning isn\'t possible:
1. Control Room operator goes to **Control Room > Attendance**
2. Click **Manual Check-In**
3. Select the guard
4. Choose the site
5. Optionally set custom time
6. Add notes if needed
7. Confirm check-in

### GPS Verification

The system verifies the guard is at the correct location:
- GPS coordinates must match site location
- Tolerance radius is configurable
- Mismatches are flagged for review

## Check-Out Process

Guards check out the same way:
1. Scan QR code at site
2. Or request manual check-out from Control Room
3. Total hours are calculated automatically

## Handling Issues

### GPS Mismatch
- Check GPS is enabled on device
- Move to open area for better signal
- Contact Control Room for manual override

### QR Code Not Working
- Ensure camera permissions are granted
- Clean the QR code if dirty
- Request manual check-in

### Missed Check-Out
- Contact Control Room immediately
- Operator can add manual check-out
- Note the reason for records',
                'category' => 'attendance',
                'tags' => ['check-in', 'attendance', 'qr', 'gps', 'scan'],
                'target_roles' => [],
                'is_published' => true,
                'featured' => true,
            ],
            [
                'title' => 'Control Room Attendance Monitoring',
                'slug' => 'control-room-attendance-monitoring',
                'content' => '# Control Room Attendance Monitoring

Guide for Control Room operators monitoring guard attendance.

## Dashboard Overview

The Control Room dashboard shows:
- **Active Guards**: Currently on duty
- **Sites Status**: Coverage status per site
- **Recent Check-ins**: Latest attendance updates
- **Exceptions**: Missed check-ins, GPS mismatches

## Real-Time Monitoring

### Map View
- See guard locations on the map
- Color-coded status indicators
- Click guard markers for details

### Attendance List
- Filter by zone, site, or status
- Sort by check-in time
- Quick actions for exceptions

## Handling Exceptions

### Missed Check-In
1. Identify the guard in exceptions list
2. Contact the guard if possible
3. Use **Manual Check-In** if needed
4. Add notes explaining the situation

### GPS Mismatch
1. Review the reported location
2. Contact guard to verify position
3. Override if legitimate reason
4. Flag for investigation if suspicious

### No Check-Out
1. Check if guard is still on site
2. Contact supervisor if needed
3. Add manual check-out with notes
4. Record incident if warranted

## Manual Check-In Modal

Access via **Manual Check-In** button:
1. Search for guard by name or ID
2. Select site from dropdown
3. Set time (defaults to now)
4. Add explanatory notes
5. Submit

## Attendance Reports

Generate reports from Control Room > Reports:
- Daily attendance summary
- Exception reports
- Site coverage reports
- Guard attendance history',
                'category' => 'control-room',
                'tags' => ['control-room', 'attendance', 'monitoring', 'exceptions'],
                'target_roles' => ['control_room_operator', 'admin', 'super_admin', 'operations_manager'],
                'is_published' => true,
            ],

            // ============================================
            // SITE MANAGEMENT
            // ============================================
            [
                'title' => 'Adding a New Client',
                'slug' => 'adding-a-new-client',
                'content' => '# Adding a New Client

Step-by-step guide to adding a new client company.

## Prerequisites

- Admin or Super Admin role required
- Client company information ready

## Steps

1. Navigate to **Admin > Clients**
2. Click **Add Client** button
3. Fill in client details:
   - **Company Name**: Legal business name
   - **Contact Person**: Primary contact
   - **Phone & Email**: Contact information
   - **Address**: Business address
   - **Billing Information**: Payment terms, monthly rate
   - **Supervisor**: Assigned supervisor (optional)
   - **Zone**: Geographic zone
4. Click **Save**

## After Adding

- Client appears in clients list
- You can now add sites for this client
- Assign guards to those sites
- Configure billing and invoicing

## Client Dashboard

View client details including:
- All sites for this client
- Assigned guards per site
- Billing history
- Contract details
- Service requests

## Tips

- Verify contact information is accurate
- Set up billing details early
- Add multiple contacts if needed
- Document contract terms in notes',
                'category' => 'sites',
                'tags' => ['clients', 'add', 'create', 'new', 'customer'],
                'target_roles' => ['admin', 'super_admin'],
                'is_published' => true,
            ],
            [
                'title' => 'Adding Sites to a Client',
                'slug' => 'adding-sites-to-client',
                'content' => '# Adding Sites to a Client

How to add site locations for client companies.

## Prerequisites

- Client must already exist in the system
- Site address and details ready
- Admin or Super Admin role required

## Steps

1. Go to **Admin > Clients**
2. Find the client and open their details
3. Click **Add Site** button
4. Enter site information:
   - **Site Name**: Location identifier
   - **Address**: Physical address
   - **GPS Coordinates**: Latitude/Longitude (or use map picker)
   - **Contact Person**: On-site contact
   - **Site Type**: Regular site or Office
   - **Services Requested**: Security services needed
5. Configure checkpoints (see Checkpoint guide)
6. Set up shift schedules
7. Click **Save**

## GPS Coordinates

### Using Map Picker
- Click on the map to place marker
- Coordinates auto-fill

### Manual Entry
- Enter latitude and longitude
- Values validated for Malawi region

## Site Types

- **Regular Site**: Client location requiring security
- **Office**: Company\'s own office (for internal guards)

## After Adding

- Site appears in client\'s site list
- QR code is auto-generated for check-ins
- Can now assign guards to this site
- Configure checkpoints for patrols

## QR Code

Each site gets a unique QR code:
- View in site details
- Download for printing
- Place at site entrance for check-ins',
                'category' => 'sites',
                'tags' => ['sites', 'add', 'create', 'location', 'client'],
                'target_roles' => ['admin', 'super_admin'],
                'is_published' => true,
            ],
            [
                'title' => 'Managing Checkpoints',
                'slug' => 'managing-checkpoints',
                'content' => '# Managing Checkpoints

Configure checkpoint locations for guard patrols.

## What Are Checkpoints?

Checkpoints are specific locations within a site that guards must visit during patrol rounds. Each has a unique QR code for scanning.

## Adding Checkpoints

1. Go to **Admin > Clients > [Client] > [Site]**
2. Click **Checkpoints** tab
3. Click **Add Checkpoint**
4. Enter:
   - **Name**: Location description (e.g., "Main Gate", "Parking Area")
   - **Location**: Specific details
   - **Required Scans**: Times when scans are required
   - **Sequence**: Order in patrol route (optional)
5. Save

## QR Codes

Each checkpoint gets a unique QR code:
- **View**: Preview the QR code
- **Download**: Save as image for printing
- **Print**: Direct print option

### Printing QR Codes
1. Download or print the QR code
2. Laminate for weather protection
3. Place at the checkpoint location
4. Ensure it\'s visible and scannable

## Required Scan Times

Set when guards must scan each checkpoint:
- **Hourly**: Every hour during shift
- **Specific Times**: E.g., 22:00, 02:00, 06:00
- **Interval-based**: Every X minutes

## Patrol Routes

Organize checkpoints in sequence:
1. Set sequence numbers for each checkpoint
2. Guards follow the numbered order
3. System tracks route completion

## Monitoring

View checkpoint scans in:
- Control Room dashboard
- Site details > Scan history
- Patrol reports',
                'category' => 'sites',
                'tags' => ['checkpoints', 'qr', 'patrol', 'scan', 'site'],
                'target_roles' => ['admin', 'super_admin', 'control_room_operator'],
                'is_published' => true,
            ],

            // ============================================
            // CONTROL ROOM OPERATIONS
            // ============================================
            [
                'title' => 'Control Room Dashboard Guide',
                'slug' => 'control-room-dashboard-guide',
                'content' => '# Control Room Dashboard Guide

Complete overview of the Control Room monitoring interface.

## Dashboard Overview

The Control Room is the central hub for monitoring security operations in real-time.

### Main Sections

- **Map View**: Live guard positions on map
- **Active Guards**: Currently on duty
- **Sites Status**: Coverage per site
- **Recent Activity**: Latest check-ins and events
- **Alerts**: Exceptions and incidents

## Real-Time Features

### Guard Tracking
- GPS positions updated live
- Color-coded status indicators
- Click markers for guard details

### Attendance Feed
- Live check-in/check-out events
- Filter by zone or site
- Quick action buttons

### Alerts Panel
- GPS mismatches
- Missed check-ins
- Incidents
- System notifications

## Quick Actions

### Manual Check-In
For guards who can\'t scan QR:
1. Click **Manual Check-In**
2. Select guard and site
3. Set time and notes
4. Submit

### Create Incident
Report security incidents:
1. Click **New Incident**
2. Fill in details
3. Assign responders
4. Track resolution

### Scan QR
Open the QR scanner for check-ins at the control room.

## Zone Management

- View all zones
- See zone commanders
- Check zone coverage
- Assign guards to zones

## Shift Management

- View active shifts
- See shift assignments
- Monitor shift changes
- Handle shift exceptions',
                'category' => 'control-room',
                'tags' => ['control-room', 'dashboard', 'monitoring', 'operations'],
                'target_roles' => ['control_room_operator', 'admin', 'super_admin', 'operations_manager'],
                'is_published' => true,
                'featured' => true,
            ],
            [
                'title' => 'Managing Incidents',
                'slug' => 'managing-incidents',
                'content' => '# Managing Incidents

How to create, track, and resolve security incidents.

## Creating an Incident

1. Navigate to **Control Room** or **Operations > Incidents**
2. Click **New Incident** button
3. Fill in incident details:
   - **Type**: Security, Safety, Medical, Other
   - **Site**: Where it occurred
   - **Location**: Specific area within site
   - **Description**: What happened
   - **Severity**: Low, Medium, High, Critical
   - **Date/Time**: When it occurred
   - **People Involved**: Guards, visitors, etc.
4. Attach photos or documents if available
5. Assign responders if needed
6. Click **Save**

## Incident Workflow

1. **Reported**: Incident created
2. **Acknowledged**: Supervisor/Manager aware
3. **In Progress**: Being handled
4. **Resolved**: Situation addressed
5. **Closed**: Final documentation complete

## Tracking Incidents

### Incident List
- Filter by status, site, date range
- Sort by severity or date
- Search by keywords

### Incident Details
- Full description and timeline
- Assigned responders
- Comments and updates
- Attached files

## Adding Updates

1. Open the incident
2. Click **Add Comment** or **Update Status**
3. Enter new information
4. Change status if appropriate
5. Save

## Resolution

When incident is resolved:
1. Update status to **Resolved**
2. Add resolution details
3. Document any follow-up actions
4. Attach final reports or evidence

## Incident Reports

Generate reports from **Reports > Incidents**:
- Incident summary by period
- By site, type, or severity
- Response time analysis
- Resolution statistics',
                'category' => 'control-room',
                'tags' => ['incidents', 'reports', 'security', 'response'],
                'target_roles' => ['control_room_operator', 'operations_manager', 'admin', 'super_admin', 'zone_commander'],
                'is_published' => true,
            ],

            // ============================================
            // FINANCE & PAYROLL
            // ============================================
            [
                'title' => 'Processing Payroll',
                'slug' => 'processing-payroll',
                'content' => '# Processing Payroll

Step-by-step guide to processing monthly payroll for security personnel.

## Prerequisites

- Finance, Admin, or Super Admin role required
- Attendance data must be complete for the period
- Pay profiles configured for each guard

## Payroll Process

### Step 1: Navigate to Payroll
Go to **Finance > Payroll**

### Step 2: Select Pay Period
- Choose the month and year
- System loads attendance data

### Step 3: Review Summary
The summary shows:
- **Total Guards**: Number of employees
- **Days Worked**: Attendance days per guard
- **Overtime Hours**: Extra hours worked
- **Deductions**: NAPSA, NHIMA, loans
- **Bonuses/Allowances**: Additional payments

### Step 4: Make Adjustments

#### Add Overtime
1. Find the guard
2. Click **Add Overtime**
3. Enter hours and rate
4. Save

#### Add Deductions
1. Click **Add Deduction**
2. Select type (Advance, Loan, Other)
3. Enter amount
4. Save

#### Add Bonuses
1. Click **Add Bonus**
2. Enter amount and reason
3. Save

### Step 5: Process Payroll
1. Review all amounts
2. Click **Process Payroll**
3. Confirm the final figures

### Step 6: Generate Outputs
- **Payslips**: Print or email to guards
- **Export**: Download as Excel/PDF
- **Reports**: Generate payroll reports

## Payroll Components

### Earnings
- Base salary (from pay profile)
- Overtime pay
- Allowances (transport, housing, etc.)
- Bonuses

### Deductions
- NAPSA (National Pension)
- NHIMA (Health Insurance)
- Paye (Income Tax)
- Loans/Advances
- Other deductions

## Pay Profiles

Each guard needs a pay profile with:
- Monthly salary
- Overtime multiplier
- Allowances
- Deduction settings

Set up in **Finance > Pay Profiles** or **Admin > Settings > Finance**',
                'category' => 'finance',
                'tags' => ['payroll', 'salary', 'finance', 'payment', 'payslip'],
                'target_roles' => ['admin', 'finance', 'super_admin'],
                'is_published' => true,
                'featured' => true,
            ],
            [
                'title' => 'Managing Requisitions',
                'slug' => 'managing-requisitions',
                'content' => '# Managing Requisitions

How to handle purchase requests and requisitions.

## What Are Requisitions?

Requisitions are formal requests for purchases or supplies needed for operations.

## Creating a Requisition

1. Go to **Finance > Requisitions**
2. Click **New Requisition**
3. Fill in details:
   - **Title**: Brief description
   - **Category**: Supplies, Equipment, Services, Other
   - **Items**: List of items with quantities and estimated costs
   - **Justification**: Why needed
   - **Required Date**: When needed by
4. Submit for approval

## Approval Workflow

1. **Draft**: Created, not yet submitted
2. **Pending**: Submitted, awaiting approval
3. **Approved**: Manager has approved
4. **Rejected**: Manager has rejected (with reason)
5. **Fulfilled**: Items purchased/received

## For Approvers

### Approving Requisitions
1. Go to **Finance > Approvals** or use notification link
2. Review the requisition details
3. Check budget availability
4. Click **Approve** or **Reject**
5. Add comments if needed

### Bulk Approval
1. Select multiple requisitions
2. Click **Bulk Approve**
3. Confirm

## Daily Batch Processing

Asset managers compile approved requisitions into daily batches:
1. Go to **Finance > Requisitions > Today\'s Batch**
2. Review all approved items
3. Click **Compile Batch**
4. Submit to procurement

## Requisition Reports

- Pending requisitions
- Approval history
- Spending by category
- Budget utilization',
                'category' => 'finance',
                'tags' => ['requisitions', 'purchasing', 'approval', 'finance'],
                'target_roles' => ['admin', 'finance', 'asset_manager', 'super_admin'],
                'is_published' => true,
            ],
            [
                'title' => 'Client Invoicing',
                'slug' => 'client-invoicing',
                'content' => '# Client Invoicing

How to generate and manage invoices for clients.

## Creating Invoices

1. Go to **Finance > Invoices**
2. Click **New Invoice**
3. Select the client
4. Add line items:
   - Service description
   - Quantity (e.g., guard-days)
   - Unit price
   - Total
5. Set due date
6. Add notes or terms
7. Save and send

## Invoice Components

- **Invoice Number**: Auto-generated
- **Client Details**: Billing information
- **Line Items**: Services/products
- **Subtotal**: Before tax
- **Tax (VAT)**: If applicable
- **Total**: Final amount

## Invoice Statuses

- **Draft**: Not yet finalized
- **Sent**: Delivered to client
- **Viewed**: Client has opened
- **Paid**: Payment received
- **Overdue**: Past due date
- **Cancelled**: Voided

## Recording Payments

1. Open the invoice
2. Click **Record Payment**
3. Enter:
   - Amount paid
   - Payment date
   - Payment method
   - Reference number
4. Save

## Recurring Invoices

For monthly billing:
1. Create invoice template
2. Set as recurring
3. Configure frequency (monthly)
4. System auto-generates each period

## Invoice Reports

- Outstanding invoices
- Revenue by client
- Payment history
- Aging report',
                'category' => 'finance',
                'tags' => ['invoices', 'billing', 'clients', 'payments'],
                'target_roles' => ['admin', 'finance', 'super_admin'],
                'is_published' => true,
            ],

            // ============================================
            // ASSETS & VEHICLES
            // ============================================
            [
                'title' => 'Vehicle Management',
                'slug' => 'vehicle-management',
                'content' => '# Vehicle Management

Complete guide to managing company vehicles in ControlRoom.

## Adding a Vehicle

1. Navigate to **Assets > Vehicles**
2. Click **Add Vehicle**
3. Enter vehicle details:
   - **Registration Number**: License plate
   - **Make**: Manufacturer (Toyota, Nissan, etc.)
   - **Model**: Vehicle model
   - **Year**: Year of manufacture
   - **Type**: Sedan, Truck, Motorcycle, etc.
   - **Status**: Active, Maintenance, Retired
4. Add insurance and inspection dates
5. Save

## Vehicle Details

Each vehicle record shows:
- Basic information
- Current assignment (driver)
- Maintenance history
- Fuel logs
- Utilization records
- Dispatch history

## Dispatching Vehicles

### Creating a Dispatch
1. Select an available vehicle
2. Click **Dispatch**
3. Choose:
   - **Driver**: Assigned driver
   - **Destination**: Site or location
   - **Purpose**: Reason for dispatch
   - **Expected Return**: Date/time
4. Confirm dispatch

### Completing a Dispatch
1. Open the active dispatch
2. Click **Mark Returned**
3. Enter:
   - Return time
   - Odometer reading
   - Condition notes
   - Issues encountered
4. Save

## Vehicle Handovers

When transferring vehicles between drivers:
1. Go to vehicle details
2. Click **Handover**
3. Select new driver
4. Record condition and notes
5. Confirm handover

## Maintenance Tracking

### Scheduling Maintenance
1. Open vehicle record
2. Click **Schedule Maintenance**
3. Enter:
   - Type (Routine, Repair, Inspection)
   - Date
   - Service provider
   - Estimated cost
4. Save

### Recording Maintenance
1. Open scheduled maintenance
2. Add actual costs
3. Record work done
4. Upload receipts
5. Complete the record',
                'category' => 'assets',
                'tags' => ['vehicles', 'assets', 'dispatch', 'maintenance', 'fleet'],
                'target_roles' => ['asset_manager', 'admin', 'super_admin'],
                'is_published' => true,
                'featured' => true,
            ],
            [
                'title' => 'Equipment Management',
                'slug' => 'equipment-management',
                'content' => '# Equipment Management

How to manage security equipment inventory.

## Adding Equipment

1. Go to **Assets > Equipment**
2. Click **Add Equipment**
3. Enter details:
   - **Name**: Equipment name
   - **Type**: Radio, Torch, Baton, Uniform, etc.
   - **Serial Number**: Unique identifier
   - **Condition**: New, Good, Fair, Poor
   - **Status**: Available, Assigned, Maintenance
4. Save

## Assigning Equipment

1. Select available equipment
2. Click **Assign**
3. Choose:
   - **Assignee**: Guard or site
   - **Assignment Date**: When assigned
   - **Notes**: Condition at assignment
4. Confirm

## Equipment Handovers

When transferring equipment between guards:
1. Open equipment details
2. Click **Handover**
3. Select new assignee
4. Record condition
5. Add notes
6. Confirm

## Maintenance & Repairs

1. Open equipment record
2. Click **Report Issue** or **Schedule Maintenance**
3. Describe the problem
4. Set priority
5. Track repair status

## Equipment Reports

- Inventory by type
- Assignment status
- Condition summary
- Maintenance due
- Value depreciation',
                'category' => 'assets',
                'tags' => ['equipment', 'assets', 'inventory', 'assignment'],
                'target_roles' => ['asset_manager', 'admin', 'super_admin'],
                'is_published' => true,
            ],

            // ============================================
            // HR MANAGEMENT
            // ============================================
            [
                'title' => 'HR Dashboard Overview',
                'slug' => 'hr-dashboard-overview',
                'content' => '# HR Dashboard Overview

Guide to the Human Resources management features.

## Dashboard Metrics

The HR dashboard shows:
- **Headcount**: Total employees and guards
- **On Duty**: Currently working
- **New Hires**: This month
- **Exits**: Departures this month
- **Off-Days**: Scheduled leave today
- **Compliance**: Missing profile fields

## Employee Management

### Adding Employees
1. Go to **HR > Employees**
2. Click **Add Employee**
3. Fill in personal and employment details
4. Set department and role
5. Configure compensation
6. Save

### Employee Records
- Personal information
- Employment history
- Compensation details
- Benefits enrollment
- Training records
- Disciplinary records

## Leave Management

### Types of Leave
- Annual leave
- Sick leave
- Personal off-days
- Public holidays

### Managing Off-Days
1. Go to **HR > Leave/Roster**
2. View calendar
3. Add off-days or holidays
4. Approve requests

## Benefits Administration

- Medical schemes
- Pension enrollment
- Insurance benefits
- Track claims and usage

## Disciplinary Management

1. Go to **HR > Disciplinary**
2. Create cases for violations
3. Track investigations
4. Record outcomes
5. Document actions taken',
                'category' => 'hr',
                'tags' => ['hr', 'employees', 'dashboard', 'human-resources'],
                'target_roles' => ['admin', 'hr', 'super_admin'],
                'is_published' => true,
            ],
            [
                'title' => 'Managing Leave & Off-Days',
                'slug' => 'managing-leave-off-days',
                'content' => '# Managing Leave & Off-Days

How to handle employee leave and scheduling.

## Leave Types

### Guard Off-Days
Regular rest days for security guards:
- Configured per guard
- Tracked in the roster
- Affects attendance expectations

### Public Holidays
Company-wide holidays:
- Configured in HR > Holidays
- Applied to all staff
- Shown in roster calendar

### Annual Leave
Planned vacation time:
- Requested by employee
- Approved by supervisor
- Tracked in leave balance

## Roster Calendar

Access via **HR > Leave/Roster**:
- Calendar view of all leave
- Filter by guard, zone, or type
- Add off-days directly
- Import holidays

## Adding Guard Off-Days

1. Open the roster calendar
2. Click on a date
3. Select **Add Off-Day**
4. Choose the guard
5. Add notes if needed
6. Save

## Adding Holidays

1. Go to **HR > Holidays**
2. Click **Add Holiday**
3. Enter:
   - Holiday name
   - Date
   - Recurring (annual)
4. Save

## Leave Reports

- Off-day utilization
- Leave balance summary
- Coverage planning
- Holiday schedule',
                'category' => 'hr',
                'tags' => ['leave', 'off-days', 'holidays', 'roster', 'hr'],
                'target_roles' => ['admin', 'hr', 'super_admin'],
                'is_published' => true,
            ],

            // ============================================
            // SUPERVISOR & ZONE MANAGEMENT
            // ============================================
            [
                'title' => 'Supervisor Dashboard Guide',
                'slug' => 'supervisor-dashboard-guide',
                'content' => '# Supervisor Dashboard Guide

Guide for supervisors and zone commanders.

## Dashboard Overview

The supervisor dashboard shows:
- **Zone Guards**: Guards in your zone
- **On Duty**: Currently working
- **Attendance Status**: Check-in status
- **Active Incidents**: Unresolved issues
- **Zone Coverage**: Site coverage status

## Zone Management

### Viewing Zone Guards
1. Dashboard shows all zone guards
2. Filter by status or site
3. Click guard for details

### Zone Statistics
- Total guards
- Active assignments
- Attendance rate
- Incidents this period

## Attendance Management

### Monitoring Check-ins
- Real-time attendance feed
- Exceptions highlighted
- Quick contact options

### QR Scanning
Supervisors can scan for guards:
1. Click **Scan QR** button
2. Scan guard\'s checkpoint QR
3. Verify guard check-in

## Incident Handling

### Viewing Zone Incidents
1. Go to **Incidents** tab
2. See incidents in your zone
3. Filter by status or type

### Responding to Incidents
1. Open incident details
2. Add comments/updates
3. Update status
4. Coordinate response

## Reports

- Zone attendance reports
- Guard performance
- Incident summary
- Coverage analysis',
                'category' => 'supervisor',
                'tags' => ['supervisor', 'zone', 'dashboard', 'commander'],
                'target_roles' => ['supervisor', 'zone_commander'],
                'is_published' => true,
            ],

            // ============================================
            // CLIENT PORTAL
            // ============================================
            [
                'title' => 'Client Portal Guide',
                'slug' => 'client-portal-guide',
                'content' => '# Client Portal Guide

Guide for clients accessing the ControlRoom portal.

## Dashboard Overview

The client dashboard shows:
- **Your Sites**: All contracted locations
- **Assigned Guards**: Guards at each site
- **Attendance Summary**: Recent check-ins
- **Invoices**: Billing information

## Viewing Sites

1. Dashboard shows your sites
2. Click a site for details:
   - Site information
   - Assigned guards
   - Shift schedule
   - Checkpoint locations

## Viewing Guards

See guards assigned to your sites:
- Guard names and photos
- Shift times
- Contact information
- Attendance history

## Attendance Reports

View attendance for your sites:
1. Go to **Reports > Attendance**
2. Select date range
3. Filter by site
4. View or export data

## Invoices & Billing

Access your billing information:
1. Go to **Invoices** section
2. View invoice history
3. Download PDF copies
4. See payment status

## Submitting Requests

Contact Coin Security for:
- Additional guards
- Service changes
- Incident reports
- General inquiries

Use the **Contact/Request** button or call the support line.',
                'category' => 'client',
                'tags' => ['client', 'portal', 'customer', 'self-service'],
                'target_roles' => ['client'],
                'is_published' => true,
            ],

            // ============================================
            // REPORTS & ANALYTICS
            // ============================================
            [
                'title' => 'Reports Overview',
                'slug' => 'reports-overview',
                'content' => '# Reports Overview

Guide to reporting features in ControlRoom.

## Accessing Reports

Navigate to **Reports** from any module, or **Admin > Reports** for centralized access.

## Report Categories

### Attendance Reports
- Daily attendance summary
- Check-in/check-out logs
- Exception reports
- Guard attendance history
- Site coverage analysis

### Operational Reports
- Incident reports
- Patrol completion
- Checkpoint scans
- Zone coverage

### Financial Reports
- Payroll summary
- Invoice aging
- Revenue by client
- Budget vs actual
- Requisition spending

### HR Reports
- Employee statistics
- Training completion
- Leave balance
- Medical claims

### Asset Reports
- Vehicle utilization
- Maintenance due
- Equipment inventory
- Dispatch history

## Generating Reports

1. Select report type
2. Set parameters:
   - Date range
   - Site/zone filter
   - Other criteria
3. Click **Generate**
4. View results

## Exporting

- **PDF**: Formatted document
- **Excel**: Spreadsheet format
- **CSV**: Raw data
- **Print**: Direct to printer

## Scheduling Reports

Some reports can be scheduled:
1. Generate the report
2. Click **Schedule**
3. Set frequency (daily, weekly, monthly)
4. Choose recipients
5. Save',
                'category' => 'reports',
                'tags' => ['reports', 'analytics', 'export', 'data'],
                'target_roles' => [],
                'is_published' => true,
            ],

            // ============================================
            // SETTINGS & CONFIGURATION
            // ============================================
            [
                'title' => 'System Settings Guide',
                'slug' => 'system-settings-guide',
                'content' => '# System Settings Guide

Overview of configuration options in ControlRoom.

## Accessing Settings

Go to **Admin > Settings** (requires Admin or Super Admin role).

## Settings Categories

### General Settings
- Company information
- Default values
- System preferences

### Finance Settings
- Payroll defaults
- Overtime multipliers
- Deduction rates
- Pay profiles

### HR Settings
- Guard grades
- Salary bands
- Benefit configurations
- Incentive settings

### Attendance Settings
- GPS tolerance
- Check-in rules
- Backdate permissions

### Notification Settings
- Email notifications
- Alert thresholds
- Reminder schedules

### AI Settings
- AI provider configuration
- Model selection
- Response settings

## Pay Profiles

Configure salary structures:
1. Go to **Settings > Finance > Pay Profiles**
2. Create profiles for different employee types
3. Set base salary, overtime, deductions
4. Assign to guards

## Guard Grades

Define guard levels:
1. Go to **Settings > HR > Guard Grades**
2. Add grades (Grade 1, Grade 2, etc.)
3. Set salary ranges
4. Assign to guards

## Module Management

Enable/disable system modules:
1. Go to **Admin > Modules**
2. Toggle modules on/off
3. Configure module settings',
                'category' => 'settings',
                'tags' => ['settings', 'configuration', 'admin', 'setup'],
                'target_roles' => ['admin', 'super_admin'],
                'is_published' => true,
            ],

            // ============================================
            // TRAINING & DEVELOPMENT
            // ============================================
            [
                'title' => 'Guard Training & Certification',
                'slug' => 'guard-training-certification',
                'content' => '# Guard Training & Certification

Overview of the training management system for security personnel.

## Training Module Access

Navigate to **HR > Training** or **Training** from the main menu.

## Training Programs

### Creating Training Regimens
1. Go to **Training > Regimens**
2. Click **Add Regimen**
3. Define:
   - Training name and description
   - Duration and schedule
   - Goals and objectives
   - Required certifications

### Managing Trainees
1. Add new guards as trainees
2. Assign trainers to trainees
3. Track progress against goals
4. Evaluate and approve/reject

### Training Record Types
- **Initial Training**: For new recruits
- **Refresher Training**: Periodic updates
- **Crash Courses**: Intensive short programs
- **Certification Training**: Specialized skills

## Certification Management

- Upload certificates to guard profiles
- Set expiration dates
- Receive renewal reminders
- Track compliance rates

## Training Reports

- Completion rates by program
- Trainee performance metrics
- Trainer effectiveness
- Certification status

## Roles in Training

- **Training Manager**: Full training module access
- **Trainer**: Assigned to train and evaluate trainees
- **HR**: View reports and manage records
- **Admin**: Configure training settings',
                'category' => 'training',
                'tags' => ['training', 'certification', 'trainees', 'hr'],
                'target_roles' => ['admin', 'hr', 'training', 'super_admin'],
                'is_published' => true,
            ],
            [
                'title' => 'Training Dashboard Guide',
                'slug' => 'training-dashboard-guide',
                'content' => '# Training Dashboard Guide

The Training Dashboard is your central hub for managing trainees, programs, and progress tracking.

## Dashboard Overview

The dashboard displays:
- **Trainee Statistics**: Total, in training, approved, rejected
- **Current Programs**: Active training regimens
- **Pending Reviews**: Trainees awaiting evaluation
- **Recent Activity**: Latest training events

## Key Features

### Trainee Management
- Add new trainees
- Assign to training programs
- Track individual progress
- Evaluate and approve/reject

### Program Types

#### Crash Courses
Short, intensive training programs:
- Quick skill acquisition
- Emergency training needs
- Rapid deployment preparation

#### Refreshers
Periodic refresher training:
- Skill maintenance
- Policy updates
- Compliance requirements

#### Regimens
Full training programs:
- Comprehensive curricula
- Multiple objectives
- Extended duration

## Quick Actions

- **Add Trainee**: Register new trainee
- **Create Program**: Set up new training
- **Review Progress**: Evaluate trainees
- **View Reports**: Training analytics

## Navigation

- **Dashboard**: Overview and stats
- **Trainees**: Manage trainee records
- **Attendance**: Track training attendance
- **Crash Courses**: Intensive programs
- **Refreshers**: Periodic training
- **Regimens**: Full programs
- **Refresher Guards**: Guards needing refresh
- **Guards Directory**: All guards',
                'category' => 'training',
                'tags' => ['training', 'dashboard', 'programs', 'trainees'],
                'target_roles' => ['training', 'hr', 'admin', 'super_admin'],
                'is_published' => true,
            ],

            // ============================================
            // MARKETING MODULE
            // ============================================
            [
                'title' => 'Marketing Module Overview',
                'slug' => 'marketing-module-overview',
                'content' => '# Marketing Module Overview

The Marketing module helps manage campaigns, leads, and marketing analytics.

## Dashboard Overview

The Marketing dashboard shows:
- **Lead Statistics**: New, contacted, converted leads
- **Campaign Performance**: Active campaigns
- **Conversion Rates**: Lead-to-client metrics
- **Recent Activity**: Latest marketing events

## Key Features

### Lead Management
Track potential customers:
1. Go to **Marketing > Leads**
2. View all leads in pipeline
3. Add new leads manually
4. Update lead status
5. Convert leads to clients

### Lead Statuses
- **New**: Fresh inquiry
- **Contacted**: Initial outreach done
- **Qualified**: Meets criteria
- **Proposal Sent**: Quote provided
- **Negotiating**: In discussion
- **Converted**: Became client
- **Lost**: Not converted

### Analytics
View marketing performance:
- Lead sources analysis
- Conversion funnels
- Campaign ROI
- Period comparisons

## Navigation

- **Overview**: Dashboard summary
- **Leads**: Lead management
- **Analytics**: Performance metrics
- **Settings**: Module configuration

## Best Practices

- Follow up leads promptly
- Update lead status regularly
- Track all interactions
- Analyze conversion patterns
- Optimize based on data',
                'category' => 'marketing',
                'tags' => ['marketing', 'leads', 'campaigns', 'analytics'],
                'target_roles' => ['marketing', 'admin', 'super_admin'],
                'is_published' => true,
            ],
            [
                'title' => 'Managing Leads',
                'slug' => 'managing-leads',
                'content' => '# Managing Leads

Comprehensive guide to lead management in the Marketing module.

## Adding a Lead

1. Go to **Marketing > Leads**
2. Click **Add Lead**
3. Enter information:
   - Company name
   - Contact person
   - Phone and email
   - Service interest
   - Lead source
   - Notes
4. Click **Save**

## Lead Pipeline

View all leads organized by status:
- Kanban board view
- Drag-and-drop status updates
- Filter by source, date, status
- Search by name or company

## Working with Leads

### Contacting Leads
- Log all communications
- Schedule follow-ups
- Set reminders
- Track response times

### Converting Leads
When a lead becomes a client:
1. Open lead details
2. Click **Convert to Client**
3. Fill client information
4. Create initial site(s)
5. Assign guards
6. Lead marked as converted

### Closing Lost Leads
1. Open lead details
2. Click **Mark as Lost**
3. Select reason:
   - Price too high
   - Chose competitor
   - No response
   - Not interested
   - Other
4. Add notes for future reference

## Lead Reports

- Lead source effectiveness
- Conversion rates by period
- Average time to convert
- Lost lead analysis',
                'category' => 'marketing',
                'tags' => ['marketing', 'leads', 'sales', 'conversion'],
                'target_roles' => ['marketing', 'admin', 'super_admin'],
                'is_published' => true,
            ],

            // ============================================
            // OPERATIONS MODULE
            // ============================================
            [
                'title' => 'Field Operations Guide',
                'slug' => 'field-operations-guide',
                'content' => '# Field Operations Guide

The Operations module is for managing daily field operations and deployments.

## Dashboard Overview

The Operations dashboard shows:
- **Site Coverage**: Current deployment status
- **Guard Roster**: Available guards
- **Active Shifts**: Current shift information
- **Incidents**: Recent incidents

## Key Features

### Site Coverage
Monitor which sites are covered:
- Green: Fully staffed
- Yellow: Partially staffed
- Red: Unstaffed (down)

### Deployments
Manage guard deployments:
1. Go to **Operations > Deployments**
2. View all sites
3. Assign guards to sites
4. Set shift schedules
5. Track coverage

### Guard Roster
View all available guards:
- Active guards
- Current assignments
- Availability status
- Zone assignments

### Shift Roster
Manage shift schedules:
- Create shifts
- Assign guards
- Handle relief
- Track overtime

### Incidents
Report and track incidents:
1. Go to **Operations > Incidents**
2. Click **Report Incident**
3. Fill incident details
4. Assign response
5. Track resolution

## Navigation

- **Dashboard**: Operations overview
- **Site Coverage**: Coverage status
- **Deployments**: Site assignments
- **Guard Roster**: Guard list
- **Shift Roster**: Shift schedules
- **Incidents**: Incident reports
- **Reports**: Operational reports
- **Requisitions**: Request resources

## Quick Actions

- **QR Scanner**: Scan for check-ins
- **Manual Check-In**: Override check-in
- **Report Incident**: Create incident
- **View Coverage**: Check site status',
                'category' => 'operations',
                'tags' => ['operations', 'field', 'deployments', 'coverage'],
                'target_roles' => ['operations_manager', 'admin', 'super_admin'],
                'is_published' => true,
            ],
            [
                'title' => 'Managing Shifts and Schedules',
                'slug' => 'managing-shifts-schedules',
                'content' => '# Managing Shifts and Schedules

Guide to shift management in the Operations module.

## Shift Types

- **Day Shift**: Morning to afternoon
- **Night Shift**: Evening to morning
- **24-Hour**: Round-the-clock coverage
- **Rotational**: Rotating schedules

## Creating Shifts

1. Go to **Operations > Shift Roster**
2. Click **Add Shift**
3. Define:
   - Shift name
   - Start time
   - End time
   - Days of week
   - Site assignment
4. Save the shift

## Assigning Guards to Shifts

1. Open the shift
2. Click **Assign Guard**
3. Select available guard
4. Set assignment dates
5. Confirm assignment

## Shift Management

### Viewing Shifts
- Calendar view
- List view
- By site
- By guard

### Handling Relief
When a guard needs relief:
1. Find the shift assignment
2. Click **Request Relief**
3. Select replacement guard
4. Set relief dates
5. Confirm

### Shift Swaps
Allow guards to swap shifts:
1. Both guards must agree
2. Supervisor approval required
3. Update shift assignments
4. Log the swap

## Reports

- Shift coverage reports
- Guard hours by shift
- Overtime analysis
- Relief frequency',
                'category' => 'operations',
                'tags' => ['shifts', 'scheduling', 'roster', 'operations'],
                'target_roles' => ['operations_manager', 'admin', 'super_admin', 'zone_commander'],
                'is_published' => true,
            ],

            // ============================================
            // FRONT OFFICE MODULE
            // ============================================
            [
                'title' => 'Front Office Guide',
                'slug' => 'front-office-guide',
                'content' => '# Front Office Guide

The Front Office module manages reception, visitors, and administrative tasks.

## Dashboard Overview

The Front Office dashboard shows:
- **Today\'s Visitors**: Expected and checked-in visitors
- **Tasks**: Pending tasks
- **Calendar**: Upcoming events
- **Messages**: Recent communications

## Key Features

### Calendar Management
Manage appointments and events:
1. Go to **Front Office > Calendar**
2. View daily/weekly/monthly schedule
3. Add new events
4. Set reminders
5. Share with team

### Visitor Management
Handle visitor check-ins:
1. Go to **Front Office > Visitors**
2. Pre-register visitors
3. Check in visitors on arrival
4. Print visitor badges
5. Check out visitors

### Task Management
Track office tasks:
1. Go to **Front Office > Tasks**
2. Create tasks
3. Assign to staff
4. Track completion
5. Set priorities

### Petty Cash (Executive Assistant)
Manage petty cash:
1. Go to **Petty Cash**
2. Record expenses
3. Request reimbursements
4. Track balance
5. Generate reports

### Messages
Internal communications:
- Send messages to staff
- Receive notifications
- Group messaging
- Message history

## Navigation

- **Dashboard**: Overview
- **Calendar**: Schedule management
- **Visitors**: Visitor check-in
- **Tasks**: Task tracking
- **Requisitions**: Office supplies
- **Petty Cash**: Cash management
- **Messages**: Communications
- **Reports**: Activity reports

## Roles

- **Executive Assistant**: Full access including petty cash
- **Receptionist**: Visitor management, calendar
- **Personal Assistant**: Calendar, tasks, messages',
                'category' => 'front-office',
                'tags' => ['front-office', 'reception', 'visitors', 'calendar'],
                'target_roles' => ['executive_assistant', 'receptionist', 'personal_assistant', 'admin', 'super_admin'],
                'is_published' => true,
            ],
            [
                'title' => 'Visitor Management',
                'slug' => 'visitor-management',
                'content' => '# Visitor Management

Guide to managing visitors in the Front Office module.

## Pre-Registering Visitors

1. Go to **Front Office > Visitors**
2. Click **Pre-Register**
3. Enter visitor details:
   - Full name
   - Company/organization
   - Purpose of visit
   - Person to visit
   - Expected time
   - Contact number
4. Save registration

## Checking In Visitors

When a visitor arrives:
1. Find the pre-registered visitor OR
2. Click **New Walk-in**
3. Enter/verify details
4. Take photo (optional)
5. Print visitor badge
6. Notify host employee

## Visitor Badge

The badge includes:
- Visitor name
- Company
- Visit purpose
- Host name
- Check-in time
- Expiry time
- QR code for check-out

## Checking Out Visitors

1. Find active visitor
2. Click **Check Out**
3. Confirm departure time
4. Badge is invalidated
5. Visit logged in history

## Visitor Reports

- Daily visitor log
- Visitor frequency by company
- Peak visiting hours
- Average visit duration
- Visitor statistics

## Security Features

- ID verification
- Photo capture
- Blacklist checking
- Escort requirements
- Restricted area alerts',
                'category' => 'front-office',
                'tags' => ['visitors', 'check-in', 'badge', 'security'],
                'target_roles' => ['executive_assistant', 'receptionist', 'personal_assistant', 'admin', 'super_admin'],
                'is_published' => true,
            ],

            // ============================================
            // FRONT DESK MODULE
            // ============================================
            [
                'title' => 'Front Desk Guide',
                'slug' => 'front-desk-guide',
                'content' => '# Front Desk Guide

The Front Desk module is for assistants managing front desk operations.

## Dashboard Overview

The dashboard shows:
- **Today\'s Overview**: Visitors and tickets
- **Open Tickets**: Pending support tickets
- **Recent Visitors**: Latest check-ins
- **Quick Actions**: Common tasks

## Key Features

### Visitor Management
Handle walk-in visitors:
1. Go to **Visitors**
2. Register new visitor
3. Check in visitors
4. Issue badges
5. Check out visitors

### Ticket Management
Handle support tickets:
1. Go to **Tickets**
2. View open tickets
3. Create new tickets
4. Assign to departments
5. Track resolution

### Ticket Workflow

#### Creating a Ticket
1. Click **New Ticket**
2. Enter details:
   - Requester information
   - Issue description
   - Priority level
   - Category
3. Assign to department
4. Submit ticket

#### Managing Tickets
- View all tickets by status
- Update ticket status
- Add notes/comments
- Escalate if needed
- Close when resolved

### Settings
Configure front desk:
- Ticket categories
- Priority levels
- Auto-assignment rules
- Notification preferences

## Navigation

- **Overview**: Dashboard
- **Visitors**: Visitor management
- **Tickets**: Support tickets
- **Requisitions**: Supply requests
- **Settings**: Configuration',
                'category' => 'front-desk',
                'tags' => ['front-desk', 'assistant', 'tickets', 'visitors'],
                'target_roles' => ['executive_assistant', 'admin', 'super_admin'],
                'is_published' => true,
            ],

            // ============================================
            // BUSINESS DEVELOPMENT MODULE
            // ============================================
            [
                'title' => 'Business Development Module',
                'slug' => 'business-development-module',
                'content' => '# Business Development Module

The Business Development module manages contracts, events, and K9 operations.

## Dashboard Overview

The dashboard shows:
- **Contracts**: Active and pending contracts
- **Events**: Upcoming business events
- **K9 Unit**: Dog and handler status
- **Operations**: Business dev activities

## Key Features

### Contract Management
Manage client contracts:
1. Go to **Contracts**
2. View all contracts
3. Create new contracts
4. Track renewals
5. Manage terms

### Creating a Contract
1. Click **New Contract**
2. Enter details:
   - Client information
   - Service type
   - Contract period
   - Value and terms
   - Sites covered
3. Add attachments
4. Submit for approval

### Events Management
Track business events:
- Corporate events
- Security deployments
- Client meetings
- Training sessions

### K9 Unit Management
Manage K9 operations:
- Dog registration
- Handler assignments
- Training records
- Deployment schedules

## Navigation

- **Overview**: Dashboard
- **Ops**: Operations activities
- **Events**: Event calendar
- **Contracts**: Contract management
- **K9 Dashboard**: K9 overview
- **K9 Dogs**: Dog registry
- **K9 Handlers**: Handler management
- **Settings**: Module configuration',
                'category' => 'business-dev',
                'tags' => ['business', 'contracts', 'events', 'k9'],
                'target_roles' => ['admin', 'super_admin'],
                'is_published' => true,
            ],
            [
                'title' => 'K9 Unit Management',
                'slug' => 'k9-unit-management',
                'content' => '# K9 Unit Management

Guide to managing the K9 security dog unit.

## K9 Dashboard

The dashboard shows:
- **Dogs**: Total active dogs
- **Handlers**: Assigned handlers
- **Deployments**: Current assignments
- **Training**: Upcoming sessions

## Dog Management

### Registering a Dog
1. Go to **K9 > Dogs**
2. Click **Add Dog**
3. Enter details:
   - Name and breed
   - Date of birth
   - Training level
   - Specializations
   - Health records
   - Handler assignment
4. Save record

### Dog Status
- **Active**: Ready for deployment
- **Training**: In training program
- **Medical**: Medical treatment
- **Retired**: No longer active

### Health Records
Track dog health:
- Vaccination records
- Medical checkups
- Treatments
- Medications
- Fitness certificates

## Handler Management

### Assigning Handlers
1. Go to **K9 > Handlers**
2. Select handler
3. Assign dog(s)
4. Set responsibilities
5. Track certifications

### Handler Requirements
- K9 handling certification
- Training completion
- Physical fitness
- Experience level

## Deployments

### Deploying K9 Teams
1. Select dog-handler team
2. Choose deployment type:
   - Patrol
   - Event security
   - Detection
   - Response
3. Assign location
4. Set schedule
5. Track activity

## Training Records

- Initial training
- Ongoing training
- Certification renewals
- Performance evaluations',
                'category' => 'business-dev',
                'tags' => ['k9', 'dogs', 'handlers', 'security'],
                'target_roles' => ['admin', 'super_admin'],
                'is_published' => true,
            ],

            // ============================================
            // TASK TRACKER MODULE
            // ============================================
            [
                'title' => 'Task Tracker Guide',
                'slug' => 'task-tracker-guide',
                'content' => '# Task Tracker Guide

The Task Tracker module helps manage and track tasks across the organization.

## Dashboard Overview

The dashboard shows:
- **Task Statistics**: Total, pending, in progress, completed
- **My Tasks**: Tasks assigned to you
- **Overdue**: Tasks past deadline
- **Recent Activity**: Latest updates

## Key Features

### Creating Tasks
1. Click **Add Task**
2. Enter details:
   - Task title
   - Description
   - Priority (Low/Medium/High/Urgent)
   - Due date
   - Assignee
   - Category
3. Add attachments if needed
4. Save task

### Task Statuses
- **Pending**: Not yet started
- **In Progress**: Currently being worked on
- **Completed**: Finished
- **On Hold**: Paused
- **Cancelled**: No longer needed

### Managing Tasks

#### Viewing Tasks
- List view
- Kanban board
- Calendar view
- Filter by status/assignee

#### Updating Tasks
1. Open task details
2. Update status
3. Add comments
4. Upload files
5. Change assignee
6. Modify due date

### Task Priorities
- **Low**: Can wait
- **Medium**: Normal priority
- **High**: Important
- **Urgent**: Critical/ASAP

## Navigation

- **Tasks**: All tasks
- **My Tasks**: Your assignments
- **Reports**: Task analytics

## Reports

- Completion rates
- Average completion time
- Overdue analysis
- Assignee workload
- Category breakdown',
                'category' => 'tasks',
                'tags' => ['tasks', 'tracker', 'productivity', 'management'],
                'target_roles' => ['executive_assistant', 'admin', 'super_admin'],
                'is_published' => true,
            ],

            // ============================================
            // MESSAGES MODULE
            // ============================================
            [
                'title' => 'Messages & Communication',
                'slug' => 'messages-communication',
                'content' => '# Messages & Communication

The Messages module provides internal communication tools.

## Overview

The Messages interface includes:
- **Conversations**: Direct and group chats
- **Forums**: Discussion boards
- **Broadcasts**: Announcements

## Conversations

### Starting a Conversation
1. Click **New Conversation**
2. Select recipient(s)
3. Type message
4. Send

### Conversation Types
- **Direct**: One-on-one chat
- **Group**: Multiple participants
- **Broadcast**: One-way announcements

### Managing Conversations
- Archive old conversations
- Mute notifications
- Mark as read/unread
- Search messages
- Delete conversations

## Forums

### Forum Types
- **Public**: Open to all users
- **Private**: Restricted access
- **Announcement**: Admin-only posts

### Using Forums
1. Select a forum
2. View existing threads
3. Create new thread
4. Reply to posts
5. Subscribe for updates

### Forum Categories
- General Discussion
- Announcements
- Help & Support
- Department-specific
- Training

## Features

### Real-Time Messaging
- Instant delivery
- Typing indicators
- Read receipts
- Online status

### Notifications
- Desktop notifications
- Sound alerts
- Badge counts
- Email summaries

### Search
- Search messages
- Search contacts
- Search forums
- Filter by date

## Best Practices

- Keep messages professional
- Use groups for team discussions
- Archive completed conversations
- Check forums regularly for announcements
- Set appropriate notification preferences',
                'category' => 'messages',
                'tags' => ['messages', 'chat', 'forums', 'communication'],
                'target_roles' => [], // All authenticated users
                'is_published' => true,
            ],

            // ============================================
            // ZONE COMMANDER MODULE
            // ============================================
            [
                'title' => 'Zone Commander Guide',
                'slug' => 'zone-commander-guide',
                'content' => '# Zone Commander Guide

Zone Commanders manage guards and operations within assigned geographic zones.

## Dashboard Overview

The dashboard shows:
- **Zone Statistics**: Guards, sites, coverage
- **Active Downs**: Unstaffed sites
- **Today\'s Attendance**: Check-in status
- **Recent Patrols**: Patrol activity

## Zone Management

### Clients
View clients with sites in your zone:
- Client list
- Site locations
- Contract status
- Contact information

### Sites
Manage sites in your zone:
1. Go to **Sites**
2. View all zone sites
3. Check coverage status
4. View assigned guards
5. Manage checkpoints

### Checkpoints
Configure site checkpoints:
1. Select a site
2. Go to **Checkpoints**
3. Add checkpoint locations
4. Generate QR codes
5. Set patrol requirements

### Guards
Manage zone guards:
- Guard roster
- Current assignments
- Attendance history
- Performance metrics

### Supervisors
View zone supervisors:
- Supervisor assignments
- Areas of responsibility
- Contact information

## Operations

### Patrols
Track guard patrols:
1. Go to **Patrols**
2. View patrol schedules
3. Track patrol completion
4. Review patrol logs
5. Handle missed patrols

### Attendance
Monitor zone attendance:
- Check-in status
- Exceptions
- Missed check-outs
- Manual overrides

### Downs (Unstaffed Sites)
Handle coverage gaps:
1. Go to **Downs**
2. View unstaffed sites
3. Assign relief guards
4. Contact backup
5. Log resolution

## Navigation

- **Dashboard**: Zone overview
- **Clients**: Zone clients
- **Sites**: Zone sites
- **Checkpoints**: Site checkpoints
- **Guards**: Zone guards
- **Supervisors**: Zone supervisors
- **Patrols**: Patrol tracking
- **Attendance**: Attendance monitoring
- **Downs**: Coverage gaps
- **Reports**: Zone reports
- **Requisitions**: Resource requests',
                'category' => 'zone-commander',
                'tags' => ['zone', 'commander', 'management', 'operations'],
                'target_roles' => ['zone_commander', 'admin', 'super_admin'],
                'is_published' => true,
            ],

            // ============================================
            // SUPERVISOR MODULE
            // ============================================
            [
                'title' => 'Supervisor Dashboard Guide',
                'slug' => 'supervisor-dashboard-guide',
                'content' => '# Supervisor Dashboard Guide

Supervisors oversee guard attendance and performance within their assigned area.

## Dashboard Overview

The dashboard shows:
- **Guard Count**: Guards under supervision
- **Attendance Today**: Present, on duty, absent
- **Active Assignments**: Current deployments
- **Exceptions**: Issues requiring attention

## Key Features

### Overview Page
Quick summary of:
- Attendance statistics
- Active guards
- Site coverage
- Recent activity

### Guards Management
View and manage guards:
1. Go to **Guards**
2. View guard list
3. Check attendance status
4. View assignments
5. Contact guards

### Analytics
View performance metrics:
- Attendance rates
- Punctuality
- Coverage levels
- Exception trends

### Attendance
Monitor daily attendance:
- Check-in times
- Check-out times
- Hours worked
- Exceptions

### Assignments
View guard assignments:
- Site assignments
- Shift schedules
- Assignment history
- Relief needs

## Quick Actions

- **Check Attendance**: Today\'s status
- **Contact Guard**: Quick communication
- **Report Issue**: Log problems
- **Request Relief**: Coverage needs

## Navigation

- **Overview**: Dashboard summary
- **Guards**: Guard management
- **Analytics**: Performance data
- **Attendance**: Attendance records
- **Assignments**: Assignment view
- **Requisitions**: Resource requests

## Reports

- Daily attendance report
- Weekly summary
- Exception report
- Guard performance',
                'category' => 'supervisor',
                'tags' => ['supervisor', 'dashboard', 'attendance', 'guards'],
                'target_roles' => ['supervisor', 'admin', 'super_admin'],
                'is_published' => true,
            ],

            // ============================================
            // BUDGETS MODULE
            // ============================================
            [
                'title' => 'Budget Management',
                'slug' => 'budget-management',
                'content' => '# Budget Management

Guide to managing budgets in ControlRoom.

## Overview

The Budgets module helps track and manage departmental budgets.

## Dashboard

The dashboard shows:
- **Budget Overview**: Allocated vs spent
- **Recent Transactions**: Latest entries
- **Alerts**: Budget warnings
- **Quick Stats**: Summary metrics

## Creating Budgets

1. Go to **Budgets**
2. Click **Create Budget**
3. Enter details:
   - Budget name
   - Department/module
   - Fiscal period
   - Total allocation
   - Categories
4. Save budget

## Budget Categories

Organize spending by category:
- Personnel
- Equipment
- Operations
- Training
- Administration
- Miscellaneous

## Tracking Spending

### Recording Expenses
1. Select budget
2. Click **Add Expense**
3. Enter details:
   - Amount
   - Category
   - Date
   - Description
   - Reference
4. Submit

### Viewing Balances
- Remaining budget
- Spent amount
- Pending commitments
- Projected spending

## Reports

- Budget vs Actual
- Spending by category
- Monthly breakdown
- Variance analysis
- Forecast reports

## Quick Budget Button

Access from any page:
- Quick expense entry
- Budget status check
- Recent transactions
- Approval requests',
                'category' => 'finance',
                'tags' => ['budget', 'finance', 'spending', 'tracking'],
                'target_roles' => ['admin', 'finance', 'super_admin'],
                'is_published' => true,
            ],

            // ============================================
            // REQUISITIONS MODULE
            // ============================================
            [
                'title' => 'Requisitions Guide',
                'slug' => 'requisitions-guide',
                'content' => '# Requisitions Guide

Guide to creating and managing requisitions (purchase requests).

## Overview

Requisitions are formal requests for goods, services, or resources.

## Creating a Requisition

1. Click **New Requisition** (or use Quick Requisition button)
2. Fill in details:
   - Title/Description
   - Category
   - Quantity needed
   - Estimated cost
   - Required by date
   - Justification
3. Add line items if multiple items
4. Attach supporting documents
5. Submit for approval

## Requisition Categories

- Office Supplies
- Equipment
- Uniforms
- Training Materials
- Vehicle Parts
- Safety Gear
- Miscellaneous

## Approval Workflow

### Submission
After submission:
- Status: Pending
- Routed to approver
- Notification sent

### Approval Levels
Based on amount:
- Small: Direct supervisor
- Medium: Department head
- Large: Management chain
- Very Large: Executive approval

### Approval Actions
Approvers can:
- **Approve**: Allow purchase
- **Reject**: Deny with reason
- **Request Info**: Ask for clarification
- **Forward**: Send to next level

## Tracking Requisitions

### Status
- **Draft**: Not yet submitted
- **Pending**: Awaiting approval
- **Approved**: Ready to purchase
- **Rejected**: Denied
- **Fulfilled**: Items received
- **Cancelled**: Withdrawn

### My Requisitions
View your requests:
- All submitted
- Filter by status
- Track progress
- Edit drafts

## Quick Requisition Button

Available from any page:
- Quick request submission
- Common items
- Fast approval for small items

## Reports

- Requisition volume
- Approval times
- Spending by category
- Department requests',
                'category' => 'finance',
                'tags' => ['requisitions', 'requests', 'purchasing', 'approval'],
                'target_roles' => [], // All authenticated users
                'is_published' => true,
            ],

            // ============================================
            // EXECUTIVE ASSISTANT MODULE
            // ============================================
            [
                'title' => 'Executive Assistant Guide',
                'slug' => 'executive-assistant-guide',
                'content' => '# Executive Assistant Guide

Guide for Executive Assistants using ControlRoom.

## Dashboard Overview

The dashboard shows:
- **Executive Calendar**: Upcoming events
- **Tasks**: Pending assignments
- **Messages**: Communications
- **Petty Cash**: Cash management

## Key Features

### Calendar Management
Manage executive schedules:
1. Go to **Calendar**
2. View appointments
3. Add new events
4. Set reminders
5. Coordinate meetings

### Task Management
Handle assigned tasks:
1. Go to **Tasks**
2. View task list
3. Create new tasks
4. Track completion
5. Report status

### Petty Cash Management
Handle cash expenses:
1. Go to **Petty Cash**
2. Record expenses
3. Request replenishment
4. Track balance
5. Generate reports

#### Recording Petty Cash
1. Click **New Entry**
2. Enter details:
   - Amount
   - Category
   - Description
   - Receipt (upload)
   - Date
3. Submit for recording

#### Cash Categories
- Office supplies
- Refreshments
- Transport
- Miscellaneous
- Emergency

### Visitor Management
Handle executive visitors:
- Pre-register visitors
- Manage check-ins
- Coordinate meetings
- Arrange refreshments

### Messages & Communications
- Receive messages
- Forward to executive
- Respond on behalf
- Schedule calls

## Navigation

- **Dashboard**: Overview
- **Calendar**: Schedule
- **Tasks**: Task list
- **Visitors**: Visitor management
- **Petty Cash**: Cash tracking
- **Messages**: Communications
- **Requisitions**: Requests
- **Reports**: Activity reports

## Weekly Tasks Panel

Toggle the weekly tasks panel:
- View assigned weekly tasks
- Track progress
- Update status
- Mark complete',
                'category' => 'front-office',
                'tags' => ['executive', 'assistant', 'calendar', 'petty-cash'],
                'target_roles' => ['executive_assistant', 'admin', 'super_admin'],
                'is_published' => true,
            ],

            // ============================================
            // INCIDENT MANAGEMENT
            // ============================================
            [
                'title' => 'Incident Reporting & Management',
                'slug' => 'incident-reporting-management',
                'content' => '# Incident Reporting & Management

Guide to reporting and managing security incidents.

## What is an Incident?

An incident is any event that:
- Compromises security
- Causes injury or damage
- Requires response
- Needs documentation

## Incident Types

- **Security Breach**: Unauthorized access
- **Theft**: Stolen property
- **Assault**: Physical confrontation
- **Fire**: Fire-related events
- **Medical**: Medical emergencies
- **Vehicle**: Vehicle incidents
- **Equipment**: Equipment damage
- **Other**: Miscellaneous events

## Reporting an Incident

1. Go to **Control Room > Incidents** or **Operations > Incidents**
2. Click **Report Incident**
3. Fill in details:
   - Incident type
   - Date and time
   - Location/Site
   - Description
   - People involved
   - Witnesses
   - Actions taken
   - Severity level
4. Attach photos/documents
5. Submit report

## Incident Severity

- **Low**: Minor issue, no major impact
- **Medium**: Moderate impact, attention needed
- **High**: Serious, immediate response required
- **Critical**: Emergency, urgent action needed

## Response Process

### Immediate Response
1. Ensure safety
2. Secure the scene
3. Notify supervisor
4. Document details
5. Report in system

### Investigation
1. Assign investigator
2. Gather evidence
3. Interview witnesses
4. Review footage
5. Document findings

### Resolution
1. Determine cause
2. Take corrective action
3. Implement prevention
4. Close incident
5. File report

## Incident Dashboard

View incidents:
- Recent incidents
- Open investigations
- By severity
- By location
- By type

## Reports

- Incident frequency
- Response times
- Resolution rates
- Trend analysis
- Site comparisons',
                'category' => 'control-room',
                'tags' => ['incident', 'reporting', 'security', 'response'],
                'target_roles' => ['control_room', 'operations_manager', 'admin', 'super_admin'],
                'is_published' => true,
            ],

            // ============================================
            // GPS & LOCATION TRACKING
            // ============================================
            [
                'title' => 'GPS & Location Tracking',
                'slug' => 'gps-location-tracking',
                'content' => '# GPS & Location Tracking

Understanding GPS features in ControlRoom.

## How GPS Works

ControlRoom uses GPS to:
- Verify guard locations
- Track vehicle movements
- Validate check-ins
- Monitor patrol routes

## GPS Verification

### During Check-In
When a guard checks in:
1. Device sends GPS coordinates
2. System compares to site location
3. Distance calculated
4. Match or mismatch recorded

### GPS Tolerance
Configurable radius for verification:
- Default: 100 meters
- Adjustable per site
- Accounts for GPS accuracy

## Location Features

### Guard Tracking
View guard locations on map:
- Real-time positions
- Last known location
- Movement history
- Zone boundaries

### Vehicle Tracking
Track fleet vehicles:
- Current location
- Route history
- Speed monitoring
- Stops made

### Site Boundaries
Define site perimeters:
- GPS coordinates
- Boundary radius
- Entry/exit alerts
- Geofencing

## Handling GPS Issues

### GPS Not Available
Causes:
- Indoor locations
- Device settings
- Hardware issues
- Network problems

Solutions:
- Enable GPS on device
- Move to open area
- Use manual check-in
- Contact Control Room

### GPS Mismatch
When reported location doesn\'t match site:
1. Alert generated
2. Control Room notified
3. Operator contacts guard
4. Verify actual position
5. Override if legitimate

## Map Features

- Satellite view
- Street map
- Traffic overlay
- Site markers
- Guard markers
- Zone boundaries

## Privacy & Security

- Location data is encrypted
- Only authorized users can view
- Data retention policies apply
- Audit logs maintained',
                'category' => 'attendance',
                'tags' => ['gps', 'location', 'tracking', 'verification'],
                'target_roles' => [], // All authenticated users
                'is_published' => true,
            ],

            // ============================================
            // NOTIFICATIONS & ALERTS
            // ============================================
            [
                'title' => 'Notifications & Alerts',
                'slug' => 'notifications-alerts',
                'content' => '# Notifications & Alerts

Understanding the notification system in ControlRoom.

## Notification Types

### System Alerts
- Check-in exceptions
- GPS mismatches
- Missed check-outs
- Site downs

### Task Notifications
- New task assigned
- Task due soon
- Task overdue
- Task completed

### Message Notifications
- New message received
- Forum reply
- Broadcast sent
- Tagged in post

### Approval Notifications
- Requisition pending
- Requisition approved
- Requisition rejected
- Leave request

### Report Notifications
- Report generated
- Scheduled report ready
- Export complete

## Notification Bell

The bell icon shows:
- Unread count badge
- Recent notifications
- Notification types
- Quick actions

### Viewing Notifications
1. Click notification bell
2. View recent items
3. Click to open detail
4. Mark as read
5. Dismiss if needed

## Notification Settings

Configure preferences:
1. Go to **Settings > Notifications**
2. Choose delivery methods:
   - In-app
   - Email
   - SMS (if enabled)
   - Push notifications
3. Set which types to receive
4. Configure quiet hours
5. Save preferences

## Real-Time Notifications

Using WebSocket technology:
- Instant delivery
- No page refresh needed
- Live updates
- Connection status indicator

## Push Notifications

Mobile app push notifications:
- Enable in device settings
- Receive alerts offline
- Tap to open app
- Customize per type

## Email Notifications

Daily/weekly summaries:
- Digest of activity
- Pending items
- Important alerts
- Customizable schedule

## Managing Notifications

### Mark All Read
Clear all notifications at once

### Filter by Type
View specific categories

### Archive
Store old notifications

### Delete
Remove unwanted notifications',
                'category' => 'getting-started',
                'tags' => ['notifications', 'alerts', 'settings', 'communication'],
                'target_roles' => [], // All authenticated users
                'is_published' => true,
            ],

            // ============================================
            // PROFILE & ACCOUNT MANAGEMENT
            // ============================================
            [
                'title' => 'Managing Your Profile',
                'slug' => 'managing-your-profile',
                'content' => '# Managing Your Profile

Guide to updating your personal information in ControlRoom.

## Accessing Your Profile

1. Click your name/avatar in the sidebar
2. Select **Profile**
3. View your current information

## Profile Sections

### Personal Information
- Full name
- Email address
- Phone number
- Profile photo

### Account Settings
- Username
- Password
- Two-factor authentication
- Session management

### Preferences
- Theme (Light/Dark)
- Language
- Timezone
- Notification preferences

### Role Information
- Assigned roles
- Permissions
- Access level

## Updating Your Profile

### Changing Photo
1. Click on your photo
2. Select **Upload New**
3. Choose image file
4. Crop if needed
5. Save changes

### Updating Contact Info
1. Edit the fields
2. Click **Save**
3. Verify if required

### Changing Password
1. Go to **Security**
2. Click **Change Password**
3. Enter current password
4. Enter new password
5. Confirm new password
6. Save

### Two-Factor Authentication
Enhanced security:
1. Go to **Security**
2. Enable 2FA
3. Scan QR code with authenticator app
4. Enter verification code
5. Save backup codes

## Theme Settings

Switch between themes:
- **Light**: White background
- **Dark**: Dark background
- Toggle from header or settings

## Session Management

View active sessions:
- Current device
- Other devices
- Last activity
- Option to logout others

## Privacy

Control your visibility:
- Profile visible to
- Contact information sharing
- Activity visibility',
                'category' => 'getting-started',
                'tags' => ['profile', 'account', 'settings', 'security'],
                'target_roles' => [], // All authenticated users
                'is_published' => true,
            ],
        ];

        // Create or update articles (avoids duplicates on re-seeding)
        foreach ($articles as $article) {
            HelpArticle::updateOrCreate(
                ['slug' => $article['slug']],
                $article
            );
        }

        $this->command->info('Help articles seeded successfully. Total: ' . count($articles));
    }
}
