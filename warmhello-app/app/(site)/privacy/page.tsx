import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_ENTITY_PLACEHOLDERS } from "@/lib/legal-placeholders";
import {
  PrivacyChoicesInlineButton,
  PrivacyChoicesInlineLink,
} from "@/components/privacy-choices-inline";

export const metadata: Metadata = {
  title: "Privacy Policy · Warm-Hello",
  description:
    "Privacy Policy for Warm-Hello. This Privacy Policy explains how 10894796 Canada Inc., doing business as Warm-Hello, collects, uses, discloses, retains, and protects personal information when you use the Warm-Hello website, applications, products, and services.",
  robots: "noindex,nofollow",
};

const E = LEGAL_ENTITY_PLACEHOLDERS;

export default function PrivacyPage() {
  const lastUpdated = "August 29, 2026";

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
        <p>
          This Privacy Policy explains how <strong>10894796 Canada Inc.</strong>,
          doing business as Warm-Hello (&ldquo;Warm-Hello,&rdquo; &ldquo;we,&rdquo;
          &ldquo;us,&rdquo; or &ldquo;our&rdquo;), collects, uses, discloses,
          retains, and protects personal information when you use the Warm-Hello
          website, applications, products, and services (collectively, the
          &ldquo;Service&rdquo;).
        </p>
        <p>
          10894796 Canada Inc. is a corporation incorporated under the federal
          laws of Canada.
        </p>
        <address style={{ fontStyle: "normal", margin: "8px 0 4px" }}>
          <strong>Mailing Address:</strong>
          <br />
          53 Lancewood Cres
          <br />
          Brampton, Ontario, Canada
          <br />
          L6S 5Y5
        </address>
        <p>
          <strong>Privacy Contact:</strong>{" "}
          <a
            href={`mailto:${E.SUPPORT_EMAIL}`}
            className="inline-link"
          >
            {E.SUPPORT_EMAIL}
          </a>
        </p>
        <p>
          This Privacy Policy applies to users in Canada, the United States,
          and other jurisdictions where Warm-Hello makes the Service available.
        </p>
        <p>
          By using the Service, you acknowledge that you have read this Privacy
          Policy. Where applicable law requires consent to a particular
          processing activity, Warm-Hello will obtain that consent through an
          appropriate mechanism.
        </p>

        <section id="important-info">
          <h2>1. Important Information About Warm-Hello</h2>
          <p>
            Warm-Hello is a communication and check-in service designed to help
            individuals maintain routine check-ins with designated personal
            contacts.
          </p>
          <p>
            Warm-Hello is <strong>not</strong> a medical alert system, medical
            monitoring service, personal emergency response system (PERS),
            healthcare service, or emergency-response service.
          </p>
          <p>
            Warm-Hello does not determine whether a person is safe, healthy,
            injured, ill, incapacitated, or experiencing an emergency.
          </p>
          <p>
            A missed check-in does not mean that an emergency has occurred.
          </p>
          <p>
            Warm-Hello does not contact 911, police, fire departments,
            ambulance services, hospitals, physicians, or other
            emergency-response organizations on behalf of users.
          </p>
          <p>
            In an actual or suspected emergency, users should immediately
            contact 911 or the applicable local emergency service.
          </p>
        </section>

        <section id="collected">
          <h2>2. Information We Collect</h2>
          <p>
            The information we collect depends on how you interact with
            Warm-Hello.
          </p>

          <h3>2.1 Account Information</h3>
          <p>When you create an account, we may collect:</p>
          <ul className="longform-list">
            <li>Name;</li>
            <li>Email address;</li>
            <li>Password or authentication information;</li>
            <li>Telephone number;</li>
            <li>Account preferences;</li>
            <li>Subscription information;</li>
            <li>Billing status;</li>
            <li>Country or province/state;</li>
            <li>Time zone;</li>
            <li>Account creation date; and</li>
            <li>
              Other information necessary to establish and administer your
              account.
            </li>
          </ul>

          <h3>2.2 Senior Information</h3>
          <p>
            If you use Warm-Hello to enroll another person as a Senior, we may
            collect information such as:
          </p>
          <ul className="longform-list">
            <li>Senior&rsquo;s name;</li>
            <li>Senior&rsquo;s telephone number;</li>
            <li>Preferred check-in schedule;</li>
            <li>Check-in preferences;</li>
            <li>Time zone;</li>
            <li>Notification preferences;</li>
            <li>Check-in response status; and</li>
            <li>Other information necessary to provide the Service.</li>
          </ul>
          <p>
            You are responsible for obtaining any consent or authorization
            required before providing another person&rsquo;s personal
            information to Warm-Hello.
          </p>

          <h3>2.3 Emergency Contact Information</h3>
          <p>
            We may collect information about designated personal contacts,
            including:
          </p>
          <ul className="longform-list">
            <li>Name;</li>
            <li>Telephone number;</li>
            <li>Email address;</li>
            <li>Relationship to the Senior, if provided;</li>
            <li>Notification preferences; and</li>
            <li>Notification or communication status.</li>
          </ul>
          <p>
            You must only provide emergency-contact information for individuals
            who have authorized you to provide their information to Warm-Hello
            and who have agreed to receive applicable notifications.
          </p>
          <p>
            Warm-Hello does not verify whether an emergency contact is
            qualified, available, or capable of responding to a notification.
          </p>

          <h3>2.4 Check-In Information</h3>
          <p>
            Warm-Hello may collect information necessary to operate the
            check-in functionality, including:
          </p>
          <ul className="longform-list">
            <li>Date and time a check-in was scheduled;</li>
            <li>Date and time a check-in message was sent;</li>
            <li>Whether a response was received;</li>
            <li>Date and time a response was received;</li>
            <li>Whether a scheduled check-in was missed;</li>
            <li>Notification status;</li>
            <li>
              Delivery status where provided by telecommunications or
              messaging providers; and
            </li>
            <li>Related technical logs.</li>
          </ul>
          <p>
            A check-in response or missed check-in is an operational event. It
            is not a medical, health, safety, or emergency determination.
          </p>

          <h3>2.5 Communications</h3>
          <p>
            We may collect and retain information concerning communications
            with Warm-Hello, including:
          </p>
          <ul className="longform-list">
            <li>Customer-support requests;</li>
            <li>Emails;</li>
            <li>Feedback;</li>
            <li>Communications with our support personnel;</li>
            <li>Requests to cancel an account;</li>
            <li>Billing inquiries; and</li>
            <li>Other communications you voluntarily provide.</li>
          </ul>
          <p>
            Warm-Hello&rsquo;s operational SMS functionality is intended to
            facilitate check-ins and notifications.
          </p>

          <h3>2.6 Payment Information</h3>
          <p>
            Payments may be processed by Stripe or another third-party payment
            processor.
          </p>
          <p>
            Warm-Hello does not intentionally store complete payment-card
            numbers.
          </p>
          <p>We may receive and retain information such as:</p>
          <ul className="longform-list">
            <li>Transaction amount;</li>
            <li>Currency;</li>
            <li>Subscription type;</li>
            <li>Billing status;</li>
            <li>Transaction date;</li>
            <li>Payment status;</li>
            <li>
              Last four digits of a payment card, where provided by the
              payment processor;
            </li>
            <li>Card brand;</li>
            <li>Billing country; and</li>
            <li>
              Other transaction information supplied by the payment processor.
            </li>
          </ul>
          <p>
            Payment processors may separately collect and process payment
            information under their own privacy policies and terms.
          </p>

          <h3>2.7 Device and Technical Information</h3>
          <p>
            When you access the Service, we may automatically collect technical
            information, including:
          </p>
          <ul className="longform-list">
            <li>IP address;</li>
            <li>Browser type;</li>
            <li>Operating system;</li>
            <li>Device type;</li>
            <li>Device identifiers;</li>
            <li>Language settings;</li>
            <li>Time zone;</li>
            <li>Approximate geographic location derived from IP address;</li>
            <li>Pages or screens viewed;</li>
            <li>Referring website;</li>
            <li>Dates and times of access;</li>
            <li>Session information;</li>
            <li>Error logs;</li>
            <li>Diagnostic information;</li>
            <li>Security information; and</li>
            <li>
              Other technical information necessary to operate, secure, and
              improve the Service.
            </li>
          </ul>

          <h3>2.8 Cookies and Similar Technologies</h3>
          <p>
            We may use cookies, pixels, tags, SDKs, local storage, APIs, and
            similar technologies.
          </p>
          <p>These technologies may be used for:</p>
          <ul className="longform-list">
            <li>Authentication;</li>
            <li>Security;</li>
            <li>Fraud prevention;</li>
            <li>Account functionality;</li>
            <li>Preferences;</li>
            <li>Analytics;</li>
            <li>Performance monitoring;</li>
            <li>Conversion measurement;</li>
            <li>Advertising;</li>
            <li>Retargeting;</li>
            <li>Campaign attribution; and</li>
            <li>Website and Service improvement.</li>
          </ul>
          <p>
            Where applicable law requires consent before non-essential
            technologies are used, Warm-Hello will obtain the required consent.
          </p>
        </section>

        <section id="how-used">
          <h2>3. How We Use Personal Information</h2>
          <p>
            We may use personal information for the following purposes:
          </p>

          <h3>3.1 Providing the Service</h3>
          <p>We use personal information to:</p>
          <ul className="longform-list">
            <li>Create and manage accounts;</li>
            <li>Enroll Seniors;</li>
            <li>Schedule check-ins;</li>
            <li>Send check-in prompts;</li>
            <li>Receive check-in responses;</li>
            <li>Identify missed check-ins;</li>
            <li>Send missed-check-in notifications;</li>
            <li>Send account communications;</li>
            <li>Provide customer support;</li>
            <li>Process subscriptions;</li>
            <li>Process payments;</li>
            <li>Maintain account security; and</li>
            <li>
              Otherwise provide functionality requested by the customer.
            </li>
          </ul>

          <h3>3.2 Security and Fraud Prevention</h3>
          <p>We may use information to:</p>
          <ul className="longform-list">
            <li>Detect and prevent fraud;</li>
            <li>Detect unauthorized access;</li>
            <li>Protect accounts;</li>
            <li>Investigate security incidents;</li>
            <li>Prevent abuse;</li>
            <li>Maintain system integrity; and</li>
            <li>Protect Warm-Hello, users, and third parties.</li>
          </ul>

          <h3>3.3 Analytics and Improvement</h3>
          <p>We may use information to:</p>
          <ul className="longform-list">
            <li>Understand how users interact with the Service;</li>
            <li>Identify technical problems;</li>
            <li>Improve features;</li>
            <li>Improve usability;</li>
            <li>Measure performance;</li>
            <li>Conduct internal analysis; and</li>
            <li>Develop and improve the Service.</li>
          </ul>

          <h3>3.4 Communications</h3>
          <p>
            We may use contact information to provide:
          </p>
          <ul className="longform-list">
            <li>Transactional communications;</li>
            <li>Operational communications;</li>
            <li>Security notifications;</li>
            <li>Account notices;</li>
            <li>Billing notices;</li>
            <li>Service announcements;</li>
            <li>Customer support; and</li>
            <li>Marketing communications where legally permitted.</li>
          </ul>

          <h3>3.5 Advertising and Marketing</h3>
          <p>
            Warm-Hello may use advertising and measurement services to:
          </p>
          <ul className="longform-list">
            <li>Advertise Warm-Hello;</li>
            <li>Measure advertising effectiveness;</li>
            <li>Measure website conversions;</li>
            <li>Understand campaign performance;</li>
            <li>Attribute registrations or purchases to advertising campaigns;</li>
            <li>Limit repetitive advertisements;</li>
            <li>Detect fraudulent advertising activity;</li>
            <li>Build or use permitted audience segments; and</li>
            <li>Improve advertising campaigns.</li>
          </ul>
          <p>
            Warm-Hello may advertise through services operated by third
            parties, including Google and Meta.
          </p>
          <p>
            Warm-Hello will operate advertising technologies in accordance
            with applicable privacy laws and applicable consent or opt-out
            requirements.
          </p>
        </section>

        <section id="advertising-analytics">
          <h2>4. Advertising, Google, Meta, Analytics, and Retargeting</h2>
          <p>
            Warm-Hello may use third-party advertising and analytics
            technologies on its website and other digital properties.
          </p>
          <p>
            These technologies may include cookies, pixels, tags, APIs, SDKs,
            conversion tracking, and similar technologies.
          </p>
          <p>
            Depending on the technology and applicable law, information may
            include:
          </p>
          <ul className="longform-list">
            <li>IP address;</li>
            <li>Browser information;</li>
            <li>Device information;</li>
            <li>Cookie identifiers;</li>
            <li>Advertising identifiers;</li>
            <li>Pages visited;</li>
            <li>Website interactions;</li>
            <li>Advertisement interactions;</li>
            <li>Conversion events;</li>
            <li>Approximate location;</li>
            <li>Referring URL;</li>
            <li>Date and time of activity; and</li>
            <li>Other technical or usage information.</li>
          </ul>
          <p>
            Warm-Hello may use this information to measure advertising
            campaigns, understand website traffic, and deliver or measure
            advertisements.
          </p>
          <p>
            Warm-Hello may use Google Ads, Google Analytics, Meta advertising
            technologies, and comparable advertising or analytics services.
          </p>
          <p>
            Third-party advertising providers may process information according
            to their own privacy policies.
          </p>
          <p>
            Warm-Hello does not intentionally provide advertising platforms
            with:
          </p>
          <ul className="longform-list">
            <li>Senior check-in message contents;</li>
            <li>
              SMS opt-in or consent records for independent advertising
              purposes;
            </li>
            <li>
              Emergency-contact information for independent advertising
              purposes;
            </li>
            <li>Medical information; or</li>
            <li>Detailed health information</li>
          </ul>
          <p>
            for those platforms&rsquo; independent advertising or
            behavioral-targeting purposes.
          </p>
          <p>
            Warm-Hello will not intentionally use the contents of private
            Senior check-in communications to create advertising audiences.
          </p>
          <p>
            Where applicable law requires consent before advertising or
            analytics technologies are activated, Warm-Hello will obtain the
            required consent.
          </p>
          <p>
            Where applicable law provides a right to opt out of targeted
            advertising, sale, sharing, or similar processing, Warm-Hello will
            provide the applicable mechanism.
          </p>
        </section>

        <section id="cookies-choices">
          <h2>5. Cookies and Privacy Choices</h2>
          <p>
            Warm-Hello may use the following categories of technologies.
          </p>

          <h3>5.1 Strictly Necessary Technologies</h3>
          <p>These technologies may be necessary to:</p>
          <ul className="longform-list">
            <li>Authenticate users;</li>
            <li>Maintain account sessions;</li>
            <li>Protect accounts;</li>
            <li>Prevent fraud;</li>
            <li>Maintain security;</li>
            <li>Process transactions;</li>
            <li>Store required preferences; and</li>
            <li>Provide core Service functionality.</li>
          </ul>
          <p>
            Where permitted by law, strictly necessary technologies may
            operate without consent because they are necessary to provide the
            Service requested by the user.
          </p>

          <h3>5.2 Analytics Technologies</h3>
          <p>Analytics technologies help us understand:</p>
          <ul className="longform-list">
            <li>Website traffic;</li>
            <li>Product usage;</li>
            <li>Technical performance;</li>
            <li>Conversion rates;</li>
            <li>User journeys; and</li>
            <li>Advertising effectiveness.</li>
          </ul>
          <p>
            Where legally required, non-essential analytics technologies will
            only be activated after the required consent is obtained.
          </p>

          <h3>5.3 Advertising Technologies</h3>
          <p>Advertising technologies may be used for:</p>
          <ul className="longform-list">
            <li>Advertising;</li>
            <li>Retargeting;</li>
            <li>Conversion measurement;</li>
            <li>Campaign attribution;</li>
            <li>Audience measurement;</li>
            <li>Fraud prevention; and</li>
            <li>Advertising optimization.</li>
          </ul>
          <p>
            Where required by applicable law, users will be given the ability
            to consent to or decline applicable technologies.
          </p>

          <h3>5.4 Your Privacy Choices</h3>
          <p>Depending on your jurisdiction, Warm-Hello may provide:</p>
          <ul className="longform-list">
            <li>A cookie consent banner;</li>
            <li>A privacy preference center;</li>
            <li>
              A &ldquo;Your Privacy Choices&rdquo; link (click{" "}
              <strong>
                <PrivacyChoicesInlineLink />
              </strong>{" "}
              to open it now);
            </li>
            <li>An opt-out mechanism for targeted advertising;</li>
            <li>
              An opt-out mechanism for the sale or sharing of personal
              information where applicable; or
            </li>
            <li>Other legally required privacy controls.</li>
          </ul>
          <div
            style={{
              margin: "18px 0",
              padding: "14px 18px",
              border: "1px solid rgba(255,214,102,0.25)",
              background: "rgba(255,214,102,0.06)",
              borderRadius: 12,
            }}
          >
            <p style={{ margin: 0 }}>
              <strong>Open the Warm-Hello preference center:</strong>{" "}
            </p>
            <div style={{ marginTop: 10 }}>
              <PrivacyChoicesInlineButton />
            </div>
            <p className="section-meta" style={{ margin: "10px 0 0" }}>
              Covers: Strictly Necessary (always on), Analytics, Targeted
              Advertising, and Sale / Sharing of Personal Information. Your
              choices are stored locally and persist until you change or reset
              them.
            </p>
          </div>
          <p>
            You may also configure your browser to restrict certain cookies.
          </p>
          <p>
            Disabling certain technologies may affect the functionality of the
            website or Service.
          </p>
        </section>

        <section id="disclosure">
          <h2>6. How We Disclose Personal Information</h2>
          <p>
            We may disclose personal information to the following categories of
            recipients where reasonably necessary for the purposes described in
            this Privacy Policy.
          </p>

          <h3>6.1 Service Providers</h3>
          <p>
            We may disclose information to vendors and service providers that
            help us operate the Service, including providers for:
          </p>
          <ul className="longform-list">
            <li>Cloud hosting;</li>
            <li>Database infrastructure;</li>
            <li>SMS and telecommunications;</li>
            <li>Email delivery;</li>
            <li>Payment processing;</li>
            <li>Customer support;</li>
            <li>Security;</li>
            <li>Analytics;</li>
            <li>Advertising;</li>
            <li>Website infrastructure;</li>
            <li>Software development;</li>
            <li>Error monitoring;</li>
            <li>Fraud prevention; and</li>
            <li>Other business functions.</li>
          </ul>
          <p>
            Service providers are expected to process personal information only
            for authorized purposes and in accordance with applicable
            contractual obligations.
          </p>

          <h3>6.2 Designated Contacts</h3>
          <p>
            Where the Service is configured to send a notification to a
            designated contact, the applicable information may be disclosed to
            that contact.
          </p>
          <p>For example, a missed-check-in notification may disclose:</p>
          <ul className="longform-list">
            <li>The Senior&rsquo;s name;</li>
            <li>
              The fact that a scheduled check-in response was not received; and
            </li>
            <li>
              Information necessary to identify or understand the notification.
            </li>
          </ul>
          <p>
            Warm-Hello does not disclose medical diagnoses or detailed medical
            records through routine check-in notifications.
          </p>

          <h3>6.3 Payment Providers</h3>
          <p>
            Payment information may be disclosed to payment processors for
            purposes including:
          </p>
          <ul className="longform-list">
            <li>Processing transactions;</li>
            <li>Verifying payments;</li>
            <li>Preventing fraud;</li>
            <li>Managing subscriptions;</li>
            <li>Processing refunds; and</li>
            <li>Maintaining payment records.</li>
          </ul>

          <h3>6.4 Advertising and Analytics Providers</h3>
          <p>
            We may disclose technical, usage, and advertising-related
            information to analytics and advertising providers as described in
            this Privacy Policy.
          </p>
          <p>
            We will not intentionally disclose Senior check-in message
            content, medical information, or emergency-contact information to
            advertising providers for their independent advertising purposes.
          </p>

          <h3>6.5 Legal and Regulatory Disclosure</h3>
          <p>
            We may disclose personal information where reasonably necessary to:
          </p>
          <ul className="longform-list">
            <li>Comply with applicable law;</li>
            <li>Respond to valid legal process;</li>
            <li>
              Respond to subpoenas, warrants, court orders, or governmental
              requests;
            </li>
            <li>Protect our legal rights;</li>
            <li>Investigate fraud or abuse;</li>
            <li>
              Protect the safety or security of users or the public; or
            </li>
            <li>Prevent or investigate suspected unlawful activity.</li>
          </ul>
          <p>
            Where legally permitted, we may seek to limit requests to
            information reasonably necessary for the applicable legal purpose.
          </p>
          <p>
            Where legally permitted and reasonably practicable, we may provide
            notice to affected individuals concerning certain government or
            legal requests.
          </p>

          <h3>6.6 Business Transfers</h3>
          <p>
            Personal information may be disclosed or transferred as part of:
          </p>
          <ul className="longform-list">
            <li>A merger;</li>
            <li>Acquisition;</li>
            <li>Corporate reorganization;</li>
            <li>Financing;</li>
            <li>Sale of assets;</li>
            <li>Sale of the company; or</li>
            <li>Similar business transaction.</li>
          </ul>
          <p>
            Where required by applicable law, Warm-Hello will provide notice
            and/or obtain consent for such a transfer.
          </p>

          <h3>6.7 With Your Direction or Consent</h3>
          <p>
            We may disclose personal information when you direct us to do so
            or where you have provided applicable consent.
          </p>
        </section>

        <section id="sms-text">
          <h2>7. SMS and Text Messaging</h2>
          <p>
            Warm-Hello may use SMS messaging to provide check-in prompts,
            missed-check-in notifications, account communications, and other
            operational communications.
          </p>
          <p>
            SMS delivery depends on third-party telecommunications carriers,
            networks, devices, and other infrastructure.
          </p>
          <p>Warm-Hello does not guarantee that any SMS message will be:</p>
          <ul className="longform-list">
            <li>Delivered;</li>
            <li>Delivered on time;</li>
            <li>Received;</li>
            <li>Read;</li>
            <li>Heard;</li>
            <li>Understood; or</li>
            <li>Responded to.</li>
          </ul>
          <p>
            Warm-Hello does not sell, rent, license, or provide SMS opt-in
            information or text-message consent records to third parties for
            their own marketing purposes.
          </p>
          <p>
            Operational SMS messages are intended to contain service-related
            information.
          </p>
          <p>
            Where applicable law requires consent, disclosures, or an opt-out
            mechanism for a particular communication, Warm-Hello will comply
            with those requirements.
          </p>
          <p>
            Recipients may use available unsubscribe mechanisms, including
            STOP where applicable, to stop eligible SMS communications.
          </p>
          <p>
            HELP may be used where supported to request assistance.
          </p>
          <p>
            Stopping SMS communications may prevent Warm-Hello from
            functioning as intended.
          </p>
          <p>Standard message and data rates may apply.</p>
        </section>

        <section id="health-info">
          <h2>8. Health and Medical Information</h2>
          <p>
            Warm-Hello is not designed to collect, maintain, or process medical
            records or detailed health information.
          </p>
          <p>Warm-Hello does not intentionally solicit:</p>
          <ul className="longform-list">
            <li>Diagnoses;</li>
            <li>Medical records;</li>
            <li>Treatment information;</li>
            <li>Medication information;</li>
            <li>Physician instructions;</li>
            <li>Insurance information;</li>
            <li>Detailed medical history; or</li>
            <li>Other sensitive medical or health information.</li>
          </ul>
          <p>
            Users should not enter or transmit such information through the
            Service.
          </p>
          <p>
            If health or medical information is voluntarily submitted despite
            these restrictions, Warm-Hello may delete or remove that
            information where reasonably practicable and may take other
            appropriate measures.
          </p>
          <p>
            Warm-Hello does not intentionally use Senior health information
            for advertising or behavioral targeting.
          </p>
          <p>
            Warm-Hello is not a HIPAA-covered entity or business associate
            solely by virtue of providing the Service. The Service should not
            be used to transmit information that is required to be handled
            through a HIPAA-compliant system.
          </p>
          <p>
            Nothing in this section is intended to exclude any privacy or
            data-protection obligation that applies to Warm-Hello under
            applicable law.
          </p>
        </section>

        <section id="children">
          <h2>9. Children&rsquo;s Privacy</h2>
          <p>The Service is intended for adults.</p>
          <p>
            Warm-Hello does not knowingly collect personal information from
            children under 13 in the United States or from children below the
            applicable age of consent in other jurisdictions where applicable
            law imposes a higher age requirement, without legally required
            parental or guardian consent.
          </p>
          <p>
            If we learn that we have collected personal information from a
            child in circumstances where collection was not legally permitted,
            we will take reasonable steps to delete the information.
          </p>
          <p>
            Parents or legal guardians who believe a child has provided
            personal information to Warm-Hello may contact us at:
          </p>
          <p style={{ margin: "4px 0 6px" }}>
            <a
              href={`mailto:${E.SUPPORT_EMAIL}`}
              className="inline-link"
            >
              {E.SUPPORT_EMAIL}
            </a>
          </p>
        </section>

        <section id="retention">
          <h2>10. Data Retention</h2>
          <p>
            Warm-Hello retains personal information for as long as reasonably
            necessary to:
          </p>
          <ul className="longform-list">
            <li>Provide the Service;</li>
            <li>Maintain accounts;</li>
            <li>Process subscriptions;</li>
            <li>Maintain transaction records;</li>
            <li>Provide customer support;</li>
            <li>Meet legal and regulatory obligations;</li>
            <li>Resolve disputes;</li>
            <li>Enforce agreements;</li>
            <li>Prevent fraud;</li>
            <li>Maintain security; and</li>
            <li>Protect legitimate business interests.</li>
          </ul>
          <p>
            Retention periods vary depending on the type of information and
            the purpose for which it was collected.
          </p>
          <p>
            When personal information is no longer reasonably required,
            Warm-Hello will take reasonable steps to delete, anonymize, or
            securely dispose of it, subject to applicable legal, regulatory,
            security, backup, and recordkeeping requirements.
          </p>
          <p>
            Backup copies may remain for a limited period after deletion in
            accordance with applicable backup and disaster-recovery procedures.
          </p>
        </section>

        <section id="security">
          <h2>11. Security</h2>
          <p>
            Warm-Hello uses reasonable administrative, technical, and
            organizational safeguards designed to protect personal information
            against unauthorized access, use, disclosure, alteration, loss, or
            destruction.
          </p>
          <p>Depending on the circumstances, safeguards may include:</p>
          <ul className="longform-list">
            <li>Access controls;</li>
            <li>Authentication controls;</li>
            <li>Encryption in transit;</li>
            <li>
              Encryption or other protections for stored information where
              appropriate;
            </li>
            <li>Logging and monitoring;</li>
            <li>Security updates;</li>
            <li>Vendor controls;</li>
            <li>Least-privilege access;</li>
            <li>Backup and recovery procedures; and</li>
            <li>Incident-response procedures.</li>
          </ul>
          <p>
            No method of transmission, storage, or electronic security is
            completely secure.
          </p>
          <p>
            Accordingly, Warm-Hello cannot guarantee that personal information
            will never be accessed, disclosed, altered, lost, or destroyed
            through circumstances beyond our reasonable control.
          </p>
        </section>

        <section id="cross-border">
          <h2>12. Cross-Border Processing</h2>
          <p>
            Personal information may be stored or processed in Canada, the
            United States, or other jurisdictions where Warm-Hello or its
            service providers operate.
          </p>
          <p>
            When personal information is transferred to a jurisdiction outside
            the individual&rsquo;s home jurisdiction, Warm-Hello will take
            reasonable contractual, technical, and organizational measures
            appropriate to the circumstances to protect the information and
            comply with applicable privacy laws.
          </p>
          <p>
            Personal information processed in the United States may be subject
            to lawful access by U.S. federal, state, or local authorities under
            applicable U.S. law.
          </p>
          <p>
            Warm-Hello does not voluntarily disclose personal information to
            government authorities except where required or permitted by
            applicable law, valid legal process, or an applicable emergency or
            safety exception.
          </p>
          <p>
            Where legally permitted, Warm-Hello will use reasonable efforts to
            limit government requests to the information legally required and
            to notify affected individuals when legally permitted and
            reasonably practicable.
          </p>
          <p>
            Warm-Hello maintains written contractual privacy and security
            requirements for applicable service providers and limits provider
            access to personal information to purposes necessary to provide
            their contracted services.
          </p>
        </section>

        <section id="canadian-rights">
          <h2>13. Canadian Privacy Rights</h2>
          <p>
            Warm-Hello is committed to complying with applicable Canadian
            privacy legislation.
          </p>
          <p>
            Depending on the circumstances and jurisdiction, Canadian
            individuals may have rights concerning their personal information,
            including:
          </p>
          <ul className="longform-list">
            <li>The right to request access to personal information;</li>
            <li>
              The right to request correction of inaccurate information;
            </li>
            <li>The right to withdraw consent where permitted by law;</li>
            <li>
              The right to request information about how personal information
              is collected, used, and disclosed;
            </li>
            <li>The right to make a privacy complaint; and</li>
            <li>
              Other rights provided by applicable federal, provincial, or
              territorial privacy legislation.
            </li>
          </ul>
          <p>
            Warm-Hello will process privacy requests in accordance with the
            law applicable to the individual and the circumstances.
          </p>
          <p>
            Certain information may be exempt from access, correction,
            deletion, or other requests where an applicable legal exception
            applies.
          </p>
        </section>

        <section id="quebec-rights">
          <h2>14. Quebec Privacy Rights</h2>
          <p>
            If you are located in Quebec, additional rights may apply under
            Quebec privacy legislation, including the Act respecting the
            protection of personal information in the private sector and other
            applicable laws.
          </p>
          <p>
            Where applicable, individuals may have rights relating to:
          </p>
          <ul className="longform-list">
            <li>Access;</li>
            <li>Correction;</li>
            <li>Withdrawal of consent;</li>
            <li>
              Information concerning the use and disclosure of personal
              information;
            </li>
            <li>Data portability;</li>
            <li>Privacy impact assessments;</li>
            <li>Automated processing;</li>
            <li>Retention and destruction; and</li>
            <li>Other rights provided by Quebec law.</li>
          </ul>
          <p>
            Warm-Hello will comply with mandatory Quebec privacy requirements
            applicable to its activities.
          </p>
          <p>
            Nothing in this Privacy Policy is intended to waive or restrict a
            mandatory right provided by Quebec law.
          </p>
        </section>

        <section id="us-rights">
          <h2>15. United States Privacy Rights</h2>
          <p>
            Warm-Hello is committed to complying with applicable U.S. federal
            and state privacy laws.
          </p>
          <p>
            Depending on your state of residence and whether the applicable
            law applies to Warm-Hello, you may have rights concerning your
            personal information.
          </p>
          <p>These rights may include:</p>
          <ul className="longform-list">
            <li>The right to know or access personal information;</li>
            <li>The right to correct inaccurate personal information;</li>
            <li>
              The right to request deletion of personal information, subject
              to legal exceptions;
            </li>
            <li>
              The right to obtain a portable copy of certain personal
              information;
            </li>
            <li>The right to opt out of the sale of personal information;</li>
            <li>
              The right to opt out of sharing personal information for
              cross-context behavioral advertising or targeted advertising
              where applicable;
            </li>
            <li>
              The right to limit certain uses of sensitive personal
              information where applicable;
            </li>
            <li>
              The right to opt out of certain profiling or automated
              decision-making activities where applicable;
            </li>
            <li>
              The right to appeal certain privacy-request decisions where
              required;
            </li>
            <li>
              The right to use an authorized agent where permitted; and
            </li>
            <li>
              The right not to receive discriminatory treatment for
              exercising applicable privacy rights.
            </li>
          </ul>
          <p>
            Not every right applies in every jurisdiction or to every
            individual.
          </p>
        </section>

        <section id="california">
          <h2>16. California Residents</h2>
          <p>
            If you are a California resident and the California Consumer
            Privacy Act, as amended by the California Privacy Rights Act
            (collectively, the &ldquo;CCPA&rdquo;), applies to Warm-Hello, you
            may have rights including:
          </p>
          <ul className="longform-list">
            <li>
              The right to know and access personal information collected
              about you;
            </li>
            <li>
              The right to request deletion of personal information, subject
              to statutory exceptions;
            </li>
            <li>The right to correct inaccurate personal information;</li>
            <li>
              The right to obtain certain information in a portable format;
            </li>
            <li>The right to opt out of the sale of personal information;</li>
            <li>
              The right to opt out of the sharing of personal information for
              cross-context behavioral advertising;
            </li>
            <li>
              The right to limit certain uses of sensitive personal
              information, where applicable;
            </li>
            <li>
              The right to opt out of certain profiling or automated
              decision-making activities, where applicable;
            </li>
            <li>
              The right to appeal certain decisions concerning privacy
              requests; and
            </li>
            <li>
              The right not to be discriminated against for exercising CCPA
              rights.
            </li>
          </ul>

          <h3>16.1 Sale of Personal Information</h3>
          <p>
            Warm-Hello does not sell personal information for monetary
            consideration.
          </p>
          <p>
            Warm-Hello does not sell, rent, license, or otherwise provide SMS
            opt-in information or text-message consent records to third
            parties for their own marketing purposes.
          </p>

          <h3>16.2 Sharing for Advertising</h3>
          <p>
            Certain uses of third-party advertising, analytics, pixels,
            cookies, or similar technologies may constitute &ldquo;sharing&rdquo;
            under the CCPA even where Warm-Hello does not receive monetary
            consideration for the disclosure.
          </p>
          <p>
            If Warm-Hello engages in processing that constitutes &ldquo;sharing&rdquo;
            under the CCPA, Warm-Hello will provide the applicable opt-out
            mechanism.
          </p>
          <p>
            California residents may use the &ldquo;Your Privacy Choices&rdquo;
            mechanism provided on the Warm-Hello website where applicable:
          </p>
          <div style={{ margin: "10px 0 14px" }}>
            <PrivacyChoicesInlineButton />
          </div>

          <h3>16.3 Sensitive Personal Information</h3>
          <p>
            Warm-Hello does not intentionally collect detailed health
            information through the Service.
          </p>
          <p>
            Where sensitive personal information is collected or processed,
            Warm-Hello will handle that information in accordance with
            applicable California law.
          </p>

          <h3>16.4 Non-Discrimination</h3>
          <p>
            Warm-Hello will not discriminate against a California consumer for
            exercising rights protected by the CCPA.
          </p>

          <h3>16.5 Verification</h3>
          <p>
            Warm-Hello may require reasonable identity verification before
            completing certain privacy requests.
          </p>
          <p>
            The verification process will be designed to protect personal
            information against unauthorized disclosure.
          </p>
        </section>

        <section id="other-us-states">
          <h2>17. Other U.S. State Privacy Laws</h2>
          <p>
            Residents of states with comprehensive privacy legislation may
            have additional rights depending on:
          </p>
          <ul className="longform-list">
            <li>Their state of residence;</li>
            <li>The applicability of the relevant statute;</li>
            <li>The effective date of the statute;</li>
            <li>Applicable statutory thresholds; and</li>
            <li>The nature of Warm-Hello&rsquo;s activities.</li>
          </ul>
          <p>
            Warm-Hello will honor rights required by applicable state privacy
            laws.
          </p>
          <p>These rights may include rights concerning:</p>
          <ul className="longform-list">
            <li>Access;</li>
            <li>Correction;</li>
            <li>Deletion;</li>
            <li>Portability;</li>
            <li>Sale;</li>
            <li>Sharing;</li>
            <li>Targeted advertising;</li>
            <li>Sensitive personal information;</li>
            <li>Profiling;</li>
            <li>Appeals;</li>
            <li>Authorized agents; and</li>
            <li>Other rights provided by applicable state law.</li>
          </ul>
          <p>
            Where a state law provides a specific request deadline,
            verification procedure, appeal process, or other requirement,
            Warm-Hello will follow the applicable legal requirement.
          </p>
        </section>

        <section id="privacy-requests">
          <h2>18. Privacy Requests</h2>
          <p>To submit a privacy request, contact:</p>
          <address style={{ fontStyle: "normal", margin: "6px 0 10px" }}>
            <strong>Email:</strong>{" "}
            <a
              href={`mailto:${E.SUPPORT_EMAIL}`}
              className="inline-link"
            >
              {E.SUPPORT_EMAIL}
            </a>
            <br />
            <strong>Mail:</strong>
            <br />
            10894796 Canada Inc. d/b/a Warm-Hello
            <br />
            Attn: Privacy Officer
            <br />
            53 Lancewood Cres
            <br />
            Brampton, Ontario, Canada
            <br />
            L6S 5Y5
          </address>
          <p>
            When permitted by law, we may request information reasonably
            necessary to verify your identity before fulfilling a privacy
            request.
          </p>
          <p>
            If you use an authorized agent, we may require proof of
            authorization where permitted or required by applicable law.
          </p>
          <p>
            We will respond to valid privacy requests within the time required
            by applicable law.
          </p>
          <p>
            If additional time is legally permitted and reasonably necessary,
            we may extend the response period and provide the required notice.
          </p>
        </section>

        <section id="appeals">
          <h2>19. Appeals</h2>
          <p>
            Where applicable law provides a right to appeal a decision
            concerning a privacy request, you may submit an appeal by
            contacting:
          </p>
          <p style={{ margin: "4px 0 6px" }}>
            <a
              href={`mailto:${E.SUPPORT_EMAIL}`}
              className="inline-link"
            >
              {E.SUPPORT_EMAIL}
            </a>
          </p>
          <p>
            The appeal should identify the original request and explain why
            you believe the decision should be reconsidered.
          </p>
          <p>
            Warm-Hello will process the appeal in accordance with applicable
            law.
          </p>
        </section>

        <section id="do-not-track">
          <h2>20. Do Not Track</h2>
          <p>Some browsers provide &ldquo;Do Not Track&rdquo; signals.</p>
          <p>
            Because there is currently no universally accepted technical
            standard governing all Do Not Track signals, Warm-Hello may not
            respond to every such signal.
          </p>
          <p>
            Where applicable law requires Warm-Hello to recognize a
            browser-based or device-based opt-out preference signal,
            Warm-Hello will take reasonable steps to recognize and process
            the signal as required by applicable law.
          </p>
        </section>

        <section id="third-party-services">
          <h2>21. Third-Party Services and Websites</h2>
          <p>
            The Service may contain links to third-party websites,
            applications, or services.
          </p>
          <p>
            Warm-Hello does not control third-party privacy practices.
          </p>
          <p>
            Third-party services may collect, use, and disclose information
            under their own privacy policies.
          </p>
          <p>
            This Privacy Policy does not apply to independent third-party
            websites or services.
          </p>
          <p>
            You should review the privacy policies of third-party services
            before providing personal information to them.
          </p>
        </section>

        <section id="ad-platforms">
          <h2>22. Advertising Platforms</h2>
          <p>
            Warm-Hello may use third-party advertising platforms, including
            Google and Meta.
          </p>
          <p>
            These companies may independently process certain information
            according to their own privacy policies and terms.
          </p>
          <p>
            Warm-Hello does not control the independent privacy practices of
            third-party advertising platforms.
          </p>
          <p>
            Warm-Hello&rsquo;s use of advertising technologies is intended to
            comply with applicable law and the restrictions described in this
            Privacy Policy.
          </p>
        </section>

        <section id="business-records">
          <h2>23. Business and Legal Records</h2>
          <p>
            Warm-Hello may retain certain information for legitimate business
            and legal purposes, including:
          </p>
          <ul className="longform-list">
            <li>Transaction records;</li>
            <li>Subscription records;</li>
            <li>Tax records;</li>
            <li>Consent records;</li>
            <li>Communications records;</li>
            <li>Security logs;</li>
            <li>Privacy requests;</li>
            <li>Legal correspondence;</li>
            <li>Fraud-prevention records; and</li>
            <li>
              Records necessary to establish, exercise, or defend legal
              claims.
            </li>
          </ul>
          <p>
            Such information may be retained even after an account is closed
            where reasonably necessary for those purposes or where required by
            law.
          </p>
        </section>

        <section id="changes">
          <h2>24. Changes to This Privacy Policy</h2>
          <p>
            Warm-Hello may update this Privacy Policy from time to time.
          </p>
          <p>Changes may be made to reflect:</p>
          <ul className="longform-list">
            <li>Changes in applicable law;</li>
            <li>Changes to the Service;</li>
            <li>Changes to our business practices;</li>
            <li>New features;</li>
            <li>New service providers;</li>
            <li>Changes to advertising or analytics technologies;</li>
            <li>Security improvements; or</li>
            <li>Other legitimate business requirements.</li>
          </ul>
          <p>
            When we make material changes, we will provide notice through an
            appropriate method where required by applicable law.
          </p>
          <p>
            The updated Privacy Policy will include a revised effective date.
          </p>
          <p>
            Your continued use of the Service after the effective date of an
            updated Privacy Policy may constitute acknowledgment of the
            changes where permitted by applicable law.
          </p>
          <p>
            Where applicable law requires affirmative consent to a material
            change, Warm-Hello will obtain the required consent.
          </p>
        </section>

        <section id="contact">
          <h2>25. Contact Us</h2>
          <p>
            For privacy questions, requests, complaints, or concerns, contact:
          </p>
          <address style={{ fontStyle: "normal", margin: "6px 0 10px" }}>
            <strong>10894796 Canada Inc.</strong> d/b/a Warm-Hello
            <br />
            Attn: Privacy Officer
            <br />
            53 Lancewood Cres
            <br />
            Brampton, Ontario, Canada
            <br />
            L6S 5Y5
            <br />
            <strong>Email:</strong>{" "}
            <a
              href={`mailto:${E.SUPPORT_EMAIL}`}
              className="inline-link"
            >
              {E.SUPPORT_EMAIL}
            </a>
          </address>
          <p>
            We encourage users to contact us first so that we can attempt to
            address privacy concerns directly.
          </p>
          <p>
            Individuals may also have the right to file a complaint with the
            applicable privacy regulator or governmental authority in their
            jurisdiction.
          </p>
        </section>

        <section id="summary">
          <h2>26. Privacy Policy Summary</h2>
          <p>For clarity, the most important points are:</p>
          <ul className="longform-list">
            <li>
              Warm-Hello collects information necessary to provide its
              check-in and notification service.
            </li>
            <li>
              Warm-Hello does not intentionally collect detailed medical
              information.
            </li>
            <li>
              Warm-Hello is not an emergency or medical alert service.
            </li>
            <li>
              A missed check-in does not mean that an emergency has occurred.
            </li>
            <li>
              Warm-Hello does not contact 911 or emergency services.
            </li>
            <li>SMS delivery cannot be guaranteed.</li>
            <li>
              Personal information may be processed in Canada, the United
              States, and other jurisdictions where Warm-Hello or its service
              providers operate.
            </li>
            <li>
              Warm-Hello may use Google, Meta, analytics, advertising, and
              conversion-measurement technologies.
            </li>
            <li>
              Warm-Hello does not intentionally provide Senior check-in
              message contents, medical information, or emergency-contact
              information to advertising platforms for their independent
              advertising purposes.
            </li>
            <li>
              Warm-Hello does not sell personal information for monetary
              consideration.
            </li>
            <li>
              Warm-Hello does not sell, rent, license, or provide SMS opt-in
              information or text-message consent records to third parties for
              their own marketing purposes.
            </li>
            <li>
              Where applicable law provides privacy choices concerning
              targeted advertising, sale, sharing, or similar processing,
              Warm-Hello will provide the required mechanisms.
            </li>
            <li>
              Users may contact Warm-Hello at{" "}
              <a
                href={`mailto:${E.SUPPORT_EMAIL}`}
                className="inline-link"
              >
                {E.SUPPORT_EMAIL}
              </a>{" "}
              regarding privacy requests or concerns.
            </li>
          </ul>
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
          <strong style={{ color: "#a8b0c5" }}>10894796 Canada Inc.</strong> d/b/a
          Warm-Hello
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
