<!-- This example requires Tailwind CSS v2.0+ -->
<template>
  <div
    class="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between"
  >
    <h3 class="text-lg leading-6 font-medium text-gray-900">System</h3>
    <div class="mt-3 sm:mt-0 sm:ml-4">
      <button
        type="button"
        class="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <RefreshIconOutline class="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<script>
import { RefreshIcon as RefreshIconOutline } from "@heroicons/vue/outline";

export default {
  components: {
    RefreshIconOutline,
  },
};
</script>
