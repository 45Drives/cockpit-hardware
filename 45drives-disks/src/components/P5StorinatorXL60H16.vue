<template>
  <div
    id="p5-xl60-h16-storinator"
    class="self-stretch m-2 flex justify-center"
  ></div>
</template>

<script>
import { DocumentSearchIcon } from "@heroicons/vue/solid";
import P5 from "p5";
import { ref, watch, onMounted, inject } from "vue";
import zfsAnimation from "./zfsAnimation.js";
import loadingAnimation from "./loadingAnimation.js";
import resizeHook from "./resizeHook.js";

const assets = {
  chassis: {
    path: "img/chassis/xl60-h16-storinator.png",
    image: null,
  },
  fade: {
    path: "img/chassis/chassis-fade-90.png",
    image: null,
  },
  disks: {
    caddy: {
      default: {
        path: "img/disks/caddy-generic-90.png",
        image: null,
      },
      micron5200: {
        path: "img/disks/caddy-micron-90.png",
        image: null,
      },
      micron5300: {
        path: "img/disks/caddy-micron-5300-90.png",
        image: null,
      },
      seagate: {
        path: "img/disks/caddy-seagate-90.png",
        image: null,
      },
      seagateSas: {
        path: "img/disks/caddy-seagate-sas-90.png",
        image: null,
      },
      loading: {
        path: "img/disks/caddy-loading-90.png",
        image: null,
      },
    },
    ssd: {
      micron5200: {
        path: "img/disks/ssd-micron-90.png",
        image: null,
      },
      micron5300: {
        path: "img/disks/ssd-micron-5300-90.png",
        image: null,
      },
      seagate: {
        path: "img/disks/ssd-seagate-90.png",
        image: null,
      },
      seagateSas: {
        path: "img/disks/ssd-seagate-sas-90.png",
        image: null,
      },
      default: {
        path: "img/disks/ssd-generic-90.png",
        image: null,
      },
      loading: {
        path: "img/disks/ssd-loading-90.png",
        image: null,
      },
      hdd25: {
        path: "img/disks/hdd-25-90.png",
        image: null,
      },
      empty: {
        path: "img/disks/empty-ssd-90.png",
        image: null,
      },
    },
    hdd: {
      default: {
        path: "img/disks/hdd-generic-90.png",
        image: null,
      },
      seagateSt: {
        path: "img/disks/hdd-seagate-st-90.png",
        image: null,
      },
      seagate: {
        path: "img/disks/hdd-seagate-90.png",
        image: null,
      },
      toshiba: {
        path: "img/disks/hdd-toshiba-90.png",
        image: null,
      },
      loading: {
        path: "img/disks/hdd-loading-90.png",
        image: null,
      },
      empty: {
        path: "img/disks/empty-hdd-90.png",
        image: null,
      },
    },
  },
  loadingFlag: true,
};

