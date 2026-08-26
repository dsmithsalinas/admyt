import { deadlineReminderEmailContent } from "./deadline-email-content.ts";
import { guidanceEmailContent, weeklyDigestEmailContent } from "./email-program-content.ts";
import { welcomeEmailContent } from "./welcome-email-content.ts";

export const EMAIL_TEMPLATE_IDS = [
  "welcome",
  "deadline_reminder",
  "guidance_1",
  "guidance_2",
  "guidance_3",
  "weekly_digest",
] as const;

export type EmailTemplateId = typeof EMAIL_TEMPLATE_IDS[number];

export interface EmailPreview {
  id: EmailTemplateId;
  name: string;
  description: string;
  from: string;
  subject: string;
  html: string;
  text: string;
}

const UNSUBSCRIBE_PREVIEW_URL = "https://youradmyt.com/profile";

export function isEmailTemplateId(value: unknown): value is EmailTemplateId {
  return typeof value === "string" && (EMAIL_TEMPLATE_IDS as readonly string[]).includes(value);
}

export function emailTemplateCatalog(): Array<Pick<EmailPreview, "id" | "name" | "description">> {
  return [
    { id: "welcome", name: "Welcome", description: "The one-time note sent after a new account signs in." },
    { id: "deadline_reminder", name: "Deadline reminder", description: "A verified application date that is 30 or 7 days away." },
    { id: "guidance_1", name: "Guidance · Sage", description: "Day 1 of the getting-started sequence." },
    { id: "guidance_2", name: "Guidance · My Schools", description: "Day 3 of the getting-started sequence." },
    { id: "guidance_3", name: "Guidance · Vibe Check", description: "Day 7 of the getting-started sequence." },
    { id: "weekly_digest", name: "Weekly digest", description: "A Monday snapshot of saved schools and upcoming dates." },
  ];
}

export function buildEmailPreview(id: EmailTemplateId): EmailPreview {
  const metadata = emailTemplateCatalog().find((item) => item.id === id);
  if (!metadata) throw new Error("unknown_email_template");

  if (id === "welcome") {
    return {
      ...metadata,
      from: "Sage from admyt <hello@youradmyt.com>",
      ...welcomeEmailContent(),
    };
  }

  if (id === "deadline_reminder") {
    return {
      ...metadata,
      from: "Sage from admyt <reminders@youradmyt.com>",
      ...deadlineReminderEmailContent([{
        collegeName: "University of Oregon",
        deadlineType: "Regular decision",
        deadlineDate: "2027-01-15",
        leadDays: 30,
        sourceUrl: "https://admissions.uoregon.edu/apply/deadlines",
      }], UNSUBSCRIBE_PREVIEW_URL),
    };
  }

  if (id === "weekly_digest") {
    return {
      ...metadata,
      from: "Sage from admyt <digest@youradmyt.com>",
      ...weeklyDigestEmailContent({
        totalSchoolCount: 3,
        schools: [
          { id: "209551", name: "University of Oregon", vibeScore: 84 },
          { id: "209542", name: "Oregon State University" },
          { id: "236948", name: "University of Washington", vibeScore: 76 },
        ],
        deadlines: [{
          collegeName: "University of Oregon",
          type: "Regular decision",
          date: "2027-01-15",
          sourceUrl: "https://admissions.uoregon.edu/apply/deadlines",
        }],
      }, UNSUBSCRIBE_PREVIEW_URL),
    };
  }

  const stage = Number(id.slice(-1)) as 1 | 2 | 3;
  return {
    ...metadata,
    from: "Sage from admyt <guidance@youradmyt.com>",
    ...guidanceEmailContent(stage, { savedSchoolCount: 3, vibeCheckCount: 1 }, UNSUBSCRIBE_PREVIEW_URL),
  };
}
