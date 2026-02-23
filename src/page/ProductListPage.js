import { Filter } from "@/components/filter/index.js";
import { Layout } from "@/components/layout/index.js";
import { closeModal, openModal, updateCartIconBadge } from "@/components/modal/core.js";
import { ProductList } from "@/components/product-list/index.js";
import { eventManager } from "@/core/eventManager.js";
import { addToCart, subscribeCart } from "@/store/cart.js";
import { actions, dispatch, store } from "@/store/store.js";
import { toast } from "../store/toast";

export function ProductListPage(router) {
  let unsubscribe = null;
  let unsubscribeCartBadge = null;
  let observer = null;

  function create() {
    return html`${Layout()}`;
  }

  function render() {
    const container = document.querySelector("main");
    if (!container) {
      document.innerHTML = "";
      return;
    }

    container.innerHTML = `${Filter()}${ProductList()}`;

    const sentinel = document.createElement("div");
    sentinel.id = "product-list-sentinel";
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.className = "h-1";
    container.appendChild(sentinel);
    setupInfiniteScroll(sentinel);
  }

  function update(state) {
    const container = document.querySelector("main");
    if (!container) {
      return;
    }

    const selects = container.querySelectorAll("select");
    selects.forEach((select) => {
      const key = select.id.split("-")[0];
      const value = state.filters[key];
      if (value) {
        Array.from(select.options).find((option) => option.value === String(value)).selected = true;
      }
    });
  }

  function setupInfiniteScroll(sentinel) {
    if (!sentinel) return;

    if (observer) {
      observer.disconnect();
    }

    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        const { pagination, isFetching } = store.state;
        if (isFetching) return;
        const currentPage = pagination?.page ?? 1;
        if (!(pagination?.hasNext ?? false)) return;

        dispatch.fetchProducts({ page: currentPage + 1 });
      },
      { root: null, rootMargin: "0px 0px 200px 0px", threshold: 0 },
    );

    observer.observe(sentinel);
  }

  function registerEventHandlers() {
    // 카테고리
    eventManager.on("click", "selectCategory1", (_, target) => {
      const { category1 } = target.dataset;
      dispatch.fetchProducts({ category1, page: 1 });
    });

    eventManager.on("click", "selectCategory2", (_, target) => {
      const { category2 } = target.dataset;
      dispatch.fetchProducts({ category2, page: 1 });
    });

    eventManager.on("click", "resetBreadcrumb", () => {
      dispatch.fetchProducts({ category1: "", category2: "", page: 1 });
    });

    // 에러 재시도
    eventManager.on("click", "retryError", () => {
      dispatch.fetchProducts();
    });

    // 상품 카드 클릭 → 상세 이동
    eventManager.on("click", "goToProduct", (_, target) => {
      const { productId } = target.dataset;
      router.push(`/product/${productId}`);
    });

    // 상품 카드 내 장바구니 버튼
    eventManager.on("click", "addToCartFromList", (_, target) => {
      const { productId } = target.dataset;
      const product = store.state.products.find((p) => p.productId === productId);
      addToCart(product);
      toast.success("장바구니에 추가되었습니다", { id: "toast-success" });
    });

    // 검색
    eventManager.on("keydown", "searchProducts", (e) => {
      if (e.key !== "Enter") return;
      dispatch.fetchProducts({ search: e.target.value, page: 1 });
    });

    // 개수 변경
    eventManager.on("change", "changeLimit", (e) => {
      const filter = { page: 1, limit: Number(e.target.value) };
      actions.setFilters(filter);
      dispatch.fetchProducts(filter);
    });

    // 정렬 변경
    eventManager.on("change", "changeSort", (e) => {
      const filter = { page: 1, sort: e.target.value };
      actions.setFilters(filter);
      dispatch.fetchProducts(filter);
    });
  }

  function unregisterEventHandlers() {
    eventManager.off("click", "selectCategory1");
    eventManager.off("click", "selectCategory2");
    eventManager.off("click", "resetBreadcrumb");
    eventManager.off("click", "retryError");
    eventManager.off("click", "goToProduct");
    eventManager.off("click", "addToCartFromList");
    eventManager.off("keydown", "searchProducts");
    eventManager.off("change", "changeLimit");
    eventManager.off("change", "changeSort");
  }

  function openModalOnCartIconClick() {
    openModal();
  }

  function mount() {
    eventManager.mount(document.getElementById("root"));

    unsubscribe = store.subscribe((state) => {
      render(state);
      update(state);
    });

    render(store.state);
    dispatch.fetchProducts();
    registerEventHandlers();
    document.querySelector("#cart-icon-btn").addEventListener("click", openModalOnCartIconClick);
    unsubscribeCartBadge = subscribeCart(updateCartIconBadge);
  }

  function unmount() {
    if (unsubscribe) unsubscribe();
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    unregisterEventHandlers();
    closeModal();
    document.querySelector("#cart-icon-btn").removeEventListener("click", openModalOnCartIconClick);
    if (unsubscribeCartBadge) unsubscribeCartBadge();
    unsubscribe = null;
    unsubscribeCartBadge = null;
  }

  return { create, mount, unmount };
}
