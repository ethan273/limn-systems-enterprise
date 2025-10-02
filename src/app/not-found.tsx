export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold  mb-4">
          Page Not Found
        </h2>
        <p className="text-tertiary mb-8">
          The page you are looking for does not exist.
        </p>
        <a
          href="/"
          className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}