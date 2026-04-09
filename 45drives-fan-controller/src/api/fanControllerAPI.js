/**
 * fanControllerAPI.js
 *
 * API layer for the 45Drives Fan Controller module.
 * All backend calls go through this file so the frontend components
 * remain decoupled from the underlying scripts/commands.
 *
 * Backend scripts live in  public/scripts/  and communicate with
 * MAX31790 fan controller ICs over I2C via ipmitool.
 *
 * Two boards:
 *   Board 1 – I2C address 0x40
 *   Board 2 – I2C address 0x48
 * Each board has 6 fan channels.
 */

/* ─────────────────────────────────────────────
 *  Script path resolution
 * ───────────────────────────────────────────── */

/**
 * Resolve the absolute path to a backend script.
 *
 * Scripts live at:
 *   /usr/share/cockpit/45drives-fan-controller/scripts/<name>
 */
const MODULE_NAME = "45drives-fan-controller";
const PROD_BASE   = `/usr/share/cockpit/${MODULE_NAME}/scripts`;

let _resolvedBase = null;

async function resolveScriptBase() {
  if (_resolvedBase) return _resolvedBase;
  _resolvedBase = PROD_BASE;
  return _resolvedBase;
}

function scriptPath(name) {
  return `${_resolvedBase || PROD_BASE}/${name}`;
}

/* ─────────────────────────────────────────────
 *  Cockpit spawn helpers
 * ───────────────────────────────────────────── */

/**
 * Raw spawn — returns stdout as a string (no JSON parsing).
 */
function cockpitSpawnRaw(argv) {
  return new Promise((resolve, reject) => {
    cockpit
      .spawn(argv, { superuser: "try", err: "message" })
      .then((stdout) => resolve(stdout))
      .catch((ex) => reject(ex));
  });
}

/**
 * Low-level helper – spawns a command via Cockpit with superuser privileges.
 * Returns a Promise that resolves with parsed JSON stdout or rejects with
 * an error object.
 *
 * @param {string[]} argv  - Command and arguments to execute.
 * @param {string}   [stdin] - Optional string to pipe into stdin.
 * @returns {Promise<Object>} Parsed JSON response from the script.
 */
function cockpitSpawn(argv, stdin) {
  return new Promise((resolve, reject) => {
    const proc = cockpit.spawn(argv, { superuser: "require", err: "message" });

    if (stdin) {
      proc.input(stdin);
    }

    proc
      .then((stdout) => {
        try {
          resolve(JSON.parse(stdout));
        } catch {
          resolve({ raw: stdout });
        }
      })
      .catch((ex) => {
        reject({
          message: ex.message || "Unknown error",
          exitStatus: ex.exit_status ?? -1,
        });
      });
  });
}

/* ─────────────────────────────────────────────
 *  Fan Detection
 * ───────────────────────────────────────────── */

/**
 * Detect all fans across both MAX31790 boards.
 *
 * @returns {Promise<Object>}
 */
export async function detectFans() {
  await resolveScriptBase();
  return cockpitSpawn([scriptPath("detect_fans")]);
}

/* ─────────────────────────────────────────────
 *  Fan RPM Reading
 * ───────────────────────────────────────────── */

/**
 * Get the current RPM for a single fan.
 *
 * @param {number} fanNum   - Fan channel (1-6).
 * @param {number} boardNum - Board number (1 or 2, default 1).
 * @returns {Promise<Object>}
 */
export async function getFanRPM(fanNum, boardNum = 1) {
  await resolveScriptBase();
  return cockpitSpawn([
    scriptPath("get_fan_rpm"),
    String(fanNum),
    String(boardNum),
  ]);
}

/**
 * Get RPM readings for ALL fans across both boards.
 *
 * @returns {Promise<{ fans: Array, success: boolean }>}
 */
export async function getAllFanRPMs() {
  await resolveScriptBase();
  return cockpitSpawn([scriptPath("get_fan_rpm"), "--all"]);
}

/* ─────────────────────────────────────────────
 *  Fan Duty (PWM) Control
 * ───────────────────────────────────────────── */

