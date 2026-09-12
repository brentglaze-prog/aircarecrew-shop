import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-display text-6xl font-bold text-graphite-950">404</p>
      <h1 className="mt-2 text-xl font-semibold">Page not found</h1>
      <p className="mt-2 max-w-sm text-graphite-600">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link href="/shop" className="btn-primary mt-6">
        Continue shopping
      </Link>
    </div>
  );
}
