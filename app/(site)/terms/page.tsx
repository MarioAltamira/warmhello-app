import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_ENTITY_PLACEHOLDERS } from "@/lib/legal-placeholders";

export const metadata: Metadata = {
  title: "Terms of Service · Warm-Hello",
  description:
    "Terms of Service for Warm-Hello. Warm-Hello is an automated text-messaging notification service operated by 10894796 Canada Inc. Warm-Hello is not a medical alert system, PERS, or emergency dispatch service.",
  robots: "noindex,nofollow",
};

const E = LEGAL_ENTITY_PLACEHOLDERS;

export default function TermsPage() {
  const lastUpdated = "August 29, 2026";

  return (
    <main className="shell">
      <article
        className="card longform"
        style={{ textAlign: "left", maxWidth: 860, margin: "0 auto" }}
      >
        <p className="eyebrow">Warm-Hello</p>
        <h1>Terms of Service</h1>
        <p className="section-meta">
          <strong>Last Updated and Effective Date:</strong> {lastUpdated}
        </p>

        <blockquote className="notice-block">
          <strong>IMPORTANT NOTICE:</strong> Warm-Hello is an automated
          text-messaging notification service operated by{" "}
          <strong>10894796 Canada Inc.</strong>, a corporation incorporated
          under the federal laws of Canada, doing business as &ldquo;Warm-Hello.&rdquo;
          Warm-Hello facilitates routine check-ins between individuals and
          their designated personal contacts.
          <br />
          <strong>
            WARM-HELLO IS NOT A MEDICAL ALERT SYSTEM, PERSONAL EMERGENCY
            RESPONSE SYSTEM (PERS), MEDICAL MONITORING SERVICE, HEALTHCARE
            SERVICE, OR EMERGENCY DISPATCH SERVICE.
          </strong>
          <br />
          Warm-Hello does not monitor for health conditions, determine
          whether an emergency has occurred, contact emergency services such
          as 911, or replace professional caregiving or emergency services.
          Delivery of SMS notifications depends on third-party
          telecommunications providers, networks, devices, and other factors
          outside Warm-Hello&rsquo;s control and cannot be guaranteed. In an
          emergency, immediately contact 911 or the applicable local
          emergency service.
        </blockquote>

        <section id="acceptance">
          <h2>1. Acceptance of Terms</h2>
          <p>
            These Terms of Service (the <strong>&ldquo;Terms&rdquo;</strong>)
            are a binding legal agreement between you (the{" "}
            <strong>&ldquo;Account Manager,&rdquo;</strong>{" "}
            <strong>&ldquo;you,&rdquo;</strong> or{" "}
            <strong>&ldquo;your&rdquo;</strong>) and{" "}
            <strong>10894796 Canada Inc.</strong>, doing business as
            &ldquo;Warm-Hello&rdquo; (<strong>&ldquo;Warm-Hello,&rdquo;</strong>{" "}
            <strong>&ldquo;we,&rdquo;</strong> <strong>&ldquo;us,&rdquo;</strong>{" "}
            or <strong>&ldquo;our&rdquo;</strong>), a corporation incorporated
            under the federal laws of Canada, with a principal mailing address
            at:
          </p>
          <address style={{ fontStyle: "normal", margin: "8px 0 16px" }}>
            <strong>10894796 Canada Inc.</strong> d/b/a Warm-Hello
            <br />
            53 Lancewood Cres
            <br />
            Brampton, Ontario, Canada L6S 5Y5
          </address>
          <p>
            Your access to and use of the Warm-Hello website, applications,
            products, and services (collectively, the{" "}
            <strong>&ldquo;Service&rdquo;</strong>) are subject to these Terms
            and the Warm-Hello Privacy Policy.
          </p>
          <p>
            By creating an account, starting a free trial, purchasing a
            subscription, clicking to accept these Terms during checkout or
            onboarding, or otherwise using the Service, you represent and
            warrant that:
          </p>
          <ol className="longform-list">
            <li>
              You are at least 18 years of age or the age of majority in
              your jurisdiction, whichever is applicable;
            </li>
            <li>
              You have the legal capacity and authority to enter into these
              Terms;
            </li>
            <li>
              If you are enrolling another individual as a Senior, you have
              obtained the permissions and consents required by applicable
              law; and
            </li>
            <li>
              You have read, understood, and agree to be bound by these
              Terms.
            </li>
          </ol>
          <p>
            If you do not agree to these Terms, do not create an account,
            enroll a Senior, purchase a subscription, or use the Service.
          </p>
        </section>

        <section id="service-description">
          <h2>2. Service Description; No Emergency or Medical Service</h2>

          <h3>2.1 Service Description</h3>
          <p>
            Warm-Hello is a voluntary, non-emergency automated check-in and
            notification service.
          </p>
          <p>
            An Account Manager may enroll a designated individual (a{" "}
            <strong>&ldquo;Senior&rdquo;</strong>) to receive scheduled
            check-in prompts. If a Senior does not respond to a scheduled
            check-in within the applicable configured period, Warm-Hello may
            send a notification to the personal contacts designated by the
            Account Manager.
          </p>
          <p>
            The Service is designed to facilitate communication between
            individuals and their designated contacts.
          </p>

          <h3>2.2 No Emergency Monitoring</h3>
          <p>
            Warm-Hello detects whether a scheduled check-in response has
            been received according to the Service&rsquo;s operating rules.
          </p>
          <p>
            A missed check-in does not establish or indicate that an
            emergency, injury, illness, incapacity, fall, medical event, or
            other dangerous situation has occurred.
          </p>
          <p>
            A missed check-in may occur for many reasons, including:
          </p>
          <ul className="longform-list">
            <li>The Senior is unavailable;</li>
            <li>The Senior is asleep or otherwise unable to respond;</li>
            <li>The Senior&rsquo;s phone is turned off;</li>
            <li>The phone battery is depleted;</li>
            <li>The phone is lost, damaged, or inaccessible;</li>
            <li>Cellular, SMS, or internet connectivity is unavailable;</li>
            <li>SMS delivery is delayed, blocked, filtered, or unsuccessful;</li>
            <li>The Senior&rsquo;s phone number has changed;</li>
            <li>The Senior has changed devices;</li>
            <li>The Senior does not see or hear the notification;</li>
            <li>
              A telecommunications carrier experiences an outage or
              interruption;
            </li>
            <li>
              A device, software, network, or third-party service
              experiences a failure; or
            </li>
            <li>
              Warm-Hello experiences a technical failure, interruption, or
              delay.
            </li>
          </ul>
          <p>
            Similarly, receipt of a check-in response does not establish
            that the Senior is safe, healthy, conscious, or free from an
            emergency.
          </p>

          <h3>2.3 No Emergency Duty</h3>
          <p>
            To the maximum extent permitted by applicable law, Warm-Hello
            does not assume a duty of care or obligation to dispatch,
            notify, summon, or contact medical, police, fire, ambulance,
            emergency-response, or other governmental personnel on behalf
            of any user or third party.
          </p>
          <p>
            Warm-Hello does not receive, process, interpret, or act upon
            emergency-response signals.
          </p>
          <p>
            Warm-Hello does not independently determine whether an
            emergency exists.
          </p>

          <h3>2.4 Not a Medical or Healthcare Service</h3>
          <p>
            The Service is not, and shall not be construed to be:
          </p>
          <ul className="longform-list">
            <li>A medical device;</li>
            <li>A medical alert system;</li>
            <li>A personal emergency response system (PERS);</li>
            <li>A medical monitoring service;</li>
            <li>A healthcare service;</li>
            <li>A telehealth service;</li>
            <li>A substitute for professional caregiving;</li>
            <li>A substitute for emergency services; or</li>
            <li>
              A substitute for professional medical advice, diagnosis, or
              treatment.
            </li>
          </ul>
          <p>
            Always seek appropriate professional medical or emergency
            assistance when necessary.
          </p>

          <h3>2.5 Emergency Services</h3>
          <p>
            Warm-Hello does not contact 911, police, fire departments,
            ambulance services, hospitals, physicians, medical facilities,
            or other emergency-response organizations on behalf of users.
          </p>
          <p>
            In an actual or suspected emergency, immediately contact 911 or
            the applicable local emergency service.
          </p>
          <p>
            Users must not rely on Warm-Hello as their sole method of
            monitoring a person&rsquo;s health, safety, welfare, location,
            or condition.
          </p>

          <h3>2.6 SMS and Carrier Disclaimer</h3>
          <p>
            SMS delivery depends on third-party telecommunications carriers,
            cellular networks, internet connectivity, device configuration,
            device power status, SIM functionality, spam filters, carrier
            policies, software, and other factors outside Warm-Hello&rsquo;s
            direct control.
          </p>
          <p>
            Warm-Hello does not guarantee delivery, timing, accuracy,
            completeness, or receipt of any SMS message, check-in prompt,
            missed-check-in notification, escalation notification, or other
            communication.
          </p>
          <p>
            You assume the risk that an SMS message may be delayed, blocked,
            filtered, undelivered, garbled, misdirected, or otherwise
            unavailable.
          </p>
        </section>

        <section id="senior-authorization">
          <h2>3. Senior Authorization; Trusted Escalation Contacts; Third-Party Information</h2>

          <h3>3.1 Authorization to Enroll a Senior</h3>
          <p>
            By enrolling, creating an account for, adding, or providing
            personal information about a Senior, including the Senior&rsquo;s
            name, telephone number, or trusted-escalation-contact information, you
            represent and warrant that:
          </p>
          <ol className="longform-list">
            <li>
              You are the Senior&rsquo;s legally authorized representative;
              <strong> OR</strong>
            </li>
            <li>
              You have obtained the Senior&rsquo;s informed and voluntary
              consent to collect, use, disclose, and process the Senior&rsquo;s
              information for the purposes described in these Terms and the
              Privacy Policy;
            </li>
            <li>
              If you are acting on behalf of the Senior, you have the legal
              authority to provide the applicable consent;
            </li>
            <li>
              The telephone number provided for the Senior is accurate and
              belongs to the Senior or is otherwise authorized for use with
              the Service;
            </li>
            <li>
              The telephone number is capable of receiving the applicable
              communications;
            </li>
            <li>
              You have obtained any consent required by applicable privacy,
              telecommunications, consumer-protection, or other laws; and
            </li>
            <li>
              Each trusted escalation contact you provide has agreed to receive
              applicable Warm-Hello notifications.
            </li>
          </ol>
          <p>
            You are responsible for maintaining evidence of any consent or
            authorization that you are required to obtain.
          </p>

          <h3>3.2 Trusted Escalation Contacts</h3>
          <p>
            Trusted escalation contacts must be individuals who have agreed to
            receive Warm-Hello notifications.
          </p>
          <p>
            You must provide accurate and current trusted-escalation-contact
            information.
          </p>
          <p>You must not designate:</p>
          <ul className="longform-list">
            <li>911;</li>
            <li>Police departments;</li>
            <li>Fire departments;</li>
            <li>Ambulance services;</li>
            <li>Hospitals;</li>
            <li>Physicians;</li>
            <li>Medical facilities; or</li>
            <li>Other emergency-response organizations</li>
          </ul>
          <p>as trusted escalation contacts.</p>
          <p>
            Warm-Hello does not verify the identity, availability, location,
            qualifications, relationship, or ability of a trusted escalation contact
            to respond to a notification.
          </p>
          <p>
            Warm-Hello does not guarantee that a trusted escalation contact will
            receive, read, understand, or respond to any notification.
          </p>
          <p>
            You are responsible for determining whether your selected
            trusted escalation contacts are appropriate for your circumstances.
          </p>

          <h3>3.3 Customer Responsibilities</h3>
          <p>You are responsible for:</p>
          <ul className="longform-list">
            <li>Providing accurate and current account information;</li>
            <li>Providing accurate Senior information;</li>
            <li>Providing accurate trusted-escalation-contact information;</li>
            <li>Obtaining all required permissions and consents;</li>
            <li>Ensuring that the Senior understands how the Service operates;</li>
            <li>
              Ensuring that the Senior has access to a functioning
              compatible device;
            </li>
            <li>
              Ensuring that applicable cellular or internet service is
              available;
            </li>
            <li>Keeping telephone numbers current;</li>
            <li>Keeping trusted-escalation-contact information current;</li>
            <li>
              Monitoring and appropriately responding to Warm-Hello
              notifications;
            </li>
            <li>
              Maintaining appropriate medical, safety, caregiving,
              communication, and emergency arrangements independent of
              Warm-Hello; and
            </li>
            <li>
              Not relying on Warm-Hello as the sole means of determining
              whether a person is safe or experiencing an emergency.
            </li>
          </ul>

          <h3>3.4 Prohibited Health Information</h3>
          <p>
            Warm-Hello is not designed to collect, maintain, or process
            medical records or detailed health information.
          </p>
          <p>
            You must not intentionally enter or transmit through the Service:
          </p>
          <ul className="longform-list">
            <li>Medical records;</li>
            <li>Diagnoses;</li>
            <li>Treatment information;</li>
            <li>Medication information;</li>
            <li>Physician instructions;</li>
            <li>Insurance information;</li>
            <li>Detailed medical history; or</li>
            <li>Other sensitive medical or health information.</li>
          </ul>
          <p>
            Warm-Hello does not intentionally solicit such information.
          </p>
          <p>
            If such information is voluntarily submitted despite these
            restrictions, Warm-Hello may delete or remove the information
            where reasonably practicable and may take other appropriate
            measures.
          </p>

          <h3>3.5 Indemnification for Customer Actions</h3>
          <p>
            To the maximum extent permitted by applicable law, you agree to
            defend, indemnify, and hold harmless Warm-Hello and its
            officers, directors, employees, contractors, service providers,
            affiliates, successors, and assigns (collectively, the{" "}
            <strong>&ldquo;Warm-Hello Parties&rdquo;</strong>) from and
            against claims, liabilities, damages, losses, costs,
            investigations, regulatory proceedings, and reasonable legal
            and accounting expenses arising from or relating to:
          </p>
          <ul className="longform-list">
            <li>
              Your breach of the representations or warranties in this
              Section 3;
            </li>
            <li>
              Your failure to obtain required consent or authorization;
            </li>
            <li>
              Your unauthorized provision of another person&rsquo;s
              personal information;
            </li>
            <li>Your misuse of the Service;</li>
            <li>
              Your violation of these Terms or applicable law; or
            </li>
            <li>
              Disputes between you and a Senior, family member, trusted escalation
              contact, or other third party arising from your enrollment or
              use of the Service.
            </li>
          </ul>
          <p>
            Nothing in this Section requires you to indemnify Warm-Hello to
            the extent prohibited by applicable law.
          </p>
        </section>

        <section id="subscriptions-billing">
          <h2>4. Subscriptions, Billing, Free Trials, and Renewal</h2>

          <h3>4.1 Subscription Plans and Pricing</h3>
          <p>
            Warm-Hello is offered through recurring subscription plans. The
            applicable subscription price and billing frequency are displayed
            to the customer before a paid purchase is completed.
          </p>
          <p>
            As of the effective date of these Terms, the standard
            subscription prices are:
          </p>
          <p style={{ marginTop: 10, marginBottom: 4 }}>
            <strong>United States</strong>
          </p>
          <ul className="longform-list">
            <li>
              <strong>Monthly Plan:</strong> $14.99 USD per month, before
              applicable taxes.
            </li>
            <li>
              <strong>Annual Plan:</strong> $144.00 USD per year, before
              applicable taxes.
            </li>
          </ul>
          <p style={{ marginTop: 10, marginBottom: 4 }}>
            <strong>Canada</strong>
          </p>
          <ul className="longform-list">
            <li>
              <strong>Monthly Plan:</strong> $19.99 CAD per month, before
              applicable taxes.
            </li>
            <li>
              <strong>Annual Plan:</strong> $180.00 CAD per year, before
              applicable taxes.
            </li>
          </ul>
          <p>
            Applicable federal, provincial, territorial, state, and local
            taxes may be added where required by law.
          </p>
          <p>
            The price and currency displayed on the final checkout screen
            immediately before a paid purchase control that transaction.
          </p>
          <p>
            Warm-Hello may change subscription prices in the future. A
            price change will apply to a future renewal term and will not
            retroactively change the price of a completed purchase. Where
            applicable law requires advance notice of a price change,
            Warm-Hello will provide the required notice.
          </p>

          <h3>4.2 Free Trial</h3>
          <p>
            Warm-Hello may offer a seven (7) day free trial from time to
            time.
          </p>
          <p>
            The free trial does not automatically convert into a paid
            subscription.
          </p>
          <p>
            Warm-Hello will not automatically charge the customer&rsquo;s
            payment method when the free trial ends.
          </p>
          <p>
            At the end of the seven (7) day trial period, access to paid
            features may end unless the customer actively selects and
            purchases a paid subscription.
          </p>
          <p>
            If the customer wishes to continue using Warm-Hello after the
            trial, the customer must actively select a paid subscription
            and complete the purchase.
          </p>
          <p>
            The applicable subscription price, billing frequency,
            automatic-renewal terms, and applicable taxes will be clearly
            displayed before the customer completes the paid purchase.
          </p>
          <p>No payment is required solely because the free trial ends.</p>
          <p>
            A customer who does not actively purchase a paid subscription
            will not be charged for the trial.
          </p>
          <p>
            If payment information is collected during registration for a
            free trial, providing that information does not constitute
            authorization for Warm-Hello to automatically charge the
            customer when the trial ends.
          </p>

          <h3>4.3 Automatic Renewal of Paid Subscriptions</h3>
          <p>
            A paid subscription automatically renews at the end of each
            applicable billing period unless cancelled before the next
            renewal date.
          </p>
          <p>Monthly subscriptions renew every month.</p>
          <p>Annual subscriptions renew every twelve (12) months.</p>
          <p>
            At renewal, Warm-Hello will charge the payment method on file
            at the then-current applicable subscription price plus
            applicable taxes.
          </p>
          <p>
            Where required by applicable law, Warm-Hello will provide
            advance notice of an upcoming renewal or price change.
          </p>

          <h3>4.4 Cancellation</h3>
          <p>
            Customers may cancel automatic renewal through the Warm-Hello
            account dashboard.
          </p>
          <p>
            Cancellation prevents future renewal charges but does not
            automatically terminate access during a billing period that has
            already been paid for, except where otherwise required by law.
          </p>
          <p>
            Customers should cancel before the next scheduled renewal date
            to prevent the next recurring charge.
          </p>

          <h3>4.5 Refunds</h3>
          <p>
            Unless otherwise required by applicable law or expressly stated
            in an applicable promotional offer, subscription payments are
            non-refundable after they have been processed.
          </p>
          <p>
            Cancelling a paid subscription does not automatically create a
            right to a refund for the current or previously paid billing
            period.
          </p>
          <p>
            Warm-Hello may, in its discretion, provide a refund, credit, or
            other billing adjustment in individual circumstances. Any
            discretionary refund or credit does not create an obligation to
            provide the same refund or credit in future circumstances.
          </p>
          <p>
            Where a refund is approved, it will generally be returned to
            the original payment method used for the transaction.
          </p>
          <p>
            Nothing in this Section limits, excludes, or waives any refund,
            cancellation, withdrawal, cooling-off, chargeback, or other
            consumer right that cannot legally be excluded or waived under
            applicable law.
          </p>

          <h3>4.6 Payment Processor</h3>
          <p>
            Payments are processed by Stripe, Inc. or its applicable
            affiliates (<strong>&ldquo;Stripe&rdquo;</strong>).
          </p>
          <p>Warm-Hello does not store full payment-card numbers.</p>
          <p>
            Your use of payment services may also be subject to Stripe&rsquo;s
            applicable terms and privacy practices.
          </p>
        </section>

        <section id="sms-compliance">
          <h2>5. SMS, Email, and Communications Compliance</h2>

          <h3>5.1 Operational Communications</h3>
          <p>
            Warm-Hello may send SMS and email communications necessary to
            provide the Service, including:
          </p>
          <ul className="longform-list">
            <li>Check-in prompts;</li>
            <li>Missed-check-in notifications;</li>
            <li>Account-related communications;</li>
            <li>Security notifications;</li>
            <li>Billing and payment communications;</li>
            <li>Trial-related communications;</li>
            <li>Account cancellation confirmations; and</li>
            <li>
              Other communications reasonably necessary to operate the
              Service.
            </li>
          </ul>
          <p>
            Operational check-in and missed-check-in messages are intended
            to contain service-related information only.
          </p>

          <h3>5.2 No Promotional Content in Operational Check-In Messages</h3>
          <p>
            Warm-Hello will not intentionally include advertising,
            promotional offers, referral incentives, coupon codes, discount
            offers, upsells, cross-selling, or unrelated marketing content
            in operational check-in or missed-check-in SMS messages.
          </p>
          <p>
            Any future promotional or marketing communication will be
            handled separately and subject to applicable consent and other
            legal requirements.
          </p>

          <h3>5.3 Marketing Communications</h3>
          <p>
            Warm-Hello may send marketing or promotional communications only
            where permitted by applicable law and where the required consent
            or other lawful basis has been obtained.
          </p>
          <p>
            Marketing communications will include an appropriate unsubscribe
            mechanism where required.
          </p>
          <p>
            Warm-Hello will process valid unsubscribe requests within the
            time required by applicable law.
          </p>

          <h3>5.4 SMS Consent and Keywords</h3>
          <p>
            Where supported and applicable, Warm-Hello may support standard
            SMS keywords such as:
          </p>
          <ul className="longform-list">
            <li>
              <strong>STOP</strong> to opt out;
            </li>
            <li>
              <strong>HELP</strong> to request assistance; and
            </li>
            <li>
              <strong>START</strong> to re-enable eligible SMS
              communications.
            </li>
          </ul>
          <p>
            The availability and effect of these keywords may depend on the
            applicable telecommunications provider and messaging service.
          </p>
          <p>
            A STOP request may prevent further SMS communications necessary
            to operate the Service.
          </p>
          <p>Standard carrier message and data rates may apply.</p>

          <h3>5.5 Applicable Telecommunications Laws</h3>
          <p>
            Warm-Hello will operate its SMS and electronic communications
            practices in accordance with applicable telecommunications,
            privacy, consumer-protection, and electronic-message laws,
            including applicable requirements under Canada&rsquo;s Anti-Spam
            Legislation (CASL), Canada&rsquo;s National Do Not Call List
            rules where applicable, the U.S. Telephone Consumer Protection
            Act (TCPA), and the U.S. CAN-SPAM Act.
          </p>
          <p>
            Whether a particular communication is commercial, transactional,
            operational, or otherwise regulated will depend on the content,
            purpose, recipient, and applicable law.
          </p>
          <p>
            Nothing in these Terms is intended to declare that a particular
            communication is exempt from a law where the law provides
            otherwise.
          </p>

          <h3>5.6 Customer Responsibility for SMS Consent</h3>
          <p>
            Customers are responsible for ensuring that they have the
            authority and required consent to provide another person&rsquo;s
            telephone number to Warm-Hello and to authorize applicable
            communications.
          </p>
          <p>
            Warm-Hello may suspend messaging to a telephone number where it
            receives an opt-out request, complaint, carrier restriction,
            legal request, or other indication that continued messaging may
            be inappropriate or unlawful.
          </p>
        </section>

        <section id="intellectual-property">
          <h2>6. Intellectual Property; Account Security</h2>

          <h3>6.1 Intellectual Property</h3>
          <p>
            All right, title, and interest in and to the Service, including
            its software, source code, design, interfaces, documentation,
            trademarks, service marks, logos, copyrights, trade secrets,
            and other proprietary materials, are owned by or licensed to
            Warm-Hello.
          </p>
          <p>
            The Warm-Hello name, trademarks, logos, and branding may not be
            used without our prior written permission.
          </p>
          <p>
            Except for the limited right to use the Service in accordance
            with these Terms, no ownership or other intellectual-property
            rights are transferred to you.
          </p>

          <h3>6.2 Account Security</h3>
          <p>
            You are responsible for maintaining the confidentiality and
            security of your account credentials.
          </p>
          <p>
            You are responsible for activity occurring under your account
            unless caused by Warm-Hello&rsquo;s failure to maintain
            reasonable security measures required by applicable law.
          </p>
          <p>
            You must promptly notify Warm-Hello at{" "}
            <a
              href={`mailto:${E.SUPPORT_EMAIL}`}
              className="inline-link"
            >
              {E.SUPPORT_EMAIL}
            </a>{" "}
            if you believe your account has been accessed without
            authorization.
          </p>
        </section>

        <section id="limitation-of-liability">
          <h2>7. Limitation of Liability</h2>

          <h3>7.1 Exclusion of Certain Damages</h3>
          <p>
            To the maximum extent permitted by applicable law, the Warm-Hello
            Parties will not be liable for indirect, incidental, special,
            consequential, exemplary, or punitive damages, or for loss of
            profits, revenue, business opportunity, goodwill, or data,
            arising from or relating to the Service or these Terms,
            regardless of the legal theory asserted.
          </p>
          <p>
            Nothing in these Terms excludes or limits liability that
            cannot legally be excluded or limited.
          </p>

          <h3>7.2 Monetary Liability Cap</h3>
          <p>
            To the maximum extent permitted by applicable law, the total
            aggregate liability of the Warm-Hello Parties for claims arising
            from or relating to these Terms or the Service will not exceed
            the greater of:
          </p>
          <ul className="longform-list">
            <li>CAD $100; or</li>
            <li>
              The total amount actually paid by you to Warm-Hello during
              the twelve (12) calendar months immediately preceding the
              event giving rise to the claim.
            </li>
          </ul>

          <h3>7.3 Non-Waivable Liability</h3>
          <p>Nothing in these Terms excludes or limits liability for:</p>
          <ul className="longform-list">
            <li>Fraud or fraudulent misrepresentation;</li>
            <li>
              Willful misconduct or gross negligence to the extent
              liability cannot legally be excluded;
            </li>
            <li>
              Death or personal injury to the extent liability cannot
              legally be excluded;
            </li>
            <li>
              Breaches of consumer-protection laws that cannot legally be
              excluded;
            </li>
            <li>
              Other liability that applicable law prohibits from being
              excluded or limited; or
            </li>
            <li>Any other non-waivable statutory right or remedy.</li>
          </ul>
          <p>
            The limitations in this Section apply only to the maximum extent
            permitted by applicable law.
          </p>
        </section>

        <section id="governing-law">
          <h2>8. Governing Law and Dispute Resolution &mdash; Canada</h2>
          <p>
            Except as otherwise provided for United States residents in
            Section 9, these Terms and disputes arising from or relating to
            the Service will be governed by the laws applicable to the
            parties and the transaction, subject to mandatory
            consumer-protection and other non-waivable laws.
          </p>
          <p>
            For Canadian residents, Ontario law and applicable federal
            Canadian law will generally govern these Terms, subject to any
            mandatory laws of the province or territory in which the
            consumer resides.
          </p>

          <h3>8.1 Mediation</h3>
          <p>
            Where legally permitted and appropriate, the parties will
            attempt in good faith to resolve disputes through direct
            communication before commencing formal proceedings.
          </p>
          <p>
            Nothing in this Section prevents a consumer from exercising a
            statutory right to file a complaint with a regulator,
            government authority, or court where that right cannot legally
            be waived.
          </p>

          <h3>8.2 Arbitration</h3>
          <p>
            Where arbitration is legally permitted and agreed to under
            these Terms, any arbitration will be conducted by a qualified
            neutral arbitrator in accordance with applicable arbitration
            legislation and rules.
          </p>
          <p>
            Any arbitration agreement in these Terms is subject to
            applicable consumer-protection laws and any mandatory rights
            that cannot legally be waived.
          </p>

          <h3>8.3 Class or Representative Proceedings</h3>
          <p>
            To the maximum extent permitted by applicable law, disputes
            will be brought in the claimant&rsquo;s individual capacity
            rather than as a class, collective, representative, or
            consolidated action.
          </p>
          <p>
            Nothing in this Section waives a class, representative,
            collective, or other procedural right that cannot legally be
            waived.
          </p>

          <h3>8.4 Quebec Consumers</h3>
          <p>
            Nothing in these Terms is intended to exclude or limit rights
            available to Quebec consumers under the Quebec Consumer
            Protection Act, the Civil Code of Qu&eacute;bec, the Charter of
            the French Language, or other applicable Quebec legislation.
          </p>
          <p>
            Where a provision of these Terms conflicts with a mandatory
            Quebec consumer right, the mandatory law will prevail.
          </p>
        </section>

        <section id="us-arbitration">
          <h2>9. United States Residents &mdash; Arbitration and Dispute Resolution</h2>
          <p>This Section applies only to residents of the United States.</p>

          <h3>9.1 Individual Arbitration</h3>
          <p>
            Except for claims that are expressly excluded below, any
            dispute, claim, or controversy arising out of or relating to
            these Terms, the Service, billing, or the relationship between
            you and Warm-Hello may, to the maximum extent permitted by
            applicable law, be resolved through individual binding
            arbitration administered by <strong>JAMS</strong> under its
            applicable consumer arbitration rules.
          </p>
          <p>
            The Federal Arbitration Act, 9 U.S.C. &sect;&sect; 1&ndash;16,
            governs the interpretation and enforcement of the arbitration
            agreement to the extent applicable.
          </p>

          <h3>9.2 Remote Arbitration</h3>
          <p>
            Unless you and Warm-Hello agree otherwise, arbitration will
            ordinarily be conducted remotely by video conference, telephone,
            or document submission.
          </p>
          <p>
            If an in-person hearing is legally required or determined
            appropriate by the arbitrator, JAMS, or applicable law, the
            hearing location will be determined in accordance with the
            applicable JAMS rules and applicable law.
          </p>

          <h3>9.3 Arbitration Costs</h3>
          <p>
            Warm-Hello will comply with the applicable JAMS consumer
            arbitration rules concerning filing fees, administrative fees,
            arbitrator fees, and allocation of costs.
          </p>
          <p>
            Nothing in these Terms requires a consumer to pay fees
            prohibited from being imposed on the consumer under applicable
            law or applicable JAMS consumer-arbitration rules.
          </p>

          <h3>9.4 Class Action and Jury Trial Waiver</h3>
          <p>
            To the fullest extent permitted by applicable law, claims
            subject to arbitration must be brought only in the claimant&rsquo;s
            individual capacity and not as a plaintiff or class member in
            any purported class, collective, consolidated, representative,
            or private-attorney-general proceeding.
          </p>
          <p>
            To the fullest extent permitted by applicable law, the parties
            knowingly and voluntarily waive any right to a jury trial for
            claims that are legally subject to such waiver.
          </p>
          <p>Nothing in this Section waives non-waivable federal or state consumer rights.</p>

          <h3>9.5 Excluded Claims</h3>
          <p>
            The arbitration provisions of this Section do not apply to:
          </p>
          <ul className="longform-list">
            <li>
              Claims that cannot legally be subject to mandatory
              arbitration;
            </li>
            <li>
              Individual claims properly brought in small-claims court
              where permitted by applicable law;
            </li>
            <li>
              Claims for injunctive or equitable relief concerning
              unauthorized use or infringement of intellectual property;
            </li>
            <li>
              Individual claims concerning personal injury or wrongful
              death to the extent applicable law prohibits arbitration or
              waiver of judicial remedies; or
            </li>
            <li>
              Any other claim that applicable law requires to remain
              outside arbitration.
            </li>
          </ul>

          <h3>9.6 Arbitration Opt-Out</h3>
          <p>
            If you are a first-time United States account holder, you may
            opt out of the arbitration provisions of this Section by
            providing written notice to{" "}
            <a
              href={`mailto:${E.SUPPORT_EMAIL}`}
              className="inline-link"
            >
              {E.SUPPORT_EMAIL}
            </a>{" "}
            within thirty (30) calendar days after you first accept these
            Terms.
          </p>
          <p>The notice must include:</p>
          <ul className="longform-list">
            <li>Your full name;</li>
            <li>Billing address;</li>
            <li>Email address associated with your account; and</li>
            <li>
              A clear statement that you wish to opt out of Section 9.
            </li>
          </ul>
          <p>
            Opting out of arbitration does not affect any other provision
            of these Terms.
          </p>

          <h3>9.7 Government and Regulatory Complaints</h3>
          <p>
            Nothing in this Section prevents you from submitting a
            complaint or report to the Federal Trade Commission, Consumer
            Financial Protection Bureau, a state attorney general, or
            another government or regulatory authority where applicable
            law permits such a complaint.
          </p>
        </section>

        <section id="termination">
          <h2>10. Termination and Suspension</h2>
          <p>
            You may terminate your account at any time by using the
            account-management functionality provided by Warm-Hello or by
            contacting Warm-Hello at{" "}
            <a
              href={`mailto:${E.SUPPORT_EMAIL}`}
              className="inline-link"
            >
              {E.SUPPORT_EMAIL}
            </a>
            .
          </p>
          <p>
            Warm-Hello may suspend or terminate access to the Service where
            reasonably necessary, including if:
          </p>
          <ul className="longform-list">
            <li>You materially breach these Terms;</li>
            <li>You fail to pay amounts properly due;</li>
            <li>
              You engage in fraud, abuse, harassment, unauthorized
              enrollment, or unlawful activity;
            </li>
            <li>
              Continued use presents an actual or reasonably anticipated
              legal, security, privacy, or safety risk;
            </li>
            <li>
              We are required to do so by law, regulation, court order, or
              other valid legal process; or
            </li>
            <li>The Service is discontinued.</li>
          </ul>
          <p>
            Where reasonably practicable, Warm-Hello may provide notice and
            an opportunity to cure a material breach before termination.
          </p>
          <p>
            Termination does not eliminate payment obligations that arose
            before termination.
          </p>
          <p>
            Sections concerning intellectual property, indemnification,
            limitations of liability, dispute resolution, privacy,
            confidentiality, and other provisions that by their nature
            should survive termination will survive.
          </p>
        </section>

        <section id="privacy-cross-border">
          <h2>11. Privacy and Cross-Border Data Processing</h2>
          <p>
            Your use of the Service is also governed by the Warm-Hello
            Privacy Policy, which is incorporated into these Terms by
            reference.
          </p>
          <p>
            Personal information may be stored or processed in Canada, the
            United States, or other jurisdictions where Warm-Hello or its
            service providers operate.
          </p>
          <p>
            When personal information is transferred to a jurisdiction
            outside the individual&rsquo;s home jurisdiction, Warm-Hello
            will take reasonable contractual, technical, and organizational
            measures appropriate to the circumstances to protect the
            information and comply with applicable privacy laws.
          </p>
          <p>
            Personal information processed in the United States may be
            subject to lawful access by U.S. federal, state, or local
            authorities under applicable U.S. law.
          </p>
          <p>
            Warm-Hello does not voluntarily disclose personal information
            to government authorities except where required or permitted by
            applicable law, valid legal process, or an applicable emergency
            or safety exception.
          </p>
          <p>
            Where legally permitted, Warm-Hello will use reasonable efforts
            to limit government requests to the information legally
            required and to notify affected individuals when legally
            permitted and reasonably practicable.
          </p>
          <p>
            Further information regarding privacy rights, data retention,
            security, cross-border processing, advertising technologies,
            and applicable privacy laws is provided in the{" "}
            <Link href="/privacy" className="inline-link">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section id="taxes">
          <h2>12. Taxes and Invoicing</h2>
          <p>
            Subscription prices are exclusive of applicable taxes unless
            expressly stated otherwise.
          </p>
          <p>
            Canadian customers may be charged applicable GST, HST, PST,
            QST, RST, or other applicable taxes depending on the customer&rsquo;s
            jurisdiction.
          </p>
          <p>
            United States customers may be charged applicable state and
            local sales taxes.
          </p>
          <p>
            Applicable taxes may be calculated and collected through Stripe
            or another payment-processing provider used by Warm-Hello.
          </p>
          <p>
            Warm-Hello may provide an electronic receipt or tax invoice
            through email or the customer&rsquo;s account dashboard.
          </p>
        </section>

        <section id="modifications">
          <h2>13. Modifications to the Terms</h2>
          <p>
            Warm-Hello may update these Terms from time to time to reflect
            changes in:
          </p>
          <ul className="longform-list">
            <li>Applicable law;</li>
            <li>The Service;</li>
            <li>Features;</li>
            <li>Pricing;</li>
            <li>Security practices;</li>
            <li>Business operations; or</li>
            <li>Other legitimate business requirements.</li>
          </ul>
          <p>
            Where a change is material, Warm-Hello will provide notice by
            an appropriate method where required by applicable law.
          </p>
          <p>The updated Terms will identify their effective date.</p>
          <p>
            If continued use of the Service after the effective date
            constitutes acceptance under applicable law, continued use may
            constitute acceptance of the updated Terms.
          </p>
          <p>
            If applicable law requires affirmative acceptance of a material
            change, Warm-Hello will obtain that acceptance.
          </p>
          <p>
            The version of the Terms applicable to a dispute will generally
            be the version in effect when the event giving rise to the
            dispute occurred, unless a later version was expressly accepted
            by the customer or applicable law provides otherwise.
          </p>
          <p>
            Prior versions may be retained by Warm-Hello for legal and
            recordkeeping purposes.
          </p>
        </section>

        <section id="contact">
          <h2>14. Contact, Legal Notices, and Compliance</h2>
          <p>
            For general questions, support, billing, privacy, or account
            matters:
          </p>
          <p style={{ margin: "6px 0 14px" }}>
            Email:{" "}
            <a
              href={`mailto:${E.SUPPORT_EMAIL}`}
              className="inline-link"
            >
              {E.SUPPORT_EMAIL}
            </a>
          </p>
          <p>
            For legal notices, privacy requests, CASL/TCPA matters,
            consumer complaints, or other compliance matters:
          </p>
          <address style={{ fontStyle: "normal", margin: "8px 0 16px" }}>
            <strong>10894796 Canada Inc.</strong> d/b/a Warm-Hello
            <br />
            Attn: Compliance Officer
            <br />
            53 Lancewood Cres
            <br />
            Brampton, Ontario, Canada L6S 5Y5
            <br />
            Email:{" "}
            <a
              href={`mailto:${E.SUPPORT_EMAIL}`}
              className="inline-link"
            >
              {E.SUPPORT_EMAIL}
            </a>
          </address>
          <p>
            Warm-Hello may require reasonable information to verify the
            identity and authority of a person submitting a privacy,
            account, or legal request.
          </p>
        </section>

        <section id="misc">
          <h2>15. Miscellaneous</h2>

          <h3>15.1 Entire Agreement</h3>
          <p>
            These Terms, the Privacy Policy, applicable service-specific
            terms, and any clickwrap or other acknowledgments accepted
            during account creation, onboarding, trial registration, or
            checkout constitute the agreement between you and Warm-Hello
            concerning the Service and supersede prior agreements
            concerning the same subject matter.
          </p>

          <h3>15.2 Severability</h3>
          <p>
            If any provision of these Terms is determined to be invalid,
            unlawful, or unenforceable, that provision will be enforced to
            the maximum extent permitted by law or modified to the minimum
            extent necessary to make it enforceable.
          </p>
          <p>The remaining provisions will remain in full force and effect.</p>

          <h3>15.3 No Waiver</h3>
          <p>
            A failure or delay by either party to exercise a right or
            remedy does not constitute a waiver of that right or remedy.
          </p>

          <h3>15.4 Assignment</h3>
          <p>
            You may not assign or transfer these Terms or your rights under
            them without Warm-Hello&rsquo;s prior written consent, except
            where applicable law permits otherwise.
          </p>
          <p>
            Warm-Hello may assign these Terms in connection with a merger,
            acquisition, corporate restructuring, sale of assets, or
            similar transaction, provided the assignee assumes applicable
            obligations.
          </p>

          <h3>15.5 Force Majeure</h3>
          <p>
            Warm-Hello will not be responsible for delays or failures
            caused by circumstances beyond its reasonable control,
            including telecommunications failures, carrier outages,
            internet failures, cloud-service outages, natural disasters,
            acts of government, labor disputes, cyber incidents, power
            failures, or other events beyond Warm-Hello&rsquo;s reasonable
            control.
          </p>
          <p>
            Nothing in this Section limits liability that cannot legally
            be excluded.
          </p>

          <h3>15.6 No Third-Party Beneficiaries</h3>
          <p>
            Except where expressly stated otherwise, these Terms do not
            create rights for any person who is not a party to these Terms.
          </p>

          <h3>15.7 Electronic Communications</h3>
          <p>
            You agree that Warm-Hello may provide notices, receipts,
            account communications, legal notices, and other communications
            electronically where permitted by applicable law.
          </p>
          <p>
            You are responsible for maintaining a current email address
            and other contact information associated with your account.
          </p>

          <h3>15.8 Language</h3>
          <p>These Terms are provided in English.</p>
          <p>
            Where applicable law requires Warm-Hello to provide a
            French-language version or otherwise restricts the use of
            English in consumer contracts, Warm-Hello will comply with
            those requirements.
          </p>
          <p>
            Nothing in these Terms is intended to waive or restrict
            mandatory language rights.
          </p>

          <h3>15.9 Headings</h3>
          <p>
            Section headings are provided for convenience only and do not
            affect the interpretation of these Terms.
          </p>

          <h3>15.10 Interpretation</h3>
          <p>
            Words in the singular include the plural and vice versa where
            the context requires.
          </p>
          <p>
            The terms &ldquo;including&rdquo; and &ldquo;includes&rdquo;
            mean &ldquo;including without limitation.&rdquo;
          </p>
          <p>
            Nothing in these Terms is intended to waive, exclude, or limit
            a right or protection that cannot legally be waived, excluded,
            or limited.
          </p>
        </section>

        <p
          style={{
            marginTop: 32,
            paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            color: "#7b829a",
            fontSize: "13px",
            lineHeight: 1.8,
          }}
        >
          <strong style={{ color: "#a8b0c5" }}>Warm-Hello</strong>
          <br />
          10894796 Canada Inc.
          <br />
          53 Lancewood Cres, Brampton, Ontario, Canada L6S 5Y5
          <br />
          <a
            href={`mailto:${E.SUPPORT_EMAIL}`}
            className="inline-link"
            style={{ color: "#7b829a" }}
          >
            {E.SUPPORT_EMAIL}
          </a>
        </p>
      </article>
    </main>
  );
}
