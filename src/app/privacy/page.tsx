export default function PrivacyPage() {
 return (
 <div className="page-container max-w-4xl">
 <div className="page-header">
 <h1 className="page-title">Privacy Policy</h1>
 </div>

 <div className="space-y-6 text-secondary">
 <section>
 <h2 className="text-2xl font-semibold text-primary mb-4">Information We Collect</h2>
 <p>
 Limn Systems Enterprise collects information necessary to provide design and production
 management services, including user account information, project data, and files uploaded
 to our system.
 </p>
 </section>

 <section>
 <h2 className="text-2xl font-semibold text-primary mb-4">Google Drive Integration</h2>
 <p>
 When you connect your Google Drive account, we request permission to store files on your
 behalf. We only access files that our application creates and never access your personal
 Google Drive files.
 </p>
 <p className="mt-2">
 <strong>Scopes requested:</strong>
 </p>
 <ul className="list-disc list-inside ml-4 mt-2">
 <li>drive.file - To upload and manage files created by this application</li>
 <li>userinfo.email - To identify your account</li>
 <li>userinfo.profile - To display your name and profile picture</li>
 </ul>
 </section>

 <section>
 <h2 className="text-2xl font-semibold text-primary mb-4">Data Storage</h2>
 <p>
 Files under 50MB are stored in Supabase Storage. Files 50MB and larger are stored in
 your connected Google Drive account in a dedicated folder.
 </p>
 </section>

 <section>
 <h2 className="text-2xl font-semibold text-primary mb-4">Data Security</h2>
 <p>
 We use industry-standard encryption (AES-256-GCM) to protect OAuth tokens and secure
 connections (HTTPS) for all data transmission. Your Google Drive access tokens are
 encrypted at rest and never exposed to client applications.
 </p>
 </section>

 <section>
 <h2 className="text-2xl font-semibold text-primary mb-4">Your Rights</h2>
 <p>
 You can revoke Google Drive access at any time through your Google Account settings
 or within the application. You can also request deletion of your data by contacting
 your system administrator.
 </p>
 </section>

 <section>
 <h2 className="text-2xl font-semibold text-primary mb-4">Contact</h2>
 <p>
 For privacy concerns or questions, contact: privacy@limn.us.com
 </p>
 </section>

 <footer className="mt-12 pt-6 border-t text-sm">
 <p>Last updated: October 1, 2025</p>
 <p className="mt-2">
 This privacy policy is part of Limn Systems Enterprise application and complies with
 Google API Services User Data Policy.
 </p>
 </footer>
 </div>
 </div>
 );
}
