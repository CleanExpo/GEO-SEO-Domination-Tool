/**
 * Support Contact API Endpoint
 * POST /api/support/contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { createEmailService } from '@/services/notifications';
import { generateSupportContactTemplate } from '@/services/notifications/templates/support-contact';
import { DatabaseClient } from '@/lib/db';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Validate email format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Sanitize input to prevent XSS
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
}

// Generate unique ticket number
function generateTicketNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `TICKET-${dateStr}-${randomNum}`;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ContactFormData = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate message length
    if (body.message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(body.name),
      email: sanitizeInput(body.email),
      subject: sanitizeInput(body.subject),
      message: sanitizeInput(body.message),
      submittedAt: new Date().toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
      }),
    };

    // Save ticket to database
    const db = new DatabaseClient();
    let ticketNumber = '';
    try {
      await db.initialize();

      // Check if support_tickets table exists
      const tableExists = await db.tableExists('support_tickets');

      if (tableExists) {
        ticketNumber = generateTicketNumber();

        // Insert ticket into database
        const query = `
          INSERT INTO support_tickets (ticket_number, name, email, subject, message, status, priority)
          VALUES (?, ?, ?, ?, ?, 'open', 'normal')
        `;

        await db.run(query, [
          ticketNumber,
          sanitizedData.name,
          sanitizedData.email,
          sanitizedData.subject,
          sanitizedData.message
        ]);

        console.log(`Support ticket created: ${ticketNumber}`);
      } else {
        console.warn('support_tickets table does not exist - ticket not saved to database');
      }
    } catch (dbError) {
      console.error('Database error saving support ticket:', dbError);
      // Continue to send emails even if database save fails
    } finally {
      await db.close();
    }

    // Create email service
    const emailService = createEmailService();

    // Get support team email from environment or use default
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || 'support@geoseodomination.com';

    // Send notification to support team
    const adminTemplate = generateSupportContactTemplate(sanitizedData, true);
    const adminEmailResult = await emailService.sendEmail({
      to: supportEmail,
      subject: adminTemplate.subject,
      html: adminTemplate.html,
      text: adminTemplate.text,
    });

    if (!adminEmailResult.success) {
      console.error('Failed to send admin notification:', adminEmailResult.error);
      // Continue anyway to send user confirmation
    }

    // Send confirmation email to user
    const userTemplate = generateSupportContactTemplate(sanitizedData, false);
    const userEmailResult = await emailService.sendEmail({
      to: sanitizedData.email,
      subject: userTemplate.subject,
      html: userTemplate.html,
      text: userTemplate.text,
    });

    if (!userEmailResult.success) {
      console.error('Failed to send user confirmation:', userEmailResult.error);
      // Still return success if admin email was sent
      if (adminEmailResult.success) {
        return NextResponse.json({
          success: true,
          message: 'Your message has been received. However, we were unable to send you a confirmation email.',
        });
      } else {
        return NextResponse.json(
          { error: 'Failed to send emails. Please try again later.' },
          { status: 500 }
        );
      }
    }

    // Both emails sent successfully
    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully. Check your email for confirmation.',
    });

  } catch (error) {
    console.error('Error processing support contact:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
