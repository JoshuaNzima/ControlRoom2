<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank you for contacting Coin Security</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
        }
        .highlight {
            background-color: #eff6ff;
            border-left: 4px solid #2563eb;
            padding: 15px;
            margin: 20px 0;
        }
        .contact-info {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .contact-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        .contact-item:last-child {
            margin-bottom: 0;
        }
        .icon {
            width: 20px;
            height: 20px;
            margin-right: 10px;
            color: #2563eb;
        }
        .footer {
            text-align: center;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            margin-top: 30px;
            color: #6b7280;
            font-size: 14px;
        }
        .btn {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
        }
        .btn:hover {
            background-color: #1d4ed8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🛡️ Coin Security</div>
            <h1 class="title">Thank You for Contacting Us!</h1>
        </div>

        <div class="content">
            <p>Dear {{ $submission->name }},</p>
            
            <p>Thank you for reaching out to Coin Security. We have received your inquiry and our team is reviewing your message.</p>

            <div class="highlight">
                <strong>Your Inquiry Details:</strong><br>
                <strong>Subject:</strong> {{ $submission->subject }}<br>
                <strong>Service Interest:</strong> {{ $submission->service_interest_label }}<br>
                @if($submission->budget)
                <strong>Budget Range:</strong> {{ $submission->budget_label }}<br>
                @endif
                @if($submission->timeline)
                <strong>Timeline:</strong> {{ $submission->timeline_label }}<br>
                @endif
            </div>

            <p>One of our security consultants will review your request and get back to you within 24 hours. We pride ourselves on providing prompt and professional service to all our clients.</p>

            <p>For immediate assistance or urgent matters, please don't hesitate to call our 24/7 emergency hotline.</p>

            <div style="text-align: center;">
                <a href="tel:+15551234567" class="btn">📞 Call Emergency Hotline</a>
            </div>
        </div>

        <div class="contact-info">
            <h3 style="margin-top: 0; color: #1f2937;">Contact Information</h3>
            <div class="contact-item">
                <span class="icon">📱</span>
                <span><strong>Emergency:</strong> +1 (555) 123-4567 (24/7)</span>
            </div>
            <div class="contact-item">
                <span class="icon">📧</span>
                <span><strong>Email:</strong> info@coinsecurity.com</span>
            </div>
            <div class="contact-item">
                <span class="icon">📍</span>
                <span><strong>Office:</strong> 123 Security Street, Business City, BC 12345</span>
            </div>
            <div class="contact-item">
                <span class="icon">🕐</span>
                <span><strong>Business Hours:</strong> Mon-Fri 8AM-6PM, Sat-Sun Emergency Only</span>
            </div>
        </div>

        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; {{ date('Y') }} Coin Security. All rights reserved.</p>
            <p>Professional Security Solutions Since 2020</p>
        </div>
    </div>
</body>
</html>
