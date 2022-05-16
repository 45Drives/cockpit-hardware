<template>
  <div id="zfsCard" class="card grow flex flex-col">
    <div class="card-header">
      <h3 class="text-header text-default">ZFS Information</h3>
    </div>
    <div
      v-if="currentDisk != '' && zfsInfo.zfs_disks.hasOwnProperty(currentDisk)"
      class="card-body overflow-y-auto grow-0 flex flex-wrap gap-12"
    >
      <div
        class="grow-0 2xl:grow grid grid-cols-3 items-stretch gap-y-3 gap-x-5"
      >
        <div
          class="text-label text-default col-span-3 border-b-[1px] shrink-0 border-neutral-200 dark:border-neutral-700"
        >
          Zpools
        </div>
        <div class="grid grid-cols-1">
          <div class="text-sm text-muted">zpool name</div>
          <div class="text-sm">
            {{ zfsInfo.zfs_disks[currentDisk].zpool_name }}
          </div>
        </div>
        <div class="grid grid-cols-1">
          <div class="text-sm text-muted">health</div>
          <div
            :class="[
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx]
                .health === 'ONLINE'
                ? 'text-success'
                : '',
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx]
                .health === 'OFFLINE'
                ? 'text-warning'
                : '',
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx]
                .health === 'DEGRADED'
                ? 'text-warning'
                : '',
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx]
                .health === 'SUSPENDED'
                ? 'text-danger'
                : '',
              'text-sm',
            ]"
          >
            {{
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].health
            }}
          </div>
        </div>
        <div class="grid grid-cols-1">
          <div class="text-sm text-muted">state</div>
          <div
            :class="[
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].state ===
              'ONLINE'
                ? 'text-success'
                : '',
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].state ===
              'OFFLINE'
                ? 'text-warning'
                : '',
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].state ===
              'DEGRADED'
                ? 'text-warning'
                : '',
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].state ===
              'SUSPENDED'
                ? 'text-danger'
                : '',
              'text-sm',
            ]"
          >
            {{ zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].state }}
          </div>
        </div>
        <div class="grid grid-cols-1">
          <div class="text-sm text-muted">mountpoint</div>
          <div class="text-sm">
            {{
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx]
                .mountpoint
            }}
          </div>
        </div>
        <div class="grid grid-cols-1">
          <div class="text-sm text-muted">available</div>
          <div class="text-sm">
            {{ zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].avail }}
          </div>
        </div>
        <div class="grid grid-cols-1">
          <div class="text-sm text-muted">used</div>
          <div class="text-sm">
            {{ zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].used }}
          </div>
        </div>
        <div class="grid grid-cols-1">
          <div class="text-sm text-muted">size (raw)</div>
          <div class="text-sm">
            {{
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].raw_size
            }}
          </div>
        </div>
        <div class="grid grid-cols-1">
          <div class="text-sm text-muted">alloc (raw)</div>
          <div class="text-sm">
            {{
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].raw_alloc
            }}
          </div>
        </div>
        <div class="grid grid-cols-1">
          <div class="text-sm text-muted">free (raw)</div>
          <div class="text-sm">
            {{
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].raw_alloc
            }}
          </div>
        </div>
      </div>
      <div
        class="grow-0 2xl:grow grid grid-cols-3 items-stretch gap-y-3 gap-x-5"
      >
        <div
          class="text-label text-default col-span-3 border-b-[1px] shrink-0 border-neutral-200 dark:border-neutral-700"
        >
          Vdevs
        </div>
        <div>
          <div class="text-sm text-muted">vdev name</div>
          <div class="text-sm">
            {{
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].vdevs[
                zfsInfo.zfs_disks[currentDisk].vdev_idx
              ].name
            }}
            <span v-if="zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].vdevs[
                zfsInfo.zfs_disks[currentDisk].vdev_idx
              ].tag != zfsInfo.zfs_disks[currentDisk].zpool_name"> ({{zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].vdevs[
                zfsInfo.zfs_disks[currentDisk].vdev_idx
              ].tag}})</span>
          </div>
        </div>
        <div>
          <div class="text-sm text-muted">state</div>
          <div
            :class="[
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].vdevs[
                zfsInfo.zfs_disks[currentDisk].vdev_idx
              ].state === 'ONLINE'
                ? 'text-success'
                : '',
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].vdevs[
                zfsInfo.zfs_disks[currentDisk].vdev_idx
              ].state === 'OFFLINE'
                ? 'text-warning'
                : '',
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].vdevs[
                zfsInfo.zfs_disks[currentDisk].vdev_idx
              ].state === 'DEGRADED'
                ? 'text-warning'
                : '',
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].vdevs[
                zfsInfo.zfs_disks[currentDisk].vdev_idx
              ].state === 'UNAVAIL'
                ? 'text-danger'
                : '',
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].vdevs[
                zfsInfo.zfs_disks[currentDisk].vdev_idx
              ].state === 'FAULTED'
                ? 'text-danger'
                : '',
              'text-sm',
            ]"
          >
            {{
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].vdevs[
                zfsInfo.zfs_disks[currentDisk].vdev_idx
              ].state
            }}
          </div>
        </div>
        <div>
          <div class="text-sm text-muted">alloc (raw)</div>
          <div class="text-sm">
            {{
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].vdevs[
                zfsInfo.zfs_disks[currentDisk].vdev_idx
              ].alloc
            }}
          </div>
        </div>
        <div>
          <div class="text-sm text-muted">free (raw)</div>
          <div class="text-sm">
            {{
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].vdevs[
                zfsInfo.zfs_disks[currentDisk].vdev_idx
              ].free
            }}
          </div>
        </div>
        <div>
          <div class="text-sm text-muted">read errors</div>
          <div class="text-sm">
            {{
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].vdevs[
                zfsInfo.zfs_disks[currentDisk].vdev_idx
              ].read_errors
            }}
          </div>
        </div>
        <div>
          <div class="text-sm text-muted">write errors</div>
          <div class="text-sm">
            {{
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].vdevs[
                zfsInfo.zfs_disks[currentDisk].vdev_idx
              ].write_errors
            }}
          </div>
        </div>
        <div>
          <div class="text-sm text-muted">checksum errors</div>
          <div class="text-sm">
            {{
              zfsInfo.zpools[zfsInfo.zfs_disks[currentDisk].zpool_idx].vdevs[
                zfsInfo.zfs_disks[currentDisk].vdev_idx
              ].checksum_errors
            }}
          </div>
        </div>
        <div>
          <div class="text-sm text-muted">vdev type</div>
          <div class="text-sm">
            <span v-if="zfsInfo.zfs_disks[currentDisk].tag != zfsInfo.zfs_disks[currentDisk].zpool_name">
            {{ zfsInfo.zfs_disks[currentDisk].tag }}
            </span>
            <span v-else>storage</span>
          </div>
        </div>
      </div>
      <div
        class="grow-0 2xl:grow grid grid-cols-3 items-stretch gap-y-3 gap-x-5 h-fit"
      >
        <div
          class="text-label text-default col-span-3 border-b-[1px] self-start border-neutral-200 dark:border-neutral-700"
        >
          Devices
        </div>
        <div>
          <div class="text-sm text-muted">device name</div>
          <div class="text-sm">
            {{ zfsInfo.zfs_disks[currentDisk].name }}
          </div>
        </div>
        <div>
          <div class="text-sm text-muted">state</div>
          <div
            :class="[
              zfsInfo.zfs_disks[currentDisk].state === 'ONLINE'
                ? 'text-success'
                : '',
              zfsInfo.zfs_disks[currentDisk].state === 'OFFLINE'
                ? 'text-warning'
                : '',
              zfsInfo.zfs_disks[currentDisk].state === 'REMOVED'
                ? 'text-danger'
                : '',
              zfsInfo.zfs_disks[currentDisk].state === 'UNAVAIL'
                ? 'text-danger'
                : '',
              'text-sm',
            ]"
          >
            {{ zfsInfo.zfs_disks[currentDisk].state }}
          </div>
        </div>
        <div>
          <div class="text-sm text-muted">read errors</div>
          <div class="text-sm">
            {{ zfsInfo.zfs_disks[currentDisk].read_errors }}
          </div>
        </div>
        <div>
          <div class="text-sm text-muted">write errors</div>
          <div class="text-sm">
            {{ zfsInfo.zfs_disks[currentDisk].write_errors }}
          </div>
        </div>
        <div>
          <div class="text-sm text-muted">checksum errors</div>
          <div class="text-sm">
            {{ zfsInfo.zfs_disks[currentDisk].checksum_errors }}
          </div>
        </div>
        <div>
          <div class="text-sm text-muted">device type</div>
          <div class="text-sm">
            <span v-if="zfsInfo.zfs_disks[currentDisk].tag != zfsInfo.zfs_disks[currentDisk].zpool_name">
            {{ zfsInfo.zfs_disks[currentDisk].tag }}
            </span>
            <span v-else>storage</span>
          </div>
        </div>
      </div>
    </div>
    <div
      v-else-if="currentDisk != ''"
      class="card-body grow flex justify-center items-center"
    >
      <div class="p-5 bg-accent rounded-lg">
        <span class="text-muted"
          >Disk '{{ currentDisk }}' is not a member of a zpool.
        </span>
      </div>
    </div>
    <div v-else class="card-body grow flex justify-center items-center">
      <div class="p-5 bg-accent rounded-lg">
        <span class="text-muted">Click on a disk for more detail.</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, watch, inject } from "vue";
export default {
  setup() {
    const currentDisk = inject("currentDisk");
    const zfsInfo = inject("zfsInfo");
    const updateZfs = () => {};

    watch(currentDisk, updateZfs);

    return {
      zfsInfo,
      currentDisk,
    };
  },
};
</script>
