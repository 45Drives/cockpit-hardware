<template>
  <div class="flex flex-col gap-6">
    <!-- ───── Back + Save ───── -->
    <div class="flex items-center gap-3">
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
        @click="goBack"
      >
        <ArrowLeftIcon class="w-4 h-4" />
        Back
      </button>
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-red-700 hover:bg-red-800 text-white transition-colors"
        @click="saveProfile"
      >
        Save
      </button>
      <span v-if="saveMsg" class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ saveMsg }}</span>
      <h2 class="text-sm font-bold text-gray-900 dark:text-gray-100 ml-auto">
        {{ profileName }}
      </h2>
    </div>

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
          @click="detectAll"
        >
          <span v-if="detecting">Detecting…</span>
          <span v-else>{{ detected ? 'Re-detect' : 'Detect Fans & Sensors' }}</span>
        </button>
      </div>
      <div class="card-body">
        <div
          v-if="detected"
          class="flex items-center gap-3 bg-accent rounded-md p-4"
        >
          <CheckCircleIcon class="w-6 h-6 text-red-700 dark:text-red-400 shrink-0" />
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
            <strong>{{ detectedCount }}</strong> fan{{ detectedCount !== 1 ? 's' : '' }} across
            {{ boardCount }} board{{ boardCount !== 1 ? 's' : '' }},
            <strong>{{ sensorCount }}</strong> temperature sensor{{ sensorCount !== 1 ? 's' : '' }} detected.
          </span>
        </div>

        <!-- Board-wise fan dropdowns after detection -->
        <div v-if="detected && detectedFans.length > 0" class="mt-3 grid grid-cols-2 gap-2 items-start">
          <div
            v-for="group in fansByBoard"
            :key="group.board"
            class="rounded-md border border-gray-200 dark:border-neutral-600 overflow-hidden"
          >
            <button
              class="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors text-left"
              @click="expandedBoards.has(group.board) ? expandedBoards.delete(group.board) : expandedBoards.add(group.board)"
            >
              <span class="text-xs font-bold text-gray-900 dark:text-gray-100">
                Board {{ group.board }}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="transition-transform text-gray-900 dark:text-gray-100"
                :class="expandedBoards.has(group.board) ? 'rotate-180' : ''"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div v-if="expandedBoards.has(group.board)" class="px-3 py-2 flex flex-col gap-1">
              <span
                v-for="fan in group.fans"
                :key="fan.name"
                class="text-xs font-medium text-gray-900 dark:text-gray-100"
              >
                Fan {{ fan.fan }}
              </span>
            </div>
          </div>
        </div>

        <p v-if="!detected" class="text-sm font-medium text-gray-900 dark:text-gray-100">
          Click <strong>Detect Fans &amp; Sensors</strong> to scan for connected fans and temperature sensors.
        </p>
        <p v-if="detectError" class="text-red-600 dark:text-red-400 text-sm font-medium mt-2">
          {{ detectError }}
        </p>
      </div>
    </div>

    <!-- ───── 2. Temperature Sensors Card ───── -->
    <div v-if="detected && detectedSensors.length > 0" class="card">
      <div class="card-header flex items-center justify-between">
        <h3 class="text-header text-default">Temperature Sensors</h3>
        <button
          class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
          :class="
            refreshingSensors
              ? 'bg-gray-400 dark:bg-neutral-600 text-white cursor-wait'
              : 'bg-red-700 hover:bg-red-800 text-white'
          "
          :disabled="refreshingSensors"
          @click="refreshAllSensorTemps"
        >
          <span v-if="refreshingSensors">Reading…</span>
          <span v-else>Refresh Temperatures</span>
        </button>
      </div>
      <div class="card-body flex flex-col gap-5">

        <!-- ── 2a. CPU Temperatures ── -->
        <div v-if="cpuSensorGroups.length > 0">
          <h4 class="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-2">Processors</h4>
          <div class="grid grid-cols-2 gap-2 items-start">
            <div
              v-for="group in cpuSensorGroups"
              :key="group.key"
              class="rounded-md border border-gray-200 dark:border-neutral-600 overflow-hidden"
            >
              <button
                class="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors text-left"
                @click="expandedCPUs.has(group.key) ? expandedCPUs.delete(group.key) : expandedCPUs.add(group.key)"
              >
                <span class="text-xs font-bold text-gray-900 dark:text-gray-100">{{ group.displayName }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform text-gray-900 dark:text-gray-100" :class="expandedCPUs.has(group.key) ? 'rotate-180' : ''"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              <div v-if="expandedCPUs.has(group.key)" class="px-3 py-2 flex flex-col gap-1">
                <div
                  v-for="sensor in group.sensors"
                  :key="sensor.id"
                  class="flex items-center justify-between"
                >
                  <span class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ sensorDisplayName(sensor) }}</span>
                  <span class="text-xs font-mono font-medium" :class="sensorValueClass(sensorTemps[sensor.id] ?? sensor.value)">
                    {{ (sensorTemps[sensor.id] ?? sensor.value).toFixed(1) }}°C
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── 2b. NIC / HBA ── -->
        <div v-if="nicHbaSensorGroups.length > 0">
          <h4 class="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-2">NIC / HBA</h4>
          <div class="grid grid-cols-2 gap-2 items-start">
            <div
              v-for="group in nicHbaSensorGroups"
              :key="group.key"
              class="rounded-md border border-gray-200 dark:border-neutral-600 overflow-hidden"
            >
              <button
                class="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors text-left"
                @click="expandedNicHba.has(group.key) ? expandedNicHba.delete(group.key) : expandedNicHba.add(group.key)"
              >
                <span class="text-xs font-bold text-gray-900 dark:text-gray-100">{{ group.displayName }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform text-gray-900 dark:text-gray-100" :class="expandedNicHba.has(group.key) ? 'rotate-180' : ''"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              <div v-if="expandedNicHba.has(group.key)" class="px-3 py-2 flex flex-col gap-1">
                <div
                  v-for="sensor in group.sensors"
                  :key="sensor.id"
                  class="flex items-center justify-between"
                >
                  <span class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ sensorDisplayName(sensor) }}</span>
                  <span class="text-xs font-mono font-medium" :class="sensorValueClass(sensorTemps[sensor.id] ?? sensor.value)">
                    {{ (sensorTemps[sensor.id] ?? sensor.value).toFixed(1) }}°C
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── 2c. GPU ── -->
        <div v-if="gpuSensorGroups.length > 0">
          <h4 class="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-2">GPU</h4>
          <div class="grid grid-cols-2 gap-2 items-start">
            <div
              v-for="group in gpuSensorGroups"
              :key="group.key"
              class="rounded-md border border-gray-200 dark:border-neutral-600 overflow-hidden"
            >
              <button
                class="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors text-left"
                @click="expandedGPU.has(group.key) ? expandedGPU.delete(group.key) : expandedGPU.add(group.key)"
              >
                <span class="text-xs font-bold text-gray-900 dark:text-gray-100">{{ group.displayName }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform text-gray-900 dark:text-gray-100" :class="expandedGPU.has(group.key) ? 'rotate-180' : ''"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              <div v-if="expandedGPU.has(group.key)" class="px-3 py-2 flex flex-col gap-1">
                <div
                  v-for="sensor in group.sensors"
                  :key="sensor.id"
                  class="flex items-center justify-between"
                >
                  <span class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ sensorDisplayName(sensor) }}</span>
                  <span class="text-xs font-mono font-medium" :class="sensorValueClass(sensorTemps[sensor.id] ?? sensor.value)">
                    {{ (sensorTemps[sensor.id] ?? sensor.value).toFixed(1) }}°C
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── 2d. Drive Temperatures ── -->
        <div v-if="driveSensors.length > 0">
          <h4 class="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-2">Drives ({{ driveStats.count }})</h4>
          <div class="grid grid-cols-3 gap-3">
            <div class="rounded-md border px-4 py-3 text-center" :class="sensorTempClass(driveStats.min)">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">Minimum</p>
              <p class="text-lg font-mono font-bold" :class="sensorValueClass(driveStats.min)">{{ driveStats.min.toFixed(1) }}°C</p>
            </div>
            <div class="rounded-md border px-4 py-3 text-center" :class="sensorTempClass(driveStats.avg)">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">Average</p>
              <p class="text-lg font-mono font-bold" :class="sensorValueClass(driveStats.avg)">{{ driveStats.avg.toFixed(1) }}°C</p>
            </div>
            <div class="rounded-md border px-4 py-3 text-center" :class="sensorTempClass(driveStats.max)">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">Maximum</p>
              <p class="text-lg font-mono font-bold" :class="sensorValueClass(driveStats.max)">{{ driveStats.max.toFixed(1) }}°C</p>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ───── 3. Fan Selector + Sensor Binding + Graph + Create Range ───── -->
    <div v-if="detected" class="card">
      <div class="card-header">
        <h3 class="text-header text-default">Fan Configuration</h3>
      </div>
      <div class="card-body flex flex-col gap-5">
        <!-- Fan Dropdown + RPM Display -->
        <div class="grid grid-cols-2 gap-4 items-start">
          <div class="flex flex-col gap-1">
            <label
              for="fan-select"
              class="text-sm font-bold text-gray-900 dark:text-gray-100"
            >
              Select Fan
            </label>
            <select
              id="fan-select"
              v-model="selectedFanKey"
              class="block w-full rounded-md border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 text-sm font-medium px-3 py-2 focus:border-red-500 focus:ring-red-500"
            >
              <option :value="null" disabled>-- choose a fan --</option>
              <option
                v-for="fan in detectedFans"
                :key="fan.name"
                :value="fan.name"
              >
                Board {{ fan.board }} · Fan {{ fan.fan }}
              </option>
            </select>
          </div>
          <div v-if="selectedFan !== null" class="flex flex-col items-center justify-center gap-1 pt-1">
            <img :src="logoLight" alt="45Drives" class="logo-spin w-9 h-9 block dark:hidden" />
            <img :src="logoDark" alt="45Drives" class="logo-spin w-9 h-9 hidden dark:block" />
            <span class="text-sm font-bold font-mono text-gray-900 dark:text-gray-100">{{ currentFanRPM }} RPM</span>
          </div>
        </div>

        <!-- Sensor Binding -->
        <div v-if="selectedFan !== null && detectedSensors.length > 0" class="grid grid-cols-2 gap-4">
          <div class="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
            <button
              class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              @click="sensorBindOpen = !sensorBindOpen"
            >
              <span class="text-sm font-bold text-gray-900 dark:text-gray-100">
                Linked Sensors ({{ currentBoundSensors.length }})
              </span>
              <ChevronDownIcon
                class="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': sensorBindOpen }"
              />
            </button>
            <div v-show="sensorBindOpen" class="px-4 pb-3 flex flex-col gap-1">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">
                Select which sensors to monitor. Fan duty will follow the <strong>highest temperature</strong> linked sensor.
              </p>

              <!-- CPU Sensors -->
              <template v-if="cpuSensorGroups.length > 0">
                <div class="mt-1 mb-0.5 px-1 text-[11px] font-bold uppercase tracking-wider border-b border-gray-200 dark:border-neutral-600 pb-1" :class="boundSensorSection && boundSensorSection !== 'cpu' ? 'text-gray-400 dark:text-gray-600' : 'text-red-700 dark:text-red-400'">
                  CPUs
                </div>
                <div :class="{ 'opacity-40 pointer-events-none': boundSensorSection && boundSensorSection !== 'cpu' }">
                  <template v-for="group in cpuSensorGroups" :key="'cpu-' + group.key">
                    <span class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 px-2 pt-1">{{ group.displayName }}</span>
                    <label
                      v-for="sensor in group.sensors"
                      :key="sensor.id"
                      class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        :value="sensor.id"
                        v-model="fanSensorBindings[selectedFanKey]"
                        class="rounded border-gray-300 dark:border-neutral-600 text-red-600 focus:ring-red-500"
                        :disabled="!!boundSensorSection && boundSensorSection !== 'cpu'"
                      />
                      <span class="text-xs font-medium text-gray-900 dark:text-gray-100 flex-1">
                        {{ sensorDisplayName(sensor) }}
                      </span>
                      <span v-if="currentBoundSensors.includes(sensor.id)" class="text-xs font-bold font-mono text-gray-900 dark:text-gray-100">
                        {{ (sensorTemps[sensor.id] ?? sensor.value).toFixed(1) }}°C
                      </span>
                    </label>
                  </template>
                </div>
              </template>

              <!-- NIC / HBA Sensors -->
              <template v-if="nicHbaSensorGroups.length > 0">
                <div class="mt-2 mb-0.5 px-1 text-[11px] font-bold uppercase tracking-wider border-b border-gray-200 dark:border-neutral-600 pb-1" :class="boundSensorSection && boundSensorSection !== 'nichba' ? 'text-gray-400 dark:text-gray-600' : 'text-red-700 dark:text-red-400'">
                  NIC / HBA
                </div>
                <div :class="{ 'opacity-40 pointer-events-none': boundSensorSection && boundSensorSection !== 'nichba' }">
                  <template v-for="group in nicHbaSensorGroups" :key="'nichba-' + group.key">
                    <span class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 px-2 pt-1">{{ group.displayName }}</span>
                    <label
                      v-for="sensor in group.sensors"
                      :key="sensor.id"
                      class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        :value="sensor.id"
                        v-model="fanSensorBindings[selectedFanKey]"
                        class="rounded border-gray-300 dark:border-neutral-600 text-red-600 focus:ring-red-500"
                        :disabled="!!boundSensorSection && boundSensorSection !== 'nichba'"
                      />
                      <span class="text-xs font-medium text-gray-900 dark:text-gray-100 flex-1">
                        {{ sensorDisplayName(sensor) }}
                      </span>
                      <span v-if="currentBoundSensors.includes(sensor.id)" class="text-xs font-bold font-mono text-gray-900 dark:text-gray-100">
                        {{ (sensorTemps[sensor.id] ?? sensor.value).toFixed(1) }}°C
                      </span>
                    </label>
                  </template>
                </div>
              </template>

              <!-- GPU Sensors -->
              <template v-if="gpuSensorGroups.length > 0">
                <div class="mt-2 mb-0.5 px-1 text-[11px] font-bold uppercase tracking-wider border-b border-gray-200 dark:border-neutral-600 pb-1" :class="boundSensorSection && boundSensorSection !== 'gpu' ? 'text-gray-400 dark:text-gray-600' : 'text-red-700 dark:text-red-400'">
                  GPU
                </div>
                <div :class="{ 'opacity-40 pointer-events-none': boundSensorSection && boundSensorSection !== 'gpu' }">
                  <template v-for="group in gpuSensorGroups" :key="'gpu-' + group.key">
                    <span class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 px-2 pt-1">{{ group.displayName }}</span>
                    <label
                      v-for="sensor in group.sensors"
                      :key="sensor.id"
                      class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        :value="sensor.id"
                        v-model="fanSensorBindings[selectedFanKey]"
                        class="rounded border-gray-300 dark:border-neutral-600 text-red-600 focus:ring-red-500"
                        :disabled="!!boundSensorSection && boundSensorSection !== 'gpu'"
                      />
                      <span class="text-xs font-medium text-gray-900 dark:text-gray-100 flex-1">
                        {{ sensorDisplayName(sensor) }}
                      </span>
                      <span v-if="currentBoundSensors.includes(sensor.id)" class="text-xs font-bold font-mono text-gray-900 dark:text-gray-100">
                        {{ (sensorTemps[sensor.id] ?? sensor.value).toFixed(1) }}°C
                      </span>
                    </label>
                  </template>
                </div>
              </template>

              <!-- Drive Sensors -->
              <template v-if="driveSensors.length > 0">
                <div class="mt-2 mb-0.5 px-1 text-[11px] font-bold uppercase tracking-wider border-b border-gray-200 dark:border-neutral-600 pb-1" :class="boundSensorSection && boundSensorSection !== 'drive' ? 'text-gray-400 dark:text-gray-600' : 'text-red-700 dark:text-red-400'">
                  Drives ({{ driveSensors.length }})
                </div>
                <div :class="{ 'opacity-40 pointer-events-none': boundSensorSection && boundSensorSection !== 'drive' }">
                  <label
                    v-for="sensor in driveSensors"
                    :key="sensor.id"
                    class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      :value="sensor.id"
                      v-model="fanSensorBindings[selectedFanKey]"
                      class="rounded border-gray-300 dark:border-neutral-600 text-red-600 focus:ring-red-500"
                      :disabled="!!boundSensorSection && boundSensorSection !== 'drive'"
                    />
                    <span class="text-xs font-medium text-gray-900 dark:text-gray-100 flex-1">
                      {{ sensorDisplayName(sensor) }}
                    </span>
                    <span v-if="currentBoundSensors.includes(sensor.id)" class="text-xs font-bold font-mono text-gray-900 dark:text-gray-100">
                      {{ (sensorTemps[sensor.id] ?? sensor.value).toFixed(1) }}°C
                    </span>
                  </label>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Create Range + Added Ranges (left) | Graph (right) -->
        <div class="grid grid-cols-2 gap-4 items-center">
          <!-- Left column: Create Range, Added Ranges, Apply -->
          <div class="flex flex-col gap-4">
            <div>
              <CreateRange
                v-if="selectedFan !== null"
                :existingPoints="currentPoints"
                @add-range="onAddRange"
              />
            </div>

            <!-- Added Ranges List -->
            <div v-if="selectedFan !== null && currentRanges.length > 0">
              <div class="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
                <button
                  class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  @click="rangesOpen = !rangesOpen"
                >
                  <span class="text-sm font-bold text-gray-900 dark:text-gray-100">
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
                    class="flex items-center gap-2 rounded-md px-3 py-2 border transition-colors"
                    :class="activeRangeId === range.id
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600'
                      : 'bg-gray-50 dark:bg-neutral-700 border-gray-200 dark:border-neutral-600'"
                  >
                    <span
                      class="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0"
                      :class="activeRangeId === range.id
                        ? 'bg-red-700 text-white'
                        : 'bg-gray-300 dark:bg-neutral-500 text-gray-600 dark:text-gray-300'"
                    >
                      {{ idx + 1 }}
                    </span>
                    <span class="text-xs font-medium text-gray-900 dark:text-gray-100 flex-1">
                      {{ range.tempLow }}°C – {{ range.tempHigh }}°C @ {{ range.speed }}%
                    </span>
                    <span v-if="activeRangeId === range.id" class="text-[10px] font-bold text-red-700 dark:text-red-400 shrink-0">
                      ACTIVE
                    </span>
                    <button
                      @click="onDeleteRange(idx)"
                      class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors ml-1 shrink-0"
                      title="Delete range"
                      :disabled="autoControlActive"
                      :class="{ 'opacity-40 pointer-events-none': autoControlActive }"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Apply / Stop -->
              <div class="mt-2" v-if="currentBoundSensors.length > 0">
                <button
                  class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors w-full bg-red-700 hover:bg-red-800 text-white"
                  @click="toggleAutoControl"
                >
                  <svg v-if="!autoControlActive" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 4v16l13 -8l-13 -8" /></svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6 6a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -12" /><path d="M14 6a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -12" /></svg>
                  {{ autoControlActive ? 'Stop' : 'Apply' }}
                </button>
              </div>
              <p v-else class="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                Link at least one sensor to enable temperature-based control.
              </p>
            </div>

            <!-- Apply status message -->
            <p v-if="applyMsg" class="text-sm font-medium" :class="applyMsgOk ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400'">
              {{ applyMsg }}
            </p>

            <!-- Save Profile -->
            <div class="flex items-center gap-2">
              <button
                class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md bg-red-700 hover:bg-red-800 text-white transition-colors"
                @click="saveProfile"
              >
                
                Save
              </button>
              <span v-if="saveMsg" class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ saveMsg }}</span>
            </div>
          </div>

          <!-- Right column: Graph -->
          <FanGraph
            v-if="selectedFan !== null"
            :fanBoard="selectedFan.board"
            :fanNumber="selectedFan.fan"
            :points="currentPoints"
            :liveTemp="currentBoundSensors.length > 0 ? maxBoundTemp : null"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from "vue";
