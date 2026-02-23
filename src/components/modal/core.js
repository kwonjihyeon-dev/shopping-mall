// src/modal/modalManager.js
import { ModalLayout } from "@/components/modal/Layout.js";
import { eventManager } from "@/core/eventManager.js";
import { toast } from "../../store/toast";
import { CartFooter } from "./Footer";

let currentModal = null;
export let carts = [];
export let selectedItems = new Set();

export function closeModalOnEscape(event) {
  if (event.key !== "Escape") return;
  closeModal();
}

export function addToCart(product) {
  const shoppingCart = localStorage.getItem("shopping_cart");
  if (shoppingCart) {
    carts = JSON.parse(shoppingCart);
  }

  const alreadyInCart = carts.find((cart) => cart.productId === product.productId);
  if (alreadyInCart) {
    if (product.quantity > 1) {
      alreadyInCart.quantity = alreadyInCart.quantity + product.quantity;
    } else {
      alreadyInCart.quantity++;
    }
  } else {
    carts.push({ ...product, quantity: 1 });
    const children = document.querySelector("#cart-icon-btn").children;
    if (children.length > 1) {
      children[1].innerHTML = carts.length;
    } else {
      const span = document.createElement("span");
      span.className =
        "absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center";
      span.innerHTML = carts.length;
      document.querySelector("#cart-icon-btn").appendChild(span);
    }
  }

  localStorage.setItem("shopping_cart", JSON.stringify(carts));
}

function rerenderModal() {
  if (!currentModal) return;
  currentModal.innerHTML = ModalLayout();
}

function removeCartIconBadge() {
  if (carts.length === 0) {
    const count = document.querySelector("#cart-icon-btn");
    count.removeChild(count.lastChild);
  }
}

function registerModalHandlers() {
  eventManager.on("click", "closeCartModal", () => {
    closeModal();
  });

  eventManager.on("click", "closeCartModalOverlay", () => {
    closeModal();
  });

  eventManager.on("click", "toggleSelectAll", (_, target) => {
    const checked = target.checked;

    selectedItems.clear();
    if (checked) {
      carts.map((cart) => selectedItems.add(cart.productId));
    }

    currentModal?.querySelectorAll(".cart-item-checkbox").forEach((checkbox) => {
      checkbox.checked = checked;
    });

    const footer = currentModal?.querySelector("#cart-modal-footer");
    if (footer) footer.innerHTML = CartFooter();
  });

  eventManager.on("click", "toggleCartItemCheck", (_, target) => {
    const { productId: id } = target.dataset;
    if (!id) return;

    if (selectedItems.has(id)) {
      selectedItems.delete(id);
    } else {
      selectedItems.add(id);
    }

    target.checked = selectedItems.has(id);

    currentModal?.querySelectorAll(".cart-item-checkbox").forEach((input) => {
      const { productId: inputId } = input.dataset;
      if (!inputId) return;
      input.checked = selectedItems.has(inputId);
    });

    const footer = currentModal?.querySelector("#cart-modal-footer");
    if (footer) footer.innerHTML = CartFooter();
  });

  eventManager.on("click", "removeSelectedCartItems", () => {
    carts = carts.filter((cart) => !selectedItems.has(cart.productId));
    selectedItems.clear();
    toast.info("선택된 상품들이 삭제되었습니다", { id: "toast-remove-selected" });
    localStorage.setItem("shopping_cart", JSON.stringify(carts));
    removeCartIconBadge();
    rerenderModal();
  });

  eventManager.on("click", "removeCartItem", (_, target) => {
    const { productId } = target.dataset;
    carts = carts.filter((cart) => cart.productId !== productId);
    selectedItems.delete(productId);
    toast.info("선택된 상품이 삭제되었습니다", { id: "toast-remove-selected" });
    localStorage.setItem("shopping_cart", JSON.stringify(carts));
    removeCartIconBadge();
    rerenderModal();
  });

  eventManager.on("click", "decreaseCartQty", (_, target) => {
    const id = target.dataset.productId;
    const item = carts.find((cart) => cart.productId === id);
    item.quantity = Math.max(1, item.quantity - 1);
    rerenderModal();
  });

  eventManager.on("click", "increaseCartQty", (_, target) => {
    const id = target.dataset.productId;
    carts.find((cart) => cart.productId === id).quantity++;
    rerenderModal();
  });

  eventManager.on("click", "clearCart", () => {
    carts = [];
    selectedItems.clear();
    toast.info("장바구니가 비워졌습니다", { id: "toast-clear-cart" });
    localStorage.removeItem("shopping_cart");
    removeCartIconBadge();
    rerenderModal();
  });
}

function unregisterModalHandlers() {
  eventManager.off("click", "closeCartModal");
  eventManager.off("click", "closeCartModalOverlay");
  eventManager.off("click", "toggleSelectAll");
  eventManager.off("click", "toggleCartItemCheck");
  eventManager.off("click", "removeSelectedCartItems");
  eventManager.off("click", "removeCartItem");
  eventManager.off("click", "decreaseCartQty");
  eventManager.off("click", "increaseCartQty");
  eventManager.off("click", "clearCart");
}

export function openModal(product) {
  if (currentModal) {
    closeModal();
  }

  if (product) {
    addToCart(product);
  }

  currentModal = document.createElement("div");
  currentModal.className = "fixed inset-0 z-50 overflow-y-auto cart-modal";
  currentModal.innerHTML = ModalLayout();

  const AllCheckbox = currentModal.querySelector("#cart-modal-select-all-checkbox");
  if (AllCheckbox) {
    AllCheckbox.checked = false;
  }

  const checkboxes = currentModal.querySelectorAll(".cart-item-checkbox");
  if (checkboxes) {
    currentModal.querySelectorAll(".cart-item-checkbox").forEach((checkbox) => {
      checkbox.checked = false;
    });
  }

  document.querySelector("#root").appendChild(currentModal);
  document.addEventListener("keydown", closeModalOnEscape);
  registerModalHandlers();
}

export function closeModal() {
  document.removeEventListener("keydown", closeModalOnEscape);
  unregisterModalHandlers();
  if (!currentModal) return;
  currentModal.remove();
  currentModal = null;
}
