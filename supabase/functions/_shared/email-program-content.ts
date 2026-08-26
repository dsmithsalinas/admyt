const APP_URL = "https://youradmyt.com";

export interface GuidanceContext {
  savedSchoolCount: number;
  vibeCheckCount: number;
}

export interface DigestSchool {
  id: string;
  name: string;
  vibeScore?: number;
}

export interface DigestDeadline {
  collegeName: string;
  type: string;
  date: string;
  sourceUrl: string;
}

export interface DigestContext {
  schools: DigestSchool[];
  totalSchoolCount: number;
  deadlines: DigestDeadline[];
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

function shell(title: string, preheader: string, body: string, footer: string) {
  return `<!doctype html><html><body style="margin:0;background:#f6f4fb;font-family:Arial,sans-serif;color:#26233a"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f4fb"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:18px;padding:32px"><tr><td><div style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#5754d8">adm<span style="color:#818cf8">y</span>t</div><h1 style="margin:14px 0 8px;font-size:27px;line-height:1.2;color:#26233a">${escapeHtml(title)}</h1>${body}<p style="margin:28px 0 0;font-size:11px;line-height:1.5;color:#8a8698">${footer} <a href="${APP_URL}/profile" style="color:#68647a">Manage email preferences</a></p></td></tr></table></td></tr></table></body></html>`;
}

function cta(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:22px;padding:12px 18px;border-radius:999px;background:#5754d8;color:#fff;text-decoration:none;font-size:14px;font-weight:700">${escapeHtml(label)}</a>`;
}

export function guidanceEmailContent(stage: 1 | 2 | 3, context: GuidanceContext) {
  if (stage === 1) {
    const title = "One honest answer is enough to start.";
    const subject = "A simple place to start with Sage";
    const intro = "You don’t need a perfect college list—or even a major picked out. Tell me one thing you want college to feel like, and we’ll build from there.";
    const html = shell(title, intro, `<p style="margin:0;font-size:15px;line-height:1.65;color:#5c5870">${escapeHtml(intro)}</p><div style="margin-top:18px;padding:16px;border-radius:14px;background:#f6f4fb;font-size:14px;line-height:1.6;color:#454158"><strong style="color:#26233a">Try this:</strong> “I want a school where I can study what I love and still feel like I have a life.”</div>${cta(`${APP_URL}/chat`, "Talk with Sage")}<p style="margin:24px 0 0;font-size:13px;color:#5c5870">— Sage</p>`, "You opted in to getting-started guidance.");
    const text = [title, "", intro, "", "Try this: “I want a school where I can study what I love and still feel like I have a life.”", "", `Talk with Sage: ${APP_URL}/chat`, "", "— Sage", "", `Manage email preferences: ${APP_URL}/profile`].join("\n");
    return { subject, html, text };
  }

  if (stage === 2) {
    const hasSchools = context.savedSchoolCount > 0;
    const title = hasSchools ? "Your list is a starting point, not a commitment." : "Save the schools that make you curious.";
    const subject = hasSchools ? "A better way to use My Schools" : "Start your My Schools list";
    const intro = hasSchools
      ? `You’ve saved ${context.savedSchoolCount} ${context.savedSchoolCount === 1 ? "school" : "schools"}. Now the useful part: ask why each one belongs. Location? Program? Cost? The feeling you got reading about it?`
      : "You don’t have to love a school to save it. Heart anything that makes you pause—even if you can’t explain why yet.";
    const button = hasSchools ? "Open My Schools" : "Browse schools";
    const href = hasSchools ? `${APP_URL}/profile` : `${APP_URL}/search`;
    const html = shell(title, intro, `<p style="margin:0;font-size:15px;line-height:1.65;color:#5c5870">${escapeHtml(intro)}</p><p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#5c5870">A short, imperfect list tells Sage more than a giant list built from rankings.</p>${cta(href, button)}<p style="margin:24px 0 0;font-size:13px;color:#5c5870">— Sage</p>`, "You opted in to getting-started guidance.");
    const text = [title, "", intro, "", "A short, imperfect list tells Sage more than a giant list built from rankings.", "", `${button}: ${href}`, "", "— Sage", "", `Manage email preferences: ${APP_URL}/profile`].join("\n");
    return { subject, html, text };
  }

  const hasVibe = context.vibeCheckCount > 0;
  const title = hasVibe ? "Now you have something real to compare." : "The brochure never tells you this part.";
  const subject = hasVibe ? "Put your Vibe Check to work" : "See what campus life might actually feel like";
  const intro = hasVibe
    ? `You’ve run ${context.vibeCheckCount} ${context.vibeCheckCount === 1 ? "Vibe Check" : "Vibe Checks"}. Use the tradeoffs—not just the score—to decide what you want more of in your next school.`
    : "A school can look perfect on paper and still feel wrong in real life. Vibe Check looks at the culture, social scene, pace, and everyday experience behind the stats.";
  const href = context.savedSchoolCount > 0 ? `${APP_URL}/profile` : `${APP_URL}/search`;
  const button = context.savedSchoolCount > 0 ? "Choose a school" : "Find a school to check";
  const html = shell(title, intro, `<p style="margin:0;font-size:15px;line-height:1.65;color:#5c5870">${escapeHtml(intro)}</p>${cta(href, button)}<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#5c5870">No school is perfect. The goal is finding the tradeoffs that feel right for you.</p><p style="margin:14px 0 0;font-size:13px;color:#5c5870">— Sage</p>`, "This is the last email in your getting-started series.");
  const text = [title, "", intro, "", `${button}: ${href}`, "", "No school is perfect. The goal is finding the tradeoffs that feel right for you.", "", "— Sage", "", `Manage email preferences: ${APP_URL}/profile`].join("\n");
  return { subject, html, text };
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

export function weeklyDigestEmailContent(context: DigestContext) {
  const schoolWord = context.totalSchoolCount === 1 ? "school" : "schools";
  const subject = `Your week with My Schools: ${context.totalSchoolCount} ${schoolWord}`;
  const title = "Your My Schools snapshot.";
  const schoolRows = context.schools.map((school) => {
    const vibe = school.vibeScore == null ? "No Vibe Check yet" : `Vibe Check: ${school.vibeScore}/100`;
    return `<tr><td style="padding:14px 0;border-bottom:1px solid #e8e5f0"><a href="${APP_URL}/college/${encodeURIComponent(school.id)}" style="font-size:16px;font-weight:700;color:#26233a;text-decoration:none">${escapeHtml(school.name)}</a><div style="margin-top:5px;font-size:13px;color:#5c5870">${escapeHtml(vibe)}</div></td></tr>`;
  }).join("");
  const extra = context.totalSchoolCount > context.schools.length
    ? `<p style="margin:12px 0 0;font-size:13px;color:#777287">Plus ${context.totalSchoolCount - context.schools.length} more in My Schools.</p>`
    : "";
  const deadlineRows = context.deadlines.slice(0, 3).map((deadline) => `<li style="margin:8px 0"><strong>${escapeHtml(deadline.collegeName)}</strong> · ${escapeHtml(deadline.type)} · ${escapeHtml(formatDate(deadline.date))} <a href="${escapeHtml(deadline.sourceUrl)}" style="color:#5754d8">confirm</a></li>`).join("");
  const deadlines = deadlineRows
    ? `<div style="margin-top:22px;padding:16px;border-radius:14px;background:#f6f4fb"><strong style="color:#26233a">Dates coming up</strong><ul style="margin:10px 0 0;padding-left:20px;font-size:13px;line-height:1.5;color:#5c5870">${deadlineRows}</ul></div>`
    : `<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#777287">No recently verified deadlines are coming up in the next 60 days.</p>`;
  const nextStep = context.schools.some((school) => school.vibeScore == null)
    ? "Try one next step this week: run a Vibe Check on a school you’re genuinely curious about."
    : "Try one next step this week: ask Sage to compare the tradeoffs between two schools on your list.";
  const html = shell(title, `${context.totalSchoolCount} ${schoolWord}, one calm place to pick up.`, `<p style="margin:0;font-size:15px;line-height:1.65;color:#5c5870">Here’s the current shape of your list. No ranking. No pressure. Just what you’ve saved and one useful next step.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px">${schoolRows}</table>${extra}${deadlines}<p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:#454158"><strong style="color:#26233a">For this week:</strong> ${escapeHtml(nextStep)}</p>${cta(`${APP_URL}/profile`, "Open My Schools")}`, "You opted in to the weekly My Schools digest.");
  const textSchools = context.schools.map((school) => `- ${school.name} — ${school.vibeScore == null ? "No Vibe Check yet" : `Vibe Check: ${school.vibeScore}/100`}`);
  const textDeadlines = context.deadlines.length
    ? ["", "Dates coming up:", ...context.deadlines.slice(0, 3).map((deadline) => `- ${deadline.collegeName} — ${deadline.type} — ${formatDate(deadline.date)} — ${deadline.sourceUrl}`)]
    : ["", "No recently verified deadlines are coming up in the next 60 days."];
  const text = [title, "", ...textSchools, ...(context.totalSchoolCount > context.schools.length ? [`Plus ${context.totalSchoolCount - context.schools.length} more in My Schools.`] : []), ...textDeadlines, "", `For this week: ${nextStep}`, "", `Open My Schools: ${APP_URL}/profile`, "", `Manage email preferences: ${APP_URL}/profile`].join("\n");
  return { subject, html, text };
}
