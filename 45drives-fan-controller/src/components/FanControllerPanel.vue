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
            <strong>{{ detectedCount }}</strong> fan{{ detectedCount !== 1 ? 's' : '' }} detected across
            {{ boardCount }} board{{ boardCount !== 1 ? 's' : '' }}.
          </span>
        </div>

        <!-- Fan list summary after detection -->
        <div v-if="detected && detectedFans.length > 0" class="mt-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <div
              v-for="fan in detectedFans"
              :key="fan.name"
              class="flex items-center gap-2 bg-gray-50 dark:bg-neutral-700 rounded-md px-3 py-2 border border-gray-200 dark:border-neutral-600"
            >
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
                  Board {{ fan.board }} · Fan {{ fan.fan }}
                </p>
              </div>
              <span class="text-xs font-mono text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {{ fan.rpm }} RPM
              </span>
            </div>
          </div>
        </div>

        <p v-if="!detected" class="text-muted text-sm">
          Click <strong>Detect Fans</strong> to scan for connected fans.
        </p>
        <p v-if="detectError" class="text-red-600 dark:text-red-400 text-sm mt-2">
          {{ detectError }}
        </p>
      </div>
    </div>

    <!-- ───── 2. Fan Selector + Graph + Create Range ───── -->
    <div v-if="detected" class="card">
      <div class="card-header flex items-center justify-between">
        <h3 class="text-header text-default">Fan Configuration</h3>
        <div class="flex items-center gap-2">
          <button
            v-if="selectedFan !== null"
            class="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-200 dark:bg-neutral-600 hover:bg-gray-300 dark:hover:bg-neutral-500 text-gray-700 dark:text-gray-200 transition-colors"
            :disabled="refreshing"
            @click="refreshSelectedFanRPM"
          >
            <span v-if="refreshing">Reading…</span>
            <span v-else>Refresh RPM</span>
          </button>
        </div>
      </div>
      <div class="card-body flex flex-col gap-5">
        <!-- Dropdown -->
        <div class="flex flex-col gap-1 max-w-xs">
          <label
            for="fan-select"
            class="text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            Select Fan
          </label>
          <select
            id="fan-select"
            v-model="selectedFanKey"
            class="block w-full rounded-md border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-100 text-sm px-3 py-2 focus:border-red-500 focus:ring-red-500"
          >
            <option :value="null" disabled>-- choose a fan --</option>
            <option
              v-for="fan in detectedFans"
              :key="fan.name"
              :value="fan.name"
            >
              Board {{ fan.board }} · Fan {{ fan.fan }} — {{ fanRPMs[fan.name] ?? fan.rpm }} RPM
            </option>
          </select>
        </div>

        <!-- Current RPM display for selected fan -->
        <div
          v-if="selectedFan !== null"
          class="flex items-center gap-3 bg-gray-50 dark:bg-neutral-700 rounded-md px-4 py-2 max-w-xs border border-gray-200 dark:border-neutral-600"
        >
          <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Current RPM:</span>
          <span class="text-sm font-mono font-semibold text-gray-800 dark:text-gray-100">
            {{ currentFanRPM }} RPM
          </span>
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
                class="flex items-center gap-2 bg-gray-50 dark:bg-neutral-700 rounded-md px-3 py-2 border border-gray-200 dark:border-neutral-600"
              >
                <button
                  @click="applyRange(idx)"
                  class="px-2 py-1 text-[11px] font-medium rounded transition-colors shrink-0"
                  :class="
                    applyingRangeIdx === idx
                      ? 'bg-gray-400 dark:bg-neutral-500 text-white cursor-wait'
                      : appliedRangeIds.has(range.id)
                        ? 'bg-red-700 hover:bg-red-800 text-white'
                        : 'bg-red-700 hover:bg-red-800 text-white'
                  "
                  :disabled="applyingRangeIdx !== null"
                >
                  <span v-if="applyingRangeIdx === idx">…</span>
                  <span v-else-if="appliedRangeIds.has(range.id)">Applied</span>
                  <span v-else>Apply</span>
                </button>
                <span class="text-xs text-gray-700 dark:text-gray-300 flex-1">
                  {{ range.tempLow }}°C – {{ range.tempHigh }}°C @ {{ range.speed }}%
                </span>
                <button
                  @click="onDeleteRange(idx)"
                  class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors ml-1 shrink-0"
                  title="Delete range"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Apply status message -->
        <p v-if="applyMsg" class="text-sm" :class="applyMsgOk ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
          {{ applyMsg }}
        </p>

        <!-- Graph -->
        <FanGraph
          v-if="selectedFan !== null"
          :fanIndex="selectedFanIndex"
          :points="currentPoints"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { CheckCircleIcon, TrashIcon, ChevronDownIcon } from "@heroicons/vue/solid";
