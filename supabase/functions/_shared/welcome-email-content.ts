const APP_URL = "https://youradmyt.com";

export function welcomeEmailContent() {
  const subject = "You’re in. Let’s find where you fit.";
  const preheader = "Three easy ways to get started with admyt.";
  const html = `<!doctype html><html><body style="margin:0;background:#f6f4fb;font-family:Arial,sans-serif;color:#26233a"><div style="display:none;max-height:0;overflow:hidden">${preheader}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f4fb"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:18px;padding:32px"><tr><td><div style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#5754d8">adm<span style="color:#818cf8">y</span>t</div><h1 style="margin:14px 0 8px;font-size:28px;line-height:1.2;color:#26233a">You’re in. Let’s find where you fit.</h1><p style="margin:0;font-size:15px;line-height:1.65;color:#5c5870">I’m Sage. I’m here to help you find schools that feel right for you—not just schools that look good on a list.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px"><tr><td style="padding:14px 0;border-bottom:1px solid #e8e5f0"><strong style="color:#26233a">1. Tell me what matters</strong><div style="margin-top:5px;font-size:14px;line-height:1.5;color:#5c5870">Start a conversation. Goals, places, budget, campus feel—messy thoughts are welcome.</div></td></tr><tr><td style="padding:14px 0;border-bottom:1px solid #e8e5f0"><strong style="color:#26233a">2. Save your first school</strong><div style="margin-top:5px;font-size:14px;line-height:1.5;color:#5c5870">Heart any school you’re curious about. It’ll stay in My Schools so we can compare it later.</div></td></tr><tr><td style="padding:14px 0"><strong style="color:#26233a">3. Run a Vibe Check</strong><div style="margin-top:5px;font-size:14px;line-height:1.5;color:#5c5870">See how a campus matches the culture and everyday experience you actually want.</div></td></tr></table><a href="${APP_URL}/chat" style="display:inline-block;margin-top:22px;padding:12px 18px;border-radius:999px;background:#5754d8;color:#fff;text-decoration:none;font-size:14px;font-weight:700">Talk with Sage</a><p style="margin:26px 0 0;font-size:13px;line-height:1.6;color:#777287">No pressure to have it all figured out. That’s what I’m here for.</p><p style="margin:16px 0 0;font-size:13px;color:#5c5870">— Sage</p><p style="margin:28px 0 0;font-size:11px;line-height:1.5;color:#8a8698">This one-time welcome was sent because you created an admyt account. You can manage optional emails in <a href="${APP_URL}/profile" style="color:#68647a">your Profile</a>.</p></td></tr></table></td></tr></table></body></html>`;
  const text = [
    "You’re in. Let’s find where you fit.",
    "",
    "I’m Sage. I’m here to help you find schools that feel right for you—not just schools that look good on a list.",
    "",
    "1. Tell me what matters",
    "Start a conversation. Goals, places, budget, campus feel—messy thoughts are welcome.",
    "",
    "2. Save your first school",
    "Heart any school you’re curious about. It’ll stay in My Schools so we can compare it later.",
    "",
    "3. Run a Vibe Check",
    "See how a campus matches the culture and everyday experience you actually want.",
    "",
    `Talk with Sage: ${APP_URL}/chat`,
    "",
    "No pressure to have it all figured out. That’s what I’m here for.",
    "— Sage",
    "",
    `Manage optional emails: ${APP_URL}/profile`,
  ].join("\n");

  return { subject, html, text };
}
