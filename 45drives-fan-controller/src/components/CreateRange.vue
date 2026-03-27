<template>
  <div
    class="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700"
  >
    <!-- Toggle header -->
    <button
      class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-750 rounded-lg transition-colors"
      @click="open = !open"
    >
      <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">
        Create Range
      </span>
      <ChevronDownIcon
        class="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200"
        :class="{ 'rotate-180': open }"
      />
    </button>

    <!-- Expandable body -->
    <div v-show="open" class="px-4 pb-4 pt-1 flex flex-col gap-3">
      <div class="grid grid-cols-3 gap-2">
        <!-- Temperature Low -->
        <div class="flex flex-col gap-0.5">
          <label class="text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate">
            Temp Low (°C)
          </label>
          <div class="flex items-center border border-gray-300 dark:border-neutral-600 rounded-md overflow-hidden">
            <input
              type="number"
              v-model.number="tempLow"
              min="0"
              max="100"
              class="w-full px-1 py-1.5 text-sm text-center bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-100 border-none focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div class="flex flex-col border-l border-gray-300 dark:border-neutral-600">
              <button
                @click="increment('tempLow')"
                class="px-2 py-0.5 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <ChevronUpIcon class="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                @click="decrement('tempLow')"
                class="px-2 py-0.5 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors border-t border-gray-300 dark:border-neutral-600"
              >
                <ChevronDownIcon class="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>

        <!-- Temperature High -->
        <div class="flex flex-col gap-0.5">
          <label class="text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate">
            Temp High (°C)
          </label>
          <div class="flex items-center border border-gray-300 dark:border-neutral-600 rounded-md overflow-hidden">
            <input
              type="number"
              v-model.number="tempHigh"
              min="0"
              max="100"
              class="w-full px-1 py-1.5 text-sm text-center bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-100 border-none focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div class="flex flex-col border-l border-gray-300 dark:border-neutral-600">
              <button
                @click="increment('tempHigh')"
                class="px-2 py-0.5 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <ChevronUpIcon class="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                @click="decrement('tempHigh')"
                class="px-2 py-0.5 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors border-t border-gray-300 dark:border-neutral-600"
              >
                <ChevronDownIcon class="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>

        <!-- Speed RPM -->
        <div class="flex flex-col gap-0.5">
          <label class="text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate">
            Speed (%)
          </label>
          <div class="flex items-center border border-gray-300 dark:border-neutral-600 rounded-md overflow-hidden">
            <input
              type="number"
              v-model.number="speedRpm"
              min="0"
              max="100"
              class="w-full px-1 py-1.5 text-sm text-center bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-100 border-none focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div class="flex flex-col border-l border-gray-300 dark:border-neutral-600">
              <button
                @click="increment('speedRpm')"
                class="px-2 py-0.5 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <ChevronUpIcon class="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                @click="decrement('speedRpm')"
                class="px-2 py-0.5 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors border-t border-gray-300 dark:border-neutral-600"
              >
                <ChevronDownIcon class="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Validation message -->
      <p
        v-if="validationError"
        class="text-xs text-red-600 dark:text-red-400"
      >
        {{ validationError }}
      </p>

      <!-- Add button -->
      <div class="flex justify-end">
        <button
          class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
          :class="
            validationError
              ? 'bg-gray-300 dark:bg-neutral-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-red-700 hover:bg-red-800 text-white'
          "
          :disabled="!!validationError"
          @click="addRange"
        >
          Add to Graph
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/vue/solid";

const props = defineProps({
  /** Existing points on the graph – used for validation */
  existingPoints: { type: Array, default: () => [] },
});

const emit = defineEmits(["add-range"]);

const tempLow = ref(20);
const tempHigh = ref(80);
const speedRpm = ref(50);
const open = ref(false);

const STEP = 1;

function clamp(val) {
  return Math.max(0, Math.min(100, val));
}

function increment(field) {
  if (field === "tempLow") tempLow.value = clamp(tempLow.value + STEP);
  else if (field === "tempHigh") tempHigh.value = clamp(tempHigh.value + STEP);
  else if (field === "speedRpm") speedRpm.value = clamp(speedRpm.value + STEP);
}

function decrement(field) {
  if (field === "tempLow") tempLow.value = clamp(tempLow.value - STEP);
  else if (field === "tempHigh") tempHigh.value = clamp(tempHigh.value - STEP);
  else if (field === "speedRpm") speedRpm.value = clamp(speedRpm.value - STEP);
}

const validationError = computed(() => {
  if (tempLow.value < 0 || tempLow.value > 100) return "Temperature Low must be between 0 and 100.";
  if (tempHigh.value < 0 || tempHigh.value > 100) return "Temperature High must be between 0 and 100.";
  if (speedRpm.value < 0 || speedRpm.value > 100) return "Speed RPM must be between 0 and 100.";
  if (tempLow.value >= tempHigh.value) return "Temperature Low must be less than Temperature High.";
  return "";
});

function addRange() {
  if (validationError.value) return;
  emit("add-range", {
    tempLow: tempLow.value,
    tempHigh: tempHigh.value,
    speed: speedRpm.value,
  });
}
</script>
