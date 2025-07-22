# Email Verification Setup Guide

This guide explains how to configure email verification for the DoorBudy application.

## Overview

The email verification system sends a 6-digit verification code to users when they register. Users must enter this code to activate their account before they can access the application.

## Email Configuration

### Environment Variables

Add these environment variables to your `.env` file or docker-compose configuration:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Branding
FROM_EMAIL=noreply@doorbudy.cloud
FROM_NAME=DoorBudy

# Verification Settings
VERIFICATION_CODE_EXPIRY=15
MAX_VERIFICATION_ATTEMPTS=3
MAX_RESEND_ATTEMPTS=3
```

### Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication**
   - Go to your Google Account settings
   - Enable 2-factor authentication if not already enabled

2. **Generate App Password**
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Copy the generated 16-character password

3. **Configure Environment Variables**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

### Other SMTP Providers

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-access-key
SMTP_PASS=your-ses-secret-key
```

## Development vs Production

### Development
- Use Gmail with app password for easy setup
- Set `NODE_ENV=development` to include verification codes in API responses for testing
- Use Mailtrap or similar services for email testing

### Production
- Use dedicated email services (SendGrid, Mailgun, AWS SES)
- Set `NODE_ENV=production` to hide verification codes from API responses
- Monitor email deliverability and set up proper SPF/DKIM records

## Security Features

### Rate Limiting
- Maximum 3 verification emails per hour per user
- Maximum 3 verification attempts per code
- Automatic cleanup of expired codes

### Code Security
- 6-digit cryptographically secure codes
- 15-minute expiration time
- Codes are single-use only

### Database Security
- Verification codes are stored with expiration timestamps
- Automatic cleanup of expired codes
- User email verification status tracking

## Testing

### Development Testing
1. Register a new user
2. Check server logs for verification code (in development mode)
3. Use the code to verify the email
4. Confirm user can log in

### Email Testing Services
- **Mailtrap**: https://mailtrap.io/ (free tier available)
- **MailHog**: Local email testing server
- **Ethereal Email**: https://ethereal.email/ (temporary email testing)

## Troubleshooting

### Common Issues

1. **"Authentication failed" error**
   - Check SMTP credentials
   - Ensure app password is used for Gmail (not regular password)
   - Verify 2FA is enabled for Gmail

2. **Emails not being sent**
   - Check server logs for email service errors
   - Verify SMTP host and port settings
   - Test email configuration with `emailService.testConnection()`

3. **Emails going to spam**
   - Set up proper SPF/DKIM records for your domain
   - Use a reputable email service provider
   - Include proper unsubscribe links

4. **Verification codes not working**
   - Check code expiration (15 minutes default)
   - Verify maximum attempts not exceeded
   - Check for typos in code entry

### Debug Commands

Test email configuration:
```bash
# In backend container
node -e "
import emailService from './src/services/email.service.js';
emailService.testConnection().then(console.log);
"
```

Check verification status:
```bash
# API call to check user verification status
curl -X GET http://localhost:3000/api/auth/verification-status/USER_ID
```

## Monitoring

### Metrics to Track
- Email delivery success rate
- Verification completion rate
- Time between registration and verification
- Failed verification attempts

### Logs to Monitor
- Email sending failures
- SMTP connection errors
- Verification code generation
- Rate limiting triggers

## Production Recommendations

1. **Use Professional Email Service**
   - SendGrid, Mailgun, or AWS SES
   - Better deliverability than Gmail
   - Detailed analytics and monitoring

2. **Set Up Domain Authentication**
   - Configure SPF records
   - Set up DKIM signing
   - Add DMARC policy

3. **Monitor Email Health**
   - Track bounce rates
   - Monitor spam complaints
   - Set up alerts for delivery failures

4. **Backup Email Strategy**
   - Configure multiple SMTP providers
   - Implement fallback mechanisms
   - Store failed emails for retry

## Support

If you encounter issues with email verification:

1. Check the server logs for detailed error messages
2. Verify your SMTP configuration
3. Test with a different email provider
4. Contact support with specific error messages and configuration details
