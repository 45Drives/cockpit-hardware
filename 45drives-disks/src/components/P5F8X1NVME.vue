<template>
    <div id="p5-f8x1-nvme-storinator" class="self-stretch m-2 flex justify-center"></div>
</template>

<script>
import P5 from "p5";
import { ref, watch, onMounted, inject } from "vue";
import zfsAnimation from "./zfsAnimation.js";
import loadingAnimation from "./loadingAnimation.js";
import resizeHook from "./resizeHook.js";

const assets = {
    chassis: {
        path: "img/chassis/f8x1-nvme-storinator.png",
        image: null,
    },
    fade: {
        path: "img/chassis/chassis-fade.png",
        image: null,
    },
    disks: {
        caddy: {
            default: {
                path: "img/disks/caddy-generic.png",
                image: null,
            },
            micron5200: {
                path: "img/disks/caddy-micron.png",
                image: null,
            },
            micron5300: {
                path: "img/disks/caddy-micron-5300.png",
                image: null,
            },
            seagate: {
                path: "img/disks/caddy-seagate.png",
                image: null,
            },
            seagateSas: {
                path: "img/disks/caddy-seagate-sas.png",
                image: null,
            },
            loading: {
                path: "img/disks/caddy-loading.png",
                image: null,
            },
        },
        ssd: {
            loading: {
                path: "img/disks/ssd-loading.png",
                image: null,
            },
            samsungE1S: {
                path: "img/disks/e1s/samsung-e1s-pm9a3.png",
                image: null,
            },
            empty: {
                path: "img/disks/empty-ssd.png",
                image: null,
            },
        },
        hdd: {
            default: {
                path: "img/disks/hdd-generic.png",
                image: null,
            },
            seagateSt: {
                path: "img/disks/hdd-seagate-st.png",
                image: null,
            },
            seagate: {
                path: "img/disks/hdd-seagate.png",
                image: null,
            },
            toshiba: {
                path: "img/disks/hdd-toshiba.png",
                image: null,
            },
            loading: {
                path: "img/disks/hdd-loading.png",
                image: null,
            },
            empty: {
                path: "img/disks/empty-hdd.png",
                image: null,
            },
        },
    },
    loadingFlag: true,
};

const diskLocations = [
    // EDSFF Bays
    { x: 8, y: 18, w: 13, h: 42, rotate: 0, BAY: "1-20", HDD: false, occupied: false, image: null },
    { x: 28, y: 18, w: 13, h: 42, rotate: 0, BAY: "1-19", HDD: false, occupied: false, image: null },
    { x: 47, y: 18, w: 13, h: 42, rotate: 0, BAY: "1-18", HDD: false, occupied: false, image: null },
    { x: 67, y: 18, w: 13, h: 42, rotate: 0, BAY: "1-17", HDD: false, occupied: false, image: null },

    { x: 7, y: 100, w: 13, h: 42, rotate: 0, BAY: "1-16", HDD: false, occupied: false, image: null },
    { x: 27, y: 100, w: 13, h: 42, rotate: 0, BAY: "1-15", HDD: false, occupied: false, image: null },
    { x: 46, y: 100, w: 13, h: 42, rotate: 0, BAY: "1-14", HDD: false, occupied: false, image: null },
    { x: 67, y: 100, w: 13, h: 42, rotate: 0, BAY: "1-13", HDD: false, occupied: false, image: null },

    // HDD Bays
    { x: 100, y: 11, w: 32, h: 125, rotate: 0, BAY: "1-12", HDD: true, occupied: false, image: null },
    { x: 133, y: 11, w: 32, h: 125, rotate: 0, BAY: "1-11", HDD: true, occupied: false, image: null },
    { x: 166, y: 11, w: 32, h: 125, rotate: 0, BAY: "1-10", HDD: true, occupied: false, image: null },
    { x: 199, y: 11, w: 32, h: 125, rotate: 0, BAY: "1-9", HDD: true, occupied: false, image: null },
    { x: 232, y: 11, w: 32, h: 125, rotate: 0, BAY: "1-8", HDD: true, occupied: false, image: null },
    { x: 265, y: 11, w: 32, h: 125, rotate: 0, BAY: "1-7", HDD: true, occupied: false, image: null },
    { x: 298, y: 11, w: 32, h: 125, rotate: 0, BAY: "1-6", HDD: true, occupied: false, image: null },
    { x: 331, y: 11, w: 32, h: 125, rotate: 0, BAY: "1-5", HDD: true, occupied: false, image: null },
    { x: 364, y: 11, w: 32, h: 125, rotate: 0, BAY: "1-4", HDD: true, occupied: false, image: null },
    { x: 397, y: 11, w: 32, h: 125, rotate: 0, BAY: "1-3", HDD: true, occupied: false, image: null },
    { x: 430, y: 11, w: 32, h: 125, rotate: 0, BAY: "1-2", HDD: true, occupied: false, image: null },
    { x: 463, y: 11, w: 32, h: 125, rotate: 0, BAY: "1-1", HDD: true, occupied: false, image: null },
];