const diskLocations = [
  {
    x: 525,
    y: 10,
    BAY: "1-1",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 525,
    y: 42,
    BAY: "1-2",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 525,
    y: 74,
    BAY: "1-3",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 525,
    y: 106,
    BAY: "1-4",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 525,
    y: 138,
    BAY: "1-5",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 525,
    y: 170,
    BAY: "1-6",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 525,
    y: 202,
    BAY: "1-7",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 525,
    y: 234,
    BAY: "1-8",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 525,
    y: 266,
    BAY: "1-9",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 525,
    y: 298,
    BAY: "1-10",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 525,
    y: 330,
    BAY: "1-11",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 525,
    y: 362,
    BAY: "1-12",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 525,
    y: 394,
    BAY: "1-13",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 525,
    y: 426,
    BAY: "1-14",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 525,
    y: 458,
    BAY: "1-15",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 361,
    y: 10,
    BAY: "2-1",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 361,
    y: 42,
    BAY: "2-2",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 361,
    y: 74,
    BAY: "2-3",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 361,
    y: 106,
    BAY: "2-4",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 361,
    y: 138,
    BAY: "2-5",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 361,
    y: 170,
    BAY: "2-6",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 361,
    y: 202,
    BAY: "2-7",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 361,
    y: 234,
    BAY: "2-8",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 361,
    y: 266,
    BAY: "2-9",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 361,
    y: 298,
    BAY: "2-10",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 361,
    y: 330,
    BAY: "2-11",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 361,
    y: 362,
    BAY: "2-12",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 361,
    y: 394,
    BAY: "2-13",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 361,
    y: 426,
    BAY: "2-14",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 361,
    y: 458,
    BAY: "2-15",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 197,
    y: 10,
    BAY: "3-1",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 197,
    y: 42,
    BAY: "3-2",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 197,
    y: 74,
    BAY: "3-3",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 197,
    y: 106,
    BAY: "3-4",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 197,
    y: 138,
    BAY: "3-5",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 197,
    y: 170,
    BAY: "3-6",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 197,
    y: 202,
    BAY: "3-7",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 197,
    y: 234,
    BAY: "3-8",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 197,
    y: 266,
    BAY: "3-9",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 197,
    y: 298,
    BAY: "3-10",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 197,
    y: 330,
    BAY: "3-11",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 197,
    y: 362,
    BAY: "3-12",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 197,
    y: 394,
    BAY: "3-13",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 197,
    y: 426,
    BAY: "3-14",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 197,
    y: 458,
    BAY: "3-15",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 40,
    y: 20,
    BAY: "4-1",
    HDD: false,
    occupied: false,
    image: null,
  },
  {
    x: 40,
    y: 31,
    BAY: "4-2",
    HDD: false,
    occupied: false,
    image: null,
  },
  {
    x: 40,
    y: 56,
    BAY: "4-3",
    HDD: false,
    occupied: false,
    image: null,
  },
  {
    x: 40,
    y: 67,
    BAY: "4-4",
    HDD: false,
    occupied: false,
    image: null,
  },
  {
    x: 40,
    y: 78,
    BAY: "4-5",
    HDD: false,
    occupied: false,
    image: null,
  },
  {
    x: 40,
    y: 89,
    BAY: "4-6",
    HDD: false,
    occupied: false,
    image: null,
  },
  {
    x: 40,
    y: 114,
    BAY: "4-7",
    HDD: false,
    occupied: false,
    image: null,
  },
  {
    x: 40,
    y: 125,
    BAY: "4-8",
    HDD: false,
    occupied: false,
    image: null,
  },
  {
    x: 40,
    y: 136,
    BAY: "4-9",
    HDD: false,
    occupied: false,
    image: null,
  },
  {
    x: 40,
    y: 147,
    BAY: "4-10",
    HDD: false,
    occupied: false,
    image: null,
  },
  {
    x: 40,
    y: 174,
    BAY: "4-11",
    HDD: false,
    occupied: false,
    image: null,
  },
  {
    x: 40,
    y: 185,
    BAY: "4-12",
    HDD: false,
    occupied: false,
    image: null,
  },
  {
    x: 40,
    y: 196,
    BAY: "4-13",
    HDD: false,
    occupied: false,
    image: null,
  },
  {
    x: 40,
    y: 207,
    BAY: "4-14",
    HDD: false,
    occupied: false,
    image: null,
  },
  {
    x: 40,
    y: 231,
    BAY: "4-15",
    HDD: false,
    occupied: false,
    image: null,
  },
  {
    x: 40,
    y: 242,
    BAY: "4-16",
    HDD: false,
    occupied: false,
    image: null,
  },
  {
    x: 33,
    y: 266,
    BAY: "4-17",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 33,
    y: 298,
    BAY: "4-18",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 33,
    y: 330,
    BAY: "4-19",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 33,
    y: 362,
    BAY: "4-20",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 33,
    y: 394,
    BAY: "4-21",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 33,
    y: 426,
    BAY: "4-22",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 33,
    y: 458,
    BAY: "4-23",
    HDD: true,
    occupied: false,
    image: null,
  },
];

export default {
  name: "P5StorinatorXL60H16",
  setup() {
    const diskInfoObj = ref({});
    const currentDisk = inject("currentDisk");
    const lsdevJson = inject("lsdevJson");
    const diskInfo = inject("diskInfo");
    const zfsInfo = inject("zfsInfo");
    const enableZfsAnimations = inject("enableZfsAnimations");

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

    function getDiskImage(occupied, modelName, modelFamily, diskType, slotHdd) {
      if (!occupied) {
        return slotHdd
          ? assets.disks.hdd.empty.image
          : assets.disks.ssd.empty.image;
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
          assets.chassis.image.width + assets.fade.image.width,
          assets.chassis.image.height
        );
        canvas.parent("p5-xl60-h16-storinator");

        p5.image(assets.fade.image, 0, 0);
        // increment the y positions of the disks by the height of the fade.
        diskLocations.forEach((loc) => {
          loc.x += assets.fade.image.width;
        });
        resizeHook(
          p5,
          canvas.id(),
          assets.chassis.image.width + assets.fade.image.width
        );
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
        p5.image(assets.chassis.image, assets.fade.image.width, 0);
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
    })

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
