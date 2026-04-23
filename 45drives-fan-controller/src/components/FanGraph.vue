<template>
  <div class="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
    <h4 class="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
      Speed (RPM) vs Temperature — Board {{ fanBoard }} · Fan {{ fanNumber }}
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
          class="fill-gray-900 dark:fill-gray-100"
          font-size="11"
          font-weight="normal"
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
          class="fill-gray-900 dark:fill-gray-100"
          font-size="11"
          font-weight="normal"
        >
          {{ (i - 1) * 10 }}
        </text>

        <!-- Axis titles -->
        <text
          :x="padding.left + chartWidth / 2"
          :y="svgHeight - 2"
          text-anchor="middle"
          class="fill-gray-900 dark:fill-gray-100"
          font-size="12"
          font-weight="700"
        >
          Temperature (°C)
        </text>
        <text
          :x="14"
          :y="padding.top + chartHeight / 2"
          text-anchor="middle"
          class="fill-gray-900 dark:fill-gray-100"
          font-size="12"
          font-weight="700"
          :transform="`rotate(-90, 14, ${padding.top + chartHeight / 2})`"
        >
          Speed (PWM %)
        </text>

        <!-- Step-function line segments (horizontal + vertical only) -->
        <polyline
          v-if="sortedPoints.length > 1"
          :points="stepPolylinePoints"
          fill="none"
          stroke="#dc2626"
          stroke-width="2"
          stroke-linejoin="miter"
          stroke-linecap="round"
        />

        <!-- Data points (only for non-default points) -->
        <circle
          v-for="(pt, idx) in sortedPoints"
          :key="'pt-' + idx"
          :cx="tempToX(pt.temp)"
          :cy="speedToY(pt.speed)"
          r="6"
          class="cursor-default"
          :fill="pt.isDefault ? 'transparent' : '#dc2626'"
          :stroke="pt.isDefault ? 'transparent' : 'white'"
          :stroke-width="pt.isDefault ? 0 : 2"
          @mouseenter="pt.isDefault ? null : (hoveredPointIndex = idx)"
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

        <!-- Live temperature indicator line -->
        <g v-if="liveTemp !== null && liveTemp !== undefined">
          <line
            :x1="tempToX(clampTemp(liveTemp))"
            :y1="padding.top"
            :x2="tempToX(clampTemp(liveTemp))"
            :y2="padding.top + chartHeight"
            stroke="#f59e0b"
            stroke-width="2"
            stroke-dasharray="6 3"
            opacity="0.85"
          />
          <rect
            :x="tempToX(clampTemp(liveTemp)) - 28"
            :y="padding.top - 18"
            width="56"
            height="18"
            rx="3"
            fill="#f59e0b"
          />
          <text
            :x="tempToX(clampTemp(liveTemp))"
            :y="padding.top - 5"
            text-anchor="middle"
            fill="white"
            font-size="10"
            font-weight="600"
          >
            {{ liveTemp.toFixed(1) }}°C
          </text>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  fanBoard: { type: Number, required: true },
  fanNumber: { type: Number, required: true },
  /** Array of { temp: number, speed: number } */
  points: { type: Array, required: true },
  /** Current live temperature from bound sensors (null if none) */
  liveTemp: { type: Number, default: null },
});

const svgWidth = 640;
const svgHeight = 420;
const padding = { top: 24, right: 24, bottom: 44, left: 54 };
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

function clampTemp(temp) {
  return Math.max(0, Math.min(100, temp));
}

const polylinePoints = computed(() => {
  return sortedPoints.value
    .map((pt) => `${tempToX(pt.temp)},${speedToY(pt.speed)}`)
    .join(" ");
});

/** Step-function polyline: horizontal lines then vertical transitions */
const stepPolylinePoints = computed(() => {
  const pts = sortedPoints.value;
  if (pts.length < 2) return "";
  const coords = [];
  for (let i = 0; i < pts.length; i++) {
    if (i > 0 && pts[i].speed !== pts[i - 1].speed) {
      // Vertical step at the current point's x
      coords.push(`${tempToX(pts[i].temp)},${speedToY(pts[i - 1].speed)}`);
    }
    coords.push(`${tempToX(pts[i].temp)},${speedToY(pts[i].speed)}`);
  }
  return coords.join(" ");
});
</script>