import { CheckCircleIcon, TrashIcon, ChevronDownIcon, ArrowLeftIcon } from "@heroicons/vue/solid";
import FanGraph from "./FanGraph.vue";
import CreateRange from "./CreateRange.vue";
import logoDark from "../assets/45drives-logo-dark.svg";
import logoLight from "../assets/45drives-logo-light.svg";
import {
  detectFans as detectFansAPI,
  getFanRPM as getFanRPMAPI,
  setFanDuty as setFanDutyAPI,
  detectSensors as detectSensorsAPI,
  getAllSensorTemps as getAllSensorTempsAPI,
} from "../api/fanControllerAPI.js";

/* ── Props & Emits ── */
const props = defineProps({
  /** Existing profile data to restore (null = new profile). */
  profile: { type: Object, default: null },
});

const emit = defineEmits(["go-back", "save"]);

/* ── Constants ── */
const AUTO_POLL_INTERVAL = 5000; // ms

/* ── Reactive state ── */
const profileName = ref("New Profile");
const detecting = ref(false);
const detected = ref(false);
const detectedCount = ref(0);
const detectedFans = ref([]);
const detectError = ref("");
const selectedFanKey = ref(null);
const transport = ref("");
const rangesOpen = ref(false);
const sensorBindOpen = ref(false);
const applyingRangeIdx = ref(null);
const appliedRangeIds = ref(new Set());
const refreshing = ref(false);
const refreshingSensors = ref(false);
const applyMsg = ref("");
const applyMsgOk = ref(false);
let rangeIdCounter = 0;
let applyMsgTimer = null;

