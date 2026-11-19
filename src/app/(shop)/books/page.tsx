import { Suspense } from "react";
import { Browse } from "./Browse";

export const metadata = { title: "Browse books" };

export default function BooksPage() {
  return (
    <Suspense>
      <Browse />
    </Suspense>
  );
}
