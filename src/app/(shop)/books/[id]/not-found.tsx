import Link from "next/link";

export default function BookNotFound() {
  return (
    <div className="empty enter">
      <h3>We couldn’t find that book.</h3>
      <p className="text-muted" style={{ margin: 0 }}>It may have sold out or been removed from the shop.</p>
      <Link href="/books" className="btn btn-primary">Browse books</Link>
    </div>
  );
}
