import { ProductList } from "@/components/product-list/index.js";
import { actions, store } from "@/store/store.js";
import { getCategories, getProducts } from "../api/productApi.js";
import { Filter } from "../components/filter/index.js";
import { Layout } from "../components/layout/index.js";

export function ProductListPage() {
  let unsubscribe = null;

  function create() {
    // TODO: 여기서 elementId설정해줬을 때 router에서 호출하고 dom찾는데 문제 없는 지 체크해야함
    // TODO: createProductListPage + 다른 컴포넌트도 조합되어야함 -> 어떻게할껀지 고민필요
    return html`${Layout()}`;
  }

  function render() {
    const container = document.querySelector("main"); // products-grid
    if (!container) {
      document.innerHTML = "";
      return;
    }

    // const { products, isFetching } = state;
    // container.innerHTML = `${isFetching ? ProductListSkeleton() : products.map((product) => `${ProductItem(product)}`).join("")} `;
    container.innerHTML = `${Filter()}<div class="grid grid-cols-2 gap-4 mb-6" id="products-grid">${ProductList()}</div> `;
  }

  // function handleClick(e) {
  //   const target = e.target;
  //   const productId = target.dataset.id;

  //   if (target.classList.contains("view-detail")) {
  //     // 🔑 스토어 액션을 통해 라우팅
  //     actions.goToProductDetail(productId);
  //   }

  //   if (target.classList.contains("add-to-cart")) {
  //     const product = store.state.products.find((p) => p.id === productId);
  //     actions.addToCart(product);

  //     // 선택적: 장바구니 페이지로 이동
  //     // actions.goToCart();
  //   }
  // }

  function mount() {
    unsubscribe = store.subscribe((state) => {
      render(state);
    });

    async function fetchProducts() {
      actions.setIsFetching(true);
      try {
        const { products } = await getProducts();
        actions.setProducts(products);
      } finally {
        actions.setIsFetching(false);
      }
    }

    getCategories();
    fetchProducts();

    render(store.state);
    // container.addEventListener("click", handleClick);
  }

  function unmount() {
    if (unsubscribe) unsubscribe();
    // container.removeEventListener("click", handleClick);
    unsubscribe = null;
  }

  return { create, mount, unmount };
}
