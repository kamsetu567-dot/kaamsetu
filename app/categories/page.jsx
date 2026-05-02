import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryCard from "@/components/CategoryCard";
import { CATEGORIES } from "@/lib/data/categories";

export const metadata = {
  title: "सभी सेवाएँ / All Categories — KaamSetu",
  description: "Browse all service categories on KaamSetu — Construction, Events, Home Services, Talent and more.",
};

export default function CategoriesPage() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-10 w-full">
        <div className="mb-8">
          <h1
            className="text-3xl md:text-4xl font-black text-text-primary mb-2"
            style={{ fontFamily: "var(--font-noto-devanagari), sans-serif" }}
          >
            सभी सेवाएँ
          </h1>
          <p className="text-text-secondary text-lg">All Service Categories ({CATEGORIES.length})</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map(category => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
