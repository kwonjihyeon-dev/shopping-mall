/**
 * @typedef {{ productId: string, title: string, image: string, lprice: number, quantity: number }} CartItem
 */

const listeners = new Set();
/** @type {CartItem[]} */
let carts = [];
/** @type {Set<string>} */
let selectedItems = new Set();

/** 현재 carts 상태를 localStorage에 저장한다 */
function persist() {
  localStorage.setItem("shopping_cart", JSON.stringify(carts));
}

/** 등록된 모든 구독자에게 상태 변경을 알린다 */
function notify() {
  listeners.forEach((listener) => listener());
}

/**
 * 장바구니 상태 변경을 구독한다
 * @param {() => void} fn - 상태 변경 시 호출될 콜백
 * @returns {() => void} 구독 해제 함수
 */
export function subscribeCart(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * 현재 장바구니 아이템 목록을 반환한다
 * @returns {CartItem[]}
 */
export function getCarts() {
  return carts;
}

/**
 * 현재 선택된 아이템 ID 목록을 반환한다
 * @returns {Set<string>}
 */
export function getSelectedItems() {
  return selectedItems;
}

/**
 * 상품을 장바구니에 추가한다.
 * 이미 존재하는 상품이면 수량을 증가시킨다.
 * @param {CartItem} product
 */
export function addToCart(product) {
  const quantityToAdd = product.quantity || 1;
  const alreadyInCart = carts.find((cart) => cart.productId === product.productId);

  if (alreadyInCart) {
    alreadyInCart.quantity += quantityToAdd;
  } else {
    carts.push({ ...product, quantity: quantityToAdd });
  }

  persist();
  notify();
}

/**
 * 장바구니에서 특정 상품을 제거한다
 * @param {string} productId
 */
export function removeFromCart(productId) {
  carts = carts.filter((cart) => cart.productId !== productId);
  selectedItems.delete(productId);
  persist();
  notify();
}

/**
 * 특정 상품의 수량을 변경한다 (최소 1)
 * @param {string} productId
 * @param {number} delta - 증감값 (예: +1, -1)
 */
export function updateQuantity(productId, delta) {
  const item = carts.find((cart) => cart.productId === productId);
  if (!item) return;
  item.quantity = Math.max(1, item.quantity + delta);
  persist();
  notify();
}

/**
 * 특정 상품의 선택 상태를 토글한다
 * @param {string} productId
 */
export function toggleSelect(productId) {
  if (selectedItems.has(productId)) {
    selectedItems.delete(productId);
  } else {
    selectedItems.add(productId);
  }
  notify();
}

/**
 * 전체 선택/해제를 수행한다
 * @param {boolean} checked - true면 전체 선택, false면 전체 해제
 */
export function toggleSelectAll(checked) {
  selectedItems.clear();
  if (checked) {
    carts.forEach((cart) => selectedItems.add(cart.productId));
  }
  notify();
}

/** 선택된 상품들을 장바구니에서 일괄 제거한다 */
export function removeSelected() {
  carts = carts.filter((cart) => !selectedItems.has(cart.productId));
  selectedItems.clear();
  persist();
  notify();
}

/** 장바구니를 완전히 비우고 localStorage에서도 제거한다 */
export function clearCart() {
  carts = [];
  selectedItems.clear();
  persist();
  notify();
}

/** localStorage에서 장바구니 데이터를 복원한다. 앱 시작 시 1회 호출한다. */
export function initCart() {
  const saved = localStorage.getItem("shopping_cart");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      carts = Array.isArray(parsed) ? parsed : [];
    } catch {
      carts = [];
    }
  }
}
