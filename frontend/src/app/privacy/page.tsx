import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { APP_NAME, APP_DOMAIN } from '@/lib/constants';

export const metadata = {
  title: 'Privacy Policy',
  description: `Privacy Policy for ${APP_NAME} — how we collect, use, and protect your data when you use our YouTube downloading service.`,
};

const sections = [
  {
    title: '1. Information We Collect',
    content:
      `When you use ${APP_NAME}, we collect the following information: (a) The YouTube URL you submit for processing — this is required to provide the download service; (b) Basic usage data such as download timestamps and file formats selected, which helps us improve the service; (c) Technical data including your IP address, browser type, and operating system for analytics and security purposes. We do not require you to create an account or provide personal identification to use the service.`,
  },
  {
    title: '2. How We Use Your Information',
    content:
      `The information we collect is used solely to: (a) Process your download requests; (b) Improve and optimize the service; (c) Monitor for abuse, security threats, and terms of service violations; (d) Compile anonymous usage statistics. We do not sell, rent, or share your personal information with third parties for their marketing purposes.`,
  },
  {
    title: '3. Data Storage and Retention',
    content:
      'Downloaded files are temporarily stored on our servers (Cloudflare R2) to facilitate delivery. Files are automatically deleted after a short retention period. We do not permanently store the content of your downloads. Log data, including IP addresses and access times, is retained for a limited period for security and analytics purposes before being anonymized or deleted.',
  },
  {
    title: '4. Cookies and Tracking',
    content:
      `${APP_NAME} uses minimal cookies and local storage solely for functional purposes — such as remembering your download history locally in your browser. We do not use third-party tracking cookies for advertising purposes. Analytics data is collected in an anonymized manner to help us understand usage patterns and improve the service.`,
  },
  {
    title: '5. Third-Party Services',
    content:
      `${APP_NAME} uses the following third-party services: (a) Cloudflare R2 for temporary file storage and CDN delivery; (b) YouTube Data API for fetching video metadata. Each third party has its own privacy policy governing data handling. We ensure that only the minimum necessary data is shared with these services.`,
  },
  {
    title: '6. Data Security',
    content:
      'We implement reasonable technical and organizational measures to protect your data against unauthorized access, alteration, disclosure, or destruction. These include encryption in transit (HTTPS), access controls on our infrastructure, and regular security reviews. However, no method of transmission over the Internet is 100% secure.',
  },
  {
    title: '7. Your Rights',
    content:
      'Depending on your jurisdiction, you may have the right to: (a) Access the personal data we hold about you; (b) Request deletion of your data; (c) Object to or restrict processing; (d) Withdraw consent where processing is based on consent. To exercise these rights, please contact us using the information below.',
  },
  {
    title: '8. Changes to This Policy',
    content:
      'We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically to stay informed about how we are protecting your information.',
  },
  {
    title: '9. Contact',
    content:
      'If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at manish.kumar@modifyly.in.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-950">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-surface-100 mb-4">
              Privacy Policy
            </h1>
            <p className="text-surface-400 text-sm">
              Last updated: June 1, 2026
            </p>
          </div>

          {/* Content */}
          <div className="glass rounded-2xl p-6 sm:p-10 divide-y divide-(--border-subtle)">
            {sections.map((section) => (
              <div key={section.title} className="py-6 first:pt-0 last:pb-0">
                <h2 className="text-lg font-semibold text-surface-100 mb-3">
                  {section.title}
                </h2>
                <p className="text-sm text-surface-400 leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* Back link */}
          <div className="text-center mt-8">
            <Link
              href="/"
              className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
            >
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
