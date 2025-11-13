import { store } from "@/store/store.js";

export const Breadcrumb = () => {
  const {
    filters: { category1, category2 },
  } = store.state;

  const firstCategory = () => {
    if (!category1) return "";
    return html`<div class="flex items-center gap-[2px]">
      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
      </svg>
      ${category1}
    </div>`;
  };

  const secondCategory = () => {
    if (!category2) return "";
    return html`<div class="flex items-center gap-[2px]">
      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
      </svg>
      ${category2}
    </div>`;
  };

  return html`
    <div class="flex items-center gap-2">
      <label class="text-sm text-gray-600">카테고리:</label>
      <button data-breadcrumb="reset" class="flex items-center gap-[2px] text-xs hover:text-blue-800 hover:underline">
        전체 ${firstCategory()} ${secondCategory()}
      </button>
    </div>
  `;
};
