<template>
  <div class="flex flex-col gap-6">
    <div class="grid grid-cols-2 gap-4">
      <!-- Saved profile cards -->
      <div
        v-for="profile in profiles"
        :key="profile.id"
        class="group flex flex-col gap-3 rounded-lg border p-5 text-left transition-all cursor-pointer"
        :class="profile.id === activeProfileId
          ? 'bg-red-50 dark:bg-red-900/10 border-red-400 dark:border-red-600 shadow-md'
          : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 hover:border-red-400 dark:hover:border-red-600 hover:shadow-md'"
        @click="$emit('open-profile', profile.id)"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">
              {{ profile.name }}
            </h3>
            <span
              v-if="profile.id === activeProfileId"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              :class="daemonRunning
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'"
            >
              <span
                class="inline-block w-1.5 h-1.5 rounded-full"
                :class="daemonRunning ? 'bg-green-500' : 'bg-yellow-500'"
              ></span>
              {{ daemonRunning ? 'Active' : 'Set' }}
            </span>
          </div>
        </div>

        <!-- Date and action buttons row -->
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-900 dark:text-gray-100">
            {{ formatDate(profile.updatedAt || profile.createdAt) }}
          </span>
          <div class="flex items-center gap-2">
            <!-- Activate / Deactivate button -->
            <button
              v-if="profile.id !== activeProfileId"
              class="px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors"
              @click.stop="$emit('activate-profile', profile.id)"
              title="Activate this profile and start the fan daemon"
            >
              Activate
            </button>
            <button
              v-else
              class="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-200 dark:bg-neutral-600 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-neutral-500 transition-colors"
              @click.stop="$emit('deactivate-profile')"
              title="Deactivate this profile and stop the fan daemon"
            >
              Deactivate
            </button>
            <button
              class="px-3 py-1.5 text-xs font-medium rounded-md bg-red-700 hover:bg-red-800 text-white transition-colors"
              @click.stop="confirmDelete(profile)"
            >
              Delete
            </button>
          </div>
        </div>

        <!-- Summary badges -->
        <div class="flex flex-wrap gap-1.5">
          <span
            v-if="profile.boardCount > 0"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
          >
            {{ profile.boardCount }} board{{ profile.boardCount !== 1 ? 's' : '' }}
          </span>
          <span
            v-if="profile.fanCount > 0"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
          >
            {{ profile.fanCount }} fan{{ profile.fanCount !== 1 ? 's' : '' }}
          </span>
          <span
            v-if="profile.sensorCount > 0"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
          >
            {{ profile.sensorCount }} sensor{{ profile.sensorCount !== 1 ? 's' : '' }}
          </span>
          <span
            v-if="profile.rangeCount > 0"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
          >
            {{ profile.rangeCount }} range{{ profile.rangeCount !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>

      <!-- + New Fan Profile card -->
      <button
        :class="[
          'flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-900 dark:border-gray-100 p-8 text-gray-900 dark:text-gray-100 hover:border-red-400 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 transition-all min-h-[140px]',
          profiles.length % 2 === 0 ? 'col-span-2' : ''
        ]"
        @click="$emit('new-profile')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
        <span class="text-sm font-bold">New Fan Profile</span>
      </button>
    </div>

    <!-- Delete confirmation dialog -->
    <div
      v-if="deleteTarget"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="deleteTarget = null"
    >
      <div class="bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 p-8 max-w-md w-full mx-4">
        <h4 class="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
          Delete Profile
        </h4>
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Are you sure you want to delete <strong>{{ deleteTarget.name }}</strong>?
        </p>
        <p v-if="deleteTarget.id === activeProfileId" class="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">
          This is the currently active profile. Deleting it will stop the fan controller daemon.
        </p>
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-6">This cannot be undone.</p>
        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 dark:bg-neutral-600 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-neutral-500 transition-colors"
            @click="deleteTarget = null"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 text-sm font-medium rounded-md bg-red-700 hover:bg-red-800 text-white transition-colors"
            @click="doDelete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  profiles: { type: Array, required: true },
  activeProfileId: { type: [Number, null], default: null },
  daemonRunning: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits([
  "new-profile",
  "open-profile",
  "delete-profile",
  "activate-profile",
  "deactivate-profile",
]);

const activeProfile = computed(() => {
  if (props.activeProfileId == null) return null;
  return props.profiles.find((p) => p.id === props.activeProfileId) ?? null;
});

const deleteTarget = ref(null);

function confirmDelete(profile) {
  deleteTarget.value = profile;
}

function doDelete() {
  if (deleteTarget.value) {
    emit("delete-profile", deleteTarget.value.id);
    deleteTarget.value = null;
  }
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>
