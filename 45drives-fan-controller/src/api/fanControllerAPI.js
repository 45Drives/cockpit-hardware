/**
 * fanControllerAPI.js
 *
 * API layer for the 45Drives Fan Controller module.
 * All backend calls go through this file so the frontend components
 * remain decoupled from the underlying scripts/commands.
 *
 * Backend developer: the Python scripts live in  public/scripts/
 * and are served at  ./scripts/<name>  relative to the Cockpit module.
 *
 * To add a new backend function:
 *   1. Create a Python script in  public/scripts/
 *   2. Add a corresponding JS wrapper function here that calls
 *      cockpitSpawn() with the script path.
 *   3. Import and use the function in the Vue components.
 */

/**
 * Low-level helper – spawns a command via Cockpit with superuser privileges.
 * Returns a Promise that resolves with parsed JSON stdout or rejects with
 * an error object.
 *
 * @param {string[]} argv  - Command and arguments to execute.
 * @returns {Promise<Object>} Parsed JSON response from the script.
 */
function cockpitSpawn(argv) {
  return new Promise((resolve, reject) => {
    cockpit
      .spawn(argv, { superuser: "require", err: "message" })
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
 * Detect fans connected to the system.
 *
 * Calls: public/scripts/detect_fans  (Python)
 *
 * Resolves with:
 * {
 *   fans: [ { name: string, rpm: number }, ... ],
 *   count: number
 * }
 *
 * @returns {Promise<{ fans: Array<{name: string, rpm: number}>, count: number }>}
 */
export async function detectFans() {
  return cockpitSpawn(["./scripts/detect_fans"]);
}

/* ─────────────────────────────────────────────
 *  Add more API functions below as needed.
 *  Example stubs for future backend work:
 * ───────────────────────────────────────────── */

// /**
//  * Apply a fan speed profile to a specific fan.
//  * @param {number} fanIndex - 1-based fan number.
//  * @param {Array<{temp: number, speed: number}>} profile - Speed curve points.
//  * @returns {Promise<Object>}
//  */
// export async function applyFanProfile(fanIndex, profile) {
//   return cockpitSpawn([
//     "./scripts/apply_fan_profile",
//     String(fanIndex),
//     JSON.stringify(profile),
//   ]);
// }

// /**
//  * Get the current temperature readings.
//  * @returns {Promise<Object>}
//  */
// export async function getTemperatures() {
//   return cockpitSpawn(["./scripts/get_temperatures"]);
// }
