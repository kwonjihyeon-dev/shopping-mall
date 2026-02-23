# Vanilla JS SPA 쇼핑몰

프레임워크 없이 순수 JavaScript로 구현한 SPA(Single Page Application) 쇼핑몰 프로젝트입니다.

## 기술 스택

- **Vanilla JavaScript** (ES Module)
- **Vite** (빌드)
- **Tailwind CSS** (스타일링)
- **MSW** (API 모킹)
- **Playwright** (E2E 테스트)

## 주요 기능

- 상품 목록 조회 / 검색 / 카테고리 필터 / 정렬
- 무한 스크롤 (IntersectionObserver)
- 상품 상세 페이지 / 관련 상품
- 장바구니 (localStorage 기반 영속화)
- 토스트 알림 시스템
- URL 쿼리 파라미터 동기화 / 새로고침 시 상태 복원

---

## 설계

### History API 기반 SPA 라우터

`history.pushState`를 사용하여 페이지 전환 시 새로고침 없이 URL을 변경합니다.

```
src/router.js
```

```js
// 라우트 정의
const router = new Router({
  rootId: "root",
  routes: {
    "/": () => ProductListPage(router),
    "/product/:id": () => ProductDetailPage(router),
    "/404": () => NotFoundPage(),
  },
});
```

**동작 흐름:**

```
1. router.init()
   └─ popstate 이벤트 리스너 등록
   └─ data-link 클릭 이벤트 위임 등록
   └─ 현재 URL로 최초 렌더링

2. 페이지 이동 (router.push)
   └─ match(path) → 라우트 패턴 매칭
   └─ history.pushState() → URL 변경 (새로고침 없음)
   └─ render() → 이전 컴포넌트 unmount → 새 컴포넌트 create → mount

3. 뒤로가기/앞으로가기
   └─ popstate 이벤트 발생
   └─ 현재 URL 기준으로 다시 매칭 및 렌더링
```

`/product/:id` 같은 동적 라우트는 정규식으로 매칭하고, 실제 ID는 `location.pathname`에서 추출합니다.

---

### Observer 패턴 상태 관리

```
src/store/core.js   ← Store 클래스
src/store/store.js  ← 앱 전역 상태 + actions + dispatch
src/store/toast.js  ← 토스트 전용 상태
```

Redux/Zustand 같은 전역 상태 관리를 Observer 패턴으로 직접 구현했습니다.

```js
// Store 핵심 구조
class Store {
  constructor(initialState) {
    this._state = initialState;
    this._observers = new Set();
  }

  setState(newState)    // 상태 변경 → 얕은 비교 → 변경 시 notify
  subscribe(observer)   // 구독 등록 → 해제 함수 반환
  _notify()             // 모든 구독자에게 새 상태 전달
}
```

**3계층 구조:**

| 계층       | 역할                        | 예시                                             |
| ---------- | --------------------------- | ------------------------------------------------ |
| `store`    | 전역 상태 보관              | `store.state.products`, `store.state.filters`    |
| `actions`  | 동기 상태 변경              | `actions.setFilters({ category1: "생활/건강" })` |
| `dispatch` | 비동기 API 호출 + 상태 반영 | `dispatch.fetchProducts({ page: 1 })`            |

**상태 변경 흐름:**

```
유저 액션 (클릭, 입력 등)
  → dispatch.fetchProducts()   // API 호출
    → actions.setProducts()    // 결과로 상태 변경
      → store.setState()      // 얕은 비교 후 변경 감지
        → store._notify()     // 구독자에게 알림
          → render()          // UI 업데이트
```

얕은 비교(`Object.is`)를 통해 상태가 실제로 변경되었을 때만 리렌더링이 발생합니다.

---

### 컴포넌트 라이프사이클 (create / mount / unmount)

각 페이지 컴포넌트는 3단계 생명주기를 가집니다.

```
src/page/ProductListPage.js
src/page/ProductDetailPage.js
src/page/404.js
```

```js
function ProductListPage(router) {
  function create() {
    /* HTML 문자열 반환 */
  }
  function mount() {
    /* DOM 삽입 후 이벤트/구독 등록 */
  }
  function unmount() {
    /* 이벤트/구독 해제, 정리 */
  }

  return { create, mount, unmount };
}
```

| 단계        | 시점                               | 역할                                                                |
| ----------- | ---------------------------------- | ------------------------------------------------------------------- |
| `create()`  | 라우터가 컴포넌트를 최초 생성할 때 | Layout HTML 문자열 반환                                             |
| `mount()`   | `innerHTML`로 DOM에 삽입된 직후    | store 구독, 이벤트 핸들러 등록, API 호출, IntersectionObserver 설정 |
| `unmount()` | 다른 페이지로 이동하기 직전        | store 구독 해제, 이벤트 핸들러 제거, Observer disconnect, 모달 닫기 |

**라우터에서의 호출 순서:**

```
router.push("/product/123")
  │
  ├─ 1. 이전 컴포넌트.unmount()    ← 구독/이벤트 정리
  ├─ 2. 새 컴포넌트 = route()      ← 컴포넌트 팩토리 호출
  ├─ 3. html = 컴포넌트.create()   ← HTML 생성
  ├─ 4. root.innerHTML = html      ← DOM 반영
  └─ 5. 컴포넌트.mount()           ← 이벤트/구독 활성화
```

`unmount`에서 정리하지 않으면 이전 페이지의 이벤트 리스너와 store 구독이 남아 메모리 누수 및 의도하지 않은 동작이 발생합니다. React의 `useEffect` cleanup과 동일한 역할입니다.

---

### 이벤트 위임 (EventManager)

```
src/core/eventManager.js
```

React의 Synthetic Event 시스템에서 영감을 받아, `#root` 하나에 이벤트를 위임하고 `data-on-*` 속성으로 핸들러를 선언적으로 매핑합니다.

```html
<!-- 템플릿에서 선언 -->
<button data-on-click="addToCart" data-product-id="123">장바구니 담기</button>
```

```js
// 페이지에서 핸들러 등록
eventManager.on("click", "addToCart", (_, target) => {
  const { productId } = target.dataset;
  // ...
});
```

**지원 이벤트:** `click`, `change`, `keydown`

이벤트 타입별로 `#root`에 리스너를 한 번만 등록하고, `closest("[data-on-click]")`로 가장 가까운 대상을 찾아 매칭된 핸들러를 실행합니다.

---

## 디렉토리 구조

```
src/
├── api/                  # API 호출 (fetch 래퍼)
├── components/
│   ├── filter/           # 검색, 카테고리, 정렬, 개수, 브레드크럼
│   ├── layout/           # Header, Footer, Layout
│   ├── modal/            # 장바구니 모달
│   ├── product/          # 상품 상세 관련
│   ├── product-list/     # 상품 목록, 스켈레톤, 에러
│   └── toast/            # 토스트 알림
├── core/                 # EventManager
├── mocks/                # MSW 핸들러 + 목 데이터
├── page/                 # 페이지 컴포넌트
├── store/                # 상태 관리 (Store, actions, dispatch)
├── types/                # JSDoc 타입 정의
├── constants.js
├── router.js             # SPA 라우터
└── main.js               # 엔트리포인트
```
