export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

      <div className="space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Acceptance of Terms</h2>
          <p>
            By accessing and using Limn Systems Enterprise, you accept and agree to be bound by
            the terms and provision of this agreement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Use of Service</h2>
          <p>
            Limn Systems Enterprise is a design and production management system for authorized
            users within your organization. You agree to use the service only for lawful purposes
            and in accordance with these terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Google Drive Integration</h2>
          <p>
            When you connect your Google Drive account to Limn Systems Enterprise:
          </p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>You authorize the application to create and manage files in a dedicated folder</li>
            <li>The application will only access files it creates, not your personal files</li>
            <li>You can revoke access at any time through Google Account settings</li>
            <li>Files stored in Google Drive remain subject to Google&apos;s Terms of Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">User Responsibilities</h2>
          <p>You agree to:</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>Maintain the confidentiality of your account credentials</li>
            <li>Notify administrators immediately of any unauthorized access</li>
            <li>Use the system only for business purposes within your organization</li>
            <li>Not attempt to access data belonging to other organizations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Data and File Storage</h2>
          <p>
            Files uploaded to the system are stored based on size:
          </p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>Files under 50MB: Stored in Supabase Storage</li>
            <li>Files 50MB and larger: Stored in your connected Google Drive</li>
          </ul>
          <p className="mt-2">
            You are responsible for ensuring you have appropriate rights to upload and store
            all files in the system.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Intellectual Property</h2>
          <p>
            You retain all rights to the content you upload. By uploading content, you grant
            Limn Systems the right to store, display, and process the content solely for the
            purpose of providing the service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Service Availability</h2>
          <p>
            While we strive to provide continuous service, we do not guarantee uninterrupted
            access. The service may be temporarily unavailable for maintenance, updates, or
            due to circumstances beyond our control.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Limitation of Liability</h2>
          <p>
            Limn Systems Enterprise is provided &quot;as is&quot; without warranties of any kind. We are
            not liable for any damages arising from use of the service, including but not limited
            to data loss, business interruption, or unauthorized access.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the service
            after changes constitutes acceptance of the modified terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Contact</h2>
          <p>
            For questions about these terms, contact: support@limn.us.com
          </p>
        </section>

        <footer className="mt-12 pt-6 border-t text-sm">
          <p>Last updated: October 1, 2025</p>
          <p className="mt-2">
            These terms apply to Limn Systems Enterprise application and comply with Google API
            Services User Data Policy.
          </p>
        </footer>
      </div>
    </div>
  );
}