/** Tracks which board dropdowns are expanded (by board number) */
const expandedBoards = reactive(new Set());

/** Tracks which CPU/NIC-HBA/GPU dropdowns are expanded */
const expandedCPUs = reactive(new Set());
const expandedNicHba = reactive(new Set());
const expandedGPU = reactive(new Set());

/** Detected temperature sensors */
const detectedSensors = ref([]);
const sensorCount = ref(0);

/** Live temperature cache: { sensor_id: temp_value } */
const sensorTemps = ref({});

/** Per-fan sensor bindings: { fan_name: [sensor_id, ...] } */
const fanSensorBindings = ref({});

/** Auto mode state */
const autoMode = ref(false);
let autoModeInterval = null;
const autoActiveDuty = ref(0);

/** ID of the range currently being enforced by auto-control */
const activeRangeId = ref(null);
/** Whether automatic temp-based fan control is engaged */
const autoControlActive = ref(false);

/** Live RPM cache keyed by fan name. */
const fanRPMs = ref({});

/** Per-fan data points keyed by fan name. */
const fanPoints = ref({});

/** Per-fan ranges keyed by fan name. */
const fanRanges = ref({});

/* ── Restore profile state on mount ── */
onMounted(() => {
  if (props.profile) {
    const p = props.profile;
    profileName.value = p.name || "Restored Profile";
    detected.value = p.detected || false;
    detectedFans.value = p.detectedFans || [];
    detectedCount.value = p.detectedCount || 0;
    detectedSensors.value = p.detectedSensors || [];
    sensorCount.value = p.sensorCount || 0;
    sensorTemps.value = { ...(p.sensorTemps || {}) };
    selectedFanKey.value = p.selectedFanKey || null;
    transport.value = p.transport || "";
    fanPoints.value = JSON.parse(JSON.stringify(p.fanPoints || {}));
    fanRanges.value = JSON.parse(JSON.stringify(p.fanRanges || {}));
    fanSensorBindings.value = JSON.parse(JSON.stringify(p.fanSensorBindings || {}));
    fanRPMs.value = { ...(p.fanRPMs || {}) };
    autoMode.value = false; // always start with auto off
    rangeIdCounter = p.rangeIdCounter || 0;
    // Start RPM polling if a fan was already selected in the restored profile
    if (selectedFanKey.value) {
      startRPMPolling();
    }
  }
});