/**
 * Set the PWM duty cycle for a single fan.
 *
 * @param {number} fanNum       - Fan channel (1-6).
 * @param {number} dutyPercent  - Duty cycle 0-100.
 * @param {number} boardNum     - Board number (1 or 2, default 1).
 * @returns {Promise<Object>}
 */
export async function setFanDuty(fanNum, dutyPercent, boardNum = 1) {
  await resolveScriptBase();
  return cockpitSpawn([
    scriptPath("set_fan_duty"),
    String(fanNum),
    String(dutyPercent),
    String(boardNum),
  ]);
}

/* ─────────────────────────────────────────────
 *  Fan Profile (batch duty setting)
 * ───────────────────────────────────────────── */

/**
 * Apply a duty cycle to one or more fans at once.
 *
 * @param {Array<{ fan_num: number, board_num: number, duty_percent: number }>} commands
 * @returns {Promise<{ results: Array, success: boolean }>}
 */
export async function applyFanProfile(commands) {
  await resolveScriptBase();
  const payload = JSON.stringify({ commands });
  return cockpitSpawn([scriptPath("apply_fan_profile")], payload);
}

/* ─────────────────────────────────────────────
 *  Temperature Sensor Detection
 * ───────────────────────────────────────────── */

/**
 * Detect all temperature sensors from hwmon sysfs.
 *
 * @returns {Promise<{ sensors: Array, count: number }>}
 */
export async function detectSensors() {
  await resolveScriptBase();
  return cockpitSpawn([scriptPath("detect_sensors")]);
}

/* ─────────────────────────────────────────────
 *  Temperature Sensor Readings
 * ───────────────────────────────────────────── */

/**
 * Read the current temperature for all sensors.
 *
 * @returns {Promise<{ sensors: Array<{ id: string, value: number }>, success: boolean }>}
 */
export async function getAllSensorTemps() {
  await resolveScriptBase();
  return cockpitSpawn([scriptPath("get_sensor_temps")]);
}

/**
 * Read the current temperature for a single sensor.
 *
 * @param {string} sensorId  - Sensor identifier (e.g. "hwmon0_temp1").
 * @returns {Promise<{ id: string, value: number, success: boolean }>}
 */
export async function getSensorTemp(sensorId) {
  await resolveScriptBase();
  return cockpitSpawn([scriptPath("get_sensor_temps"), sensorId]);
}

/* ─────────────────────────────────────────────
 *  Persistent Profile Storage (file-backed)
 * ───────────────────────────────────────────── */

/**
 * Load all profiles from /etc/45drives/fan-controller/profiles.json.
 *
 * @returns {Promise<{ version: number, activeProfileId: number|null, profiles: Array, success: boolean }>}
 */
export async function loadProfiles() {
  await resolveScriptBase();
  return cockpitSpawn([scriptPath("load_profiles")]);
}

/**
 * Save all profiles to /etc/45drives/fan-controller/profiles.json.
 *
 * @param {{ version: number, activeProfileId: number|null, profiles: Array }} config
 * @returns {Promise<{ success: boolean }>}
 */
export async function saveProfiles(config) {
  await resolveScriptBase();
  return cockpitSpawn([scriptPath("save_profiles")], JSON.stringify(config));
}

/**
 * Set (or clear) the active profile and start/stop the daemon.
 *
 * @param {number|null} profileId  - Profile ID to activate, or null to deactivate.
 * @returns {Promise<{ success: boolean, activeProfileId: number|null, daemonRunning: boolean }>}
 */
export async function setActiveProfile(profileId) {
  await resolveScriptBase();
  return cockpitSpawn(
    [scriptPath("set_active_profile")],
    JSON.stringify({ activeProfileId: profileId }),
  );
}

/**
 * Check whether the fan controller daemon systemd service is running.
 *
 * @returns {Promise<{ running: boolean, enabled: boolean, activeState: string, success: boolean }>}
 */
export async function getDaemonStatus() {
  await resolveScriptBase();
  return cockpitSpawn([scriptPath("get_daemon_status")]);
}
