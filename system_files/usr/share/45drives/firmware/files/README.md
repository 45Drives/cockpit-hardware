# Firmware Binary Files

This directory holds firmware binary files on the target system at:
`/usr/share/45drives/firmware/files/`

**These files are NOT stored in the git repository** due to their size and
licensing restrictions. They are deployed to production servers via SCP or
package management.

## Expected files (referenced by manifest.json)

- `MobulaBPExosX14SATA-STD-512E-SN03.LOD` — Seagate Exos X14 MobulaBP SATA
- `EvansExosX16SATA-STD-512E-SN04.LOD` — Seagate Exos X16 Evans SATA
- `HBA_9400-16i_SAS_SATA_Profile.bin` — Broadcom HBA 9400-16i

## Deployment

```bash
scp <firmware_file> root@<target>:/usr/share/45drives/firmware/files/
```

The `firmware-flash` script looks for files in this directory when
`firmware_file` is specified in the manifest entry for a device.
