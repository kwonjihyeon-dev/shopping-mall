import { store } from "@/store/store.js";
import { ProductItem } from "./ProductItem";
import { ProductListSkeleton } from "./Skeleton";

export const ProductList = () => {
  const { products, isFetching } = store.state;

  return html`<div class="grid grid-cols-2 gap-4 mb-6" id="products-grid">
    ${isFetching
      ? Array(6)
          .fill(1)
          .map(() => ProductListSkeleton())
          .join("")
      : products.map((product) => `${ProductItem(product)}`).join("")}
  </div> `;
};
