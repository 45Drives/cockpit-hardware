<template>
    <div id="p5-studio8-studio" class="self-stretch m-2 flex justify-center"></div>
</template>

<script>
import P5 from "p5";
import { ref, watch, onMounted, inject } from "vue";
import zfsAnimation from "./zfsAnimation.js";
import loadingAnimation from "./loadingAnimation.js";
import resizeHook from "./resizeHook.js";

const assets = {
    chassis: {
        path: "img/chassis/studio8-studio.png",
        image: null,
    },
    disks: {
        ssd: {
            loading: {
                path: "img/disks/ssd-loading.png",
                image: null,
            },
            default: {
                path: "img/disks/ssd-generic.png",
                image: null,
            },
            empty: {
                path: "img/disks/empty-ssd.png",
                image: null,
            },
        },
    },
    loadingFlag: true,
};

const diskLocations = [
    { x: 144, y: 31, BAY: "1-1", HDD: false, occupied: false, image: null },
    { x: 178.51, y: 31, BAY: "1-2", HDD: false, occupied: false, image: null },
    { x: 321.6, y: 31, BAY: "1-3", HDD: false, occupied: false, image: null },
    { x: 357.18, y: 31, BAY: "1-4", HDD: false, occupied: false, image: null },
    { x: 500.5, y: 31, BAY: "2-1", HDD: false, occupied: false, image: null },
    { x: 535, y: 31, BAY: "2-2", HDD: false, occupied: false, image: null },
    { x: 679, y: 31, BAY: "2-3", HDD: false, occupied: false, image: null },
    { x: 713, y: 31, BAY: "2-4", HDD: false, occupied: false, image: null },
];

export default {
    name: "P5StudioSTUDIO8",
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
                diskInfoObj.value.rows?.flat().forEach((slot) => {
                    const index = diskLocations.findIndex((loc) => loc.BAY === slot["bay-id"]);
                    if (index == -1) return;
                    diskLocations[index].occupied = slot.occupied;
                    diskLocations[index].image = getDiskImage(
                        slot.occupied,
                        slot["model-name"],
                        slot["model-family"],
                        slot["disk_type"]
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
                diskInfoObj.value.rows?.flat().forEach((slot) => {
                    const index = diskLocations.findIndex((loc) => loc.BAY === slot["bay-id"]);
                    if (index == -1) return;
                    diskLocations[index].occupied = slot.occupied;
                    diskLocations[index].image = getDiskImage(
                        slot.occupied,
                        slot["model-name"],
                        slot["model-family"],
                        slot["disk_type"]
                    );
                });
            },
            { immediate: false, deep: true }
        );

        // SSD-only logic for this server
        function getDiskImage(occupied, _modelName, _modelFamily, diskType) {
            // Always use SSD "empty" for empty bays
            if (!occupied) return assets.disks.ssd.empty.image;

            // While loading, show SSD loading (and never caddy/HDD)
            if (assets.loadingFlag) return assets.disks.ssd.loading.image;

            // Only draw for SSDs; hide HDDs/caddies by returning null
            if (diskType === "SSD") return assets.disks.ssd.default.image;

            return null; // hide non-SSD
        }

        const p5Script = function (p5) {
            loadingAnimation(p5);
            zfsAnimation(p5);

            p5.preload = () => {
                assets.chassis.image = p5.loadImage(assets.chassis.path);

                // Only preload SSD assets
                Object.entries(assets.disks.ssd).forEach(([key, val]) => {
                    assets.disks.ssd[key].image = p5.loadImage(val.path);
                });

                // Initialize current images based on existing data, if present
                diskInfoObj.value.rows?.flat().forEach((slot) => {
                    const index = diskLocations.findIndex((loc) => loc.BAY === slot["bay-id"]);
                    if (index === -1) return;
                    diskLocations[index].occupied = slot.occupied;
                    diskLocations[index].image = getDiskImage(
                        slot.occupied,
                        slot["model-name"],
                        slot["model-family"],
                        slot["disk_type"]
                    );
                });
            };

            p5.setup = () => {
                const canvas = p5.createCanvas(
                    assets.chassis.image.width,
                    assets.chassis.image.height
                );
                canvas.parent("p5-studio8-studio");
                resizeHook(p5, canvas.id(), assets.chassis.image.width);
            };

            p5.draw = () => {
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
                        const w = loc.image.width * 2.1;
                        const h = loc.image.height * 2.49;
                        p5.image(loc.image, loc.x, loc.y, w, h);
                        if (assets.loadingFlag) {
                            p5.animateLoading(
                                loc.x,
                                loc.y,
                                w,
                                h,
                                p5.animationSteps,
                                p5.animationLoadingIndex
                            );
                        }
                    }
                });

                if (currentDisk.value) {
                    const idx = diskLocations.findIndex((loc) => loc.BAY === currentDisk.value);
                    if (idx !== -1 && diskLocations[idx].image) {
                        if (enableZfsAnimations.flag) {
                            p5.showZfs(currentDisk.value, zfsInfo, diskLocations);
                        }
                        const img = diskLocations[idx].image;
                        const w = img.width * 2.1;
                        const h = img.height * 2.49;
                        p5.fill(255, 255, 255, 50);
                        p5.stroke(206, 242, 212);
                        p5.strokeWeight(2);
                        p5.rect(
                            diskLocations[idx].x,
                            diskLocations[idx].y,
                            w,
                            h
                        );
                    }
                }
            };

            p5.mouseClicked = () => {
                const mx = p5.mouseX;
                const my = p5.mouseY;
                diskLocations.forEach((loc) => {
                    if (loc.image) {
                        const w = loc.image.width * 2.1;
                        const h = loc.image.height * 2.49;
                        if (mx > loc.x && mx < loc.x + w && my > loc.y && my < loc.y + h) {
                            currentDisk.value = loc.BAY;
                        }
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
