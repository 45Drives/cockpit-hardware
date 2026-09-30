<template>
  <div id="p5-ubm-storinator" class="self-stretch m-2 flex justify-center"></div>
</template>

<script>
import P5 from "p5";
import { ref, watch, onMounted, inject } from "vue";
import zfsAnimation from "./zfsAnimation.js";
import loadingAnimation from "./loadingAnimation.js";
import resizeHook from "./resizeHook.js";

// DEV MODE: fills every bay with a fake drive, outlines + labels each bay, and shows
// cursor X,Y (chassis-image coords, i.e. the same space as the layout tables below).
// Clicking logs the coords to the console. Use this to align bays against the artwork.
const DEV_MODE = true;

// All coordinates are relative to the chassis image.
// Index 0 = bay X-1 (right side of the chassis), index 14 = bay X-15 (left side).
const HDD_COLUMN_X = [459, 427, 394, 362, 330, 298, 266, 234, 202, 170, 138, 106, 74, 42, 10];
const HDD_SIZE = { w: 30, h: 122 };

// 15mm NVMe bays along the top. Index 0 = bay N-1 (right), index 3 = bay N-4 (left).
const NVME_SLOT_X = [373, 253, 133, 13];
const NVME_SIZE = { w: 89, h: 20 };

// hddRowY index 0 = row 1 (bottom row). NVMe bays use row (hddRowY.length + 1).
const LAYOUTS = {
  AV15: { image: "img/chassis/av15-ubm-storinator.png", hddRowY: [78], nvmeY: 12 },
  Q30: { image: "img/chassis/q30-ubm-storinator.png", hddRowY: [238, 78], nvmeY: 12 },
  S45: { image: "img/chassis/s45-ubm-storinator.png", hddRowY: [400, 240, 80], nvmeY: 12 },
  // Art is rotated 90° CCW: rows run as columns (right = row 1), bays run top to bottom.
  XL60: {
    image: "img/chassis/xl60-ubm-storinator.png",
    rotated: true,
    hddRowX: [561, 400, 240, 80],
    hddBayY: [12, 44, 77, 109, 141, 173, 205, 237, 269, 301, 333, 365, 397, 429, 461],
    nvmeX: 12,
    nvmeSlotY: [39, 159, 279, 399],
  },
};

function buildAssets(rotated) {
  const disk = (name) => ({ path: `img/disks/${name}${rotated ? "-90" : ""}.png`, image: null });
  const nvme = (name) => ({ path: `img/disks/trimode/U3NVME15/${name}${rotated ? "-90" : ""}.png`, image: null });
  return {
    chassis: { path: "", image: null },
    disks: {
      caddy: {
        default: disk("caddy-generic"),
        micron5200: disk("caddy-micron"),
        micron5300: disk("caddy-micron-5300"),
        seagate: disk("caddy-seagate"),
        seagateSas: disk("caddy-seagate-sas"),
        loading: disk("caddy-loading"),
      },
      hdd: {
        default: disk("hdd-generic"),
        seagateSt: disk("hdd-seagate-st"),
        seagate: disk("hdd-seagate"),
        toshiba: disk("hdd-toshiba"),
        loading: disk("hdd-loading"),
      },
      nvme: {
        default: nvme("generic"),
        micron: nvme("micron"),
        loading: nvme("loading"),
      },
    },
    loadingFlag: true,
  };
}

function buildDiskLocations(layout) {
  const locations = [];
  const rowCount = layout.rotated ? layout.hddRowX.length : layout.hddRowY.length;
  for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
    for (let colIdx = 0; colIdx < 15; colIdx++) {
      const rect = layout.rotated
        ? { x: layout.hddRowX[rowIdx], y: layout.hddBayY[colIdx], w: HDD_SIZE.h, h: HDD_SIZE.w }
        : { x: HDD_COLUMN_X[colIdx], y: layout.hddRowY[rowIdx], ...HDD_SIZE };
      locations.push({
        ...rect,
        BAY: `${rowIdx + 1}-${colIdx + 1}`,
        NVME: false,
        occupied: false,
        image: null,
      });
    }
  }
  const nvmeRow = rowCount + 1;
  for (let slotIdx = 0; slotIdx < 4; slotIdx++) {
    const rect = layout.rotated
      ? { x: layout.nvmeX, y: layout.nvmeSlotY[slotIdx], w: NVME_SIZE.h, h: NVME_SIZE.w }
      : { x: NVME_SLOT_X[slotIdx], y: layout.nvmeY, ...NVME_SIZE };
    locations.push({
      ...rect,
      BAY: `${nvmeRow}-${slotIdx + 1}`,
      NVME: true,
      occupied: false,
      image: null,
    });
  }
  return locations;
}

