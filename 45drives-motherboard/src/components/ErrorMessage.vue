<template>
<div class="flex items-center justify-evenly">
<div class="rounded-md bg-red-50 p-4">
    <div class="flex">
      <div class="flex-shrink-0">
        <XCircleIcon class="h-5 w-5 text-red-400" aria-hidden="true" />
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-red-800">
          {{errorHeader}}
        </h3>
        <div class="mt-2 text-sm text-red-700">
          <ul role="list" class="list-disc pl-5 space-y-1 whitespace-pre">
            <li v-for="entry in errorMsg" >{{ entry }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  <button
    v-if="FixButton"
    @click="FixButtonHandler"
    type="button"
    class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
  >
    Fix
  </button>
</div>
  
</template>

<script>
import { XCircleIcon } from "@heroicons/vue/solid";
import { ref, watch } from "vue";

export default {
  components: {
    XCircleIcon,
  },
  props: {
    errorHeader: String,
    errorMsg: Array,
    FixButton: Boolean,
    FixButtonHandler: Function
  },
  setup(props) {
    const errorMsg = ref(props.errorMsg);
    const FixButtonHandler = ref(props.FixButtonHandler);
    const errorHeader = ref(props.errorHeader);

    watch(() => props.FixButtonHandler, (fn) => {
      FixButtonHandler.value = fn;
    });

    return {
      errorMsg,
      FixButtonHandler,
    };
  },
};
</script>