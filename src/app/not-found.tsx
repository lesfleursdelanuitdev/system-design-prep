import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main" className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-3 text-muted">That page isn’t part of the course. It may have moved.</p>
      <p className="mt-6">
        <Link href="/" className="btn btn-primary">
          Back to the course
        </Link>
      </p>
    </main>
  );
}