export default {
  name: "P5StorinatorUBM",
  props: {
    size: { type: String, required: true },
  },
  setup(props) {
    const layout = LAYOUTS[props.size];
    const assets = buildAssets(layout.rotated);
    assets.chassis.path = layout.image;
    const diskLocations = buildDiskLocations(layout);

    const diskInfoObj = ref({});
    const currentDisk = inject("currentDisk");
    const lsdevJson = inject("lsdevJson");
    const diskInfo = inject("diskInfo");
    const zfsInfo = inject("zfsInfo");
    const enableZfsAnimations = inject("enableZfsAnimations");

    function applySlots() {
      (diskInfoObj.value.rows ?? []).flat().forEach((slot) => {
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
          diskLocations[index].NVME
        );
      });
    }

    watch(
      diskInfo,
      () => {
        diskInfoObj.value = diskInfo;
        applySlots();
      },
      { immediate: true, deep: true }
    );
    watch(
      lsdevJson,
      () => {
        diskInfoObj.value = lsdevJson;
        assets.loadingFlag = false;
        applySlots();
      },
      { immediate: false, deep: true }
    );

    function getDiskImage(occupied, modelName, modelFamily, diskType, slotNvme) {
      if (!occupied) return null;
      if (slotNvme) {
        if (assets.loadingFlag) return assets.disks.nvme.loading.image;
        if (/Micron/.test(modelName)) return assets.disks.nvme.micron.image;
        return assets.disks.nvme.default.image;
      }
      if (assets.loadingFlag && diskType === "SSD")
        return assets.disks.caddy.loading.image;
      if (assets.loadingFlag)
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
      if (/ST18000|ST16000|ST20000|ST14000|ST12000/.test(modelName)) {
        return assets.disks.hdd.seagateSt.image;
      } else if (/Seagate Enterprise/.test(modelFamily)) {
        return assets.disks.hdd.seagate.image;
      } else if (/TOSHIBA/.test(modelName)) {
        return assets.disks.hdd.toshiba.image;
      }
      return assets.disks.hdd.default.image;
    }

    const p5Script = function (p5) {
      loadingAnimation(p5);
      zfsAnimation(p5);
      p5.preload = (_) => {
        assets.loadingFlag = true;
        assets.chassis.image = p5.loadImage(assets.chassis.path);
        Object.values(assets.disks).forEach((group) => {
          Object.values(group).forEach((val) => {
            val.image = p5.loadImage(val.path);
          });
        });
        applySlots();
      };
      // NOTE: Set up is here
      p5.setup = (_) => {
        const canvas = p5.createCanvas(
          assets.chassis.image.width,
          assets.chassis.image.height
        );
        canvas.parent("p5-ubm-storinator");
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
          const fake = DEV_MODE && !loc.occupied;
          const fakeImage = loc.NVME
            ? assets.disks.nvme.default.image
            : assets.disks.hdd.default.image;
          const img = fake ? fakeImage : loc.image;
          if ((loc.occupied || fake) && img) {
            p5.image(img, loc.x, loc.y, loc.w, loc.h);
            if (assets.loadingFlag && !fake) {
              p5.animateLoading(loc.x, loc.y, loc.w, loc.h);
            }
          }
        });
        if (currentDisk.value) {
          const idx = diskLocations.findIndex(
            (loc) => loc.BAY === currentDisk.value
          );
          if (idx !== -1 && diskLocations[idx].image) {
            const loc = diskLocations[idx];
            if (enableZfsAnimations.flag) {
              p5.showZfs(currentDisk.value, zfsInfo, diskLocations);
            }
            p5.fill(255, 255, 255, 50);
            p5.stroke(206, 242, 212);
            p5.strokeWeight(2);
            p5.rect(loc.x, loc.y, loc.w, loc.h);
          }
        }

        if (DEV_MODE) {
          p5.push();
          p5.textSize(9);
          p5.textAlign(p5.CENTER, p5.CENTER);
          diskLocations.forEach((loc) => {
            p5.noFill();
            p5.stroke(255, 0, 0);
            p5.strokeWeight(1);
            p5.rect(loc.x, loc.y, loc.w, loc.h);
            p5.noStroke();
            p5.fill(255, 255, 0);
            p5.text(loc.BAY, loc.x + loc.w / 2, loc.y + loc.h / 2);
          });
          p5.textAlign(p5.LEFT, p5.TOP);
          p5.textSize(14);
          p5.fill(0, 0, 0, 180);
          p5.rect(4, 4, 150, 22);
          p5.fill(255);
          p5.text(`x:${p5.int(p5.mouseX)} y:${p5.int(p5.mouseY)}`, 10, 8);
          p5.pop();
        }
      };

      p5.mouseClicked = (_) => {
        const mx = p5.mouseX;
        const my = p5.mouseY;
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
        if (DEV_MODE) {
          const hit = diskLocations.find(
            (loc) => mx > loc.x && mx < loc.x + loc.w && my > loc.y && my < loc.y + loc.h
          );
          console.log("UBM CLICK", {
            x: p5.int(mx),
            y: p5.int(my),
            bay: hit?.BAY,
            bayX: hit?.x,
            bayY: hit?.y,
          });
        }
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
