const nodemailer = require('nodemailer');
const config = require('../config');
const prisma = require('../config/db');
const { parseId } = require('../utils/idHelper');

// Create reusable Nodemailer transporter using Brevo Free SMTP
const createTransporter = () => {
  const { host, port, user, pass } = config.smtp;
  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: host || 'smtp-relay.brevo.com',
    port: port || 587,
    secure: port === 465, // true for 465, false for 587
    auth: {
      user,
      pass,
    },
    // Brevo TLS configuration
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Format a date nicely
 */
const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Send an email and record its status in the EmailLog table
 */
const sendEmail = async ({ to, role, subject, html, text, bookingId }) => {
  const logEntry = {
    recipient: to,
    recipientRole: role || null,
    subject,
    bookingId: bookingId ? parseId(bookingId) : null,
    status: 'PENDING',
    error: null,
  };

  const transporter = createTransporter();

  // If SMTP is not yet configured, log warning and store record
  if (!transporter) {
    const errorMsg = 'Brevo SMTP credentials not configured in server/.env (SMTP_USER and SMTP_PASS are empty). Email logged in development mode.';
    console.warn(`[EMAIL SERVICE] ${errorMsg}`);
    console.log(`[EMAIL PREVIEW] To: ${to} | Subject: ${subject}`);
    console.log(`[EMAIL TEXT]:\n${text}\n---------------------------`);

    try {
      await prisma.emailLog.create({
        data: {
          recipient: to,
          recipientRole: role,
          subject,
          bookingId: bookingId ? parseId(bookingId) : null,
          status: 'FAILED',
          error: errorMsg,
        },
      });
    } catch (e) {
      console.error('[EMAIL LOG ERROR]', e.message);
    }

    return { success: false, reason: errorMsg };
  }

  try {
    const fromAddress = `"${config.smtp.fromName}" <${config.smtp.from}>`;
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
    });

    console.log(`[EMAIL SENT] MessageId: ${info.messageId} to ${to}`);

    try {
      await prisma.emailLog.create({
        data: {
          recipient: to,
          recipientRole: role,
          subject,
          bookingId: bookingId ? parseId(bookingId) : null,
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (e) {
      console.error('[EMAIL LOG ERROR]', e.message);
    }

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL SEND FAILED] To: ${to} | Error: ${err.message}`);

    try {
      await prisma.emailLog.create({
        data: {
          recipient: to,
          recipientRole: role,
          subject,
          bookingId: bookingId ? parseId(bookingId) : null,
          status: 'FAILED',
          error: err.message,
        },
      });
    } catch (e) {
      console.error('[EMAIL LOG ERROR]', e.message);
    }

    return { success: false, error: err.message };
  }
};

/**
 * Send bilingual (English + Tamil) notification to faculty/staff
 */
const sendFacultyAllocationEmail = async ({ booking, vehicle, driver, isUpdate = false }) => {
  const bookingId = booking.id;
  let staffEmail = booking.user?.email;
  if (!staffEmail && booking.userId) {
    const user = await prisma.user.findUnique({ where: { id: booking.userId } });
    if (user?.email) staffEmail = user.email;
  }

  // Fallback to faculty email format if user email is missing
  if (!staffEmail && booking.facultyName) {
    const cleanName = booking.facultyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    staffEmail = `${cleanName}@bit.edu`;
  }

  if (!staffEmail) {
    console.warn(`[EMAIL SERVICE] No email found for faculty/staff for booking #${bookingId}`);
    return;
  }

  const routeUrl = `${config.clientUrl}/trips/${bookingId}/route`;
  const bookingUrl = `${config.clientUrl}/faculty/booking/${bookingId}`;
  const actionText = isUpdate ? 'Assignment Updated' : 'Vehicle & Driver Allocated';
  const actionTextTamil = isUpdate ? 'வாகன ஒதுக்கீடு மாற்றம் செய்யப்பட்டுள்ளது' : 'வாகனம் மற்றும் ஓட்டுநர் ஒதுக்கீடு செய்யப்பட்டுள்ளது';

  const subject = isUpdate
    ? `[BIT Fleet] Update: Vehicle Allocation for Booking #${bookingId}`
    : `[BIT Fleet] Vehicle Allocated for Booking #${bookingId} - ${booking.destination}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }
        .card { max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #0f172a; padding: 24px; color: #ffffff; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; }
        .header p { margin: 6px 0 0; font-size: 13px; color: #94a3b8; }
        .badge { display: inline-block; background: #2563eb; color: #ffffff; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px; margin-top: 10px; }
        .content { padding: 24px; }
        .section-title { font-size: 15px; font-weight: 700; color: #1e293b; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 14px; }
        .info-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
        .info-table td.label { width: 40%; color: #64748b; font-weight: 500; }
        .info-table td.val { width: 60%; color: #0f172a; font-weight: 600; }
        .tamil-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 14px 16px; border-radius: 0 8px 8px 0; margin: 20px 0; }
        .tamil-box h3 { margin: 0 0 6px 0; font-size: 14px; color: #1e40af; }
        .tamil-box p { margin: 4px 0; font-size: 13px; color: #1e3a8a; line-height: 1.5; }
        .btn-container { text-align: center; margin: 28px 0 10px; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2); }
        .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>Bannari Amman Institute of Technology</h1>
          <p>Centralized Vehicle Fleet Booking Portal</p>
          <span class="badge">${actionText}</span>
        </div>

        <div class="content">
          <p style="font-size: 15px; margin-top: 0;">Dear <strong>${booking.facultyName}</strong>,</p>
          <p style="font-size: 14px; color: #475569;">
            ${isUpdate
              ? `The vehicle and driver assignment for your booking <strong>#${bookingId}</strong> has been updated by the Transport Office.`
              : `Your vehicle booking request <strong>#${bookingId}</strong> has been allocated with a vehicle and driver.`}
          </p>

          <!-- English Details -->
          <div class="section-title">Trip & Vehicle Details (English)</div>
          <table class="info-table">
            <tr><td class="label">Booking ID</td><td class="val">#${bookingId}</td></tr>
            <tr><td class="label">Staff Name</td><td class="val">${booking.facultyName} (${booking.department})</td></tr>
            <tr><td class="label">Staff Contact Number</td><td class="val"><a href="tel:${booking.contactNumber}" style="color: #2563eb; text-decoration: none;">${booking.contactNumber}</a></td></tr>
            <tr><td class="label">Pickup Point</td><td class="val">${booking.startingLocation}</td></tr>
            <tr><td class="label">Destination</td><td class="val">${booking.destination}</td></tr>
            <tr><td class="label">Travel Date</td><td class="val">${formatDate(booking.travelDate)}</td></tr>
            <tr><td class="label">Pickup Time</td><td class="val">${booking.departureTime}</td></tr>
            <tr><td class="label">Return Date & Time</td><td class="val">${formatDate(booking.returnDate)} at ${booking.returnTime}</td></tr>
            <tr><td class="label">Assigned Vehicle Number</td><td class="val">${vehicle.registrationNumber} (${vehicle.vehicleType} - ${vehicle.model})</td></tr>
            <tr><td class="label">Driver Name</td><td class="val">${driver.name}</td></tr>
            <tr><td class="label">Driver Contact Number</td><td class="val"><a href="tel:${driver.phone}" style="color: #2563eb; text-decoration: none;">${driver.phone}</a></td></tr>
          </table>

          <!-- Tamil Details -->
          <div class="tamil-box">
            <h3>முன்பதிவு விவரங்கள் (Tamil) - ${actionTextTamil}</h3>
            <p><strong>முன்பதிவு எண்:</strong> #${bookingId}</p>
            <p><strong>பேராசிரியர் பெயர்:</strong> ${booking.facultyName}</p>
            <p><strong>பேராசிரியர் தொடர்பு எண்:</strong> ${booking.contactNumber}</p>
            <p><strong>புறப்படும் இடம்:</strong> ${booking.startingLocation}</p>
            <p><strong>சேருமிடம்:</strong> ${booking.destination}</p>
            <p><strong>பயணத் தேதி & நேரம்:</strong> ${formatDate(booking.travelDate)} - ${booking.departureTime}</p>
            <p><strong>ஒதுக்கப்பட்ட வாகனம்:</strong> ${vehicle.registrationNumber} (${vehicle.model})</p>
            <p><strong>ஓட்டுநர் பெயர்:</strong> ${driver.name}</p>
            <p><strong>ஓட்டுநர் தொலைபேசி எண்:</strong> ${driver.phone}</p>
            <p style="font-size: 12px; margin-top: 8px; color: #3b82f6;">குறிப்பு: பயணத்தின் திட்டமிடப்பட்ட வழியை (Planned Route) கீழே உள்ள இணைப்பில் காணலாம்.</p>
          </div>

          <div class="btn-container">
            <a href="${routeUrl}" class="btn" target="_blank">🗺️ View Planned Route & Details</a>
          </div>
          <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 10px;">
            Or visit: <a href="${bookingUrl}" style="color: #2563eb;">${bookingUrl}</a>
          </p>
        </div>

        <div class="footer">
          BIT Fleet Management System • Sathyamangalam - 638401 • Tamil Nadu<br/>
          This is an automated system notification. Free Open-Source Portal.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
BIT Fleet Portal - ${actionText}
=====================================================
Dear ${booking.facultyName},

${isUpdate ? 'Your vehicle assignment has been updated.' : 'A vehicle and driver have been allocated for your trip.'}

TRIP DETAILS (English):
- Booking ID: #${bookingId}
- Staff Name: ${booking.facultyName} (${booking.department})
- Staff Contact: ${booking.contactNumber}
- Pickup Point: ${booking.startingLocation}
- Destination: ${booking.destination}
- Date: ${formatDate(booking.travelDate)}
- Pickup Time: ${booking.departureTime}
- Vehicle Number: ${vehicle.registrationNumber} (${vehicle.model})
- Driver Name: ${driver.name}
- Driver Contact: ${driver.phone}

முன்பதிவு விவரங்கள் (Tamil):
- முன்பதிவு எண்: #${bookingId}
- பேராசிரியர்: ${booking.facultyName} (தொடர்பு: ${booking.contactNumber})
- புறப்படும் இடம்: ${booking.startingLocation}
- சேருமிடம்: ${booking.destination}
- பயணத் தேதி: ${formatDate(booking.travelDate)} (${booking.departureTime})
- வாகனம்: ${vehicle.registrationNumber}
- ஓட்டுநர்: ${driver.name} (தொலைபேசி: ${driver.phone})

View Planned Route:
${routeUrl}
`;

  return sendEmail({
    to: staffEmail,
    role: 'FACULTY',
    subject,
    html,
    text,
    bookingId,
  });
};

/**
 * Send Tamil-first simple instruction email to the assigned driver
 */
const sendDriverAllocationEmail = async ({ booking, vehicle, driver, isUpdate = false }) => {
  const bookingId = booking.id;

  // Find driver's email (from linked User account or fallback phone/pattern)
  let driverEmail = null;
  if (driver.userId) {
    const driverUser = await prisma.user.findUnique({ where: { id: driver.userId } });
    if (driverUser && driverUser.email) {
      driverEmail = driverUser.email;
    }
  }

  // Fallback to driver email format if not in User
  if (!driverEmail) {
    const cleanName = driver.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    driverEmail = `${cleanName}@bit.edu`;
  }

  const routeUrl = `${config.clientUrl}/trips/${bookingId}/route`;
  const subject = isUpdate
    ? `[BIT Fleet] ஓட்டுநர் பணி மாற்றம்: முன்பதிவு #${bookingId} (${booking.destination})`
    : `[BIT Fleet] புதிய பயணப் பணி: முன்பதிவு #${bookingId} (${booking.destination})`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #0f172a; padding: 22px; color: #ffffff; text-align: center; }
        .header h1 { margin: 0; font-size: 19px; color: #ffffff; }
        .badge { display: inline-block; background: #16a34a; color: #ffffff; font-size: 13px; font-weight: 600; padding: 5px 14px; border-radius: 9999px; margin-top: 10px; }
        .content { padding: 24px; }
        .tamil-hero { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
        .tamil-hero h2 { margin: 0 0 8px; font-size: 16px; color: #166534; }
        .tamil-hero p { margin: 4px 0; font-size: 14px; color: #14532d; line-height: 1.5; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .detail-label { color: #64748b; font-weight: 500; }
        .detail-value { color: #0f172a; font-weight: 700; text-align: right; }
        .instructions { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-top: 18px; font-size: 13px; color: #334155; }
        .instructions ol { margin: 6px 0 0; padding-left: 20px; }
        .btn-container { text-align: center; margin: 24px 0 10px; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px; }
        .footer { background: #f8fafc; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>பண்ணாரி அம்மன் தொழில்நுட்பக் கல்லூரி</h1>
          <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8;">BIT Centralized Fleet Vehicle Portal</p>
          <span class="badge">${isUpdate ? 'பணி மாற்றம் / Duty Updated' : 'புதிய பயணப் பணி / New Trip Duty'}</span>
        </div>

        <div class="content">
          <!-- Tamil-First Instruction Box -->
          <div class="tamil-hero">
            <h2>வணக்கம் ${driver.name},</h2>
            <p>${isUpdate ? 'உங்களுக்கு ஒதுக்கப்பட்ட பயண விவரங்கள் மாற்றம் செய்யப்பட்டுள்ளன.' : 'உங்களுக்கு புதிய வாகனப் பயணப் பணி ஒதுக்கப்பட்டுள்ளது.'}</p>
            <p>தயவுசெய்து புறப்படும் நேரத்திற்கு முன்னதாக வாகனத்தை தயார் செய்து கொள்ளவும்.</p>
          </div>

          <!-- Key Details in Tamil & English -->
          <div style="font-weight: 700; font-size: 15px; margin-bottom: 12px; color: #0f172a;">
            முக்கிய பயண விவரங்கள் (Trip Summary)
          </div>

          <div class="detail-row">
            <span class="detail-label">முன்பதிவு எண் (Booking ID):</span>
            <span class="detail-value">#${bookingId}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">பேராசிரியர் பெயர் (Staff Name):</span>
            <span class="detail-value">${booking.facultyName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">பேராசிரியர் தொடர்பு எண்:</span>
            <span class="detail-value"><a href="tel:${booking.contactNumber}" style="color: #2563eb; text-decoration: none;">${booking.contactNumber}</a></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">புறப்படும் இடம் (Pickup Point):</span>
            <span class="detail-value">${booking.startingLocation}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">சேருமிடம் (Destination):</span>
            <span class="detail-value">${booking.destination}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">பயணத் தேதி (Travel Date):</span>
            <span class="detail-value">${formatDate(booking.travelDate)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">புறப்படும் நேரம் (Pickup Time):</span>
            <span class="detail-value">${booking.departureTime}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">ஒதுக்கப்பட்ட வாகனம் (Vehicle Number):</span>
            <span class="detail-value">${vehicle.registrationNumber} (${vehicle.model})</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">ஓட்டுநர் பெயர் (Driver Name):</span>
            <span class="detail-value">${driver.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">ஓட்டுநர் தொடர்பு எண் (Driver Contact):</span>
            <span class="detail-value"><a href="tel:${driver.phone}" style="color: #2563eb; text-decoration: none;">${driver.phone}</a></span>
          </div>

          <!-- Simple Instructions for Driver -->
          <div class="instructions">
            <strong>முக்கிய வழிகாட்டுதல்கள்:</strong>
            <ol>
              <li>பயணம் தொடங்குவதற்கு 15 நிமிடங்களுக்கு முன்பாக புறப்படும் இடத்திற்கு வரவும்.</li>
              <li>வாகன எரிபொருள் மற்றும் டயர் காற்றை சரிபார்க்கவும்.</li>
              <li>ஏதேனும் தாமதம் அல்லது சந்தேகம் இருப்பின் போக்குவரத்துக் கட்டுப்பாட்டு அலுவலகத்தை அல்லது பேராசிரியரை தொடர்பு கொள்ளவும்.</li>
            </ol>
          </div>

          <div class="btn-container">
            <a href="${routeUrl}" class="btn" target="_blank">🗺️ வரைபட வழியைப் பார்க்க (View Planned Route)</a>
          </div>
        </div>

        <div class="footer">
          BIT Fleet Portal • Transport Department • Sathyamangalam<br/>
          தானியங்கி அறிவிப்பு முறைமை • Automated Notification
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
வணக்கம் ${driver.name},
${isUpdate ? 'உங்களுக்கு ஒதுக்கப்பட்ட பயண விவரங்கள் மாற்றம் செய்யப்பட்டுள்ளன.' : 'உங்களுக்கு புதிய வாகனப் பயணப் பணி ஒதுக்கப்பட்டுள்ளது.'}

முக்கிய விவரங்கள்:
- முன்பதிவு எண் (Booking ID): #${bookingId}
- பேராசிரியர் பெயர் (Staff Name): ${booking.facultyName}
- பேராசிரியர் தொடர்பு (Staff Contact): ${booking.contactNumber}
- புறப்படும் இடம் (Pickup Point): ${booking.startingLocation}
- சேருமிடம் (Destination): ${booking.destination}
- பயணத் தேதி (Travel Date): ${formatDate(booking.travelDate)}
- புறப்படும் நேரம் (Pickup Time): ${booking.departureTime}
- வாகன எண் (Vehicle Number): ${vehicle.registrationNumber} (${vehicle.model})
- ஓட்டுநர் பெயர் (Driver Name): ${driver.name}
- ஓட்டுநர் தொடர்பு (Driver Contact): ${driver.phone}

திட்டமிடப்பட்ட வரைபட வழி (Planned Route):
${routeUrl}
`;

  return sendEmail({
    to: driverEmail,
    role: 'DRIVER',
    subject,
    html,
    text,
    bookingId,
  });
};

module.exports = {
  sendEmail,
  sendFacultyAllocationEmail,
  sendDriverAllocationEmail,
};
