// Keep UI actions and notifications aligned with backend qualification.
export const isCard = device => ['nic', 'hba'].includes(device?.type);

export const isQualifiedCard = device => isCard(device)
  && device.qualification_policy_version === 1
  && device.eligible === true
  && !device.blocked_reason;

export const hasAvailableUpdate = device => isQualifiedCard(device)
  && device.flashable === true
  && device.update_available === 'outdated'
  && Boolean(device.firmware_file || device.tool_package);

export const catalogIsCurrent = cache => cache?.qualification_policy_version === 1
  && !['unavailable', 'local'].includes(cache?.manifest_source)
  && cache?.results_available !== false;
