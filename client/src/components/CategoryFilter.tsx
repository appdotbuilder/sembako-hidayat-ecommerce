
import { Button } from '@/components/ui/button';
import type { Category } from '../../../server/src/schema';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: number | null;
  onCategoryChange: (categoryId: number | null) => void;
}

export function CategoryFilter({ categories, selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="space-y-2">
      <Button
        variant={selectedCategory === null ? "default" : "ghost"}
        onClick={() => onCategoryChange(null)}
        className={`w-full justify-start text-left transition-colors ${
          selectedCategory === null 
            ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
            : 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
        }`}
      >
        🏪 Semua Produk
      </Button>
      
      {categories.map((category: Category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "ghost"}
          onClick={() => onCategoryChange(category.id)}
          className={`w-full justify-start text-left transition-colors ${
            selectedCategory === category.id 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
              : 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
          }`}
        >
          <span className="truncate">
            📦 {category.name}
          </span>
        </Button>
      ))}
    </div>
  );
}
