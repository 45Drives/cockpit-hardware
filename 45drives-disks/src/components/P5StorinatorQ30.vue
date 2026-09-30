<template>
  <div id="p5-q30-storinator" class="self-stretch m-2 flex justify-center"></div>
</template>

<script>
import P5 from "p5";
import { ref, watch, onMounted, inject } from "vue";
import zfsAnimation from "./zfsAnimation.js";
import loadingAnimation from "./loadingAnimation.js";
import resizeHook from "./resizeHook.js";

const assets = {
  chassis: {
    path: "img/chassis/q30-storinator.png",
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
      empty: {
        path: "img/disks/empty-caddy.png",
        image: null,
      },
    },
    ssd: {
      loading: {
        path: "img/disks/ssd-loading.png",
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
  {
    x: 459,
    y: 197,
    BAY: "1-1",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 427,
    y: 197,
    BAY: "1-2",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 394,
    y: 197,
    BAY: "1-3",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 362,
    y: 197,
    BAY: "1-4",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 330,
    y: 197,
    BAY: "1-5",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 298,
    y: 197,
    BAY: "1-6",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 266,
    y: 197,
    BAY: "1-7",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 234,
    y: 197,
    BAY: "1-8",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 202,
    y: 197,
    BAY: "1-9",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 170,
    y: 197,
    BAY: "1-10",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 138,
    y: 197,
    BAY: "1-11",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 106,
    y: 197,
    BAY: "1-12",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 74,
    y: 197,
    BAY: "1-13",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 42,
    y: 197,
    BAY: "1-14",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 10,
    y: 197,
    BAY: "1-15",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 459,
    y: 33,
    BAY: "2-1",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 427,
    y: 33,
    BAY: "2-2",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 394,
    y: 33,
    BAY: "2-3",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 362,
    y: 33,
    BAY: "2-4",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 330,
    y: 33,
    BAY: "2-5",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 298,
    y: 33,
    BAY: "2-6",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 266,
    y: 33,
    BAY: "2-7",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 234,
    y: 33,
    BAY: "2-8",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 202,
    y: 33,
    BAY: "2-9",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 170,
    y: 33,
    BAY: "2-10",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 138,
    y: 33,
    BAY: "2-11",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 106,
    y: 33,
    BAY: "2-12",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 74,
    y: 33,
    BAY: "2-13",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 42,
    y: 33,
    BAY: "2-14",
    HDD: true,
    occupied: false,
    image: null,
  },
  {
    x: 10,
    y: 33,
    BAY: "2-15",
    HDD: true,
    occupied: false,
    image: null,
  },
];

export default {
  name: "P5StorinatorQ30",
  setup() {
    const diskInfoObj = ref({});
    const currentDisk = inject("currentDisk");
    const lsdevJson = inject("lsdevJson");
    const diskInfo = inject("diskInfo");
    const zfsInfo = inject("zfsInfo");
    const enableZfsAnimations = inject("enableZfsAnimations");

    const getDiskImage = (
      occupied,
      modelName,
      modelFamily,
      diskType,
      slotHdd
    ) => {
      if (!occupied) {
        return slotHdd
          ? assets.disks.hdd.empty.image
          : assets.disks.ssd.empty.image;
      }
      if (assets.loadingFlag && diskType === "SSD" && slotHdd)
        return assets.disks.caddy.loading.image;
      if (assets.loadingFlag && diskType === "SSD" && !slotHdd)
        return assets.disks.caddy.loading.image;
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
        return assets.disks.caddy.default.image;
      }
      if (diskType === "HDD") {
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
    };

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

    const p5Script = function (p5) {
      loadingAnimation(p5);
      zfsAnimation(p5);

      p5.preload = (_) => {
        assets.loadingFlag = true;
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
        canvas.parent("p5-q30-storinator");
        p5.image(assets.fade.image, 0, 0);
        // increment the y positions of the disks by the height of the fade.
        diskLocations.forEach((loc) => {
          loc.y += assets.fade.image.height;
        });
        resizeHook(p5,canvas.id(),assets.chassis.image.width);
        //p5.noLoop();
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
      getDiskImage,
      enableZfsAnimations,
    };
  },
};
</script>
