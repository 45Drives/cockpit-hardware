<template>
  <div id="p5-mi4-storinator" class="m-2"></div>
</template>

<script>
import P5 from "p5";
import { ref, watch, onMounted, inject } from "vue";

const assets = {
  chassis: {
    path: "img/chassis/mi4-storinator.png",
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
    },
    ssd: {},
    hdd: {},
  },
  loadingFlag: true,
};
const diskLocations = [
  {
    x: 50,
    y: 56,
    BAY: "1-1",
    occupied: false,
    image: null,
  },
  {
    x: 312,
    y: 56,
    BAY: "1-2",
    occupied: false,
    image: null,
  },
  {
    x: 573,
    y: 56,
    BAY: "1-3",
    occupied: false,
    image: null,
  },
  {
    x: 834,
    y: 56,
    BAY: "1-4",
    occupied: false,
    image: null,
  },
];

export default {
  name: "P5StorinatorMI4",
  setup() {
    const diskInfoObj = ref({});
    const currentDisk = inject("currentDisk");
    const lsdevJson = inject("lsdevJson");
    const diskInfo = inject("diskInfo");

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

    watch(
      diskInfo,
      () => {
        diskInfoObj.value = diskInfo;
        diskInfoObj.value.rows.flat().forEach((slot) => {
          const index = diskLocations.findIndex(
            (loc) => loc.BAY === slot["bay-id"]
          );
          diskLocations[index].occupied = slot.occupied;
          diskLocations[index].image = getDiskImage(slot.occupied);
        });
      },
      { immediate: true, deep: true }
    );

    function getDiskImage(occupied) {
      if (!occupied) return null;
      if (assets.loadingFlag) return assets.disks.caddy.loading.image;
      return assets.disks.caddy.default.image;
    }

    const p5Script = function (p5) {
      let loadingIndex = 0;
      let animationSteps = 20;
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
        canvas.parent("p5-mi4-storinator");
        document.getElementById(
          "disk-section-card-body"
        ).style.height = `350px`;
        //p5.noLoop();
      };
      // NOTE: Draw is here
      p5.draw = (_) => {
        if (assets.loadingFlag) {
          p5.frameRate(10);
          loadingIndex = p5.int((loadingIndex + 1) % animationSteps);
        } else {
          p5.frameRate(30);
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
                animationSteps,
                loadingIndex
              );
            }
          }
        });
        if (currentDisk.value) {
          let idx = diskLocations.findIndex(
            (loc) => loc.BAY === currentDisk.value
          );
          if (diskLocations[idx].image) {
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

      p5.animateLoading = (x, y, w, h, steps, index) => {
        p5.push();
        p5.colorMode(p5.RGB);
        p5.noStroke();
        let from = p5.color(100, 100, 110, 100);
        let to = p5.color(0, 0, 0, 100);
        p5.colorMode(p5.RGB);
        let stepPx = h / steps;
        let stepPercent = 1.0 / steps;
        for (let i = 0; i < steps; i++) {
          p5.fill(p5.lerpColor(from, to, stepPercent * i));
          p5.rect(x, y + stepPx * ((index + i) % steps), w, stepPx);
        }
        p5.pop();
      };

      p5.mouseClicked = (_) => {
        let mx = p5.mouseX;
        let my = p5.mouseY;
        diskLocations.forEach((loc) => {
          if (
            loc.occupied &&
            mx > loc.x &&
            mx < loc.x + loc.image.width &&
            my > loc.y &&
            my < loc.y + loc.image.height
          ) {
            currentDisk.value = loc.BAY;
            //p5.redraw();
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
    };
  },
};
</script>