import FanGraph from "./FanGraph.vue";
import CreateRange from "./CreateRange.vue";
import {
  detectFans as detectFansAPI,
  getFanRPM as getFanRPMAPI,
  setFanDuty as setFanDutyAPI,
} from "../api/fanControllerAPI.js";

/* ── Reactive state ── */
const detecting = ref(false);
const detected = ref(false);
const detectedCount = ref(0);
const detectedFans = ref([]);   // Array of { board, fan, name, rpm, responding }
const detectError = ref("");
const selectedFanKey = ref(null); // Fan name key e.g. "Board1_Fan3"
const transport = ref("");       // "ipmitool" or "i2cdev"
const rangesOpen = ref(false);
const applyingRangeIdx = ref(null);   // Index of range currently being applied
const appliedRangeIds = ref(new Set()); // Set of range IDs that have been applied
const refreshing = ref(false);
const applyMsg = ref("");
const applyMsgOk = ref(false);
let rangeIdCounter = 0;
let applyMsgTimer = null;

/** Live RPM cache keyed by fan name. */
const fanRPMs = ref({});

/** Per-fan data points keyed by fan name. */
const fanPoints = ref({});

/** Per-fan ranges keyed by fan name. */
const fanRanges = ref({});

/* ── Computed ── */

/** The currently selected fan object, or null. */
const selectedFan = computed(() => {
  if (!selectedFanKey.value) return null;
  return detectedFans.value.find((f) => f.name === selectedFanKey.value) ?? null;
});

/** 1-based index of the selected fan within detectedFans (for FanGraph label). */
const selectedFanIndex = computed(() => {
  if (!selectedFan.value) return 0;
  return detectedFans.value.indexOf(selectedFan.value) + 1;
});

/** Number of unique boards. */
const boardCount = computed(() => {
  const boards = new Set(detectedFans.value.map((f) => f.board));
  return boards.size;
});

const currentPoints = computed(() => {
  if (!selectedFanKey.value) return [];
  return fanPoints.value[selectedFanKey.value] ?? [{ temp: 0, speed: 70 }];
});

const currentRanges = computed(() => {
  if (!selectedFanKey.value) return [];
  return fanRanges.value[selectedFanKey.value] ?? [];
});

const currentFanRPM = computed(() => {
  if (!selectedFanKey.value) return 0;
  return fanRPMs.value[selectedFanKey.value] ?? selectedFan.value?.rpm ?? 0;
});

/* ── Clear apply message and applied state when switching fans ── */
watch(selectedFanKey, () => {
  applyMsg.value = "";
  appliedRangeIds.value = new Set();
});