/* ── Collect current state into a serialisable profile snapshot ── */
function collectProfileState() {
  // Count total ranges across all fans
  let totalRanges = 0;
  for (const key of Object.keys(fanRanges.value)) {
    totalRanges += (fanRanges.value[key] || []).length;
  }

  return {
    name: profileName.value,
    detected: detected.value,
    detectedFans: JSON.parse(JSON.stringify(detectedFans.value)),
    detectedCount: detectedCount.value,
    detectedSensors: JSON.parse(JSON.stringify(detectedSensors.value)),
    sensorCount: sensorCount.value,
    sensorTemps: { ...sensorTemps.value },
    selectedFanKey: selectedFanKey.value,
    transport: transport.value,
    fanPoints: JSON.parse(JSON.stringify(fanPoints.value)),
    fanRanges: JSON.parse(JSON.stringify(fanRanges.value)),
    fanSensorBindings: JSON.parse(JSON.stringify(fanSensorBindings.value)),
    fanRPMs: { ...fanRPMs.value },
    autoMode: autoMode.value,
    rangeIdCounter,
    // Summary fields for the profile card
    fanCount: detectedFans.value.length,
    boardCount: new Set(detectedFans.value.map((f) => f.board)).size,
    rangeCount: totalRanges,
  };
}

/* ── Save profile without leaving ── */
const saveMsg = ref("");
let saveMsgTimer = null;

