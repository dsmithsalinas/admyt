# Legal review notes

The public Terms and Privacy Policy are implemented at `/terms` and `/privacy`. They are a product-specific working draft, not a substitute for advice from qualified counsel.

## Decisions reflected in the draft

- Admyt is operated by Dustin Smith-Salinas, not a separate legal entity.
- The public contact is `dsmithsalinas@gmail.com`, sourced from the operator's public portfolio. Replace it in `src/lib/legal.ts` if a dedicated privacy inbox is preferred.
- Users must be at least 13. Users under 18 must have parent or guardian permission.
- Admyt is currently direct-to-consumer and not acting on behalf of a school or district.
- Admyt does not currently run advertising, behavioral advertising, or third-party product analytics.
- Admyt does not sell personal information or share it for cross-context behavioral advertising.
- The Terms do not impose mandatory arbitration or a class-action waiver.
- The Terms intentionally do not name a governing state or exclusive venue because the operator's legal business location was not established in the repository.

## Sources checked on August 14, 2026

- [FTC COPPA guidance](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions): parental consent is generally required before collecting personal information online from a child under 13.
- [FTC 2025 COPPA amendments](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-finalizes-changes-childrens-privacy-rule-limiting-companies-ability-monetize-kids-data): strengthened third-party advertising and data-retention requirements for covered child-directed services.
- [California Attorney General CCPA guidance](https://www.oag.ca.gov/privacy/ccpa): describes access, deletion, correction, sale/sharing opt-out, sensitive-information, and non-discrimination rights, plus special sale/sharing rules for users under 16.
- [Anthropic commercial API retention](https://privacy.anthropic.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data): standard API inputs and outputs are deleted within 30 days, subject to stated exceptions or a different agreement.
- [Vercel Privacy Notice](https://vercel.com/legal/privacy-notice): describes End User request and device information processed when Vercel hosts a customer application.
- [Supabase security documentation](https://supabase.com/docs/guides/security): describes platform security controls and the shared-responsibility model.

## Before treating this as final legal approval

1. Confirm the operator name, legal entity (if any), business address, contact email, and governing jurisdiction.
2. Have qualified counsel review youth privacy, state consumer privacy, enforceability, liability limits, and the signup consent language.
3. Confirm production provider agreements and retention settings match the Policy, especially Anthropic, Supabase, Vercel, and Google OAuth.
4. Update the Policy before adding analytics, advertising, uploads, school/district contracts, payment processing, or new subprocessors.
5. Preserve evidence of policy versions and acceptance events.
