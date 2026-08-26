import LegalDocument, { LegalSection } from '@/components/ui/LegalDocument'
import { LEGAL_CONTACT_EMAIL, LEGAL_EFFECTIVE_DATE } from '@/lib/legal'

export default function Privacy() {
  return (
    <LegalDocument
      eyebrow="Privacy Policy"
      title="What Admyt knows, and why."
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      summary={<p>This Privacy Policy explains how Dustin Smith-Salinas, the operator of Admyt (“Admyt,” “we,” “us,” or “our”), collects, uses, discloses, and retains personal information when you use Admyt.</p>}
    >
      <LegalSection title="1. The short version">
        <ul>
          <li>Admyt uses what you share to provide and personalize college exploration.</li>
          <li>Relevant prompts, preferences, and school context are sent to Anthropic so Sage can respond.</li>
          <li>Admyt does not sell personal information or share it for cross-context behavioral advertising.</li>
          <li>You can download your account data or permanently delete your account from Profile.</li>
          <li>Admyt is for users 13 and older. Users under 18 need permission from a parent or guardian.</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <h3>Information you provide</h3>
        <ul>
          <li><strong>Account information:</strong> email address, account identifier, and, if you use Google or Apple sign-in, information that provider makes available such as your name, profile image, private relay email address, or provider identifier.</li>
          <li><strong>Conversation content:</strong> messages you send to Sage and Sage’s responses.</li>
          <li><strong>College-search preferences:</strong> intended majors, locations, budget, school size, institution type, career goals, and other preferences you choose to share.</li>
          <li><strong>Saved activity:</strong> saved schools, Vibe Checks, Fit Scores, and related notes or results.</li>
          <li><strong>Email preferences and delivery:</strong> whether you opt in to deadline reminders, your time zone, delivery status, records needed to prevent duplicate delivery, and a one-way email-address fingerprint when a message bounces, is reported as spam, or is suppressed.</li>
          <li><strong>Communications:</strong> information included when you contact us.</li>
        </ul>
        <h3>Information collected automatically</h3>
        <ul>
          <li><strong>Browser storage:</strong> guest hearts, preferences, and up to three guest Vibe Checks stored locally on your device.</li>
          <li><strong>Security and request data:</strong> request timestamps, error and performance events, and a one-way pseudonymous identifier derived from an IP address for short-term abuse prevention.</li>
          <li><strong>Hosting data:</strong> Vercel and Supabase may process IP addresses, device or browser information, request details, and operational logs while delivering and securing Admyt.</li>
        </ul>
        <p>Admyt does not currently use advertising cookies, behavioral advertising, or third-party product analytics. If that changes, this Policy and any required choices will be updated first.</p>
      </LegalSection>

      <LegalSection title="3. How we use information">
        <p>We use personal information to:</p>
        <ul>
          <li>create and secure accounts;</li>
          <li>provide Sage conversations, Fit Scores, Vibe Checks, saved schools, and preferences;</li>
          <li>personalize college suggestions and let you continue across sessions;</li>
          <li>send deadline reminders you explicitly choose to receive;</li>
          <li>operate, troubleshoot, secure, and improve Admyt;</li>
          <li>respond to support, privacy, and safety requests;</li>
          <li>prevent fraud, abuse, and security incidents; and</li>
          <li>comply with law and enforce our Terms.</li>
        </ul>
        <p>We do not use your personal information to make admissions decisions, and we do not provide it to colleges for recruiting or admissions decisions.</p>
      </LegalSection>

      <LegalSection title="4. AI processing">
        <p>Admyt sends relevant conversation text, school information, and preferences to Anthropic’s API to generate Sage and Vibe Check responses. Do not put information into Sage that you would not want processed for this purpose.</p>
        <p>Under Anthropic’s published standard API practice, API inputs and outputs are deleted from its backend within 30 days, except where a different agreement applies or longer retention is needed for usage-policy enforcement or legal compliance. See <a href="https://privacy.anthropic.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data" target="_blank" rel="noopener noreferrer">Anthropic’s retention explanation</a>.</p>
        <p>AI output may be inaccurate. It should not be treated as an admissions prediction or professional advice.</p>
      </LegalSection>

      <LegalSection title="5. When information is disclosed">
        <p>We disclose information only as reasonably necessary to these categories of recipients:</p>
        <ul>
          <li><strong>Supabase:</strong> authentication, database, API, backups, and Edge Functions.</li>
          <li><strong>Anthropic:</strong> AI generation described above.</li>
          <li><strong>Vercel:</strong> website hosting, delivery, and operational security.</li>
          <li><strong>Resend:</strong> delivery of sign-in codes and deadline reminders.</li>
          <li><strong>Google:</strong> when you choose Google sign-in; Google also sends sign-in information to Admyt.</li>
          <li><strong>Apple:</strong> when you choose Apple sign-in; Apple also sends sign-in information to Admyt and may provide a private relay email address if you choose Hide My Email.</li>
          <li><strong>Authorities or other parties:</strong> when required by law or reasonably necessary to protect rights, safety, users, or the service.</li>
          <li><strong>A successor:</strong> in a merger, financing, acquisition, reorganization, or sale, subject to applicable law and this Policy.</li>
        </ul>
        <p>These providers process information under their own agreements and privacy commitments. Admyt does not sell personal information and does not share it for cross-context behavioral advertising.</p>
      </LegalSection>

      <LegalSection title="6. Retention">
        <ul>
          <li><strong>Signed-in account data:</strong> retained while your account is active, unless you delete individual information or your account sooner.</li>
          <li><strong>Deleted accounts:</strong> removed from the live application when deletion succeeds. Encrypted disaster-recovery copies may remain for up to 7 days before aging out.</li>
          <li><strong>Guest data:</strong> remains in your browser until it is overwritten, reaches a product limit, or you clear browser data.</li>
          <li><strong>Abuse-prevention identifiers:</strong> rate-limit records are removed after the rate-limit window ends and scheduled cleanup runs, generally within 48 hours.</li>
          <li><strong>Anthropic API data:</strong> handled under the retention practice described in the AI section above.</li>
          <li><strong>Email suppression records:</strong> a one-way address fingerprint may be retained after account deletion when needed to honor a bounce, spam complaint, or do-not-send restriction. Admyt does not retain the address itself in this suppression record.</li>
          <li><strong>Operational and legal records:</strong> retained only as long as reasonably needed for security, support, dispute resolution, legal compliance, or enforcement.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Your choices and rights">
        <p>From Profile, you can review or change preferences, turn deadline emails on or off, remove saved schools, download a JSON copy of your account data, and permanently delete your account. You can clear guest information through your browser settings.</p>
        <p>Depending on where you live, you may also have rights to know, access, correct, delete, or receive a copy of personal information; restrict or object to certain processing; appeal a denied request; or opt out of sale, targeted advertising, or certain profiling. Admyt does not sell personal information or use it for targeted advertising.</p>
        <p>Email <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> to exercise a right that is not available in Profile. We may verify your identity before acting. An authorized agent may submit a request where permitted by law. We will not discriminate against you for exercising a privacy right.</p>
      </LegalSection>

      <LegalSection title="8. Children and teens">
        <p>Admyt is intended for students who are at least 13. It is not directed to children under 13, and we do not knowingly collect personal information from them. Users under 18 must have permission from a parent or legal guardian.</p>
        <p>If we learn that we collected personal information from a child under 13, we will delete it. A parent or guardian can contact us to request review or deletion. Admyt does not sell the personal information of users under 16—or anyone else.</p>
      </LegalSection>

      <LegalSection title="9. Security and international processing">
        <p>We use administrative, technical, and organizational safeguards designed to protect information, including access controls, row-level database security, encrypted connections, authenticated deletion, backups, rate limits, and redacted operational logs. No system is perfectly secure, so we cannot guarantee absolute security.</p>
        <p>Admyt and its providers may process information in the United States and other countries where they operate. Those countries may have different data-protection laws than your home jurisdiction.</p>
      </LegalSection>

      <LegalSection title="10. School relationships and third-party links">
        <p>Admyt is currently a direct-to-consumer service and is not operated by your school, school district, or college. Do not assume your use is part of an official school record or counselor relationship. If Admyt later provides services on behalf of a school, the relevant school agreement and student-privacy notice may also apply.</p>
        <p>Links to colleges and other websites are governed by those sites’ privacy practices, not this Policy.</p>
      </LegalSection>

      <LegalSection title="11. Changes to this Policy">
        <p>We may update this Policy as Admyt changes. We will update the effective date and provide additional notice when required by law. If a change materially affects how existing personal information is used, we will ask for consent where required.</p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>Questions, privacy requests, or concerns about a child’s information can be sent to <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.</p>
      </LegalSection>
    </LegalDocument>
  )
}
