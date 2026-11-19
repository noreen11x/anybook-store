"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAdmin } from "../../AdminProvider";
import { ProductForm } from "../ProductForm";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const book = useAdmin().books.find((b) => b.id === id);
  if (!book) {
    return (
      <div className="empty">
        <h3>That product no longer exists.</h3>
        <Link href="/admin/products" className="btn btn-primary">All products</Link>
      </div>
    );
  }
  return <ProductForm key={book.id} book={book} />;
}
