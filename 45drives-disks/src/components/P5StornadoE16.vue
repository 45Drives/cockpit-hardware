<template>
    <div id="p5-e16-stornado" class="self-stretch m-2 flex justify-center"></div>
</template>

<script>
import P5 from "p5";
import { ref, reactive, watch, onMounted, inject, provide } from "vue";
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

// E1S storage drive bays - TODO: adjust x,y coords after testing
const diskLocations = [
    { x: 125, y: 119, w: 30, h: 99, BAY: "1-1", boot: false, occupied: false, image: null },
    { x: 196,  y: 119, w: 30, h: 99, BAY: "1-2", boot: false, occupied: false, image: null },
    { x: 267,  y: 119, w: 30, h: 99, BAY: "1-3", boot: false, occupied: false, image: null },
    { x: 338,  y: 119, w: 30, h: 99, BAY: "1-4", boot: false, occupied: false, image: null },
    { x: 411,  y: 119, w: 30, h: 99, BAY: "1-5", boot: false, occupied: false, image: null },
    { x: 482,  y: 119, w: 30, h: 99, BAY: "1-6", boot: false, occupied: false, image: null },
    { x: 552,  y: 119, w: 30, h: 99, BAY: "1-7", boot: false, occupied: false, image: null },
    { x: 625,  y: 119, w: 30, h: 99, BAY: "1-8", boot: false, occupied: false, image: null },
    { x: 695, y: 119, w: 30, h: 99, BAY: "1-9", boot: false, occupied: false, image: null },
    { x: 768, y: 119, w: 30, h: 99, BAY: "1-10", boot: false, occupied: false, image: null },
    { x: 839, y: 119, w: 30, h: 99, BAY: "1-11", boot: false, occupied: false, image: null },
    { x: 910, y: 119, w: 30, h: 99, BAY: "1-12", boot: false, occupied: false, image: null },
    { x: 982, y: 119, w: 30, h: 99, BAY: "1-13", boot: false, occupied: false, image: null },
    { x: 1052, y: 119, w: 30, h: 99, BAY: "1-14", boot: false, occupied: false, image: null },
    { x: 1126, y: 119, w: 30, h: 99, BAY: "1-15", boot: false, occupied: false, image: null },
    { x: 1196, y: 119, w: 30, h: 99, BAY: "1-16", boot: false, occupied: false, image: null },
];

// Boot drive bays (15mm NVMe) - TODO: adjust x,y coords after testing
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

        // Boot drive info fetched via nvme list
        const bootDrives = reactive([]);
        provide("bootDrives", bootDrives);

        async function fetchBootDrives() {
            try {
                // Find ANY device (NVMe, SATA, etc.) that has boot-related partitions
                const lsblkProc = await unwrap(server.execute(
                    new Command(["lsblk", "-J", "-o", "NAME,MOUNTPOINT,PKNAME,TYPE,SIZE,MODEL,SERIAL,FSTYPE,PARTTYPE,PATH"], { superuser: "require" })
                ));
                const lsblkData = JSON.parse(lsblkProc.getStdout());
                const blockdevices = lsblkData.blockdevices || [];

                // Find parent disks that contain boot/EFI partitions
                const EFI_PARTTYPE = "c12a7328-f81f-11d2-ba4b-00a9a104f3cd";
                const bootDevices = [];
                
                blockdevices.forEach((dev) => {
                    const children = dev.children || [];
                    const hasBoot = children.some((part) =>
                        part.mountpoint === "/boot" ||
                        part.mountpoint === "/boot/efi" ||
                        part.mountpoint === "/efi" ||
                        (part.parttype && part.parttype.toLowerCase() === EFI_PARTTYPE)
                    );
                    if (hasBoot && dev.type === "disk") {
                        bootDevices.push(dev);
                    }
                });

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

                // Mark boot bays as occupied and assign images
                bootDriveLocations.forEach((loc, i) => {
                    if (i < bootDrives.length) {
                        loc.occupied = true;
                        loc.image = getBootDiskImage(bootDrives[i]["model-name"]);
                    }
                });
            } catch (error) {
                console.error("Failed to fetch boot drive info:", error);
            }
        }

        function getBootDiskImage(modelName) {
            if (!modelName) return assets.disks.boot.default.image;
            if (/Micron/.test(modelName)) return assets.disks.boot.micronNvme.image;
            if (/Seagate|XP/.test(modelName)) return assets.disks.boot.seagateNvme.image;
            return assets.disks.boot.default.image;
        }

        watch(
            diskInfo,
            () => {
                diskInfoObj.value = diskInfo;
                diskInfoObj.value.rows.flat().forEach((slot) => {
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
            // NVMe model matching
            if (/NVMe Micron/.test(modelName)) {
                return category.micronNvme.image;
            }
            if (/NVMe XP/.test(modelName)) {
                return category.seagateNvme.image;
            }
            // E1S specific (storage bays only)
            if (!isBoot && /Samsung/.test(modelName)) {
                return assets.disks.ssd.samsungE1S.image;
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
                p5.noStroke();
                p5.fill(255);
                p5.textSize(16);
                p5.text(`x:${p5.mouseX} y:${p5.mouseY}`, 10, 20);

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
                console.log("CLICK", { x: p5.mouseX, y: p5.mouseY });

            };
        };

        onMounted(() => {
            new P5(p5Script);
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
