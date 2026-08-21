import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_ENTITY_PLACEHOLDERS } from "@/lib/legal-placeholders";

export const metadata: Metadata = {
  title: "Terms of Service · Warm-Hello",
  description:
    "Terms of Service for Warm-Hello. Governed by the laws of the Province of Ontario and applicable federal laws of Canada, with US-resident arbitration and dispute resolution terms.",
  robots: "noindex,nofollow",
};

const E = LEGAL_ENTITY_PLACEHOLDERS;

export default function TermsPage() {
  const lastUpdated = "August 21, 2026";

  return (
    <main className="shell">
      <article
        className="card longform"
        style={{ textAlign: "left", maxWidth: 820, margin: "0 auto" }}
      >
        <p className="eyebrow">Warm-Hello</p>
        <h1>Terms of Service</h1>
        <p className="section-meta">
          <strong>Last Updated and Effective Date:</strong> {lastUpdated}
        </p>

        <blockquote className="notice-block">
          <strong>IMPORTANT NOTICE:</strong> Warm-Hello is an automated
          text-messaging notification utility operated by{" "}
          <strong>{E.LEGAL_ENTITY_NAME}</strong> to facilitate routine check-ins
          between individuals and their designated personal contacts.{" "}
          <strong>
            WARM-HELLO IS NOT A MEDICAL ALERT SYSTEM, PERSONAL EMERGENCY
            RESPONSE SYSTEM (PERS), OR EMERGENCY DISPATCH SERVICE.
          </strong>{" "}
          Warm-Hello does not monitor for health conditions, contact emergency
          services (e.g., 911), or replace professional caregiving. Delivery of
          SMS notifications relies on third-party telecommunication providers
          and cannot be guaranteed. In an emergency, dial 911 or contact local
          emergency services immediately.
        </blockquote>

        <section id="acceptance">
          <h2>1. Acceptance of Terms</h2>
          <p>
            These Terms of Service (the <strong>&quot;Terms&quot;</strong>) are
            a binding legal agreement between you (the
            &quot;<strong>Account Manager</strong>&quot; or
            &quot;<strong>you</strong>&quot;) and{" "}
            <strong>{E.LEGAL_ENTITY_NAME}</strong>
            (&quot;<strong>Warm-Hello</strong>,&quot;
            &quot;<strong>we</strong>,&quot; &quot;<strong>us</strong>,&quot; or
            &quot;<strong>our</strong>&quot;), a company registered under the
            laws of {E.JURISDICTION_OF_INCORPORATION}, with a principal mailing
            address at <strong>{E.CA_MAILING_ADDRESS}</strong>. Your access to
            and use of the Warm-Hello website, products, and services
            (collectively, the &quot;<strong>Service</strong>&quot;) is subject
            to these Terms. By creating an account, purchasing a subscription,
            clicking to accept these Terms during checkout or onboarding, or
            otherwise using the Service, you confirm that you (a) are at least
            18 years of age or the age of majority in your jurisdiction, (b)
            have the legal authority to enter into this agreement, and (c) have
            read, understood, and agree to be bound by these Terms. If you do
            not agree, do not use the Service.
          </p>
        </section>

        <section id="service-description">
          <h2>2. Service Description; Express Waiver of Emergency Obligations</h2>
          <p>
            The Service is a voluntary, non-emergency automated SMS check-in
            notification platform. Account Managers may register designated
            senior contacts (&quot;<strong>Seniors</strong>&quot;) who receive
            one or more automated daily SMS prompts to confirm they are well.
            If a Senior does not confirm a check-in within the configured
            grace window, the Service notifies personal emergency contacts
            designated by the Account Manager via SMS or email.
          </p>
          <p>
            <strong>NO EMERGENCY DUTY.</strong> TO THE FULLEST EXTENT PERMITTED
            BY APPLICABLE LAW, WARM-HELLO ASSUMES NO DUTY OF CARE, OBLIGATION,
            OR RESPONSIBILITY TO DISPATCH, NOTIFY, OR SUMMON ANY MEDICAL,
            POLICE, FIRE, OR OTHER EMERGENCY RESPONSE PERSONNEL ON BEHALF OF
            ANY USER OR THIRD PARTY. WARM-HELLO DOES NOT RECEIVE, PROCESS, OR
            ACT ON EMERGENCY RESPONSE SIGNALS.
          </p>
          <p>
            <strong>NOT A MEDICAL DEVICE OR HEALTHCARE PROVIDER.</strong> The
            Service is not, and shall not be construed to be, a medical device,
            a healthcare service, a Personal Emergency Response System (PERS),
            a telehealth provider, or a substitute for professional medical
            advice, diagnosis, or treatment. Always seek the advice of a
            qualified health provider with any questions regarding a medical
            condition.
          </p>
          <p>
            <strong>CARRIER DISCLAIMER.</strong> SMS delivery is dependent on
            third-party cellular carriers, telecommunications networks, device
            power status, SIM functionality, network outages, spam filters,
            and other factors outside Warm-Hello&apos;s direct control.
            Delivery of any given SMS message, check-in prompt, or escalation
            alert cannot be guaranteed and is expressly disclaimed. You assume
            all risk of failed, delayed, garbled, or misdirected SMS
            transmission.
          </p>
        </section>

        <section id="caregiver-authorization">
          <h2>3. Caregiver Authorization; Third-Party Data; Indemnification</h2>
          <h3>3.1 Authorization to Enroll a Senior</h3>
          <p>
            By enrolling, creating an account for, adding, or inputting
            personal information about a Senior (including, without limitation,
            the Senior&apos;s full name, mobile telephone number, and emergency
            contact chain), you represent and warrant that:
          </p>
          <ol className="longform-list">
            <li>
              You are the Senior&apos;s legally authorized representative
              (e.g., power of attorney for personal care, court-appointed
              guardian, or substitute decision-maker under applicable
              provincial legislation such as the Ontario <em>Substitute
              Decisions Act, 1992</em>), <strong>OR</strong> you have obtained
              the explicit, informed, voluntary, written or oral consent of
              the Senior to collect, use, disclose, and process their personal
              information for the purposes described in these Terms and the
              Privacy Policy;
            </li>
            <li>
              The Senior is capable of understanding the nature and purpose of
              the Service, or you are lawfully authorized to consent on their
              behalf;
            </li>
            <li>
              Any mobile telephone number you provide belongs to the Senior
              and is active, capable of two-way SMS, and not on a national do
              not call / DNCL list without applicable express consent;
            </li>
            <li>
              The emergency contact individuals you register have consented to
              being contacted by Warm-Hello SMS or email in the event of a
              missed check-in.
            </li>
          </ol>

          <h3>3.2 Indemnification</h3>
          <p>
            You agree to defend, indemnify, and hold harmless Warm-Hello, its
            officers, directors, employees, contractors, affiliates,
            successors, and assigns (collectively, the &quot;Warm-Hello
            Parties&quot;) from and against any and all claims, liabilities,
            damages, losses, costs, investigations, regulatory proceedings,
            and expenses (including reasonable legal and accounting fees)
            arising out of or related to: (a) any breach of the representations
            and warranties in Section 3.1; (b) your failure to obtain valid,
            informed consent from a Senior or emergency contact prior to
            enrollment; (c) any claim by a Senior, emergency contact, family
            member, regulator, or third party relating to CASL, TCPA, DNCL,
            PIPEDA, PHIPA, consumer protection legislation, privacy torts, or
            any other law governing SMS communications or personal data,
            arising from your actions; (d) your misuse of the Service,
            violation of these Terms, or violation of any applicable law or
            regulation; or (e) any dispute between you and a Senior, family
            member, or emergency contact regarding the enrollment of the
            Senior or the operation of the Service.
          </p>
        </section>

        <section id="subscriptions-auto-renewal">
          <h2>4. Subscriptions, Billing, and Auto-Renewal Transparency</h2>
          <h3>4.1 Plan Pricing</h3>
          <p>
            The Service is offered under recurring subscription plans.
            Pricing, including advertised monthly, daily, and annual amounts,
            is displayed during checkout. Current pricing at the time these
            Terms were updated is as follows (prices shown for information
            purposes only; actual prices and taxes at checkout via Stripe are
            authoritative):
          </p>
          <ul className="longform-list">
            <li>
              <strong>Monthly:</strong> approximately $5 USD / $6 CAD (before
              taxes), billed automatically at the start of each monthly term.
            </li>
            <li>
              <strong>Annual:</strong> approximately $72 CAD (before taxes),
              billed automatically at the start of each annual term.
            </li>
          </ul>
          <p>
            Applicable federal (GST/HST) and provincial (PST, QST, RST, or US
            state sales tax) taxes are calculated automatically during
            checkout.
          </p>

          <h3>4.2 Auto-Renewal</h3>
          <p>
            <strong>RECURRING BILLING.</strong> Your subscription automatically
            renews at the end of each billing term for an equivalent renewal
            term unless you cancel at least 48 hours before the renewal date.
            At renewal, you authorize Warm-Hello (via Stripe) to charge the
            payment method on file for the then-current subscription price
            plus applicable taxes. You will receive a renewal reminder email
            at least 14 calendar days before the start of each annual renewal
            term.
          </p>

          <h3>4.3 Cancellation</h3>
          <p>
            Cancellation is simple. You may cancel auto-renewal at any time
            with one (1) click from your Warm-Hello Dashboard, under Settings
            → Subscription. No phone calls, written letters, or support tickets
            are required. Upon cancellation, auto-renewal is turned off and
            your service remains active through the end of the billing cycle
            you have already paid for. No refunds are provided for partial
            billing periods, except as expressly required by the Ontario{" "}
            <em>Consumer Protection Act, 2002</em>, equivalent provincial
            consumer protection legislation, or any applicable US state
            consumer protection statute that cannot be disclaimed.
          </p>

          <h3>4.4 Payment Processor</h3>
          <p>
            All payments are processed by Stripe, Inc. or its affiliates
            (&quot;<strong>Stripe</strong>&quot;). Warm-Hello does not store or
            transmit full payment card numbers. Your relationship with Stripe
            is governed by Stripe&apos;s own terms of service and privacy
            policy.
          </p>
        </section>

        <section id="sms-compliance">
          <h2>5. SMS &amp; Email Compliance (CASL / TCPA / DNCL)</h2>
          <h3>5.1 Operational vs. Commercial Messages</h3>
          <p>
            Warm-Hello sends three categories of messages:
          </p>
          <ol className="longform-list">
            <li>
              <strong>Operational / Transactional SMS (daily check-ins and
              escalations):</strong> Pure safety check-in prompts and missed
              check-in alerts. These messages are sent only to deliver a
              service the recipient is entitled to receive under a contractual
              or legitimate interest basis and do not contain promotional,
              referral, or discount content.
            </li>
            <li>
              <strong>Onboarding / Welcome SMS:</strong> The first SMS a
              Senior receives includes identity, compliance, and STOP/HELP
              information required under CASL and TCPA, followed immediately
              by the first check-in prompt.
            </li>
            <li>
              <strong>Emails (billing / lifecycle):</strong> Transactional
              emails (renewal reminders, successful payment receipts, trial
              expiration, account cancellations, and failed check-in alerts to
              emergency contacts). Commercial or marketing emails, if any,
              will only be sent with documented explicit opt-in and will
              contain a clearly labeled, functional, 1-click, no-login
              unsubscribe mechanism that processes requests within the time
              required by CASL (10 business days) and the US CAN-SPAM Act (10
              business days).
            </li>
          </ol>

          <h3>5.2 Strict No-Promo Rule for Operational SMS</h3>
          <p>
            The daily check-in SMS sent to Seniors is operationally critical.
            It will NEVER contain promotional copy, referral incentives,
            referral links, coupon codes, discount offers, upsells, or any
            content not directly related to the check-in itself. Any message
            containing promotional language is sent as a separate message to
            the Account Manager, not as part of a check-in, and only if
            explicit separate marketing consent is on file.
          </p>

          <h3>5.3 STOP / HELP / START Keywords</h3>
          <p>
            Every automated SMS from Warm-Hello supports the industry-standard
            keywords <strong>STOP</strong> (to opt out of further messages),{" "}
            <strong>HELP</strong> (to receive support contact information), and{" "}
            <strong>START</strong> (to re-opt in after a previous STOP).
            Replies of STOP are processed immediately, and the Senior&apos;s
            number is flagged in our database so no further check-in SMS or
            escalation messages are sent. After STOP, a single final
            confirmation SMS is sent acknowledging the opt-out. Standard
            carrier message and data rates may apply to all SMS messages.
          </p>

          <h3>5.4 Regulatory Identification</h3>
          <p>
            Canadian users: Warm-Hello is registered with the Canadian
            National Do Not Call List (DNCL) as a subscriber organization
            sending operational messages to consented numbers. Questions about
            SMS compliance may be directed to the compliance contact listed in
            Section 14.
          </p>
        </section>

        <section id="intellectual-property">
          <h2>6. Intellectual Property; Account Security</h2>
          <p>
            All right, title, and interest in and to the Service, including
            all copyrights, trademarks, service marks, logos, patents, trade
            secrets, source code, documentation, and other proprietary
            materials, are and shall remain the exclusive property of
            Warm-Hello and its licensors. The Warm-Hello name and logo are
            trademarks of Warm-Hello. Nothing in these Terms grants you any
            license or right to use our trademarks or copyrighted works except
            for personal, internal use of the Service as provided.
          </p>
          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials and for restricting access to your account.
            You are responsible for all activities that occur under your
            account credentials. Notify us immediately of any unauthorized
            account access at <strong>{E.SUPPORT_EMAIL}</strong>.
          </p>
        </section>

        <section id="limitation-of-liability">
          <h2>7. Limitation of Liability</h2>
          <p>
            <strong>7.1 EXCLUSION OF DAMAGES.</strong> TO THE MAXIMUM EXTENT
            PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL ANY OF THE WARM-HELLO
            PARTIES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY DAMAGES FOR
            LOSS OF PROFITS, LOSS OF REVENUE, LOSS OF BUSINESS OPPORTUNITY,
            LOSS OF DATA, LOSS OF GOODWILL, OR PERSONAL INJURY OR WRONGFUL
            DEATH THAT ARISES OUT OF OR IS RELATED TO THE USE OF, INABILITY TO
            USE, OR FAILURE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY
            OF SUCH DAMAGES AND REGARDLESS OF THE LEGAL THEORY (CONTRACT,
            TORT, STATUTE, EQUITY, OR OTHERWISE).
          </p>
          <p>
            <strong>7.2 MONETARY CAP.</strong> SUBJECT TO SECTION 7.3, THE
            TOTAL, AGGREGATE, CUMULATIVE LIABILITY OF ALL WARM-HELLO PARTIES,
            FOR ANY AND ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR
            THE SERVICE (WHETHER IN CONTRACT, TORT, OR OTHERWISE), SHALL NOT
            EXCEED THE GREATER OF: (A) ONE HUNDRED CANADIAN DOLLARS (CAD $100);
            AND (B) THE TOTAL FEES ACTUALLY PAID BY YOU TO WARM-HELLO DURING THE
            TWELVE (12) CALENDAR MONTHS IMMEDIATELY PRECEDING THE DATE THE
            FIRST CLAIM AROSE.
          </p>
          <p>
            <strong>7.3 NON-DISCLAIMABLE CARVE-OUTS.</strong> Nothing in this
            Section 7 excludes or limits the liability of any Warm-Hello Party
            for: (a) death or personal injury caused by the willful misconduct
            or gross negligence of a Warm-Hello Party; (b) fraud or fraudulent
            misrepresentation; (c) any breach of a consumer protection
            provision that cannot, as a matter of law, be excluded (including
            non-waivable rights under the Ontario <em>Consumer Protection Act,
            2002</em>, the Quebec <em>Consumer Protection Act</em>, or any US
            state consumer protection statute); (d) any breach of the essential
            terms of this contract that deprives you of the substantial benefit
            of the bargain; or (e) any other liability that cannot be limited
            or excluded by the applicable laws of Ontario, the federal laws of
            Canada, or, for US-resident claimants, the non-waivable consumer
            protection laws of the claimant&apos;s state of residence.
          </p>
        </section>

        <section id="governing-law">
          <h2>8. Governing Law &amp; Forum Selection (General — Non-US Residents)</h2>
          <p>
            Except as otherwise expressly provided for US residents in Section
            9, these Terms, their subject matter, their formation, and all
            disputes arising out of or relating to them or the Service shall
            be:
          </p>
          <ol className="longform-list">
            <li>
              <strong>Governing Law.</strong> Governed by and construed in
              accordance with the laws of the <strong>Province of Ontario</strong>{" "}
              and the federal laws of Canada applicable therein, without
              regard to conflict of laws or private international law
              principles that would require the application of the laws of any
              other jurisdiction.
            </li>
            <li>
              <strong>Mandatory Mediation (First Step).</strong> Any dispute
              arising out of or relating to these Terms or the Service shall
              first be submitted to non-binding mediation administered in
              accordance with the Ontario Mandatory Mediation Program rules or,
              if inapplicable, the mediation rules of the ADR Institute of
              Canada (ADRIC). The seat of any mediation or arbitration shall be{" "}
              <strong>Toronto, Ontario, Canada</strong>. The language of all
              proceedings shall be English, unless French is required by the
              Quebec <em>Charter of the French Language</em> (Bill 101/Law 96)
              for Quebec consumer contracts.
            </li>
            <li>
              <strong>Binding Arbitration if Mediation Fails.</strong> If the
              dispute is not resolved by good-faith mediation within forty-five
              (45) calendar days after the written notice initiating mediation,
              the dispute shall be finally resolved by binding arbitration
              administered by the <strong>ADR Institute of Canada (ADRIC)</strong>{" "}
              under its Domestic Arbitration Rules then in effect. The
              arbitration shall be conducted by a single neutral arbitrator
              with experience in SaaS consumer disputes. The arbitrator shall
              apply the governing law specified in Section 8(a) above.
              Judgment on the award rendered by the arbitrator may be entered
              in any court having competent jurisdiction pursuant to the
              Ontario <em>Arbitration Act, 1991</em>, S.O. 1991, c. 17. An
              appeal on a pure question of law may be brought to the Ontario
              Divisional Court in accordance with that Act.
            </li>
            <li>
              <strong>Class-Wide Relief:</strong> For Canadian-resident
              claimants, to the maximum extent permitted by applicable law,
              all disputes shall be resolved in the claimant&apos;s individual
              capacity only, and not as a class, representative, or
              consolidated action. If a court or arbitrator of competent
              jurisdiction finds the individual-proceeding limitation in this
              Section to be unenforceable or unconscionable under Quebec law
              or the laws of any other province, the parties agree that the
              proper forum for any class-wide or representative proceeding
              shall be the courts of Ontario sitting in Toronto, Canada,
              without application of any jury trial right if jury is otherwise
              available. This sentence does not purport to waive procedural
              rights that cannot be waived by statute; it merely selects the
              proper forum.
            </li>
          </ol>
        </section>

        <section id="us-arbitration">
          <h2>
            9. United States Residents Only — Individual Binding Arbitration;
            Class Action &amp; Jury Trial Waiver
          </h2>
          <blockquote className="notice-block">
            <strong>SECTION 9 APPLIES SOLELY TO UNITED STATES RESIDENTS.</strong>{" "}
            If you are a resident of any jurisdiction other than the United
            States (including Canada), Section 8 applies to you and Section 9
            does not apply.
          </blockquote>
          <p>
            PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS
            AND REMEDIES AS A CONSUMER OF THE SERVICE IN THE UNITED STATES.
          </p>

          <h3>9.1 Individual Binding Arbitration</h3>
          <p>
            Except for the excluded claims listed in Section 9.4 below, any
            dispute, claim, or controversy arising out of or relating to these
            Terms, the Service, billing, or any aspect of the relationship
            between you and Warm-Hello, whether based in contract, statute,
            regulation, tort, fraud, misrepresentation, or any other legal or
            equitable theory (collectively, &quot;Claims&quot;), shall be
            SETTLED EXCLUSIVELY by INDIVIDUAL BINDING ARBITRATION administered
            by <strong>JAMS</strong> under its Comprehensive Arbitration Rules
            and Procedures (the &quot;JAMS Rules&quot;) then in effect, except
            as modified by this Section 9. The Federal Arbitration Act, 9 U.S.C.
            §§ 1–16, governs the interpretation and enforcement of this
            arbitration agreement.
          </p>

          <h3>9.2 Arbitration Procedures; Location; Costs</h3>
          <p>
            The arbitration shall be conducted in <strong>Buffalo, New York,
            USA</strong>, unless you and Warm-Hello mutually agree to another
            location or JAMS determines that an in-person hearing is not
            necessary or that a video/telephonic hearing is appropriate. For
            claims seeking less than $10,000 USD, the arbitration shall be
            conducted by documents only unless you request a hearing. Warm-Hello
            will pay all JAMS filing, administrative, and arbitrator fees for
            Claims that total less than $75,000 USD (before interest and
            costs), provided the Claim is not frivolous as determined by the
            JAMS arbitrator applying Rule 41 of the JAMS Rules. Otherwise, the
            JAMS Rules shall govern the allocation of costs.
          </p>

          <h3>9.3 Class Action Waiver &amp; Jury Trial Waiver (US Residents)</h3>
          <p>
            <strong>CLASS ACTION WAIVER.</strong> TO THE FULLEST EXTENT
            PERMITTED BY APPLICABLE LAW, ALL CLAIMS, WHETHER IN ARBITRATION OR
            IN COURT, SHALL BE BROUGHT IN THE CLAIMANT&apos;S INDIVIDUAL
            CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED
            CLASS, CONSOLIDATED, REPRESENTATIVE, COLLECTIVE, OR PRIVATE
            ATTORNEY GENERAL ACTION. THE ARBITRATOR MAY AWARD INJUNCTIVE OR
            OTHER RELIEF ONLY IN FAVOR OF THE INDIVIDUAL CLAIMANT AND ONLY TO
            THE EXTENT NECESSARY TO PROVIDE RELIEF WARRANTED BY THE
            CLAIMANT&apos;S INDIVIDUAL CLAIM.
          </p>
          <p>
            <strong>JURY TRIAL WAIVER.</strong> TO THE FULLEST EXTENT PERMITTED
            BY APPLICABLE LAW, YOU AND WARM-HELLO HEREBY KNOWINGLY, VOLUNTARILY,
            AND INTENTIONALLY WAIVE ANY RIGHT TO TRIAL BY JURY IN ANY ACTION
            OR PROCEEDING ARISING OUT OF OR RELATING TO THESE TERMS OR THE
            SERVICE, WHETHER IN CONTRACT, TORT, OR OTHERWISE.
          </p>
          <p>
            <strong>Non-waivable rights carve-out.</strong> Nothing in this
            Section 9.3 limits or waives any non-waivable US state or federal
            consumer protection statutory rights you may have that by law
            cannot be waived, including, where applicable, (i) your right to
            bring an individual action in small claims court if you otherwise
            qualify and (ii) your right to file a complaint with the FTC,
            CFPB, your state attorney general, or other applicable regulator.
          </p>

          <h3>9.4 Excluded Claims; Opt-Out Right</h3>
          <p>
            This Section 9 does not apply to (a) any claim for injunctive or
            equitable relief relating to unauthorized access, use, or misuse
            of intellectual property or confidential information, (b) claims
            below the small claims court jurisdictional limit that are
            maintained in small claims court on an individual basis only, or
            (c) any individual claim brought within the applicable statute of
            limitations regarding personal injury or wrongful death.
          </p>
          <p>
            <strong>30-Day Opt-Out for New US Account Holders.</strong> If you
            are a first-time US account holder, you may opt out of this
            arbitration agreement within 30 days of the date you first accept
            these Terms by sending a signed written notice to{" "}
            <strong>{E.SUPPORT_EMAIL}</strong> (subject line:
            &quot;Section 9 Arbitration Opt-Out&quot;) that includes your full
            name, billing address, email address, and a clear statement that
            you wish to opt out of Section 9 of the Terms. Opting out of
            Section 9 does not affect any other provision of these Terms.
          </p>
        </section>

        <section id="termination">
          <h2>10. Termination; Suspension</h2>
          <p>
            Either party may terminate these Terms for convenience at any time:
            you by closing your account via Dashboard or by requesting account
            deletion by email; Warm-Hello upon thirty (30) days&apos; prior
            written notice to the email on file. Warm-Hello may immediately
            suspend or terminate your access to the Service without prior
            notice if: (a) you materially breach these Terms and fail to cure
            within fifteen (15) days after written notice (except for payment
            breaches, fraud, abusive enrollment practices, or legal
            enforcement requirements, which may be acted upon immediately);
            (b) we are required to do so by law, regulation, regulatory order,
            court order, or valid subpoena; or (c) we reasonably believe your
            use of the Service poses an actual or threatened risk of harm,
            fraud, harassment, or legal liability to Warm-Hello, a Senior, an
            emergency contact, or any other person. Upon termination, Sections
            2 (emergency waivers), 3.2 (indemnification), 5 (SMS compliance as
            relates to already sent messages), 6 (IP), 7 (limitation of
            liability), 8 &amp; 9 (dispute resolution), and 11–15 (misc
            legal) shall survive indefinitely.
          </p>
        </section>

        <section id="privacy-cross-border">
          <h2>11. Privacy; Cross-Border Data Transfer</h2>
          <p>
            Your use of the Service is also governed by the Warm-Hello Privacy
            Policy, the current version of which is available at{" "}
            <Link href="/privacy" className="inline-link">
              /privacy
            </Link>
            . The Privacy Policy is incorporated into these Terms by this
            reference. Without limiting the Privacy Policy, you acknowledge
            and agree that personal information collected through the Service
            may be stored and processed in cloud infrastructure located outside
            your jurisdiction of residence, including the United States of
            America, and may be accessible to law enforcement or national
            security authorities in those jurisdictions pursuant to their
            applicable laws, including the United States <em>USA PATRIOT
            Act</em>. Further details, including your PIPEDA access/correction
            rights and Quebec Law 25 portability/erasure rights, are set out
            in the Privacy Policy.
          </p>
        </section>

        <section id="taxes">
          <h2>12. Taxes; Invoicing</h2>
          <p>
            All fees are exclusive of taxes, duties, or similar governmental
            assessments of any nature, except where the Service description
            otherwise states that taxes are included. Canadian residents may
            be charged GST, HST, PST, RST, or QST as applicable depending on
            province of residence, as calculated automatically by Stripe at
            checkout. US residents may be charged state and local sales tax as
            required by applicable law, as also calculated automatically by
            Stripe Tax at checkout. Upon request, we will provide a tax invoice
            or receipt for any payment via email or in the Billing section of
            your Dashboard, including our GST/HST registration number{" "}
            <strong>{E.GST_HST_REGISTRATION_NUMBER}</strong> (once configured
            on the account).
          </p>
        </section>

        <section id="modifications">
          <h2>13. Modifications to the Terms</h2>
          <p>
            We may update these Terms from time to time to reflect changes in
            the law, changes in our Service, new features, or for other good
            faith business reasons. Material changes (for example, changes to
            pricing, dispute resolution, auto-renewal, or limitation of
            liability) will be notified to you by email at least thirty (30)
            calendar days before they become effective, together with a
            description of the change. If you continue to use the Service
            after the effective date of any updated Terms, you agree to be
            bound by the updated version. All prior versions of these Terms
            are archived by date; you may request a copy of any prior version
            by email. The version of these Terms in effect at the time of the
            disputed event governs that dispute unless a later version is
            explicitly accepted by clickwrap by you.
          </p>
        </section>

        <section id="contact">
          <h2>14. Contact; Notices; Compliance</h2>
          <p>
            For general questions about the Service, billing, or support,
            email{" "}
            <a href={`mailto:${E.SUPPORT_EMAIL}`} className="inline-link">
              {E.SUPPORT_EMAIL}
            </a>
            . For legal notices, CASL/TCPA/PIPEDA/PHIPA compliance requests,
            or PIPEDA Individual Access Requests (IARs), please direct your
            communications to the Compliance/Registered Office at:
          </p>
          <address>
            <strong>{E.LEGAL_ENTITY_NAME}</strong>
            <br />
            Attn: Compliance Officer
            <br />
            {E.CA_MAILING_ADDRESS}
            <br />
            Email:{" "}
            <a href={`mailto:${E.SUPPORT_EMAIL}`} className="inline-link">
              {E.SUPPORT_EMAIL}
            </a>
          </address>
        </section>

        <section id="misc">
          <h2>15. Miscellaneous</h2>
          <p>
            <strong>Entire Agreement:</strong> These Terms, together with the
            Privacy Policy and any clickwrap acknowledgments you have accepted
            at checkout or onboarding (including, without limitation, the
            explicit assumption-of-risk and caregiver-authorization
            checkboxes), constitute the entire agreement between you and
            Warm-Hello and supersede all prior or contemporaneous oral or
            written agreements with respect to the Service.
            <br />
            <strong>Severability:</strong> If any provision of these Terms is
            held invalid or unenforceable by a court or arbitrator of
            competent jurisdiction, the remaining provisions shall remain in
            full force and effect, and the invalid provision shall be reformed
            only to the minimum extent necessary to make it enforceable to the
            maximum extent permitted by law, so as to preserve the original
            intent of the parties as closely as possible.
            <br />
            <strong>Waiver:</strong> No failure or delay by either party in
            exercising any right or remedy under these Terms shall operate as a
            waiver of that or any other right or remedy, nor shall any single
            or partial exercise preclude any further exercise of that or any
            other right.
            <br />
            <strong>Assignment:</strong> You may not assign or transfer these
            Terms or any rights hereunder, by operation of law or otherwise,
            without our prior written consent, which shall not be unreasonably
            withheld. Warm-Hello may freely assign these Terms in connection
            with a merger, acquisition, sale of all or substantially all of
            its assets, or other corporate restructuring, provided that the
            assignee assumes all obligations hereunder.
            <br />
            <strong>Survival:</strong> Sections or subsections whose context
            requires survival shall survive any termination or expiration of
            these Terms indefinitely.
            <br />
            <strong>Language:</strong> These Terms are drafted and executed in
            the English language. If a translation is provided for your
            convenience, the English version shall control. For Quebec
            consumers, the parties consent to the use of English where not
            prohibited by law.
          </p>
        </section>
      </article>
    </main>
  );
}