export default {
    name: "P5F8X1",
    setup() {
        const diskInfoObj = ref({});
        const currentDisk = inject("currentDisk");
        const lsdevJson = inject("lsdevJson");
        const diskInfo = inject("diskInfo");
        const zfsInfo = inject("zfsInfo");
        const enableZfsAnimations = inject("enableZfsAnimations");

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
            },
            { immediate: false, deep: true }
        );

        function getDiskImage(occupied, modelName, modelFamily, diskType, slotHdd) {
            if (!occupied) {
                return slotHdd ? assets.disks.hdd.empty.image : assets.disks.ssd.empty.image;
            }
            // EDSFF bays (1-13 to 1-20) - only E1S drives
            if (!slotHdd) {
                if (assets.loadingFlag) return assets.disks.ssd.loading.image;
                return assets.disks.ssd.samsungE1S.image;
            }
            // HDD bays (1-1 to 1-12) - HDDs or SSDs in caddies
            if (assets.loadingFlag && diskType === "SSD")
                return assets.disks.caddy.loading.image;
            if (assets.loadingFlag && diskType === "HDD")
                return assets.disks.hdd.loading.image;
            if (diskType === "SSD") {
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
            if (diskType === "HDD") {
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
        }

        const p5Script = function (p5) {
            loadingAnimation(p5);
            zfsAnimation(p5);
            p5.preload = (_) => {
                assets.chassis.image = p5.loadImage(assets.chassis.path);
                assets.fade.image = p5.loadImage(assets.fade.path);
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
                    if (index === -1) return;
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
                    assets.chassis.image.height + assets.fade.image.height
                );
                canvas.parent("p5-f8x1-nvme-storinator");
                p5.image(assets.fade.image, 0, 0);
                // increment the y positions of the disks by the height of the fade.
                diskLocations.forEach((loc) => {
                    loc.y += assets.fade.image.height;
                });
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
                p5.image(assets.chassis.image, 0, assets.fade.image.height);
                diskLocations.forEach((loc) => {
                    if (loc.occupied && loc.image) {
                        p5.push();
                        p5.translate(loc.x, loc.y);
                        p5.rotate((loc.rotate || 0) * Math.PI / 180);

                        if (loc.rotate === -90 || loc.rotate === 90) {
                            p5.image(loc.image, -loc.h, 0, loc.h, loc.w);
                            if (assets.loadingFlag) {
                                p5.animateLoading(
                                    -loc.h,
                                    0,
                                    loc.h,
                                    loc.w,
                                    p5.animationSteps,
                                    p5.animationLoadingIndex
                                );
                            }
                        } else {
                            p5.image(loc.image, 0, 0, loc.w, loc.h);
                            if (assets.loadingFlag) {
                                p5.animateLoading(
                                    0,
                                    0,
                                    loc.w,
                                    loc.h,
                                    p5.animationSteps,
                                    p5.animationLoadingIndex
                                );
                            }
                        }

                        p5.pop();
                    }
                });
                if (currentDisk.value) {
                    let idx = diskLocations.findIndex(
                        (loc) => loc.BAY === currentDisk.value
                    );

                    if (diskLocations[idx].image) {
                        const loc = diskLocations[idx];

                        if (enableZfsAnimations.flag) {
                            p5.showZfs(currentDisk.value, zfsInfo, diskLocations);
                        }

                        p5.push();
                        p5.noFill();
                        p5.stroke(206, 242, 212);
                        p5.strokeWeight(2);
                        p5.translate(loc.x, loc.y);
                        p5.rotate((loc.rotate || 0) * Math.PI / 180);

                        if (loc.rotate === -90 || loc.rotate === 90) {
                            p5.rect(-loc.h, 0, loc.h, loc.w);
                        } else {
                            p5.rect(0, 0, loc.w, loc.h);
                        }

                        p5.pop();
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
                        mx < loc.x + loc.w &&
                        my > loc.y &&
                        my < loc.y + loc.h
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
