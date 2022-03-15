<!-- This example requires Tailwind CSS v2.0+ -->
<template>
<div class="card">
  <div
    class="card-header p-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between"
  >
    <h3 class="text-lg leading-6 font-semibold">PCI</h3>
    <div class="mt-3 sm:mt-0 sm:ml-4">
      <button
        type="button"
        class="card-refresh-btn"
      >
        <RefreshIconOutline class="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  </div>
  <div class="card-body">
      This is a test...
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