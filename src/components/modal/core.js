import { ModalLayout } from "@/components/modal/Layout.js";
import { eventManager } from "@/core/eventManager.js";
import {
  clearCart,
  getCarts,
  removeFromCart,
  removeSelected,
  subscribeCart,
  toggleSelect,
  toggleSelectAll,
  updateQuantity,
} from "@/store/cart.js";
import { toast } from "../../store/toast";

let currentModal = null;
let unsubscribeCart = null;

/**
 * Escape 키 입력 시 모달을 닫는 keydown 이벤트 핸들러
 * @param {KeyboardEvent} event
 */
export function closeModalOnEscape(event) {
  if (event.key !== "Escape") return;
  closeModal();
}

/** 현재 열려있는 모달의 innerHTML을 최신 장바구니 상태로 갱신한다 */
function rerenderModal() {
  if (!currentModal) return;
  currentModal.innerHTML = ModalLayout();
}

/** 헤더의 장바구니 아이콘 뱃지(숫자)를 현재 카트 수량에 맞게 갱신한다 */
function updateCartIconBadge() {
  const btn = document.querySelector("#cart-icon-btn");
  if (!btn) return;
  const count = getCarts().length;
  const existing = btn.querySelector("span");

  if (count > 0) {
    if (existing) {
      existing.innerHTML = count;
    } else {
      const span = document.createElement("span");
      span.className =
        "absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center";
      span.innerHTML = count;
      btn.appendChild(span);
    }
  } else if (existing) {
    existing.remove();
  }
}

/** 모달 내부 이벤트 핸들러를 eventManager에 등록한다 */
function registerModalHandlers() {
  eventManager.on("click", "closeCartModal", () => {
    closeModal();
  });

  eventManager.on("click", "closeCartModalOverlay", () => {
    closeModal();
  });

  eventManager.on("click", "toggleSelectAll", (_, target) => {
    toggleSelectAll(target.checked);
  });

  eventManager.on("click", "toggleCartItemCheck", (_, target) => {
    const { productId: id } = target.dataset;
    if (!id) return;
    toggleSelect(id);
  });

  eventManager.on("click", "removeSelectedCartItems", () => {
    removeSelected();
    toast.info("선택된 상품들이 삭제되었습니다", { id: "toast-remove-selected" });
  });

  eventManager.on("click", "removeCartItem", (_, target) => {
    const { productId } = target.dataset;
    removeFromCart(productId);
    toast.info("선택된 상품이 삭제되었습니다", { id: "toast-remove-selected" });
  });

  eventManager.on("click", "decreaseCartQty", (_, target) => {
    const id = target.dataset.productId;
    updateQuantity(id, -1);
  });

  eventManager.on("click", "increaseCartQty", (_, target) => {
    const id = target.dataset.productId;
    updateQuantity(id, 1);
  });

  eventManager.on("click", "clearCart", () => {
    clearCart();
    toast.info("장바구니가 비워졌습니다", { id: "toast-clear-cart" });
  });
}

/** registerModalHandlers에서 등록한 모든 이벤트 핸들러를 해제한다 */
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

/**
 * 장바구니 모달을 열고 DOM에 마운트한다.
 * - 이미 열려 있으면 기존 모달을 닫고 새로 연다.
 * - cart store를 구독하여 상태 변경 시 자동 리렌더 및 뱃지 갱신을 수행한다.
 */
export function openModal() {
  if (currentModal) {
    closeModal();
  }

  currentModal = document.createElement("div");
  currentModal.className = "fixed inset-0 z-50 overflow-y-auto cart-modal";
  currentModal.innerHTML = ModalLayout();

  document.querySelector("#root").appendChild(currentModal);
  document.addEventListener("keydown", closeModalOnEscape);
  registerModalHandlers();

  unsubscribeCart = subscribeCart(() => {
    rerenderModal();
    updateCartIconBadge();
  });
}

/**
 * 장바구니 모달을 닫고 DOM에서 제거한다.
 * - cart store 구독 해제, 이벤트 핸들러 해제, keydown 리스너 해제를 수행한다.
 */
export function closeModal() {
  document.removeEventListener("keydown", closeModalOnEscape);
  unregisterModalHandlers();
  if (unsubscribeCart) {
    unsubscribeCart();
    unsubscribeCart = null;
  }
  if (!currentModal) return;
  currentModal.remove();
  currentModal = null;
}
