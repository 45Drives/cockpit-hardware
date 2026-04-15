<script setup>
import "@fontsource/red-hat-text/600.css";
import "@fontsource/red-hat-text/400.css";
import FfdHeader from "./components/FfdHeader.vue";
import FanControllerPanel from "./components/FanControllerPanel.vue";
import ProfileList from "./components/ProfileList.vue";
import { ref, onMounted } from "vue";
import {
  loadProfiles as loadProfilesAPI,
  saveProfiles as saveProfilesAPI,
  setActiveProfile as setActiveProfileAPI,
  getDaemonStatus as getDaemonStatusAPI,
} from "./api/fanControllerAPI.js";

const adminCheck = ref(false);
const adminFlag = ref(false);

/* ── Chassis compatibility gate ──
 * The fan controller is only supported on NVME-F8X3 chassis.
 * We read /etc/45drives/server_info/server_info.json to decide.
 */
const chassisChecked = ref(false);   // true once the check has completed
const chassisSupported = ref(false); // true only when Chassis Size === "NVME-F8X3"
const chassisSize = ref("");         // actual value for the UI message

async function checkChassisSize() {
  try {
    const raw = await new Promise((resolve, reject) => {
      cockpit
        .file("/etc/45drives/server_info/server_info.json")
        .read()
        .then((content) => resolve(content))
        .catch((err) => reject(err));
    });
    const info = JSON.parse(raw);
    chassisSize.value = info["Chassis Size"] || "Unknown";
    chassisSupported.value = chassisSize.value === "NVME-F8X3";
  } catch (err) {
    console.error("Failed to read server info for chassis check:", err);
    chassisSize.value = "Unknown";
    chassisSupported.value = false;
  }
  chassisChecked.value = true;
}

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

/* ── File-backed profile storage ──
 * Profiles are persisted at /etc/45drives/fan-controller/profiles.json
 * via backend scripts so the daemon and UI share the same data.
 */
const activeProfileId = ref(null);  // ID of profile the daemon is running
const daemonRunning = ref(false);
const daemonEnabled = ref(false);
const loading = ref(true);          // True while initial load is in flight

async function saveProfilesToStorage() {
  try {
    const config = {
      version: 1,
      activeProfileId: activeProfileId.value,
      profiles: JSON.parse(JSON.stringify(profiles.value)),
    };
    await saveProfilesAPI(config);
  } catch (err) {
    console.error("Failed to save profiles:", err);
  }
}

async function loadProfilesFromStorage() {
  loading.value = true;
  try {
    const result = await loadProfilesAPI();
    if (result.success !== false) {
      profiles.value = result.profiles || [];
      activeProfileId.value = result.activeProfileId ?? null;
    }
  } catch (err) {
    console.error("Failed to load profiles:", err);
  }
  loading.value = false;
}

async function refreshDaemonStatus() {
  try {
    const status = await getDaemonStatusAPI();
    daemonRunning.value = status.running || false;
    daemonEnabled.value = status.enabled || false;
  } catch {
    daemonRunning.value = false;
    daemonEnabled.value = false;
  }
}

/* ── Profile management ── */
const currentView = ref("list");     // "list" | "editor"
const profiles = ref([]);            // Array of saved profile objects
const editingProfileId = ref(null);  // ID of profile being edited (null = new)
const editingProfile = ref(null);    // Profile data passed to editor
const editorSessionKey = ref(0);     // Incremented to force remount only on new editor sessions

function onNewProfile() {
  editingProfileId.value = null;
  editingProfile.value = null;
  editorSessionKey.value++;
  currentView.value = "editor";
}

function onOpenProfile(id) {
  const found = profiles.value.find((p) => p.id === id);
  if (!found) return;
  editingProfileId.value = id;
  editingProfile.value = { ...found };
  editorSessionKey.value++;
  currentView.value = "editor";
}

async function upsertProfile(profileState) {
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
    // Track the newly created ID so subsequent saves update it (no remount)
    editingProfileId.value = id;
  }

  await saveProfilesToStorage();
  return editingProfileId.value;
}

async function onSave(profileState) {
  const id = await upsertProfile(profileState);
  return id;
}

async function onGoBack() {
  editingProfileId.value = null;
  editingProfile.value = null;
  currentView.value = "list";
  // Refresh daemon status when returning to list
  await refreshDaemonStatus();
}

async function onDeleteProfile(id) {
  // If the deleted profile was active, deactivate it
  if (activeProfileId.value === id) {
    activeProfileId.value = null;
    try {
      await setActiveProfileAPI(null);
    } catch {
      // best-effort
    }
  }
  profiles.value = profiles.value.filter((p) => p.id !== id);
  await saveProfilesToStorage();
}

async function onActivateProfile(id) {
  try {
    const result = await setActiveProfileAPI(id);
    if (result.success) {
      activeProfileId.value = id;
      daemonRunning.value = result.daemonRunning || false;
    }
  } catch (err) {
    console.error("Failed to activate profile:", err);
  }
}

async function onDeactivateProfile() {
  try {
    const result = await setActiveProfileAPI(null);
    if (result.success) {
      activeProfileId.value = null;
      daemonRunning.value = false;
    }
  } catch (err) {
    console.error("Failed to deactivate profile:", err);
  }
}

onMounted(async () => {
  rootCheck();
  await checkChassisSize();
  if (chassisSupported.value) {
    await loadProfilesFromStorage();
    await refreshDaemonStatus();
  }
});
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <FfdHeader moduleName="Fan Controller" centerName />

    <!-- Waiting for chassis check -->
    <div
      v-if="!chassisChecked"
      class="grow flex flex-col well overflow-y-auto p-4 justify-center items-center"
    >
      <span class="text-muted">Checking chassis compatibility…</span>
    </div>

    <!-- Unsupported chassis -->
    <div
      v-else-if="!chassisSupported"
      class="grow flex flex-col well overflow-y-auto p-4 justify-center items-center"
    >
      <div class="card">
        <div class="card-header">
          <h3 class="text-header text-default">
            Unsupported Chassis
          </h3>
        </div>
        <div class="card-body flex flex-col gap-4">
          <div
            class="bg-accent rounded-md p-5 flex flex-col items-center gap-4"
          >
            The 45Drives Fan Controller is only supported on the
            <strong>NVME-F8X3</strong> chassis.
            <br />
            Detected chassis:&nbsp;<strong>{{ chassisSize }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Supported chassis — normal flow -->
    <div v-else-if="adminCheck && adminFlag" class="grow flex flex-col well overflow-y-auto p-4">
      <!-- Profile list (landing page) -->
      <ProfileList
        v-if="currentView === 'list'"
        :profiles="profiles"
        :activeProfileId="activeProfileId"
        :daemonRunning="daemonRunning"
        :loading="loading"
        @new-profile="onNewProfile"
        @open-profile="onOpenProfile"
        @delete-profile="onDeleteProfile"
        @activate-profile="onActivateProfile"
        @deactivate-profile="onDeactivateProfile"
      />
      <!-- Profile editor (FanControllerPanel) -->
      <FanControllerPanel
        v-else
        :key="editorSessionKey"
        :profile="editingProfile"
        :profileId="editingProfileId"
        @go-back="onGoBack"
        @save="onSave"
        @update:profileId="(id) => editingProfileId.value = id"
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
