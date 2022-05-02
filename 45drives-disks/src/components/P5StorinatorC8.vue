<template>
  <div id="p5-c8-storinator" class="self-stretch m-2 flex justify-center"></div>
</template>

<script>
import P5 from "p5";
import { ref, watch, onMounted, inject } from "vue";
import zfsAnimation from "./zfsAnimation.js";
import loadingAnimation from "./loadingAnimation.js";
import resizeHook from "./resizeHook.js";

const assets = {
  chassis: {
    path: "img/chassis/c8-storinator.png",
    image: null,
  },
  disks: {
    caddy: {
      default: {
        path: "img/disks/caddy-c8-mi4.png",
        image: null,
      },
      loading: {
        path: "img/disks/caddy-c8-mi4.png",
        image: null,
      },
      empty: {
        path: "img/disks/caddy-c8-mi4.png",
        image: null,
      },
    },
    ssd: {},
    hdd: {},
  },
  loadingFlag: true,
};
const diskLocations = [
  {
    x: 50,
    y: 80,
    BAY: "1-1",
    occupied: false,
    image: null,
  },
  {
    x: 312,
    y: 80,
    BAY: "1-2",
    occupied: false,
    image: null,
  },
  {
    x: 573,
    y: 80,
    BAY: "1-3",
    occupied: false,
    image: null,
  },
  {
    x: 834,
    y: 80,
    BAY: "1-4",
    occupied: false,
    image: null,
  },
  {
    x: 50,
    y: 150,
    BAY: "2-1",
    occupied: false,
    image: null,
  },
  {
    x: 312,
    y: 150,
    BAY: "2-2",
    occupied: false,
    image: null,
  },
  {
    x: 573,
    y: 150,
    BAY: "2-3",
    occupied: false,
    image: null,
  },
  {
    x: 834,
    y: 150,
    BAY: "2-4",
    occupied: false,
    image: null,
  },
];

export default {
  name: "P5StorinatorC8",
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
          diskLocations[index].image = getDiskImage(slot.occupied);
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
          diskLocations[index].image = getDiskImage(slot.occupied);
        });
      },
      { immediate: false, deep: true }
    );

    function getDiskImage(occupied) {
      if (!occupied) return assets.disks.caddy.empty.image;
      if (assets.loadingFlag) return assets.disks.caddy.loading.image;
      return assets.disks.caddy.default.image;
    }

    const p5Script = function (p5) {
      loadingAnimation(p5);
      zfsAnimation(p5);
      p5.preload = (_) => {
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
          if (index === -1) return;
          diskLocations[index].occupied = slot.occupied;
          diskLocations[index].image = getDiskImage(slot.occupied);
        });
      };
      // NOTE: Set up is here
      p5.setup = (_) => {
        const canvas = p5.createCanvas(
          assets.chassis.image.width,
          assets.chassis.image.height
        );
        canvas.parent("p5-c8-storinator");
        resizeHook(p5,canvas.id(),assets.chassis.image.width);
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
                loc.image.height,
                p5.animationSteps,
                p5.animationLoadingIndex
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
              p5.showZfs(currentDisk.value, zfsInfo, diskLocations);
            }
            p5.fill(255, 255, 255, 50);
            p5.stroke(206, 242, 212);
            p5.strokeWeight(2);
            p5.rect(
              diskLocations[idx].x,
              diskLocations[idx].y,
              diskLocations[idx].image.width,
              diskLocations[idx].image.height
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