function saveProfile() {
  emit("save", collectProfileState());
  saveMsg.value = "Saved Successfully";
  if (saveMsgTimer) clearTimeout(saveMsgTimer);
  saveMsgTimer = setTimeout(() => { saveMsg.value = ""; }, 2000);
}

/* ── Go back: navigate without saving ── */
async function goBack() {
  // Stop auto-control and auto mode before leaving
  autoControlActive.value = false;
  activeRangeId.value = null;
  if (autoMode.value) {
    autoMode.value = false;
    stopAutoMode();
  }
  stopRPMPolling();
  stopSensorPolling();

  // Reset all detected fans to the default 50% duty
  for (const fan of detectedFans.value) {
    try {
      await setFanDutyAPI(fan.fan, 50, fan.board);
    } catch {
      // best-effort
    }
  }

  emit("go-back");
}

/* ── Computed ── */

const selectedFan = computed(() => {
  if (!selectedFanKey.value) return null;
  return detectedFans.value.find((f) => f.name === selectedFanKey.value) ?? null;
});

const selectedFanIndex = computed(() => {
  if (!selectedFan.value) return 0;
  return detectedFans.value.indexOf(selectedFan.value) + 1;
});

const boardCount = computed(() => {
  const boards = new Set(detectedFans.value.map((f) => f.board));
  return boards.size;
});

const fansByBoard = computed(() => {
  const map = {};
  for (const fan of detectedFans.value) {
    if (!map[fan.board]) map[fan.board] = [];
    map[fan.board].push(fan);
  }
  return Object.entries(map)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([board, fans]) => ({ board: Number(board), fans }));
});

const currentPoints = computed(() => {
  if (!selectedFanKey.value) return [];
  return fanPoints.value[selectedFanKey.value] ?? [{ temp: 0, speed: 50, isDefault: true }, { temp: 100, speed: 50, isDefault: true }];
});

const currentRanges = computed(() => {
  if (!selectedFanKey.value) return [];
  return fanRanges.value[selectedFanKey.value] ?? [];
});

const currentFanRPM = computed(() => {
  if (!selectedFanKey.value) return 0;
  return fanRPMs.value[selectedFanKey.value] ?? selectedFan.value?.rpm ?? 0;
});

/** Sensors currently bound to the selected fan */
const currentBoundSensors = computed(() => {
  if (!selectedFanKey.value) return [];
  return fanSensorBindings.value[selectedFanKey.value] ?? [];
});

/**
 * Which UI section ("cpu", "nichba", "gpu", "drive") do the currently
 * bound sensors belong to?  Returns null if nothing is selected yet.
 * All bound sensors will always be from the same section (enforced by disabling).
 */
const boundSensorSection = computed(() => {
  const bound = currentBoundSensors.value;
  if (!bound || bound.length === 0) return null;
  // Build a quick lookup: sensor-id → section
  const sensorMap = {};
  for (const s of detectedSensors.value) {
    const cat = inferCategory(s);
    const dt = (s.device_type || "").toUpperCase();
    if (cat === "cpu") sensorMap[s.id] = "cpu";
    else if (cat === "pci" && (dt === "NIC" || dt === "HBA")) sensorMap[s.id] = "nichba";
    else if (cat === "pci" && dt === "GPU") sensorMap[s.id] = "gpu";
    else if (cat === "drive") sensorMap[s.id] = "drive";
    else sensorMap[s.id] = "pci";
  }
  // Return the section of the first bound sensor
  for (const id of bound) {
    if (sensorMap[id]) return sensorMap[id];
  }
  return null;
});

