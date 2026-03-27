<template>
  <div class="flex flex-col gap-6">
    <!-- ───── 1. Fan Detection / Confirmation Card ───── -->
    <div class="card">
      <div class="card-header flex items-center justify-between">
        <h3 class="text-header text-default">Fan Detection</h3>
        <button
          class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
          :class="
            detecting
              ? 'bg-gray-400 dark:bg-neutral-600 text-white cursor-wait'
              : 'bg-red-700 hover:bg-red-800 text-white'
          "
          :disabled="detecting"
          @click="detectFans"
        >
          <span v-if="detecting">Detecting…</span>
          <span v-else>{{ detected ? 'Re-detect Fans' : 'Detect Fans' }}</span>
        </button>
      </div>
      <div class="card-body">
        <div
          v-if="detected"
          class="flex items-center gap-3 bg-accent rounded-md p-4"
        >
          <CheckCircleIcon class="w-6 h-6 text-green-500 shrink-0" />
          <span class="text-default text-sm">
            <strong>{{ detectedCount }}</strong> fan{{ detectedCount !== 1 ? 's' : '' }} detected and working.
          </span>
        </div>
        <p v-else class="text-muted text-sm">
          Click <strong>Detect Fans</strong> to scan for connected fans.
        </p>
        <p v-if="detectError" class="text-red-600 dark:text-red-400 text-sm mt-2">
          {{ detectError }}
        </p>
      </div>
    </div>

    <!-- ───── 2. Fan Selector + Graph + Create Range ───── -->
    <div v-if="detected" class="card">
      <div class="card-header">
        <h3 class="text-header text-default">Fan Configuration</h3>
      </div>
      <div class="card-body flex flex-col gap-5">
        <!-- Dropdown -->
        <div class="flex flex-col gap-1 max-w-xs">
          <label
            for="fan-select"
            class="text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            Select Fan
          </label>
          <select
            id="fan-select"
            v-model="selectedFan"
            class="block w-full rounded-md border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-100 text-sm px-3 py-2 focus:border-red-500 focus:ring-red-500"
          >
            <option :value="null" disabled>-- choose a fan --</option>
            <option v-for="n in detectedCount" :key="n" :value="n">
              Fan {{ n }}
            </option>
          </select>
        </div>

        <!-- Create Range (between dropdown and graph) -->
        <div class="max-w-sm">
          <CreateRange
            v-if="selectedFan !== null"
            :existingPoints="currentPoints"
            @add-range="onAddRange"
          />
        </div>

        <!-- Added Ranges List -->
        <div v-if="selectedFan !== null && currentRanges.length > 0" class="max-w-sm">
          <div class="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
            <button
              class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              @click="rangesOpen = !rangesOpen"
            >
              <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Added Ranges ({{ currentRanges.length }})
              </span>
              <ChevronDownIcon
                class="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': rangesOpen }"
              />
            </button>
            <div v-show="rangesOpen" class="px-4 pb-3 flex flex-col gap-2">
              <div
                v-for="(range, idx) in currentRanges"
                :key="range.id"
                class="flex items-center justify-between bg-gray-50 dark:bg-neutral-700 rounded-md px-3 py-2 border border-gray-200 dark:border-neutral-600"
              >
                <span class="text-xs text-gray-700 dark:text-gray-300">
                  {{ range.tempLow }}°C – {{ range.tempHigh }}°C @ {{ range.speed }}%
                </span>
                <button
                  @click="onDeleteRange(idx)"
                  class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors ml-3"
                  title="Delete range"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Graph -->
        <FanGraph
          v-if="selectedFan !== null"
          :fanIndex="selectedFan"
          :points="currentPoints"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { CheckCircleIcon, TrashIcon, ChevronDownIcon } from "@heroicons/vue/solid";
import FanGraph from "./FanGraph.vue";
import CreateRange from "./CreateRange.vue";
import { detectFans as detectFansAPI } from "../api/fanControllerAPI.js";

/* ── Reactive state ── */
const detecting = ref(false);
const detected = ref(false);
const detectedCount = ref(0);
const detectedFans = ref([]);
const detectError = ref("");
const selectedFan = ref(null);
const rangesOpen = ref(false);
let rangeIdCounter = 0;

/**
 * Per-fan data points.
 * Key = fan number (1-based), value = array of { temp, speed }.
 * Initialised with a single default point at 0 °C / 50 %.
 */
const fanPoints = ref({});

/**
 * Per-fan added ranges for tracking/deletion.
 * Key = fan number, value = array of { id, tempLow, tempHigh, speed }.
 */
const fanRanges = ref({});

const currentPoints = computed(() => {
  if (selectedFan.value === null) return [];
  return fanPoints.value[selectedFan.value] ?? [{ temp: 0, speed: 50 }];
});

const currentRanges = computed(() => {
  if (selectedFan.value === null) return [];
  return fanRanges.value[selectedFan.value] ?? [];
});

/* ── Detect fans via backend API ── */
async function detectFans() {
  detecting.value = true;
  detectError.value = "";
  try {
    const result = await detectFansAPI();
    if (result.error_msg) {
      detectError.value = result.error_msg;
      detecting.value = false;
      return;
    }
    detectedFans.value = result.fans || [];
    detectedCount.value = result.count || 0;
    // Initialise default point for each fan
    for (let i = 1; i <= detectedCount.value; i++) {
      if (!fanPoints.value[i]) {
        fanPoints.value[i] = [{ temp: 0, speed: 50 }];
      }
    }
    detected.value = true;
    selectedFan.value = 1;
  } catch (err) {
    detectError.value = err.message || "Failed to detect fans.";
  } finally {
    detecting.value = false;
  }
}

/* ── Graph callbacks ── */
function onAddRange({ tempLow, tempHigh, speed }) {
  if (selectedFan.value === null) return;
  const fan = selectedFan.value;
  const pts = [...(fanPoints.value[fan] ?? [])];
  pts.push({ temp: tempLow, speed });
  pts.push({ temp: tempHigh, speed });
  fanPoints.value[fan] = pts;

  // Track the range for deletion
  if (!fanRanges.value[fan]) fanRanges.value[fan] = [];
  fanRanges.value[fan] = [
    ...fanRanges.value[fan],
    { id: ++rangeIdCounter, tempLow, tempHigh, speed },
  ];
}

function onDeleteRange(rangeIdx) {
  if (selectedFan.value === null) return;
  const fan = selectedFan.value;
  const ranges = fanRanges.value[fan] ?? [];
  const range = ranges[rangeIdx];
  if (!range) return;

  // Remove the two points that were added for this range
  const pts = [...(fanPoints.value[fan] ?? [])];
  let removedLow = false;
  let removedHigh = false;
  const filtered = pts.filter((p) => {
    if (!removedLow && p.temp === range.tempLow && p.speed === range.speed) {
      removedLow = true;
      return false;
    }
    if (!removedHigh && p.temp === range.tempHigh && p.speed === range.speed) {
      removedHigh = true;
      return false;
    }
    return true;
  });
  fanPoints.value[fan] = filtered;

  // Remove the range entry
  fanRanges.value[fan] = ranges.filter((_, i) => i !== rangeIdx);
}
</script>
