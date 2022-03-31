<template>
  <div id="p5-q30-storinator" class="m-2"></div>
</template>

<script>
import P5 from "p5";
import { ref, watch, onMounted, inject } from "vue";

const assets = {
  chassis: {
    path: "img/q30/q30-storinator.png",
    image: null,
  },
  disks: {
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
  },
};
const diskLocations = [
  {
    x: 457,
    y: 321,
    BAY: "1-1",
    occupied: false,
    image: null,
  },
  {
    x: 425,
    y: 321,
    BAY: "1-2",
    occupied: false,
    image: null,
  },
  {
    x: 393,
    y: 321,
    BAY: "1-3",
    occupied: false,
    image: null,
  },
  {
    x: 361,
    y: 321,
    BAY: "1-4",
    occupied: false,
    image: null,
  },
  {
    x: 329,
    y: 321,
    BAY: "1-5",
    occupied: false,
    image: null,
  },
  {
    x: 297,
    y: 321,
    BAY: "1-6",
    occupied: false,
    image: null,
  },
  {
    x: 265,
    y: 321,
    BAY: "1-7",
    occupied: false,
    image: null,
  },
  {
    x: 233,
    y: 321,
    BAY: "1-8",
    occupied: false,
    image: null,
  },
  {
    x: 201,
    y: 321,
    BAY: "1-9",
    occupied: false,
    image: null,
  },
  {
    x: 169,
    y: 321,
    BAY: "1-10",
    occupied: false,
    image: null,
  },
  {
    x: 137,
    y: 321,
    BAY: "1-11",
    occupied: false,
    image: null,
  },
  {
    x: 105,
    y: 321,
    BAY: "1-12",
    occupied: false,
    image: null,
  },
  {
    x: 73,
    y: 321,
    BAY: "1-13",
    occupied: false,
    image: null,
  },
  {
    x: 41,
    y: 321,
    BAY: "1-14",
    occupied: false,
    image: null,
  },
  {
    x: 9,
    y: 321,
    BAY: "1-15",
    occupied: false,
    image: null,
  },
  {
    x: 457,
    y: 158,
    BAY: "2-1",
    occupied: false,
    image: null,
  },
  {
    x: 425,
    y: 158,
    BAY: "2-2",
    occupied: false,
    image: null,
  },
  {
    x: 393,
    y: 158,
    BAY: "2-3",
    occupied: false,
    image: null,
  },
  {
    x: 361,
    y: 158,
    BAY: "2-4",
    occupied: false,
    image: null,
  },
  {
    x: 329,
    y: 158,
    BAY: "2-5",
    occupied: false,
    image: null,
  },
  {
    x: 297,
    y: 158,
    BAY: "2-6",
    occupied: false,
    image: null,
  },
  {
    x: 265,
    y: 158,
    BAY: "2-7",
    occupied: false,
    image: null,
  },
  {
    x: 233,
    y: 158,
    BAY: "2-8",
    occupied: false,
    image: null,
  },
  {
    x: 201,
    y: 158,
    BAY: "2-9",
    occupied: false,
    image: null,
  },
  {
    x: 169,
    y: 158,
    BAY: "2-10",
    occupied: false,
    image: null,
  },
  {
    x: 137,
    y: 158,
    BAY: "2-11",
    occupied: false,
    image: null,
  },
  {
    x: 105,
    y: 158,
    BAY: "2-12",
    occupied: false,
    image: null,
  },
  {
    x: 73,
    y: 158,
    BAY: "2-13",
    occupied: false,
    image: null,
  },
  {
    x: 41,
    y: 158,
    BAY: "2-14",
    occupied: false,
    image: null,
  },
  {
    x: 9,
    y: 158,
    BAY: "2-15",
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

    watch(lsdevJson, () => {
      diskInfoObj.value = lsdevJson;
        diskInfoObj.value.rows.flat().forEach((slot) => {
          const index = diskLocations.findIndex(
            (loc) => loc.BAY === slot["bay-id"]
          );
          diskLocations[index].occupied = slot.occupied;
          diskLocations[index].image = getDiskImage(
            slot.occupied,
            slot["model-name"],
            slot["model-family"]
          );
        });
    },
    {immediate:true, deep: true});

    function getDiskImage(occupied, modelName, modelFamily) {
      if (!occupied) return null;
      if (/Seagate Nytro/.test(modelFamily)) {
        return assets.disks.seagate.image;
      } else if (/SEAGATE XS400LE10003/.test(modelName)) {
        return assets.disks.seagateSas.image;
      } else if (/Micron_5100_|Micron_5200_/.test(modelName)) {
        return assets.disks.micron5200.image;
      } else if (/Micron_5300_/.test(modelName)) {
        return assets.disks.micron5300.image;
      }
      return assets.disks.default.image;
    }

    const p5Script = function (p5) {

      p5.preload = (_) => {
        assets.chassis.image = p5.loadImage(assets.chassis.path);
        Object.entries(assets.disks).forEach(([dsk, val]) => {
          assets.disks[dsk].image = p5.loadImage(val.path);
        });

        diskInfoObj.value.rows.flat().forEach((slot) => {
          const index = diskLocations.findIndex(
            (loc) => loc.BAY === slot["bay-id"]
          );
          diskLocations[index].occupied = slot.occupied;
          diskLocations[index].image = getDiskImage(
            slot.occupied,
            slot["model-name"],
            slot["model-family"]
          );
        });
      };
      // NOTE: Set up is here
      p5.setup = (_) => {
        const canvas = p5.createCanvas(
          assets.chassis.image.width,
          assets.chassis.image.height
        );
        canvas.parent("p5-q30-storinator");
        //p5.noLoop();
      };
      // NOTE: Draw is here
      p5.draw = (_) => {
        p5.image(assets.chassis.image, 0, 0);
        diskLocations.forEach((loc) => {
          if (loc.occupied) {
            p5.image(loc.image, loc.x, loc.y);
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
      lsdevJson
    };
  },
};
</script>
