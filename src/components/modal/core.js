// src/modal/modalManager.js
import { ModalLayout } from "@/components/modal/Layout.js";

let currentModal = null;
export let carts = [];
export let selectedItems = new Set();

export function openModal(product) {
  if (currentModal) {
    closeModal(); // 이미 모달 할당되있으면 닫고 다시 열기
  }

  const alreadyInCart = carts.find((cart) => cart.productId === product.productId);
  if (alreadyInCart) {
    alreadyInCart.quantity++;
  } else {
    carts.push({ ...product, quantity: 1 });
    const children = document.querySelector("#cart-icon-btn").children;
    if (children.length > 1) {
      children[1].innerHTML = carts.length;
    } else {
      const span = document.createElement("span");
      span.className =
        "absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center";
      span.innerHTML = carts.length;
      document.querySelector("#cart-icon-btn").appendChild(span);
    }
  }

  currentModal = document.createElement("div");
  currentModal.className = "fixed inset-0 z-50 overflow-y-auto cart-modal";
  currentModal.innerHTML = ModalLayout();
  document.querySelector("#root").appendChild(currentModal);

  defaultModalEvents();
}

export function defaultModalEvents() {
  currentModal?.querySelector("#cart-modal-close-btn")?.addEventListener("click", closeModal);

  currentModal?.querySelector(".cart-modal-overlay")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeModal();
  });
}

export function closeModal() {
  if (!currentModal) return;
  currentModal.remove();
  currentModal = null;
}