/* ── Detect fans via backend API (falls back to mock) ── */
async function detectFans() {
  detecting.value = true;
  detectError.value = "";
  applyMsg.value = "";
  try {
    const result = await detectFansAPI();
    if (result.error_msg) {
      throw new Error(result.error_msg);
    }
    detectedFans.value = result.fans || [];
    detectedCount.value = result.count || 0;
    transport.value = result.transport || "unknown";
  } catch (err) {
    detectError.value = `Backend error: ${err.message ?? err}. Using mock data.`;
    transport.value = "mock";
    // Fallback: mock detection with random 1-6 fans
    const mockCount = Math.floor(Math.random() * 6) + 1;
    detectedFans.value = Array.from({ length: mockCount }, (_, i) => ({
      board: i < 3 ? 1 : 2,
      fan: (i % 6) + 1,
      name: `MOCK_Board${i < 3 ? 1 : 2}_Fan${(i % 6) + 1}`,
      rpm: Math.floor(Math.random() * 4000) + 1000,
      responding: true,
    }));
    detectedCount.value = mockCount;
  }

  // Initialise default point & RPM cache for each fan
  for (const fan of detectedFans.value) {
    if (!fanPoints.value[fan.name]) {
      fanPoints.value[fan.name] = [{ temp: 0, speed: 70 }];
    }
    fanRPMs.value[fan.name] = fan.rpm;
  }
  detected.value = true;
  if (detectedFans.value.length > 0) {
    selectedFanKey.value = detectedFans.value[0].name;
  }
  detecting.value = false;
}

/* ── Refresh RPM for the selected fan ── */
async function refreshSelectedFanRPM() {
  const fan = selectedFan.value;
  if (!fan) return;
  refreshing.value = true;
  try {
    const result = await getFanRPMAPI(fan.fan, fan.board);
    if (result.rpm !== undefined) {
      fanRPMs.value[fan.name] = result.rpm;
    }
  } catch {
    // Silently keep the old value
  }
  refreshing.value = false;
}

/* ── Apply a single range (set duty) for the selected fan ── */
async function applyRange(rangeIdx) {
  const fan = selectedFan.value;
  if (!fan) return;
  const ranges = currentRanges.value;
  const range = ranges[rangeIdx];
  if (!range) return;

  applyingRangeIdx.value = rangeIdx;
  applyMsg.value = "";

  try {
    const result = await setFanDutyAPI(fan.fan, range.speed, fan.board);
    if (result.success) {
      appliedRangeIds.value = new Set([...appliedRangeIds.value, range.id]);
      applyMsg.value = `Applied ${range.speed}% duty (${range.tempLow}°C–${range.tempHigh}°C) to Board ${fan.board} · Fan ${fan.fan}`;
      applyMsgOk.value = true;
      // Auto-clear success message after 3 seconds
      if (applyMsgTimer) clearTimeout(applyMsgTimer);
      applyMsgTimer = setTimeout(() => { applyMsg.value = ""; }, 3000);
      // Refresh RPM after a short delay for the fan to adjust
      setTimeout(() => refreshSelectedFanRPM(), 2000);
    } else {
      throw new Error(result.error_msg || "Unknown error");
    }
  } catch (err) {
    applyMsg.value = `✗ Failed to apply range: ${err.message ?? err}`;
    applyMsgOk.value = false;
  }
  applyingRangeIdx.value = null;
}

/* ── Range management callbacks ── */
function onAddRange({ tempLow, tempHigh, speed }) {
  if (!selectedFanKey.value) return;
  const key = selectedFanKey.value;
  const pts = [...(fanPoints.value[key] ?? [])];
  pts.push({ temp: tempLow, speed });
  pts.push({ temp: tempHigh, speed });
  fanPoints.value[key] = pts;

  // Track the range for deletion
  if (!fanRanges.value[key]) fanRanges.value[key] = [];
  fanRanges.value[key] = [
    ...fanRanges.value[key],
    { id: ++rangeIdCounter, tempLow, tempHigh, speed },
  ];
}

function onDeleteRange(rangeIdx) {
  if (!selectedFanKey.value) return;
  const key = selectedFanKey.value;
  const ranges = fanRanges.value[key] ?? [];
  const range = ranges[rangeIdx];
  if (!range) return;

  // Remove the two points that were added for this range
  const pts = [...(fanPoints.value[key] ?? [])];
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
  fanPoints.value[key] = filtered;

  // Remove the range entry and its applied state
  const newApplied = new Set(appliedRangeIds.value);
  newApplied.delete(range.id);
  appliedRangeIds.value = newApplied;
  fanRanges.value[key] = ranges.filter((_, i) => i !== rangeIdx);
}
</script>
