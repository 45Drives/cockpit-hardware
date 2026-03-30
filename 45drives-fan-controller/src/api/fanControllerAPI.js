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
 * In production the scripts live at:
 *   /usr/share/cockpit/45drives-fan-controller/scripts/<name>
 *
 * During development (test installs via yarn deploy) they live at:
 *   ~/.local/share/cockpit/45drives-fan-controller-test/scripts/<name>
 *
 * We try the production path first. If cockpit.file can't stat it,
 * we fall back to the test path.  Both paths are absolute so
 * cockpit.spawn() can always find them regardless of CWD.
 */
const MODULE_NAME = "45drives-fan-controller";
const PROD_BASE   = `/usr/share/cockpit/${MODULE_NAME}/scripts`;
const TEST_BASE   = `/usr/share/cockpit/${MODULE_NAME}-test/scripts`;

/**
 * Detect which base path exists and cache it.
 * Falls back to production path if detection fails.
 */
let _resolvedBase = null;

async function resolveScriptBase() {
  if (_resolvedBase) return _resolvedBase;

  // Try production path first
  try {
    await cockpitSpawnRaw(["test", "-d", PROD_BASE]);
    _resolvedBase = PROD_BASE;
    return _resolvedBase;
  } catch {
    // not found — try test path
  }

  try {
    await cockpitSpawnRaw(["test", "-d", TEST_BASE]);
    _resolvedBase = TEST_BASE;
    return _resolvedBase;
  } catch {
    // not found either — try home-local path
  }

  // Last resort: try the user's home local share path
  try {
    const result = await cockpitSpawnRaw(["sh", "-c", `echo $HOME/.local/share/cockpit/${MODULE_NAME}-test/scripts`]);
    const homePath = result.trim();
    await cockpitSpawnRaw(["test", "-d", homePath]);
    _resolvedBase = homePath;
    return _resolvedBase;
  } catch {
    // give up, use production path
  }

  _resolvedBase = PROD_BASE;
  return _resolvedBase;
}

function scriptPath(name) {
  // Synchronous — uses cached value. Must call resolveScriptBase() first.
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
