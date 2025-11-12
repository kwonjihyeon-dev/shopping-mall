import { store } from "@/store/store.js";
import { ProductItem } from "./ProductItem";
import { ProductListSkeleton } from "./Skeleton";

export const ProductList = () => {
  const { products, isFetching } = store.state;

  return html`${isFetching ? ProductListSkeleton() : products.map((product) => `${ProductItem(product)}`).join("")} `;
};