/** Group CPU sensors by hwmon for dropdown display */
const _CPU_CHIPS = new Set(["k10temp", "coretemp", "zenpower", "fam15h_power"]);

function inferCategory(sensor) {
  if (sensor.category) return sensor.category;
  if (_CPU_CHIPS.has(sensor.chip)) return "cpu";
  if (sensor.chip === "drivetemp" || sensor.chip === "smartctl") return "drive";
  // storcli, nvidia, bnxt_en, etc. are all PCI devices
  return "pci";
}

const cpuSensorGroups = computed(() => {
  const cpuSensors = detectedSensors.value.filter((s) => inferCategory(s) === "cpu");
  const hwmons = {};
  for (const s of cpuSensors) {
    if (!hwmons[s.hwmon]) hwmons[s.hwmon] = [];
    hwmons[s.hwmon].push(s);
  }
  const sorted = Object.entries(hwmons).sort(([a], [b]) => a.localeCompare(b));
  return sorted.map(([hwmon, sensors], i) => ({
    key: hwmon,
    displayName: `CPU ${i + 1}`,
    sensors,
  }));
});

/** Group NIC/HBA PCI sensors by hwmon */
const nicHbaSensorGroups = computed(() => {
  const sensors = detectedSensors.value.filter((s) => {
    if (inferCategory(s) !== "pci") return false;
    const dt = (s.device_type || "").toUpperCase();
    return dt === "NIC" || dt === "HBA";
  });
  const hwmons = {};
  for (const s of sensors) {
    if (!hwmons[s.hwmon]) hwmons[s.hwmon] = { type: s.device_type || "PCI", sensors: [] };
    hwmons[s.hwmon].sensors.push(s);
  }
  const typeCounts = {};
  const sortedKeys = Object.keys(hwmons).sort();
  return sortedKeys.map((hwmon) => {
    const g = hwmons[hwmon];
    if (!typeCounts[g.type]) typeCounts[g.type] = 0;
    typeCounts[g.type]++;
    return { key: hwmon, displayName: `${g.type} ${typeCounts[g.type]}`, sensors: g.sensors };
  });
});

/** Group GPU PCI sensors by hwmon */
const gpuSensorGroups = computed(() => {
  const sensors = detectedSensors.value.filter((s) => {
    if (inferCategory(s) !== "pci") return false;
    const dt = (s.device_type || "").toUpperCase();
    return dt === "GPU";
  });
  const hwmons = {};
  for (const s of sensors) {
    if (!hwmons[s.hwmon]) hwmons[s.hwmon] = { type: "GPU", sensors: [] };
    hwmons[s.hwmon].sensors.push(s);
  }
  let idx = 0;
  const sortedKeys = Object.keys(hwmons).sort();
  return sortedKeys.map((hwmon) => {
    idx++;
    return { key: hwmon, displayName: `GPU ${idx}`, sensors: hwmons[hwmon].sensors };
  });
});

/** Drive sensors */
const driveSensors = computed(() => {
  return detectedSensors.value.filter((s) => inferCategory(s) === "drive");
});

/** Drive temperature stats: min, avg, max */
const driveStats = computed(() => {
  const allDrives = driveSensors.value;
  const temps = allDrives.map((s) => sensorTemps.value[s.id] ?? s.value).filter((t) => t > 0);
  if (temps.length === 0) return { min: 0, avg: 0, max: 0, count: allDrives.length };
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
  return { min: Math.round(min * 10) / 10, avg: Math.round(avg * 10) / 10, max: Math.round(max * 10) / 10, count: allDrives.length };
});

/** Maximum temperature across all bound sensors for the selected fan */
const maxBoundTemp = computed(() => {
  const bound = currentBoundSensors.value;
  if (bound.length === 0) return 0;
  let max = -Infinity;
  for (const sId of bound) {
    const val = sensorTemps.value[sId];
    if (val !== undefined && val > max) max = val;
  }
  return max === -Infinity ? 0 : max;
});

/** Bound sensor objects with live temps for display, grouped by sub-group */
const boundSensorDetails = computed(() => {
  const bound = currentBoundSensors.value;
  if (!bound || bound.length === 0) return [];
  const sensorMap = {};
  for (const s of detectedSensors.value) sensorMap[s.id] = s;

  const boundSet = new Set(bound);
  const section = boundSensorSection.value;

  // For CPU: group by cpuSensorGroups
  if (section === "cpu") {
    const groups = [];
    for (const group of cpuSensorGroups.value) {
      const sensors = group.sensors.filter((s) => boundSet.has(s.id));
      if (sensors.length > 0) {
        groups.push({
          label: group.displayName,
          sensors: sensors.map((s) => ({ id: s.id, name: sensorDisplayName(s), temp: sensorTemps.value[s.id] ?? s.value ?? 0 })),
        });
      }
    }
    return groups;
  }

  // For NIC/HBA: group by nicHbaSensorGroups
  if (section === "nichba") {
    const groups = [];
    for (const group of nicHbaSensorGroups.value) {
      const sensors = group.sensors.filter((s) => boundSet.has(s.id));
      if (sensors.length > 0) {
        groups.push({
          label: group.displayName,
          sensors: sensors.map((s) => ({ id: s.id, name: sensorDisplayName(s), temp: sensorTemps.value[s.id] ?? s.value ?? 0 })),
        });
      }
    }
    return groups;
  }

  // For GPU: group by gpuSensorGroups
  if (section === "gpu") {
    const groups = [];
    for (const group of gpuSensorGroups.value) {
      const sensors = group.sensors.filter((s) => boundSet.has(s.id));
      if (sensors.length > 0) {
        groups.push({
          label: group.displayName,
          sensors: sensors.map((s) => ({ id: s.id, name: sensorDisplayName(s), temp: sensorTemps.value[s.id] ?? s.value ?? 0 })),
        });
      }
    }
    return groups;
  }

  // For drives: single flat group
  if (section === "drive") {
    const sensors = driveSensors.value.filter((s) => boundSet.has(s.id));
    if (sensors.length > 0) {
      return [{
        label: `Drives (${sensors.length})`,
        sensors: sensors.map((s) => ({ id: s.id, name: sensorDisplayName(s), temp: sensorTemps.value[s.id] ?? s.value ?? 0 })),
      }];
    }
  }

  return [];
});

