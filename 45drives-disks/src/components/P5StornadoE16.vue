<template>
    <div id="p5-e16-stornado" class="self-stretch m-2 flex justify-center"></div>
</template>

<script>
import P5 from "p5";
import { ref, reactive, watch, onMounted, inject } from "vue";
import { server, Command, unwrap } from "@45drives/houston-common-lib";
import zfsAnimation from "./zfsAnimation.js";
import loadingAnimation from "./loadingAnimation.js";
import resizeHook from "./resizeHook.js";

const assets = {
    chassis: {
        path: "img/chassis/e16-stornado.png",
        image: null,
    },
    disks: {
        ssd: {
            default: {
                path: "img/disks/trimode/ssd_generic.png",
                image: null,
            },
            samsungE1S: {
                path: "img/disks/e1s/samsung-e1s-pm9a3.png",
                image: null,
            },
            micronNvme: {
                path: "img/disks/trimode/nvme_micron.png",
                image: null,
            },
            seagateNvme: {
                path: "img/disks/trimode/nvme_seagate.png",
                image: null,
            },
            loading: {
                path: "img/disks/trimode/ssd_loading.png",
                image: null,
            },
            empty: {
                path: "img/disks/trimode/ssd_loading.png",
                image: null,
            },
        },
        boot: {
            default: {
                path: "img/disks/trimode/ssd_generic-270.png",
                image: null,
            },
            micronNvme: {
                path: "img/disks/trimode/nvme_micron-270.png",
                image: null,
            },
            seagateNvme: {
                path: "img/disks/trimode/nvme_seagate-270.png",
                image: null,
            },
            loading: {
                path: "img/disks/trimode/ssd_loading-270.png",
                image: null,
            },
            empty: {
                path: "img/disks/trimode/ssd_loading-270.png",
                image: null,
            },
        },
    },
    loadingFlag: true,
    devMode: false,
};

// E1S storage drive bays
const diskLocations = [
    { x: 125, y: 119, w: 30, h: 99, BAY: "1-1", boot: false, occupied: false, image: null },
    { x: 196, y: 119, w: 30, h: 99, BAY: "1-2", boot: false, occupied: false, image: null },
    { x: 267, y: 119, w: 30, h: 99, BAY: "1-3", boot: false, occupied: false, image: null },
    { x: 338, y: 119, w: 30, h: 99, BAY: "1-4", boot: false, occupied: false, image: null },
    { x: 411, y: 119, w: 30, h: 99, BAY: "2-1", boot: false, occupied: false, image: null },
    { x: 482, y: 119, w: 30, h: 99, BAY: "2-2", boot: false, occupied: false, image: null },
    { x: 552, y: 119, w: 30, h: 99, BAY: "2-3", boot: false, occupied: false, image: null },
    { x: 625, y: 119, w: 30, h: 99, BAY: "2-4", boot: false, occupied: false, image: null },
    { x: 695, y: 119, w: 30, h: 99, BAY: "3-1", boot: false, occupied: false, image: null },
    { x: 768, y: 119, w: 30, h: 99, BAY: "3-2", boot: false, occupied: false, image: null },
    { x: 839, y: 119, w: 30, h: 99, BAY: "3-3", boot: false, occupied: false, image: null },
    { x: 910, y: 119, w: 30, h: 99, BAY: "3-4", boot: false, occupied: false, image: null },
    { x: 982, y: 119, w: 30, h: 99, BAY: "4-1", boot: false, occupied: false, image: null },
    { x: 1052, y: 119, w: 30, h: 99, BAY: "4-2", boot: false, occupied: false, image: null },
    { x: 1126, y: 119, w: 30, h: 99, BAY: "4-3", boot: false, occupied: false, image: null },
    { x: 1196, y: 119, w: 30, h: 99, BAY: "4-4", boot: false, occupied: false, image: null },
];

// Boot drive bays (15mm NVMe)
const bootDriveLocations = [
    { x: 452, y: 19.5, w: 196, h: 45, BAY: "boot-1", boot: true, occupied: false, image: null },
    { x: 749, y: 19.5, w: 196, h: 45, BAY: "boot-2", boot: true, occupied: false, image: null },
];

