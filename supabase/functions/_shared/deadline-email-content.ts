const APP_URL = "https://youradmyt.com/profile";

export interface DeadlineEmailItem {
  collegeName: string;
  deadlineType: string;
  deadlineDate: string;
  leadDays: number;
  sourceUrl: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

export function deadlineReminderEmailContent(
  reminders: DeadlineEmailItem[],
  unsubscribeUrl: string,
) {
  if (reminders.length === 0) throw new Error("deadline_email_requires_item");
  const one = reminders.length === 1;
  const subject = one
    ? `${reminders[0].collegeName} has a deadline coming up`
    : `${reminders.length} school deadlines are coming up`;
  const intro = one
    ? `A date you’re tracking is ${reminders[0].leadDays} days away.`
    : "A few dates you’re tracking are getting close.";
  const rows = reminders.map((reminder) => `
    <tr><td style="padding:16px 0;border-bottom:1px solid #e8e5f0">
      <div style="font-size:16px;font-weight:700;color:#26233a">${escapeHtml(reminder.collegeName)}</div>
      <div style="margin-top:5px;font-size:14px;line-height:1.5;color:#5c5870">${escapeHtml(reminder.deadlineType)} · ${escapeHtml(formatDate(reminder.deadlineDate))} · ${reminder.leadDays} days away</div>
      <a href="${escapeHtml(reminder.sourceUrl)}" style="display:inline-block;margin-top:8px;color:#5754d8;font-size:13px;font-weight:700">Confirm on the school’s site</a>
    </td></tr>`).join("");
  const html = `<!doctype html><html><body style="margin:0;background:#f6f4fb;font-family:Arial,sans-serif;color:#26233a"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(intro)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f4fb"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:18px;padding:32px"><tr><td><div style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#5754d8">admyt</div><h1 style="margin:14px 0 8px;font-size:26px;line-height:1.2;color:#26233a">A calm deadline heads-up.</h1><p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#5c5870">${escapeHtml(intro)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table><p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#777287">Deadline information can change. Always confirm on the school’s official admissions page before relying on it.</p><a href="${APP_URL}" style="display:inline-block;margin-top:22px;padding:12px 18px;border-radius:999px;background:#5754d8;color:#fff;text-decoration:none;font-size:14px;font-weight:700">Open My Schools</a><p style="margin:28px 0 0;font-size:11px;line-height:1.5;color:#8a8698">You opted in to deadline emails in Admyt. <a href="${APP_URL}" style="color:#68647a">Manage reminders</a> · <a href="${escapeHtml(unsubscribeUrl)}" style="color:#68647a">Unsubscribe</a></p></td></tr></table></td></tr></table></body></html>`;
  const text = [
    "A calm deadline heads-up.",
    intro,
    "",
    ...reminders.flatMap((reminder) => [
      `${reminder.collegeName} — ${reminder.deadlineType}`,
      `${formatDate(reminder.deadlineDate)} (${reminder.leadDays} days away)`,
      `Confirm: ${reminder.sourceUrl}`,
      "",
    ]),
    "Deadline information can change. Always confirm on the school’s official admissions page before relying on it.",
    `Manage reminders: ${APP_URL}`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");
  return { subject, html, text };
}
