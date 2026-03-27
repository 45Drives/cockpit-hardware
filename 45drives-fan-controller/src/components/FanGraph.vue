<template>
  <div class="max-w-2xl bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
    <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
      Speed (RPM) vs Temperature — Fan {{ fanIndex }}
    </h4>
    <div class="relative">
      <svg
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        class="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Background -->
        <rect :width="svgWidth" :height="svgHeight" fill="none" />

        <!-- Grid lines -->
        <g class="grid-lines">
          <line
            v-for="i in 11"
            :key="'hgrid-' + i"
            :x1="padding.left"
            :y1="padding.top + ((i - 1) / 10) * chartHeight"
            :x2="padding.left + chartWidth"
            :y2="padding.top + ((i - 1) / 10) * chartHeight"
            stroke="currentColor"
            class="text-gray-200 dark:text-neutral-700"
            stroke-width="0.5"
          />
          <line
            v-for="i in 11"
            :key="'vgrid-' + i"
            :x1="padding.left + ((i - 1) / 10) * chartWidth"
            :y1="padding.top"
            :x2="padding.left + ((i - 1) / 10) * chartWidth"
            :y2="padding.top + chartHeight"
            stroke="currentColor"
            class="text-gray-200 dark:text-neutral-700"
            stroke-width="0.5"
          />
        </g>

        <!-- Axes -->
        <line
          :x1="padding.left"
          :y1="padding.top"
          :x2="padding.left"
          :y2="padding.top + chartHeight"
          stroke="currentColor"
          class="text-gray-400 dark:text-gray-500"
          stroke-width="1.5"
        />
        <line
          :x1="padding.left"
          :y1="padding.top + chartHeight"
          :x2="padding.left + chartWidth"
          :y2="padding.top + chartHeight"
          stroke="currentColor"
          class="text-gray-400 dark:text-gray-500"
          stroke-width="1.5"
        />

        <!-- Y-axis labels (Speed RPM %) -->
        <text
          v-for="i in 11"
          :key="'ylabel-' + i"
          :x="padding.left - 8"
          :y="padding.top + chartHeight - ((i - 1) / 10) * chartHeight + 4"
          text-anchor="end"
          class="fill-gray-500 dark:fill-gray-400"
          font-size="11"
        >
          {{ (i - 1) * 10 }}
        </text>

        <!-- X-axis labels (Temperature) -->
        <text
          v-for="i in 11"
          :key="'xlabel-' + i"
          :x="padding.left + ((i - 1) / 10) * chartWidth"
          :y="padding.top + chartHeight + 18"
          text-anchor="middle"
          class="fill-gray-500 dark:fill-gray-400"
          font-size="11"
        >
          {{ (i - 1) * 10 }}
        </text>

        <!-- Axis titles -->
        <text
          :x="padding.left + chartWidth / 2"
          :y="svgHeight - 2"
          text-anchor="middle"
          class="fill-gray-600 dark:fill-gray-300"
          font-size="12"
          font-weight="600"
        >
          Temperature (°C)
        </text>
        <text
          :x="14"
          :y="padding.top + chartHeight / 2"
          text-anchor="middle"
          class="fill-gray-600 dark:fill-gray-300"
          font-size="12"
          font-weight="600"
          :transform="`rotate(-90, 14, ${padding.top + chartHeight / 2})`"
        >
          Speed (RPM %)
        </text>

        <!-- Line segments between sorted points -->
        <polyline
          v-if="sortedPoints.length > 1"
          :points="polylinePoints"
          fill="none"
          stroke="#dc2626"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />

        <!-- Data points (hover only, no drag) -->
        <circle
          v-for="(pt, idx) in sortedPoints"
          :key="'pt-' + idx"
          :cx="tempToX(pt.temp)"
          :cy="speedToY(pt.speed)"
          r="6"
          class="cursor-default"
          fill="#dc2626"
          stroke="white"
          stroke-width="2"
          @mouseenter="hoveredPointIndex = idx"
          @mouseleave="hoveredPointIndex = null"
        />

        <!-- Tooltip for hovered point -->
        <g v-if="hoveredPointIndex !== null && sortedPoints[hoveredPointIndex]">
          <rect
            :x="tempToX(sortedPoints[hoveredPointIndex].temp) - 40"
            :y="speedToY(sortedPoints[hoveredPointIndex].speed) - 32"
            width="80"
            height="22"
            rx="4"
            fill="#1f2937"
            fill-opacity="0.9"
          />
          <text
            :x="tempToX(sortedPoints[hoveredPointIndex].temp)"
            :y="speedToY(sortedPoints[hoveredPointIndex].speed) - 17"
            text-anchor="middle"
            fill="white"
            font-size="11"
          >
            {{ sortedPoints[hoveredPointIndex].temp }}°C, {{ sortedPoints[hoveredPointIndex].speed }}%
          </text>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  fanIndex: { type: Number, required: true },
  /** Array of { temp: number, speed: number } */
  points: { type: Array, required: true },
});

const svgWidth = 520;
const svgHeight = 340;
const padding = { top: 20, right: 20, bottom: 40, left: 50 };
const chartWidth = svgWidth - padding.left - padding.right;
const chartHeight = svgHeight - padding.top - padding.bottom;

const hoveredPointIndex = ref(null);

const sortedPoints = computed(() => {
  return [...props.points].sort((a, b) => a.temp - b.temp);
});

function tempToX(temp) {
  return padding.left + (temp / 100) * chartWidth;
}

function speedToY(speed) {
  return padding.top + chartHeight - (speed / 100) * chartHeight;
}

const polylinePoints = computed(() => {
  return sortedPoints.value
    .map((pt) => `${tempToX(pt.temp)},${speedToY(pt.speed)}`)
    .join(" ");
});
</script>
