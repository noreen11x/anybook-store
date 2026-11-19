import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBookPage } from "@/lib/queries";
import { BookDetail } from "./BookDetail";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getBookPage((await params).id);
  if (!data) return { title: "Book not found" };
  const { book } = data;
  return {
    title: `${book.title} by ${book.author}`,
    description: book.description.slice(0, 160) || `${book.title} by ${book.author} — new and secondhand copies at AnyBook.`,
    openGraph: { title: book.title, description: book.description.slice(0, 200), images: book.coverImageUrl ? [book.coverImageUrl] : undefined },
  };
}

export default async function BookPage({ params }: Props) {
  const data = await getBookPage((await params).id);
  if (!data) notFound();
  return <BookDetail key={data.book.id} book={data.book} reviews={data.reviews} />;
}
