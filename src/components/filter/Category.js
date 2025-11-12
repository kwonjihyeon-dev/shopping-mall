import { store } from "@/store/store.js";

export const Category = () => {
  const { categories, isFetching } = store.state;

  const category = () => {
    if (isFetching) {
      return html`
        <!-- 1depth 카테고리 -->
        <div class="flex flex-wrap gap-2">
          <div class="text-sm text-gray-500 italic">카테고리 로딩 중...</div>
        </div>
      `;
    } else {
      return html`
        <!-- 1depth 카테고리 -->
        <div class="flex flex-wrap gap-2">
          ${Object.keys(categories)
            .map(
              (category) => html`
                <button
                  data-category1="${category}"
                  class="category1-filter-btn text-left px-3 py-2 text-sm rounded-md border transition-colors bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  ${category}
                </button>
              `,
            )
            .join("")}
        </div>
        <div>하위 카테고리</div>
        <!-- 2depth 카테고리 -->
      `;
    }
  };

  return html`
    <!-- 필터 옵션 -->
    <div class="space-y-2">
      <!-- 브래드크럼 -->
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-600">카테고리:</label>
        <button data-breadcrumb="reset" class="text-xs hover:text-blue-800 hover:underline">전체</button>
      </div>
      <!-- 필터 카테고리 -->
      ${category()}
    </div>
  `;
};
