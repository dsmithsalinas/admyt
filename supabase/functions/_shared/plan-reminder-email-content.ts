const PLAN_URL = "https://youradmyt.com/plan";
const PROFILE_URL = "https://youradmyt.com/profile";

export interface PlanReminderEmailItem {
  title: string;
  dueDate: string;
  leadDays: 0 | 7;
  ownerRole: "student" | "parent";
  collegeName?: string | null;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] ?? character);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

export function planReminderEmailContent(
  tasks: PlanReminderEmailItem[],
  unsubscribeUrl: string,
) {
  if (tasks.length === 0) throw new Error("plan_reminder_requires_task");
  const dueToday = tasks.filter((task) => task.leadDays === 0).length;
  const subject = tasks.length === 1
    ? `${tasks[0].title} ${tasks[0].leadDays === 0 ? "is due today" : "is due in 7 days"}`
    : `${tasks.length} Sage Plan tasks need a look`;
  const intro = dueToday > 0
    ? `${dueToday === 1 ? "One task is" : `${dueToday} tasks are`} due today. Here’s the short list.`
    : "These tasks are a week away. A small move now can keep next week calmer.";
  const rows = tasks.map((task) => {
    const context = [
      task.ownerRole === "parent" ? "Parent owns" : "Student owns",
      task.collegeName,
      task.leadDays === 0 ? "Due today" : `Due ${formatDate(task.dueDate)}`,
    ].filter(Boolean).join(" · ");
    return `<tr><td style="padding:16px 0;border-bottom:1px solid #e8e5f0"><div style="font-size:16px;font-weight:700;color:#26233a">${escapeHtml(task.title)}</div><div style="margin-top:5px;font-size:14px;line-height:1.5;color:#5c5870">${escapeHtml(context)}</div></td></tr>`;
  }).join("");
  const html = `<!doctype html><html><body style="margin:0;background:#f6f4fb;font-family:Arial,sans-serif;color:#26233a"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(intro)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f4fb"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:18px;padding:32px"><tr><td><div style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#5754d8">admyt · Sage Plan</div><h1 style="margin:14px 0 8px;font-size:26px;line-height:1.2;color:#26233a">Your next steps, minus the noise.</h1><p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#5c5870">${escapeHtml(intro)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table><p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#777287">Parent-owned tasks are shown here for coordination. This reminder is sent only to the student’s Admyt account.</p><a href="${PLAN_URL}" style="display:inline-block;margin-top:22px;padding:12px 18px;border-radius:999px;background:#5754d8;color:#fff;text-decoration:none;font-size:14px;font-weight:700">Open Sage Plan</a><p style="margin:28px 0 0;font-size:11px;line-height:1.5;color:#8a8698">You opted in to Sage Plan reminders. <a href="${PROFILE_URL}" style="color:#68647a">Manage reminders</a> · <a href="${escapeHtml(unsubscribeUrl)}" style="color:#68647a">Unsubscribe</a></p></td></tr></table></td></tr></table></body></html>`;
  const text = [
    "Your next steps, minus the noise.", intro, "",
    ...tasks.flatMap((task) => [
      task.title,
      [task.ownerRole === "parent" ? "Parent owns" : "Student owns", task.collegeName, task.leadDays === 0 ? "Due today" : `Due ${formatDate(task.dueDate)}`].filter(Boolean).join(" · "),
      "",
    ]),
    "Parent-owned tasks are shown for coordination. This reminder is sent only to the student’s Admyt account.",
    `Open Sage Plan: ${PLAN_URL}`,
    `Manage reminders: ${PROFILE_URL}`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");
  return { subject, html, text };
}
