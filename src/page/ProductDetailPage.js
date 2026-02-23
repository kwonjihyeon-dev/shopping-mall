import { Layout } from "@/components/layout/index.js";
import { DetailProduct } from "@/components/product/index.js";
import { eventManager } from "@/core/eventManager.js";
import { actions, dispatch, store } from "@/store/store.js";
import { addToCart, openModal } from "../components/modal/core";
import { toast } from "../store/toast";

// TODO: 여기 클릭이벤트 넣으면서 라우터 props 추가해야함
export function ProductDetailPage(router) {
  let unsubscribe = null;

  function create() {
    return html`${Layout()}`;
  }

  function render() {
    const container = document.querySelector("main");
    if (!container) {
      document.innerHTML = "";
      return;
    }

    container.innerHTML = `${DetailProduct()}`;
  }

  function registerEventHandlers() {
    eventManager.on("click", "addToCart", (_, target) => {
      const id = target.dataset.productId;
      const product = store.state.products.find((product) => product.productId === id);
      addToCart(product);
      toast.success("장바구니에 추가되었습니다", { id: "toast-success" });
    });

    eventManager.on("click", "goToProductList", () => {
      const { category1, category2 } = store.state.product;
      actions.setFilters({ category1, category2, page: 1 });
      router.push("/");
    });

    eventManager.on("click", "goToRelatedProduct", (_, target) => {
      const id = target.dataset.productId;
      router.push(`/product/${id}`);
    });

    eventManager.on("click", "goToCategory1", (_, target) => {
      const { category1 } = target.dataset;
      actions.setFilters({ category1, category2: "", page: 1 });
      router.push("/");
    });

    eventManager.on("click", "goToCategory2", (_, target) => {
      const { category2 } = target.dataset;
      actions.setFilters({ category2, page: 1 });
      router.push("/");
    });

    eventManager.on("click", "decreaseQty", () => {
      const product = store.state.product;
      product.quantity = Math.max(1, product.quantity - 1);
      const input = document.querySelector("#quantity-input");
      if (input) input.value = product.quantity;
      actions.setProduct(product);
    });

    eventManager.on("click", "increaseQty", () => {
      const product = store.state.product;
      product.quantity = Math.min(product.stock, product.quantity + 1);
      const input = document.querySelector("#quantity-input");
      if (input) input.value = product.quantity;
      actions.setProduct(product);
    });
  }

  function unregisterEventHandlers() {
    eventManager.off("click", "addToCart");
    eventManager.off("click", "goToProductList");
    eventManager.off("click", "goToRelatedProduct");
    eventManager.off("click", "goToCategory1");
    eventManager.off("click", "goToCategory2");
    eventManager.off("click", "decreaseQty");
    eventManager.off("click", "increaseQty");
  }

  function openModalOnCartIconClick() {
    openModal();
  }

  function mount() {
    eventManager.mount(document.getElementById("root"));

    unsubscribe = store.subscribe((state) => {
      render(state);
    });

    const productId = location.pathname.split("/").pop();
    dispatch.fetchProduct(productId);

    if (!store.state.products.length) {
      dispatch.fetchProducts();
    }

    render(store.state);
    registerEventHandlers();
    document.querySelector("#cart-icon-btn").addEventListener("click", openModalOnCartIconClick);
  }

  function unmount() {
    if (unsubscribe) unsubscribe();
    unregisterEventHandlers();
    document.querySelector("#cart-icon-btn").removeEventListener("click", openModalOnCartIconClick);
    unsubscribe = null;
  }

  return { create, mount, unmount };
}
