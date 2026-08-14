import LegalDocument, { LegalSection } from '@/components/ui/LegalDocument'
import { LEGAL_CONTACT_EMAIL, LEGAL_EFFECTIVE_DATE } from '@/lib/legal'

export default function Terms() {
  return (
    <LegalDocument
      eyebrow="Terms of Use"
      title="The ground rules for using Admyt."
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      summary={<p>These Terms of Use form an agreement between you and Dustin Smith-Salinas, the operator of Admyt (“Admyt,” “we,” “us,” or “our”). By creating an account or using Admyt, you agree to these Terms.</p>}
    >
      <LegalSection title="1. Who may use Admyt">
        <p>You must be at least 13 years old to use Admyt. If you are under 18—or under the legal age of adulthood where you live—you may use Admyt only with permission from a parent or legal guardian. That adult should review these Terms and our Privacy Policy with you.</p>
        <p>Admyt is not directed to children under 13. Do not create an account or submit personal information if you are under 13. A parent or guardian who believes a child under 13 has used Admyt should contact us so we can remove the information.</p>
      </LegalSection>

      <LegalSection title="2. What Admyt does—and does not do">
        <p>Admyt helps students explore colleges, organize preferences, save schools, and ask an AI advisor named Sage questions about college fit. Fit Scores and Vibe Checks are informational tools based on the information available to Admyt and what you choose to share.</p>
        <p>Admyt is not a college, admissions office, school counselor, financial adviser, legal adviser, or mental-health professional. It does not submit applications or make admissions decisions. Nothing in Admyt is a promise of admission, financial aid, affordability, academic success, or happiness at a school.</p>
        <p>AI can be incomplete, outdated, or wrong. College information can also change. Confirm deadlines, tuition, financial aid, admissions requirements, programs, and other important decisions directly with the school and a trusted adult or professional.</p>
      </LegalSection>

      <LegalSection title="3. Your account">
        <p>You are responsible for providing accurate account information, protecting your sign-in credentials, and activities performed through your account. Tell us promptly if you believe someone else has accessed it.</p>
        <p>You may use Admyt as a guest where available. Guest information stays in that browser and may disappear if browser data is cleared. A signed-in account is required for cross-device persistence.</p>
      </LegalSection>

      <LegalSection title="4. Your content and privacy">
        <p>You keep ownership of text and other content you submit. You give Admyt a limited, non-exclusive license to host, process, reproduce, and transmit that content only as reasonably necessary to operate, secure, maintain, and improve the service and comply with law.</p>
        <p>Do not submit information you do not have the right to share. Avoid putting highly sensitive information—such as Social Security numbers, financial-account credentials, medical records, or another person’s private information—into Sage.</p>
        <p>Our <a href="/privacy">Privacy Policy</a> explains what information is collected, why it is used, which service providers process it, and how to export or delete it.</p>
      </LegalSection>

      <LegalSection title="5. Acceptable use">
        <p>You may not:</p>
        <ul>
          <li>use Admyt for unlawful, fraudulent, threatening, harassing, or abusive activity;</li>
          <li>submit malware, attempt unauthorized access, probe security, evade rate limits, or interfere with the service;</li>
          <li>scrape, copy, or use automated systems to extract Admyt content or overload its infrastructure, except as permitted in writing;</li>
          <li>impersonate another person or misrepresent your affiliation;</li>
          <li>use output to make automated high-impact decisions about another person; or</li>
          <li>reverse engineer or misuse Admyt except where applicable law expressly permits it.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Admyt content and third-party services">
        <p>Admyt’s software, design, branding, and original content belong to Admyt or its licensors. These Terms do not transfer those rights to you. You may use the service only for personal, non-commercial college exploration unless we agree otherwise in writing.</p>
        <p>Admyt uses and links to third-party services and information, including Google sign-in, College Scorecard data, Supabase, Vercel, Anthropic, and college websites. Their services and content are governed by their own terms. Admyt is not responsible for third-party websites or changes to their information.</p>
      </LegalSection>

      <LegalSection title="7. Changes, suspension, and termination">
        <p>You may stop using Admyt at any time and may permanently delete your account from Profile. We may suspend or terminate access when reasonably necessary to protect users or the service, investigate misuse, comply with law, or enforce these Terms.</p>
        <p>We may change or discontinue features. If we materially change these Terms, we will update the effective date and provide additional notice when required by law. Continued use after revised Terms take effect means you accept them; if you do not agree, stop using Admyt and delete your account.</p>
      </LegalSection>

      <LegalSection title="8. Disclaimers">
        <p>To the fullest extent permitted by law, Admyt is provided “as is” and “as available.” We do not warrant that it will always be available, secure, accurate, complete, or error-free, or that results will meet your expectations. Some jurisdictions do not allow certain warranty exclusions, so parts of this section may not apply to you.</p>
      </LegalSection>

      <LegalSection title="9. Limitation of liability">
        <p>To the fullest extent permitted by law, Admyt and its operator will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, lost data, lost opportunities, or decisions made in reliance on the service. Our total liability for claims relating to Admyt will not exceed the greater of $100 or the amount you paid Admyt in the 12 months before the claim.</p>
        <p>These limitations do not apply where prohibited by law, or to liability that cannot legally be limited. Nothing in these Terms limits rights you have under applicable consumer-protection law.</p>
      </LegalSection>

      <LegalSection title="10. Disputes and general terms">
        <p>Please contact us first so we can try to resolve a concern informally. Either party may bring an unresolved claim in a court that has jurisdiction. These Terms do not require individual arbitration or waive a right to a jury trial.</p>
        <p>If one provision is unenforceable, the remaining provisions stay in effect. Our failure to enforce a provision is not a waiver. You may not transfer these Terms without our consent; we may transfer them as part of a reorganization, financing, merger, acquisition, or sale of the service, subject to applicable law.</p>
      </LegalSection>

      <LegalSection title="11. Contact">
        <p>Questions about these Terms can be sent to <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.</p>
      </LegalSection>
    </LegalDocument>
  )
}
