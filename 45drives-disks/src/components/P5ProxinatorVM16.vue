<template>
    <div id="p5-proxinatorvm16" class="self-stretch m-2 flex justify-center"></div>
</template>

<script>
import P5 from "p5";
import { ref, watch, onMounted, inject } from "vue";
import zfsAnimation from "./zfsAnimation.js";
import loadingAnimation from "./loadingAnimation.js";
import resizeHook from "./resizeHook.js";

const assets = {
    chassis: {
        path: "img/chassis/vm16-proxinator.png",
        image: null,
    },
    disks: {
        caddy: {
            loading: {
                path: "img/disks/trimode/ssd_loading.png",
                image: null,
            },
            default: {
                path: "img/disks/trimode/ssd_loading.png",
                image: null,
            },
        },
        ssd: {
            default: {
                path: "img/disks/trimode/ssd_generic.png",
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
            micron5200: {
                path: "img/disks/trimode/sata_micron_5200.png",
                image: null,
            },
            micron5300: {
                path: "img/disks/trimode/sata_micron_5300.png",
                image: null,
            },
            seagate: {
                path: "img/disks/trimode/sata_seagate.png",
                image: null,
            },
            seagateSas: {
                path: "img/disks/trimode/sas_seagate.png",
                image: null,
            },
            loading: {
                path: "img/disks/trimode/ssd_loading.png",
                image: null,
            },
            hdd25: {
                path: "img/disks/trimode/hdd_25.png",
                image: null,
            },
            empty: {
                path: "img/disks/trimode/ssd_loading.png",
                image: null,
            },
        },
        hdd: {
            loading: {
                path: "img/disks/trimode/ssd_loading.png",
                image: null,
            },
            default: {
                path: "img/disks/trimode/ssd_loading.png",
                image: null,
            },
        },
    },
    loadingFlag: true,
};

const diskLocations = [
    { x: 91.8, y: 37.5, BAY: "1-1", HDD: false, occupied: false, image: null },
    { x: 145.3, y: 37.5, BAY: "1-2", HDD: false, occupied: false, image: null },
    { x: 198.8, y: 37.5, BAY: "1-3", HDD: false, occupied: false, image: null },
    { x: 252.3, y: 37.5, BAY: "1-4", HDD: false, occupied: false, image: null },
    { x: 305.8, y: 37.5, BAY: "1-5", HDD: false, occupied: false, image: null },
    { x: 359.0, y: 37.5, BAY: "1-6", HDD: false, occupied: false, image: null },
    { x: 412.0, y: 37.5, BAY: "1-7", HDD: false, occupied: false, image: null },
    { x: 465.5, y: 37.5, BAY: "1-8", HDD: false, occupied: false, image: null },
    { x: 519.3, y: 37.5, BAY: "2-1", HDD: false, occupied: false, image: null },
    { x: 572.3, y: 37.5, BAY: "2-2", HDD: false, occupied: false, image: null },
    { x: 625.3, y: 37.5, BAY: "2-3", HDD: false, occupied: false, image: null },
    { x: 678.3, y: 37.5, BAY: "2-4", HDD: false, occupied: false, image: null },
    { x: 732.2, y: 37.5, BAY: "2-5", HDD: false, occupied: false, image: null },
    { x: 785.8, y: 37.5, BAY: "2-6", HDD: false, occupied: false, image: null },
    { x: 839.7, y: 37.5, BAY: "2-7", HDD: false, occupied: false, image: null },
    { x: 892.5, y: 37.5, BAY: "2-8", HDD: false, occupied: false, image: null },
];

export default {
    name: "P5ProxinatorVM16",
    setup() {
        const diskInfoObj = ref({});
        const currentDisk = inject("currentDisk");
        const lsdevJson = inject("lsdevJson");
        const diskInfo = inject("diskInfo");
        const zfsInfo = inject("zfsInfo");
        const enableZfsAnimations = inject("enableZfsAnimations");

        //lsdev is done, assign regular hdd images.
        watch(
            lsdevJson,
            () => {
                diskInfoObj.value = lsdevJson;
                assets.loadingFlag = false;
                diskInfoObj.value.rows.flat().forEach((slot) => {
                    const index = diskLocations.findIndex(
                        (loc) => loc.BAY === slot["bay-id"]
                    );
                    if (index == -1) return;
                    diskLocations[index].occupied = slot.occupied;
                    diskLocations[index].image = getDiskImage(
                        slot.occupied,
                        slot["model-name"],
                        slot["model-family"],
                        slot["disk_type"],
                        diskLocations[index].HDD
                    );
                });
                assets.loadingFlag = false;
            },
            { immediate: false, deep: true }
        );

        watch(
            diskInfo,
            () => {
                diskInfoObj.value = diskInfo;
                diskInfoObj.value.rows.flat().forEach((slot) => {
                    const index = diskLocations.findIndex(
                        (loc) => loc.BAY === slot["bay-id"]
                    );
                    if (index == -1) return;
                    diskLocations[index].occupied = slot.occupied;
                    diskLocations[index].image = getDiskImage(
                        slot.occupied,
                        slot["model-name"],
                        slot["model-family"],
                        slot["disk_type"],
                        diskLocations[index].HDD
                    );
                });
            },
            { immediate: true, deep: true }
        );

        watch(enableZfsAnimations, () => { }, { immediate: true, deep: true });

        function getDiskImage(occupied, modelName, modelFamily, diskType, slotHdd) {
            if (!occupied) {
                return slotHdd ? null : assets.disks.ssd.empty.image;
            }
            if (assets.loadingFlag && diskType === "SSD" && slotHdd)
                return assets.disks.caddy.loading.image;
            if (assets.loadingFlag && diskType === "SSD" && !slotHdd)
                return assets.disks.ssd.loading.image;
            if (assets.loadingFlag && diskType === "HDD" && !slotHdd)
                return assets.disks.ssd.loading.image;
            if (assets.loadingFlag && diskType === "HDD")
                return assets.disks.hdd.loading.image;
            if (diskType === "SSD" && slotHdd) {
                if (/Seagate Nytro/.test(modelFamily)) {
                    return assets.disks.caddy.seagate.image;
                } else if (/SEAGATE XS400LE10003/.test(modelName)) {
                    return assets.disks.caddy.seagateSas.image;
                } else if (/Micron_5100_|Micron_5200_/.test(modelName)) {
                    return assets.disks.caddy.micron5200.image;
                } else if (/Micron_5300_/.test(modelName)) {
                    return assets.disks.caddy.micron5300.image;
                }
                return assets.disks.caddy.default.image;
            }
            if (diskType === "SSD" && !slotHdd) {
                if (/Seagate Nytro/.test(modelFamily)) {
                    return assets.disks.ssd.seagate.image;
                } else if (/SEAGATE XS400LE10003/.test(modelName)) {
                    return assets.disks.ssd.seagateSas.image;
                } else if (/Micron_5100_|Micron_5200_/.test(modelName)) {
                    return assets.disks.ssd.micron5200.image;
                } else if (/Micron_5300_/.test(modelName)) {
                    return assets.disks.ssd.micron5300.image;
                }
                else if (/NVMe Micron/.test(modelName)) {
                    return assets.disks.ssd.micronNvme.image;
                }
                else if (/NVMe XP/.test(modelName)) {
                    return assets.disks.ssd.seagateNvme.image;
                }
                return assets.disks.ssd.default.image;
            }
            if (diskType === "HDD" && slotHdd) {
                //hard drive in slot
                if (/ST18000|ST16000|ST20000|ST14000|ST12000/.test(modelName)) {
                    return assets.disks.hdd.seagateSt.image;
                } else if (/Seagate Enterprise/.test(modelFamily)) {
                    return assets.disks.hdd.seagate.image;
                } else if (/TOSHIBA/.test(modelName)) {
                    return assets.disks.hdd.toshiba.image;
                } else {
                    return assets.disks.hdd.default.image;
                }
            }
            if (diskType === "HDD" && !slotHdd) {
                //hard drive in ssd sized slot
                return assets.disks.ssd.hdd25.image;
            }
        }

        const p5Script = function (p5) {
            loadingAnimation(p5);
            zfsAnimation(p5);
            p5.preload = (_) => {
                assets.loadingFlag = true;
                assets.chassis.image = p5.loadImage(assets.chassis.path);
                Object.entries(assets.disks.caddy).forEach(([dsk, val]) => {
                    assets.disks.caddy[dsk].image = p5.loadImage(val.path);
                });
                Object.entries(assets.disks.ssd).forEach(([dsk, val]) => {
                    assets.disks.ssd[dsk].image = p5.loadImage(val.path);
                });
                Object.entries(assets.disks.hdd).forEach(([dsk, val]) => {
                    assets.disks.hdd[dsk].image = p5.loadImage(val.path);
                });

                diskInfoObj.value.rows.flat().forEach((slot) => {
                    const index = diskLocations.findIndex(
                        (loc) => loc.BAY === slot["bay-id"]
                    );
                    diskLocations[index].occupied = slot.occupied;
                    diskLocations[index].image = getDiskImage(
                        slot.occupied,
                        slot["model-name"],
                        slot["model-family"],
                        slot["disk_type"],
                        diskLocations[index].HDD
                    );
                });
            };
            // NOTE: Set up is here
            p5.setup = (_) => {
                const canvas = p5.createCanvas(
                    assets.chassis.image.width,
                    assets.chassis.image.height
                );
                canvas.parent("p5-proxinatorvm16");
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
                diskLocations.forEach((loc) => {
                    if (loc.occupied && loc.image) {
                        p5.image(loc.image, loc.x, loc.y);
                        if (assets.loadingFlag) {
                            p5.animateLoading(
                                loc.x,
                                loc.y,
                                loc.image.width,
                                loc.image.height - 14
                            );
                        }
                    }
                });
                if (currentDisk.value) {
                    let idx = diskLocations.findIndex(
                        (loc) => loc.BAY === currentDisk.value
                    );
                    if (diskLocations[idx].image) {
                        if (enableZfsAnimations.flag) {
                            p5.showZfs(currentDisk.value, zfsInfo, diskLocations, -14);
                        }
                        p5.fill(255, 255, 255, 50);
                        p5.stroke(206, 242, 212);
                        p5.strokeWeight(2);
                        p5.rect(
                            diskLocations[idx].x,
                            diskLocations[idx].y,
                            diskLocations[idx].image.width,
                            diskLocations[idx].image.height - 14
                        );
                    }
                }
            };

            p5.mouseClicked = (_) => {
                let mx = p5.mouseX;
                let my = p5.mouseY;
                diskLocations.forEach((loc) => {
                    if (
                        loc.image &&
                        mx > loc.x &&
                        mx < loc.x + loc.image.width &&
                        my > loc.y &&
                        my < loc.y + loc.image.height
                    ) {
                        currentDisk.value = loc.BAY;
                    }
                });
            };

        };

        onMounted(() => {
            new P5(p5Script);
        });

        return {
            diskInfoObj,
            currentDisk,
            lsdevJson,
            diskInfo,
            enableZfsAnimations,
        };
    },
};
</script>