// Combined locations for rendering
const allLocations = [...diskLocations, ...bootDriveLocations];

// DEV MODE: Set to true to fake boot drives and treat any drive as E1S for layout testing
const DEV_MODE = false;

export default {
    name: "P5StornadoE16",
    setup() {
        const diskInfoObj = ref({});
        const currentDisk = inject("currentDisk");
        const lsdevJson = inject("lsdevJson");
        const diskInfo = inject("diskInfo");
        const zfsInfo = inject("zfsInfo");
        const enableZfsAnimations = inject("enableZfsAnimations");
        const bootDrives = inject("bootDrives");
        // console.log("P5StornadoE16: Injected bootDrives:", bootDrives);

        async function fetchBootDrives() {
            try {
                // console.log("fetchBootDrives: Starting boot drive detection...");
                
                // Strategy: Find drives with partitions that are NOT in lsdev output
                // These are boot drives (OS drives not managed as storage)
                
                // Get lsdev output to know which drives are storage drives
                const lsdevProc = await unwrap(server.execute(
                    new Command(["lsdev", "-j"], { superuser: "try" })
                ));
                const lsdevData = JSON.parse(lsdevProc.getStdout());
                const storageDrives = new Set();
                lsdevData.rows.flat().forEach(disk => {
                    if (disk.dev) storageDrives.add(disk.dev);
                });
                // console.log("fetchBootDrives: Storage drives from lsdev:", Array.from(storageDrives));

                // Get all block devices
                const lsblkProc = await unwrap(server.execute(
                    new Command(["lsblk", "-J", "-o", "NAME,MOUNTPOINT,PKNAME,TYPE,SIZE,MODEL,SERIAL,FSTYPE,PARTTYPE,PATH"], { superuser: "require" })
                ));
                const lsblkData = JSON.parse(lsblkProc.getStdout());
                const blockdevices = lsblkData.blockdevices || [];
                // console.log("fetchBootDrives: Total block devices:", blockdevices.length);

                // Find disks with partitions that aren't in lsdev (= boot drives)
                const bootDevices = [];
                blockdevices.forEach((dev) => {
                    const devPath = dev.path || `/dev/${dev.name}`;
                    const hasPartitions = dev.children && dev.children.length > 0;
                    const isNotStorageDrive = !storageDrives.has(devPath);
                    
                    // console.log(`fetchBootDrives: Checking ${dev.name}: path=${devPath}, hasPartitions=${hasPartitions}, isNotStorageDrive=${isNotStorageDrive}, type=${dev.type}`);
                    
                    if (dev.type === "disk" && hasPartitions && isNotStorageDrive) {
                        // console.log(`fetchBootDrives: ✓ Adding ${dev.name} as boot drive`);
                        bootDevices.push(dev);
                    }
                });
                // console.log("fetchBootDrives: Found boot devices:", bootDevices.length);

                // Format boot devices to match lsdevJson structure
                bootDrives.splice(0, bootDrives.length);
                bootDevices.forEach((dev, idx) => {
                    const bayId = `boot-${idx + 1}`;
                    const devPath = dev.path || `/dev/${dev.name}`;
                    const partCount = (dev.children || []).length;
                    
                    bootDrives.push({
                        "bay-id": bayId,
                        "dev-by-path": devPath,
                        "occupied": true,
                        "dev": devPath,
                        "partitions": partCount,
                        "model-family": "",
                        "model-name": dev.model || "Unknown",
                        "serial": dev.serial || "N/A",
                        "capacity": dev.size || "N/A",
                        "firm-ver": "",
                        "disk_type": dev.name.startsWith("nvme") ? "NVMe" : dev.name.startsWith("sd") ? "SATA/SAS" : "Unknown"
                    });
                });

                // console.log("Boot drives detected:", bootDrives.length, bootDrives);

                // Mark boot bays as occupied and assign images
                bootDriveLocations.forEach((loc, i) => {
                    if (i < bootDrives.length) {
                        loc.occupied = true;
                        loc.image = getBootDiskImage(bootDrives[i]["model-name"]);
                    } else {
                        loc.occupied = false;
                        loc.image = null;
                    }
                });
            } catch (error) {
                console.error("fetchBootDrives: Failed to fetch boot drive info:", error);
                console.error("fetchBootDrives: Error details:", error.message, error.stack);
            }
        }

        function getBootDiskImage(modelName) {
            if (!modelName) return assets.disks.boot.default.image;
            if (/Micron/.test(modelName)) return assets.disks.boot.micronNvme.image;
            if (/Seagate|XP/.test(modelName)) return assets.disks.boot.seagateNvme.image;
            return assets.disks.boot.default.image;
        }

        function fixDiskType(slot) {
            // Override generic "SSD" label for NVMe devices to be more specific
            if (slot.dev && slot.dev.includes("nvme") && slot["disk_type"] === "SSD") {
                slot["disk_type"] = "NVMe";
            }
            return slot;
        }

        watch(
            diskInfo,
            () => {
                diskInfoObj.value = diskInfo;
                diskInfoObj.value.rows.flat().forEach((slot) => {
                    fixDiskType(slot);
                    const index = allLocations.findIndex(
                        (loc) => loc.BAY === slot["bay-id"]
                    );
                    if (index == -1) return;
                    allLocations[index].occupied = slot.occupied;
                    allLocations[index].image = getDiskImage(
                        slot.occupied,
                        slot["model-name"],
                        slot["model-family"],
                        slot["disk_type"],
                        allLocations[index].boot
                    );
                });
            },
            { immediate: true, deep: true }
        );

        watch(
            lsdevJson,
            () => {
                diskInfoObj.value = lsdevJson;
                assets.loadingFlag = false;
                diskInfoObj.value.rows.flat().forEach((slot) => {
                    fixDiskType(slot);
                    const index = allLocations.findIndex(
                        (loc) => loc.BAY === slot["bay-id"]
                    );
                    if (index == -1) return;
                    allLocations[index].occupied = slot.occupied;
                    allLocations[index].image = getDiskImage(
                        slot.occupied,
                        slot["model-name"],
                        slot["model-family"],
                        slot["disk_type"],
                        allLocations[index].boot
                    );
                });
            },
            { immediate: false, deep: true }
        );

        watch(enableZfsAnimations, () => { }, { immediate: true, deep: true });

        function getDiskImage(occupied, modelName, modelFamily, diskType, isBoot) {
            const category = isBoot ? assets.disks.boot : assets.disks.ssd;

            if (!occupied) {
                return category.empty.image;
            }
            if (assets.loadingFlag) {
                return category.loading.image;
            }
            // In dev mode, treat any occupied drive as a generic E1S/NVMe
            if (DEV_MODE && !isBoot) {
                return assets.disks.ssd.samsungE1S.image;
            }
            // E1.S specific (storage bays only) - Micron 7450, Micron E1.S (MTFDLCE), and Samsung E1.S
            if (!isBoot && (/Micron_7450/.test(modelName) || /MTFDLCE/.test(modelName) || /MTFDKCE/.test(modelName) || /Samsung.*E1S/.test(modelName) || /SAMSUNG.*MZTL2/.test(modelName))) {
                return assets.disks.ssd.samsungE1S.image;
            }
            // Standard NVMe model matching (for boot drives and non-E1S)
            if (/NVMe Micron/.test(modelName) || /Micron/.test(modelName)) {
                return category.micronNvme?.image || category.default.image;
            }
            if (/NVMe XP/.test(modelName) || /Seagate/.test(modelName)) {
                return category.seagateNvme?.image || category.default.image;
            }
            return category.default.image;
        }

        const p5Script = function (p5) {
            loadingAnimation(p5);
            zfsAnimation(p5);
            p5.preload = (_) => {
                assets.loadingFlag = true;
                assets.chassis.image = p5.loadImage(assets.chassis.path);
                Object.entries(assets.disks.ssd).forEach(([dsk, val]) => {
                    assets.disks.ssd[dsk].image = p5.loadImage(val.path);
                });
                Object.entries(assets.disks.boot).forEach(([dsk, val]) => {
                    assets.disks.boot[dsk].image = p5.loadImage(val.path);
                });

                diskInfoObj.value.rows.flat().forEach((slot) => {
                    const index = allLocations.findIndex(
                        (loc) => loc.BAY === slot["bay-id"]
                    );
                    if (index === -1) return;
                    allLocations[index].occupied = slot.occupied;
                    allLocations[index].image = getDiskImage(
                        slot.occupied,
                        slot["model-name"],
                        slot["model-family"],
                        slot["disk_type"],
                        allLocations[index].boot
                    );
                });
            };
            // NOTE: Set up is here
            p5.setup = (_) => {
                const canvas = p5.createCanvas(
                    assets.chassis.image.width,
                    assets.chassis.image.height
                );
                canvas.parent("p5-e16-stornado");
                p5.frameRate(24);
                resizeHook(p5, canvas.id(), assets.chassis.image.width);
            };
            // NOTE: Draw is here
            p5.draw = (_) => {
                if (assets.loadingFlag) {
                    p5.frameRate(10);
                    p5.loadingAnimationIndex = p5.int(
                        (p5.loadingAnimationIndex + 1) % p5.loadingAnimationSteps
                    );
                } else {
                    p5.frameRate(24);
                }
                p5.image(assets.chassis.image, 0, 0);
                allLocations.forEach((loc) => {
                    const showDev = assets.devMode && !loc.occupied;
                    const devImage = showDev
                        ? (loc.boot ? assets.disks.boot.loading.image : assets.disks.ssd.loading.image)
                        : null;
                    const img = loc.image || devImage;
                    if ((loc.occupied || showDev) && img) {
                        p5.image(img, loc.x, loc.y, loc.w, loc.h);
                        if (assets.loadingFlag || showDev) {
                            p5.animateLoading(
                                loc.x,
                                loc.y,
                                loc.w,
                                loc.h
                            );
                        }
                    }
                });
                if (currentDisk.value) {
                    let idx = allLocations.findIndex(
                        (loc) => loc.BAY === currentDisk.value
                    );

                    if (idx !== -1 && allLocations[idx].image) {
                        const loc = allLocations[idx];

                        if (enableZfsAnimations.flag) {
                            p5.showZfs(currentDisk.value, zfsInfo, allLocations);
                        }

                        p5.fill(255, 255, 255, 50);
                        p5.stroke(206, 242, 212);
                        p5.strokeWeight(2);
                        p5.rect(loc.x, loc.y, loc.w, loc.h);
                    }
                }

                // DEBUG: Show X,Y coords in image for drive positioning
                // p5.noStroke();
                // p5.fill(255);
                // p5.textSize(16);
                // p5.text(`x:${p5.mouseX} y:${p5.mouseY}`, 10, 20);

            };

            p5.mouseClicked = (_) => {
                let mx = p5.mouseX;
                let my = p5.mouseY;
                allLocations.forEach((loc) => {
                    if (
                        loc.image &&
                        mx > loc.x &&
                        mx < loc.x + loc.w &&
                        my > loc.y &&
                        my < loc.y + loc.h
                    ) {
                        currentDisk.value = loc.BAY;
                    }
                });

                // DEBUG: Show X,Y coords in console on click for drive positioning
                // console.log("CLICK", { x: p5.mouseX, y: p5.mouseY });

            };
        };

        onMounted(() => {
            console.log("P5StornadoE16: Component mounted, initializing...");
            new P5(p5Script);
            console.log("P5StornadoE16: Calling fetchBootDrives...");
            fetchBootDrives();
        });

        return {
            diskInfoObj,
            currentDisk,
            lsdevJson,
            diskInfo,
            enableZfsAnimations,
            bootDrives,
        };
    },
};
</script>
