import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_ENTITY_PLACEHOLDERS } from "@/lib/legal-placeholders";

export const metadata: Metadata = {
  title: "Privacy Policy · Warm-Hello",
  description:
    "Privacy Policy for Warm-Hello. Compliant with PIPEDA, Quebec Law 25, Ontario PHIPA, CASL, US CCPA/CPRA, and mandatory carrier 10DLC SMS disclosure language.",
  robots: "noindex,nofollow",
};

const E = LEGAL_ENTITY_PLACEHOLDERS;

export default function PrivacyPage() {
  const lastUpdated = "August 21, 2026";

  return (
    <main className="shell">
      <article
        className="card longform"
        style={{ textAlign: "left", maxWidth: 860, margin: "0 auto" }}
      >
        <p className="eyebrow">Warm-Hello</p>
        <h1>Privacy Policy</h1>
        <p className="section-meta">
          <strong>Last Updated and Effective Date:</strong> {lastUpdated}
        </p>

        <blockquote className="notice-block">
          <strong>Scope:</strong> This Privacy Policy describes how{" "}
          <strong>{E.LEGAL_ENTITY_NAME}</strong> (&quot;Warm-Hello,&quot;
          &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses,
          stores, discloses, retains, and otherwise processes personal
          information in connection with the Warm-Hello automated SMS check-in
          service (the &quot;Service&quot;). We respect your privacy and are
          committed to protecting personal information in accordance with the
          federal <em>Personal Information Protection and Electronic Documents
          Act</em> (PIPEDA), provincial privacy laws including Quebec&apos;s
          <em> Act to modernize legislative provisions as regards the protection
          of personal information</em> (Law 25), British Columbia&apos;s{" "}
          <em>Personal Information Protection Act</em> (BC PIPA), Alberta&apos;s{" "}
          <em>Personal Information Protection Act</em> (AB PIPA), Ontario&apos;s{" "}
          <em>Personal Health Information Protection Act, 2004</em> (PHIPA), and,
          for US residents, the California <em>Consumer Privacy Act</em> (CCPA
          / CPRA) and other applicable US state privacy laws.
        </blockquote>

        <section id="controller">
          <h2>1. Data Controller &amp; Contact Information</h2>
          <p>
            Warm-Hello is the data controller and, where applicable under
            PIPEDA, the &quot;organization&quot; responsible for the
            collection, use, disclosure, and retention of personal information
            collected through the Service. Our contact information is:
          </p>
          <address>
            <strong>{E.LEGAL_ENTITY_NAME}</strong>
            <br />
            Attn: Chief Privacy Officer / Compliance
            <br />
            {E.CA_MAILING_ADDRESS}
            <br />
            Email (privacy &amp; Individual Access Requests — IARs):{" "}
            <a href={`mailto:${E.SUPPORT_EMAIL}`} className="inline-link">
              {E.SUPPORT_EMAIL}
            </a>
          </address>
          <p>
            PIPEDA Principle 4.1.1: Warm-Hello designates the role of Chief
            Privacy Officer (CPO) with responsibility for compliance. Contact
            the CPO at the address above for any privacy question, complaint,
            or request.
          </p>
        </section>

        <section id="collected">
          <h2>2. Categories of Personal Information Collected</h2>
          <p>
            Warm-Hello only collects personal information that is reasonably
            necessary for the purpose of providing safety check-in services,
            billing, and account administration. We do not collect more
            personal information than is necessary. At the time of this
            update, the categories of personal information collected are:
          </p>
          <ul className="longform-list">
            <li>
              <strong>Account Owner / Account Manager Data (Adult Child /
              Caregiver):</strong> Full name, email address, billing address
              (pass-through to Stripe), and authenticated session data.
              Payment card data is never stored by Warm-Hello; it is processed
              directly by our PCI-DSS compliant payment processor, Stripe.
            </li>
            <li>
              <strong>Senior Contact Data:</strong> Full name, mobile telephone
              number in E.164 format, time zone, preferred daily check-in
              time, and grace window preference.
            </li>
            <li>
              <strong>Emergency Contact Data:</strong> Full name, relationship
              to the Senior, mobile telephone number, and email address.
            </li>
            <li>
              <strong>Check-in Log Data (Operational History):</strong> Date
              and time of automated SMS check-in prompts sent to the Senior,
              Senior reply timestamp (if any), check-in status (confirmed /
              missed / escalated), and escalation notification dispatch log
              (timestamp + target emergency contact).
            </li>
            <li>
              <strong>Subscription, Billing, and Tax Data:</strong> Stripe
              customer ID, Stripe subscription ID, subscription status,
              current period end date, selected billing currency, invoice
              numbers, and tax amounts collected. Retained in accordance with
              the Income Tax Act (Canada) and equivalent US IRS record-keeping
              requirements.
            </li>
            <li>
              <strong>SMS Consent &amp; Compliance Records (PIPEDA / CASL /
              TCPA):</strong> Date and time of caregiver-authorization
              clickwrap consent, checkbox version string, Terms of Service
              acceptance timestamp, Terms version, dashboard legal disclaimer
              dismissal timestamp, and STOP / HELP / START inbound SMS reply
              logs with timestamps and carrier message IDs.
            </li>
            <li>
              <strong>Technical Data (Automatically Collected):</strong> Web
              server access logs (IP address, browser user agent string,
              referring URL, timestamps) for up to 30 days for fraud detection,
              abuse prevention, and network security purposes. IP addresses
              are not linked to the subscriber account profile after the 30
              day window expires unless required by valid legal process or
              fraud investigation.
            </li>
          </ul>
          <p>
            <strong>No Health Information Sought:</strong> Warm-Hello does
            NOT intentionally solicit, collect, or store personal health
            information (PHI). We are NOT a health information custodian under
            PHIPA or equivalent provincial health privacy law, and we are NOT
            a covered entity or business associate under the U.S. Health
            Insurance Portability and Accountability Act of 1996 (HIPAA). If
            you or any other person inadvertently provides us with PHI or
            sensitive medical information (diagnoses, medications, physician
            notes, etc.), please email {E.SUPPORT_EMAIL} with the subject
            &quot;Unintended PHI Deletion Request&quot; and we will purge the
            information from our systems within the shortest time practicable
            and document the deletion.
          </p>
        </section>

        <section id="third-party-senior">
          <h2>
            3. Third-Party Senior Data — Caregiver Authorization &amp;
            Warranties (PIPEDA Principle 4.3; Quebec Law 25 S. 12)
          </h2>
          <p>
            Because the Service is typically set up by an adult child or
            caregiver (Account Manager) on behalf of a Senior, the Account
            Manager frequently provides us with personal information of a
            third party (the Senior) and personal information about the
            Senior&apos;s emergency contacts. In accordance with PIPEDA
            Principle 4.3, Quebec Law 25 S. 12–14, and applicable law:
          </p>
          <ol className="longform-list">
            <li>
              The Account Manager represents and warrants that, at the time
              they provide any third-party personal information, they have
              obtained the <strong>explicit, informed, and voluntary consent</strong>{" "}
              of each individual whose personal information is being submitted
              — specifically, the Senior and each named Emergency Contact — to
              the collection, use, disclosure, and cross-border processing of
              their information for the purposes described in this Privacy
              Policy;
            </li>
            <li>
              OR, the Account Manager represents and warrants that they are
              the legally authorized representative (guardian, substitute
              decision-maker, holder of power of attorney for personal care, or
              equivalent) of each such individual, and that they are legally
              authorized to consent on that individual&apos;s behalf;
            </li>
            <li>
              The Account Manager acknowledges that the provision of false or
              unauthorized third-party personal information is a material
              breach of the Terms of Service and may expose Warm-Hello to
              regulatory inquiries by the Office of the Privacy Commissioner
              of Canada (OPC), the Commission d&apos;accès à l&apos;information
              (CAI) du Québec, or equivalent regulators.
            </li>
          </ol>
        </section>

        <section id="purposes">
          <h2>4. Purposes for Which We Collect, Use, and Disclose Information</h2>
          <p>
            Personal information is collected, used, and disclosed only for
            purposes that a reasonable person would consider appropriate in the
            circumstances (PIPEDA Principle 4.4). Specifically:
          </p>
          <ol className="longform-list">
            <li>
              <strong>To provide the core Service:</strong> Send the daily
              automated SMS check-in prompt to the Senior; detect missed
              check-ins; notify designated emergency contacts; surface
              check-in history in the Warm-Hello Dashboard; and power
              dashboards, reports, and timeline views.
            </li>
            <li>
              <strong>Billing, subscription management, and accounting:</strong>{" "}
              Collect payment via Stripe; issue receipts and tax invoices;
              calculate and remit GST/HST, PST/QST, and US state sales taxes as
              required; comply with the Income Tax Act (Canada) and IRS 1099-K
              record-keeping requirements.
            </li>
            <li>
              <strong>CASL/TCPA/DNCL SMS compliance:</strong> Produce consent
              records on demand during regulatory audits; process STOP, HELP,
              and START keyword replies; and demonstrate opt-in lineage to
              carriers (Telnyx / Twilio / US 10DLC / Canadian CLC auditors).
            </li>
            <li>
              <strong>Customer support and account administration:</strong>{" "}
              Respond to billing, technical support, feature requests, and
              complaints.
            </li>
            <li>
              <strong>Fraud prevention, safety, and integrity:</strong> Detect
              and prevent abusive signups, unauthorized access, credential
              stuffing attacks, impersonation of Seniors or emergency
              contacts, and other threats to the Service.
            </li>
            <li>
              <strong>Legal and regulatory compliance:</strong> Comply with
              valid subpoenas, court orders, warrants, regulatory production
              orders, and other lawful demands from recognized governmental or
              regulatory authorities in Canada and/or the United States (see
              Section 5).
            </li>
            <li>
              <strong>Business transaction:</strong> In the event of a merger,
              acquisition, divestiture, consolidation, reorganization, or sale
              of all or substantially all of the assets of Warm-Hello (in
              whole or in part), personal information may be transferred as a
              business asset, subject to appropriate confidentiality
              protections and notice to affected individuals where required by
              law.
            </li>
          </ol>
        </section>

        <section id="cross-border">
          <h2>
            5. Cross-Border Transfer &amp; Disclosure of Personal Information
            (PIPEDA Sch. 1 Principle 4.1.3; Quebec Law 25 Ch. VI)
          </h2>
          {E.DATA_RESIDENCY_DISCLOSURE_REQUIRED ? (
            <>
              <p>
                <strong>NOTICE REGARDING CROSS-BORDER DATA PROCESSING OUTSIDE OF
                CANADA.</strong> Warm-Hello operates the Service using a
                combination of our own systems and services provided by
                established third-party technology vendors. Personal
                information that we collect may be stored and/or processed on
                servers located outside of the user&apos;s home jurisdiction,
                including but not limited to the following countries:
              </p>
              <ul className="longform-list">
                {E.DATA_PROCESSING_COUNTRIES.map((country) => (
                  <li key={country}>{country}</li>
                ))}
              </ul>
              <p>
                <strong>Foreign Law Enforcement Access Notice (USA PATRIOT
                Act):</strong> Personal information stored or processed in the
                United States may be accessible to United States law
                enforcement, intelligence, and national security authorities
                pursuant to the laws of the United States, including, without
                limitation, the <em>Uniting and Strengthening America by
                Providing Appropriate Tools Required to Intercept and Obstruct
                Terrorism Act of 2001</em> (USA PATRIOT Act).
              </p>
              <p>
                Where personal information is transferred to a third-party
                service provider outside of Canada or the European Economic
                Area, Warm-Hello takes reasonable contractual and operational
                steps to ensure that the information receives a comparable
                level of protection to that required by PIPEDA, Quebec Law 25,
                and applicable provincial law. These steps include
                industry-standard encryption in transit and at rest, access
                controls, limited processing purposes, written data processing
                agreements imposing equivalent PIPEDA/Schumer II-level
                obligations on the processor, and documented information
                security policies.
              </p>
              <p>
                You may request a list of Warm-Hello&apos;s current
                cross-border sub-processors and copies of the applicable data
                processing agreements by writing to the Chief Privacy Officer
                at the address in Section 1.
              </p>
            </>
          ) : (
            <p>
              All personal information collected by Warm-Hello is stored and
              processed within Canada by Canadian-based service providers that
              are subject to PIPEDA and equivalent provincial privacy
              legislation. Personal information is not intentionally
              transferred or processed outside of Canada except in the case of
              individual remote access by a user or the rare valid legal
              process scenario described in Section 4(f).
            </p>
          )}
        </section>

        <section id="sms-10dlc-casl">
          <h2>6. SMS &amp; Mobile Data — Mandatory Carrier &amp; Regulatory Disclosures</h2>
          <h3>6.1 US 10DLC MANDATORY MOBILE DATA STATEMENT (NON-NEGOTIABLE)</h3>
          <p>
            The following paragraph is required verbatim by US mobile carrier
            10DLC compliance programs and MUST be reproduced exactly in any
            privacy policy posted by a commercial SMS sender:
          </p>
          <blockquote className="notice-block">
            No mobile information will be shared with third parties/affiliates
            for marketing/promotional purposes. All the above categories
            exclude text messaging originator opt-in data and consent; this
            information will not be shared with any third parties.
          </blockquote>
          <p>
            Warm-Hello confirms the foregoing: originator opt-in data (the
            record that a mobile subscriber consented to receive SMS from
            Warm-Hello&apos;s sender IDs) and opt-in consent artifacts are
            never sold, rented, licensed, or shared with any unaffiliated
            third party, except to our SMS delivery provider (currently
            Telnyx LLC) for the sole purpose of delivering the Service and
            complying with carrier audit obligations, or as required by valid
            legal process described in Section 4(f).
          </p>

          <h3>6.2 CANADA CASL COMPLIANCE STATEMENT (S. 6 &amp; S. 13, CASL)</h3>
          <blockquote className="notice-block">
            <strong>Compliance with Canada&apos;s Anti-Spam Legislation
            (CASL):</strong> For recipients of our SMS check-ins in Canada, we
            obtain express opt-in consent before sending any commercial
            electronic message (CEM). Purely operational messages — namely,
            the routine daily automated SMS safety check-in prompts and
            missed-check-in escalation alerts — are exempt from the CEM
            consent requirements of CASL as messages sent to deliver a
            product, service, or subscription the recipient is entitled to
            receive under a pre-existing contractual or legitimate interest
            relationship. Warm-Hello&apos;s operational check-in SMS contains
            NO promotional, referral, discount, or upsell language of any
            kind. Any commercial marketing message that Warm-Hello might send
            in the future (for example, feature announcements or referral
            incentives) will only be transmitted with separate documented
            express opt-in and will clearly identify the sender, provide a
            valid Canadian mailing address, and include a fully functional
            1-click unsubscribe/opt-out mechanism that processes requests
            within ten (10) business days as required by s. 11(1)(c) of
            CASL.
          </blockquote>

          <h3>6.3 STOP / HELP / START (Dual Compliance CASL + TCPA)</h3>
          <p>
            Every automated outbound SMS message sent by or on behalf of
            Warm-Hello acknowledges and supports the following standard
            mobile carrier reply keywords:
          </p>
          <ul className="longform-list">
            <li>
              <strong>STOP</strong> — Reply STOP to immediately opt out of all
              further Warm-Hello check-in and escalation SMS. One final
              confirmation message will be sent acknowledging the opt-out.
              Thereafter, no further operational SMS will be sent to the
              mobile number, except for non-SMS communications required by law
              or by the Terms of Service (billing receipts, regulatory
              notifications).
            </li>
            <li>
              <strong>HELP</strong> — Reply HELP to receive compliance and
              support information, including: the legal name and Canadian
              mailing address of the sender, support contact email,
              explanation of the service, and the STOP/START keywords above.
            </li>
            <li>
              <strong>START</strong> — After an earlier STOP, reply START to
              re-opt-in to check-in SMS (subject to a new express-opt-in
              confirmation).
            </li>
          </ul>
          <p>
            Standard carrier message and data rates may apply to all SMS
            messages regardless of opt-in status. Mobile subscribers should
            consult their wireless carrier for plan details.
          </p>

          <h3>6.4 CASL 6-Year Consent Record Retention (s. 13(1))</h3>
          <p>
            Pursuant to s. 13(1) of the CASL and accompanying CRTC guidelines,
            Warm-Hello retains all SMS consent records (caregiver clickwrap
            consent timestamp and version, first-check-in success message
            ID, STOP/HELP/START reply timestamps, and caregiver authorization
            checkbox acknowledgements) for a period of{" "}
            <strong>
              {E.SMS_CONSENT_RECORDS_RETENTION_YEARS} years
            </strong>{" "}
            after the date of the LAST message sent to the relevant mobile
            telephone number. These records are NOT PII-purged on subscriber
            account deletion because they are required regulatory compliance
            artifacts under a statutory 6-year retention period. They are
            stored separately in a dedicated, access-restricted consent
            tombstone table and are used solely in the event of a CRTC, DNCL,
            FTC, or carrier compliance audit. See Section 9 for full retention
            schedule.
          </p>
        </section>

        <section id="safeguards">
          <h2>7. Security Safeguards (PIPEDA Principle 4.7)</h2>
          <p>
            Warm-Hello protects personal information using safeguards
            appropriate to the sensitivity of the information. Implemented
            safeguards include, where applicable:
          </p>
          <ul className="longform-list">
            <li>
              TLS 1.3 encryption for all data in transit between users and
              Warm-Hello, and between Warm-Hello and sub-processors (Stripe,
              Supabase, Telnyx, AWS SES);
            </li>
            <li>
              AES-256 encryption for personal data at rest on primary
              database infrastructure;
            </li>
            <li>
              Role-based access controls (RBAC) and the principle of least
              privilege for all internal and sub-processor access;
            </li>
            <li>
              Authentication via secure Next.js server-side sessions (no
              client-stored bearer tokens);
            </li>
            <li>
              Physical and administrative security measures on cloud servers
              provided by SOC 2 Type II certified infrastructure vendors
              (AWS, Supabase, Stripe);
            </li>
            <li>
              Limited automated logging; automated rotation of API keys and
              webhook secrets;
            </li>
            <li>
              Annual security review and, for material vendor changes, a
              documented vendor risk assessment (VRA) prior to onboarding.
            </li>
          </ul>
          <p>
            While no method of transmission or storage is 100% secure, Warm-Hello
            maintains safeguards that are consistent with or exceed industry
            standards for SaaS consumer check-in services of our size and
            maturity. In the event of a security incident that creates a
            reasonable risk of significant harm to an identifiable individual
            as defined by PIPEDA S. 10.1(3), Quebec Law 25 S. 40–43, or
            equivalent state breach-notification legislation (e.g., California
            AB 199, NY SHIELD Act), we will: (a) notify the OPC / CAI /
            applicable regulator within the time required by law; (b) notify
            affected individuals without unreasonable delay where required by
            law; and (c) provide an incident summary post via email to
            affected Account Managers.
          </p>
        </section>

        <section id="retention">
          <h2>8. Retention &amp; Destruction Schedule (PIPEDA Princ. 4.5; Law 25 S. 26)</h2>
          <p>
            Personal information is retained only for as long as is reasonably
            necessary to fulfill the identified purposes for which it was
            collected or as required by law. Our current retention schedule is:
          </p>
          <ul className="longform-list">
            <li>
              <strong>Check-in log data (confirmed / missed timestamps,
              Senior reply content):</strong> {E.CHECKIN_LOGS_RETENTION_MONTHS}{" "}
              months from the date of the last check-in, or 24 months from the
              date of account cancellation, whichever is later. After this
              period, check-in rows are soft-deleted (PII fields — reply
              content, Senior free-text, display name — set to null; only
              the date and a boolean confirmed/missed flag retained for
              aggregate, anonymized product metrics).
            </li>
            <li>
              <strong>Subscription, billing, tax, and invoice records:</strong>{" "}
              {E.BILLING_LOGS_RETENTION_YEARS} years from the end of the tax
              year in which the payment was processed, per s. 230 of the
              Canadian <em>Income Tax Act</em>, s. 6038B of the US Internal
              Revenue Code, and generally accepted accounting principles
              (GAAP/IFRS).
            </li>
            <li>
              <strong>SMS consent records &amp; STOP/HELP/START tombstone
              table (CASL s. 13(1)):</strong>{" "}
              {E.SMS_CONSENT_RECORDS_RETENTION_YEARS} years from the date of
              the last SMS message sent to or received from the associated
              phone number. Records are retained even after account closure.
            </li>
            <li>
              <strong>Account Owner profile data (name, email, session):</strong>{" "}
              Retained for the duration of the active account plus 12 months
              after the later of (a) the effective date of account closure or
              (b) final resolution of any pending billing dispute, outstanding
              refund request, regulatory complaint, or legal process.
              Thereafter, PII is hard-deleted or permanently anonymized,
              except for the SMS consent records and billing records listed
              above which are retained for their statutory retention periods.
            </li>
            <li>
              <strong>Server access logs (IP, user agent):</strong> 30 days,
              then rotated/purged.
            </li>
          </ul>
          <p>
            Upon expiry of the applicable retention period, personal
            information is either destroyed in a secure, irreversible manner
            (shredded via zeroized cryptographic key wipe where feasible) or
            converted to a truly anonymized, aggregate form that can no longer
            be linked to an identifiable individual.
          </p>
        </section>

        <section id="individual-rights">
          <h2>
            9. Your Individual Privacy Rights (Access, Correction, Erasure,
            Portability, Withdrawal of Consent)
          </h2>

          <h3>9.1 For All Individuals Globally</h3>
          <p>
            Upon written request and subject to our right to verify the
            identity of the requester, every individual has the right to:
          </p>
          <ul className="longform-list">
            <li>
              <strong>Access:</strong> Request confirmation of whether we hold
              personal information about you, the categories of information
              held, a description of the purposes for which it is used, and a
              copy of the personal information itself (a PIPEDA Individual
              Access Request, or &quot;IAR&quot;).
            </li>
            <li>
              <strong>Correction:</strong> Request the correction of any
              inaccurate or incomplete personal information held about you.
            </li>
            <li>
              <strong>Erasure (&quot;Right to be Forgotten&quot;):</strong>{" "}
              Request deletion of the personal information we hold about you,
              subject to our legal obligations to retain certain records for
              their statutory retention periods (notably CASL SMS consent
              records — 6 years — and tax/billing records — 7 years), which
              will be retained in an access-restricted compliance store and
              not otherwise processed.
            </li>
            <li>
              <strong>Withdrawal of Consent:</strong> Withdraw any consent you
              previously provided to the processing of your personal
              information, subject to contractual and legal restrictions and
              reasonable prior notice. For SMS, replying STOP from your mobile
              is the recommended withdrawal mechanism (effective immediately);
              withdrawal by other means will be processed within the statutory
              time. Withdrawal of consent does not affect the lawfulness of
              any processing conducted prior to withdrawal.
            </li>
          </ul>
          <p>
            <strong>How to Submit a Request (Signed-in users have a faster
            path):</strong>
          </p>
          <ol className="longform-list">
            <li>
              <strong>Option A (Faster — signed in):</strong> From the
              Warm-Hello Dashboard → Settings, use the
              &quot;<strong>Download My Data (JSON)</strong>&quot; and
              &quot;<strong>Permanently Delete My Account</strong>&quot;
              one-click tools. Account deletion immediately cancels any active
              subscription, scrambles all PII fields on the Account Manager
              and Senior records (see retention schedule above), and flips the
              global SMS opt-out flag on the Senior phone. A confirmation
              email is sent within 24 hours.
            </li>
            <li>
              <strong>Option B (Email — for non-signed-in users, Seniors,
              Emergency Contacts, or regulators):</strong> Send a signed
              written request to{" "}
              <a href={`mailto:${E.SUPPORT_EMAIL}`} className="inline-link">
                {E.SUPPORT_EMAIL}
              </a>{" "}
              with the subject &quot;IAR / Privacy Request&quot;. Include your
              full legal name, the email or phone number associated with the
              account, and a description of the specific right you are
              exercising. We reserve the right to request additional identity
              verification (e.g., photo of government-issued ID) before
              disclosing or deleting personal information to protect against
              impersonation fraud.
            </li>
          </ol>
          <p>
            <strong>Response Time:</strong> We will respond to all verifiable
            privacy requests within <strong>{E.DAYS_TO_RESPOND_IAR} calendar
            days</strong>, unless an extension is permitted or required by law,
            in which case we will notify you of the extension in writing
            within the first 30 days and before the statutory deadline
            applicable to the jurisdiction of the request (30 days under
            PIPEDA Principle 4.9; 45 days under CCPA/CPRA; 30 days under
            Quebec Law 25 S. 51). Where a request is manifestly unfounded or
            excessive, a reasonable administrative fee may be charged or the
            request declined in accordance with applicable law.
          </p>

          <h3>9.2 For California Residents (CCPA/CPRA)</h3>
          <p>
            If you are a California resident, the CCPA provides you with
            additional rights regarding personal information collected by a
            business subject to the CCPA. To the extent that Warm-Hello is
            deemed a &quot;business&quot; or &quot;service provider&quot;
            under the CCPA with respect to your personal information, you
            have the right to: (a) request disclosure of the categories and
            specific pieces of personal information collected, used, disclosed,
            or sold in the preceding 12 months; (b) request deletion of your
            personal information (subject to statutory exceptions); (c) opt
            out of the &quot;sale&quot; of your personal information to third
            parties; and (d) not be discriminated against for exercising any
            of your CCPA rights. Warm-Hello DOES NOT sell personal
            information of California consumers in the traditional sense,
            and specifically DOES NOT sell SMS opt-in records (see Section
            6.1 above). If, in the future, we engage in any activity that
            would be deemed a &quot;sale&quot; under the CCPA, we will provide
            a &quot;Do Not Sell My Personal Information&quot; link prominently
            on our home page and Terms/Privacy footer. All of the mechanisms
            listed in Section 9.1 above are fully available to California
            residents.
          </p>

          <h3>9.3 For Quebec Residents (Law 25 — Chapitre 3, Titre 1er)</h3>
          <p>
            Si vous résidez au Québec, la Loi sur la protection des renseignements
            personnels dans le secteur privé (Loi 25, chapitre 3 du Recueil des
            lois du Québec, chapitre P-39.1) vous accorde des droits
            spécifiques, notamment le droit d&apos;accès, de rectification, de
            désindexation, de portabilité et d&apos;effacement visés aux
            articles 50 à 55 de ladite Loi. Pour exercer ces droits, utilisez
            les voies décrites à l&apos;article 9.1 ci-dessus. Les demandes
            peuvent être déposées en français ou en anglais. L&apos;Office de
            protection du consommateur (OPC) et la Commission d&apos;accès à
            l&apos;information (CAI) demeurent vos autorités de surveillance
            compétentes en matière de protection de la vie privée au Québec.
          </p>
        </section>

        <section id="children">
          <h2>10. Children&apos;s Privacy — No Service Intentionally Offered to Minors</h2>
          <p>
            The Service is a family safety tool intended for use by and for
            adult Seniors. We do not knowingly solicit, market, or offer the
            Service to children under the age of majority in their
            jurisdiction of residence (generally 18 years; 19 in Alberta,
            British Columbia, Newfoundland and Labrador, New Brunswick,
            Northwest Territories, Nunavut, and Yukon). In compliance with the
            U.S. Children&apos;s Online Privacy Protection Act (COPPA), we do
            not knowingly collect personal information from children under 13
            years of age. If you become aware that a child has provided us
            with personal information in violation of this Section, please
            contact {E.SUPPORT_EMAIL} immediately and we will take reasonable
            steps to promptly delete the applicable information from our
            systems.
          </p>
        </section>

        <section id="cookies">
          <h2>11. Cookies, Analytics, &amp; Advertising</h2>
          <p>
            At the time this Privacy Policy was last updated, Warm-Hello uses
            first-party, strictly-necessary session cookies solely to
            authenticate signed-in Account Managers and to prevent cross-site
            request forgery (CSRF). We do not use third-party tracking
            cookies, advertising networks, re-targeting pixels, or behavioral
            advertising on the Service. We do not sell, rent, or share user
            information for marketing purposes with any third party. If we
            change this policy in the future to use non-essential analytics or
            advertising cookies, we will: (a) update this Section; (b) add a
            cookie consent banner compliant with Quebec Law 25, the EU GDPR,
            and the California CCPA; and (c) re-notify existing users in
            accordance with Section 14.
          </p>
        </section>

        <section id="third-parties">
          <h2>12. Third-Party Service Providers — Current List</h2>
          <p>
            The following categories of sub-processors and service providers
            may have access to personal information in the course of providing
            their services to Warm-Hello. Each is subject to contractual data
            protection provisions:
          </p>
          <ul className="longform-list">
            <li>
              <strong>Infrastructure &amp; Database:</strong> Supabase (AWS
              hosted), Vercel (deployment hosting).
            </li>
            <li>
              <strong>Payments, Billing, Tax Calculation:</strong> Stripe,
              Inc. (payment processing via PCI-DSS compliant endpoints;
              automatic tax calculation via Stripe Tax; receipt issuance).
            </li>
            <li>
              <strong>SMS Delivery &amp; 10DLC/CLC Carrier Registration:</strong>{" "}
              Telnyx LLC (long-code and toll-free SMS carrier).
            </li>
            <li>
              <strong>Transactional Email:</strong> Amazon Web Services
              (AWS) SES (billing receipts, renewal reminders, check-in
              escalation emails to emergency contacts).
            </li>
            <li>
              <strong>Customer Support:</strong> Email via {E.SUPPORT_EMAIL}.
            </li>
            <li>
              <strong>Professional Advisors:</strong> External legal counsel,
              chartered professional accountants, and IT security auditors,
              each bound by professional confidentiality obligations.
            </li>
          </ul>
          <p>
            A complete, current list of sub-processors and their respective
            data processing agreement statuses is available upon written
            request from the Chief Privacy Officer per Section 1.
          </p>
        </section>

        <section id="changes">
          <h2>13. Updates to This Privacy Policy</h2>
          <p>
            We reserve the right to amend this Privacy Policy from time to
            time. Material changes (changes that materially expand or alter
            the ways in which we use or share personal information, or that
            affect enforceable rights) will be brought to your attention at
            least thirty (30) calendar days before they become effective via:
            (a) a prominent notice on the Dashboard home screen; (b) an email
            to the primary Account Owner email on file; or (c) a new
            clickwrap acceptance prompt the next time the Account Owner logs
            in after the change is posted. Your continued use of the Service
            after the effective date of an amended Privacy Policy constitutes
            acceptance of the amended terms, unless you submit a request to
            delete your account in accordance with Section 9 before the
            effective date.
          </p>
        </section>

        <section id="questions">
          <h2>14. Questions &amp; Regulatory Complaints</h2>
          <p>
            If you have any questions, concerns, or complaints regarding this
            Privacy Policy, the practices of the Service, or our handling of
            personal information, please first contact:
          </p>
          <address>
            <strong>{E.LEGAL_ENTITY_NAME}</strong>
            <br />
            Attn: Chief Privacy Officer / Compliance
            <br />
            {E.CA_MAILING_ADDRESS}
            <br />
            Email:{" "}
            <a href={`mailto:${E.SUPPORT_EMAIL}`} className="inline-link">
              {E.SUPPORT_EMAIL}
            </a>
          </address>
          <p>
            We take privacy complaints seriously. Every complaint is logged,
            acknowledged in writing within 5 business days, investigated, and
            responded to in writing within the time required by applicable law
            (at a maximum, 30 calendar days for PIPEDA complaints). If you
            are not satisfied with the resolution of your complaint, you may
            escalate it to the applicable supervisory authority, including:
          </p>
          <ul className="longform-list">
            <li>
              <strong>Office of the Privacy Commissioner of Canada (OPC):</strong>{" "}
              https://www.priv.gc.ca
            </li>
            <li>
              <strong>Commission d&apos;accès à l&apos;information (Québec):</strong>{" "}
              https://www.cai.gouv.qc.ca
            </li>
            <li>
              <strong>California Privacy Protection Agency (CPPA / California
              residents):</strong> https://cppa.ca.gov
            </li>
          </ul>
        </section>

        <hr className="footer-divider" />
        <p style={{ opacity: 0.7, fontSize: 12 }}>
          This document includes both English and French statutory rights
          disclosures. A full French translation is not provided at this time;
          please email {E.SUPPORT_EMAIL} to request a French-language version
          for Quebec consumer contract purposes under Bill 101 / Law 96.
        </p>
        <p style={{ opacity: 0.7, fontSize: 12 }}>
          <Link href="/terms" className="inline-link">
            View the Warm-Hello Terms of Service
          </Link>
          .
        </p>
      </article>
    </main>
  );
}