/* ── Sensor display helpers ── */

/** Full-form names for AMD k10temp / coretemp labels */
const _CPU_LABEL_MAP = {
  "Tctl":    "Tctl (T Control)",
  "Tdie":    "Tdie (Die Temperature)",
  "Tccd1":   "Tccd1 (Core Complex Die 1)",
  "Tccd2":   "Tccd2 (Core Complex Die 2)",
  "Tccd3":   "Tccd3 (Core Complex Die 3)",
  "Tccd4":   "Tccd4 (Core Complex Die 4)",
  "Tccd5":   "Tccd5 (Core Complex Die 5)",
  "Tccd6":   "Tccd6 (Core Complex Die 6)",
  "Tccd7":   "Tccd7 (Core Complex Die 7)",
  "Tccd8":   "Tccd8 (Core Complex Die 8)",
  "Tctl_Tdie": "Tctl/Tdie (Control / Die)",
};

function sensorDisplayName(sensor) {
  if (sensor.label) {
    // Expand abbreviated CPU labels to full form
    if (sensor.category === "cpu" || _CPU_CHIPS.has(sensor.chip)) {
      const full = _CPU_LABEL_MAP[sensor.label];
      if (full) return full;
    }
    return sensor.label;
  }
  // Fallback for unlabeled sensors
  if (sensor.category === "pci") return `${sensor.device_type || sensor.chip} Temp`;
  if (sensor.category === "drive") return sensor.model || "Drive";
  return sensor.id;
}

function sensorTempClass() {
  return "bg-gray-50 dark:bg-neutral-700 border-gray-200 dark:border-neutral-600";
}

function sensorValueClass() {
  return "text-gray-900 dark:text-gray-100";
}

/* ── Clear apply message and applied state when switching fans ── */
watch(selectedFanKey, (newKey) => {
  applyMsg.value = "";
  appliedRangeIds.value = new Set();
  // Deactivate auto-control when switching fans
  autoControlActive.value = false;
  activeRangeId.value = null;
  // Stop auto mode when switching fans
  if (autoMode.value) {
    autoMode.value = false;
    stopAutoMode();
  }
  // Start / stop RPM live polling
  if (newKey) {
    startRPMPolling();
  } else {
    stopRPMPolling();
  }
});

