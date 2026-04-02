<script setup>
import "@fontsource/red-hat-text/600.css";
import "@fontsource/red-hat-text/400.css";
import FfdHeader from "./components/FfdHeader.vue";
import FanControllerPanel from "./components/FanControllerPanel.vue";
import ProfileList from "./components/ProfileList.vue";
import { ref, watch, onMounted } from "vue";

const adminCheck = ref(false);
const adminFlag = ref(false);

const rootCheck = async () => {
  let root_check = cockpit.permission({ admin: true });
  root_check.addEventListener("changed", function () {
    if (root_check.allowed) {
      adminCheck.value = true;
      adminFlag.value = true;
    } else {
      adminCheck.value = true;
      adminFlag.value = false;
    }
  });
};

/* ── localStorage helpers ── */
const STORAGE_KEY = "45drives-fan-profiles";

function saveProfilesToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles.value));
  } catch { /* quota exceeded — silently skip */ }
}

function loadProfilesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      profiles.value = JSON.parse(raw);
    }

  } catch { /* corrupted data — start fresh */ }
}

/* ── Profile management ── */
const currentView = ref("list");     // "list" | "editor"
const profiles = ref([]);            // Array of saved profile objects
const editingProfileId = ref(null);  // ID of profile being edited (null = new)
const editingProfile = ref(null);    // Profile data passed to editor

function onNewProfile() {
  editingProfileId.value = null;
  editingProfile.value = null;
  currentView.value = "editor";
}

function onOpenProfile(id) {
  const found = profiles.value.find((p) => p.id === id);
  if (!found) return;
  editingProfileId.value = id;
  editingProfile.value = { ...found };
  currentView.value = "editor";
}

function upsertProfile(profileState) {
  const now = new Date().toISOString();

  if (editingProfileId.value !== null) {
    // Update existing profile
    const idx = profiles.value.findIndex((p) => p.id === editingProfileId.value);
    if (idx !== -1) {
      profiles.value[idx] = {
        ...profiles.value[idx],
        ...profileState,
        updatedAt: now,
      };
    }
  } else {
    // Save as new profile
    const maxId = profiles.value.length
      ? Math.max(...profiles.value.map((p) => p.id))
      : 0;
    const id = maxId + 1;
    const name = profileState.name && profileState.name !== "New Profile"
      ? profileState.name
      : `Profile ${id}`;
    profiles.value.push({
      id,
      ...profileState,
      name,
      createdAt: now,
      updatedAt: now,
    });
    // Track the newly created ID so subsequent saves update it
    editingProfileId.value = id;
  }

  saveProfilesToStorage();
}

function onSave(profileState) {
  upsertProfile(profileState);
}

function onGoBack() {
  editingProfileId.value = null;
  editingProfile.value = null;
  currentView.value = "list";
}

function onDeleteProfile(id) {
  profiles.value = profiles.value.filter((p) => p.id !== id);
  saveProfilesToStorage();
}

onMounted(() => {
  loadProfilesFromStorage();
  rootCheck();
});
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <FfdHeader moduleName="Fan Controller" centerName />
    <div v-if="adminCheck && adminFlag" class="grow flex flex-col well overflow-y-auto p-4">
      <!-- Profile list (landing page) -->
      <ProfileList
        v-if="currentView === 'list'"
        :profiles="profiles"
        @new-profile="onNewProfile"
        @open-profile="onOpenProfile"
        @delete-profile="onDeleteProfile"
      />
      <!-- Profile editor (FanControllerPanel) -->
      <FanControllerPanel
        v-else
        :key="editingProfileId ?? 'new'"
        :profile="editingProfile"
        @go-back="onGoBack"
        @save="onSave"
      />
    </div>
    <div
      v-else-if="adminCheck && !adminFlag"
      class="grow flex flex-col well overflow-y-auto p-4 justify-center items-center"
    >
      <div class="card">
        <div class="card-header">
          <h3 class="text-header text-default">
            Administrative Access Required
          </h3>
        </div>
        <div class="card-body flex flex-col gap-4">
          <div
            class="bg-accent rounded-md p-5 flex flex-col items-center gap-4"
          >
            45Drives Fan Controller requires administrative access to proceed.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import "@45drives/houston-common-css/src/index.css";
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  @apply bg-default h-full text-default;
}
</style>
