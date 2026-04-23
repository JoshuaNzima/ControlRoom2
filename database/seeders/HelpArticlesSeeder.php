<?php

namespace Database\Seeders;

use App\Models\HelpArticle;
use Illuminate\Database\Seeder;

class HelpArticlesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $articles = [
            // === VISITOR/GUEST ARTICLES (target_roles = null) ===
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
                'target_roles' => null, // Visitors only
                'is_published' => true,
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
            ],
        ];

        foreach ($articles as $article) {
            HelpArticle::create($article);
        }

        $this->command->info('Help articles seeded successfully.');
    }
}