/* ── Detect fans AND sensors ── */
async function detectAll() {
  detecting.value = true;
  detectError.value = "";
  applyMsg.value = "";

  // Detect fans
  try {
    const result = await detectFansAPI();
    if (result.error_msg) throw new Error(result.error_msg);
    detectedFans.value = result.fans || [];
    detectedCount.value = result.count || 0;
    transport.value = result.transport || "unknown";
  } catch (err) {
    detectError.value = `Fan detection error: ${err.message ?? err}. Using mock data.`;
    transport.value = "mock";
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

  // Detect sensors
  try {
    const sResult = await detectSensorsAPI();
    if (sResult.error_msg) throw new Error(sResult.error_msg);
    detectedSensors.value = sResult.sensors || [];
    sensorCount.value = sResult.count || 0;
    // Initialize sensor temp cache
    for (const s of detectedSensors.value) {
      sensorTemps.value[s.id] = s.value;
    }
  } catch (err) {
    // Non-fatal: sensors are optional
    console.warn("Sensor detection failed:", err);
    detectedSensors.value = [];
    sensorCount.value = 0;
  }

  // Initialise default point & RPM cache for each fan
  for (const fan of detectedFans.value) {
    if (!fanPoints.value[fan.name]) {
      fanPoints.value[fan.name] = [{ temp: 0, speed: 50, isDefault: true }, { temp: 100, speed: 50, isDefault: true }];
    }
    fanRPMs.value[fan.name] = fan.rpm;
    // Initialize empty sensor bindings if not already set
    if (!fanSensorBindings.value[fan.name]) {
      fanSensorBindings.value[fan.name] = [];
    }
  }

  // Set all detected fans to the default 50 % duty
  for (const fan of detectedFans.value) {
    try {
      await setFanDutyAPI(fan.fan, 50, fan.board);
    } catch {
      // best-effort; don't block detection on a single failure
    }
  }

  detected.value = true;
  if (detectedFans.value.length > 0) {
    selectedFanKey.value = detectedFans.value[0].name;
  }
  detecting.value = false;
}

/* ── Refresh all sensor temps ── */
async function refreshAllSensorTemps() {
  refreshingSensors.value = true;
  try {
    const result = await getAllSensorTempsAPI();
    if (result.sensors) {
      for (const s of result.sensors) {
        sensorTemps.value[s.id] = s.value;
      }
    }
  } catch {
    // silently keep old values
  }
  refreshingSensors.value = false;
}

/* ── Refresh RPM for the selected fan ── */
let rpmPollInterval = null;

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

function startRPMPolling() {
  stopRPMPolling();
  // Fetch immediately, then every 1 s
  refreshSelectedFanRPM();
  rpmPollInterval = setInterval(refreshSelectedFanRPM, 1000);
}

function stopRPMPolling() {
  if (rpmPollInterval) {
    clearInterval(rpmPollInterval);
    rpmPollInterval = null;
  }
}

/* ── Live sensor temp polling for linked sensors (1 s) ── */
let sensorPollInterval = null;

async function pollBoundSensorTemps() {
  const bound = currentBoundSensors.value;
  if (!bound || bound.length === 0) return;
  try {
    const result = await getAllSensorTempsAPI();
    if (result.sensors) {
      for (const s of result.sensors) {
        sensorTemps.value[s.id] = s.value;
      }
    }
  } catch {
    // silently keep old values
    return;
  }

  // Auto-control: evaluate ranges and apply the correct duty
  if (!autoControlActive.value) return;
  const fan = selectedFan.value;
  if (!fan) return;

  // Find hottest bound sensor
  let hottest = -Infinity;
  for (const sId of bound) {
    const val = sensorTemps.value[sId];
    if (val !== undefined && val > hottest) hottest = val;
  }
  if (hottest === -Infinity) return;

  // Match temp to a range
  const ranges = currentRanges.value;
  if (ranges.length === 0) return;

  const sorted = [...ranges].sort((a, b) => a.tempLow - b.tempLow);
  let matchedRange = null;
  for (const range of sorted) {
    if (hottest >= range.tempLow && hottest <= range.tempHigh) {
      matchedRange = range;
      break;
    }
  }
  // If above all ranges, use highest; if below all, use lowest
  if (!matchedRange) {
    const last = sorted[sorted.length - 1];
    if (hottest > last.tempHigh) matchedRange = last;
    else matchedRange = sorted[0];
  }

  if (matchedRange) {
    activeRangeId.value = matchedRange.id;
    try {
      await setFanDutyAPI(fan.fan, matchedRange.speed, fan.board);
    } catch {
      // best-effort
    }
  }
}

function startSensorPolling() {
  stopSensorPolling();
  pollBoundSensorTemps();
  sensorPollInterval = setInterval(pollBoundSensorTemps, 1000);
}

function stopSensorPolling() {
  if (sensorPollInterval) {
    clearInterval(sensorPollInterval);
    sensorPollInterval = null;
  }
}

// Start/stop sensor polling based on whether any sensors are bound
watch(currentBoundSensors, (bound) => {
  if (bound && bound.length > 0) {
    startSensorPolling();
  } else {
    stopSensorPolling();
  }
}, { immediate: true });



/* ── Activate / deactivate automatic temperature-based fan control ── */
function toggleAutoControl() {
  autoControlActive.value = !autoControlActive.value;
  if (autoControlActive.value) {
    // Run an immediate evaluation
    pollBoundSensorTemps();
  } else {
    activeRangeId.value = null;
    // Reset fan to default 50 % duty when deactivating
    const fan = selectedFan.value;
    if (fan) {
      setFanDutyAPI(fan.fan, 50, fan.board).catch(() => {});
    }
  }
}

/* ── Auto mode: poll sensors and apply matching duty ── */
function toggleAutoMode() {
  autoMode.value = !autoMode.value;
  if (autoMode.value) {
    startAutoMode();
  } else {
    stopAutoMode();
  }
}

function startAutoMode() {
  // Run immediately, then on interval
  autoModeStep();
  autoModeInterval = setInterval(autoModeStep, AUTO_POLL_INTERVAL);
}

function stopAutoMode() {
  if (autoModeInterval) {
    clearInterval(autoModeInterval);
    autoModeInterval = null;
  }
}

async function autoModeStep() {
  const fan = selectedFan.value;
  if (!fan || !autoMode.value) return;

  // 1. Refresh sensor temps
  try {
    const result = await getAllSensorTempsAPI();
    if (result.sensors) {
      for (const s of result.sensors) {
        sensorTemps.value[s.id] = s.value;
      }
    }
  } catch {
    return; // skip this cycle
  }

  // 2. Get hottest bound sensor
  const bound = fanSensorBindings.value[fan.name] ?? [];
  if (bound.length === 0) return;

  let hottest = -Infinity;
  for (const sId of bound) {
    const val = sensorTemps.value[sId];
    if (val !== undefined && val > hottest) hottest = val;
  }
  if (hottest === -Infinity) return;

  // 3. Find the matching range and apply duty
  const ranges = fanRanges.value[fan.name] ?? [];
  if (ranges.length === 0) return;

  // Sort ranges by tempLow ascending
  const sorted = [...ranges].sort((a, b) => a.tempLow - b.tempLow);

  let duty = null;
  for (const range of sorted) {
    if (hottest >= range.tempLow && hottest <= range.tempHigh) {
      duty = range.speed;
      break;
    }
  }

  // If temp exceeds all ranges, use the highest range's duty
  if (duty === null) {
    const last = sorted[sorted.length - 1];
    if (hottest > last.tempHigh) {
      duty = last.speed;
    }
  }

  // If temp is below all ranges, use the lowest range's duty
  if (duty === null) {
    const first = sorted[0];
    if (hottest < first.tempLow) {
      duty = first.speed;
    }
  }

  if (duty !== null) {
    autoActiveDuty.value = duty;
    try {
      await setFanDutyAPI(fan.fan, duty, fan.board);
    } catch {
      // silently continue
    }
  }
}

// Clean up auto mode, RPM polling, and sensor polling on component unmount
onUnmounted(() => {
  autoControlActive.value = false;
  stopAutoMode();
  stopRPMPolling();
  stopSensorPolling();
});

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
      if (applyMsgTimer) clearTimeout(applyMsgTimer);
      applyMsgTimer = setTimeout(() => { applyMsg.value = ""; }, 3000);
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

  const newApplied = new Set(appliedRangeIds.value);
  newApplied.delete(range.id);
  appliedRangeIds.value = newApplied;
  fanRanges.value[key] = ranges.filter((_, i) => i !== rangeIdx);

  // If no ranges remain, reset fan to default 50 % duty
  if ((fanRanges.value[key] ?? []).length === 0) {
    const fan = selectedFan.value;
    if (fan) {
      setFanDutyAPI(fan.fan, 50, fan.board).catch(() => {});
    }
  }
}
</script>

<style scoped>
@keyframes logo-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.logo-spin {
  animation: logo-spin 2s linear infinite;
}
</style>
