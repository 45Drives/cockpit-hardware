<template>
  <div id="p5-q30-storinator" class="m-2"></div>
</template>

<script>
import P5 from "p5";
import { ref, watch, onMounted, inject } from "vue";

const assets = {
  chassis: {
    path: "img/chassis/stornado.png",
    image: null,
  },
  fade: {
    path: "img/chassis/chassis-fade.png",
    image: null,
  },
  disks: {
    default: {
      path: "img/disks/ssd-generic.png",
      image: null,
    },
    micron5200: {
      path: "img/disks/ssd-micron.png",
      image: null,
    },
    micron5300: {
      path: "img/disks/ssd-micron-5300.png",
      image: null,
    },
    seagate: {
      path: "img/disks/ssd-seagate.png",
      image: null,
    },
    seagateSas: {
      path: "img/disks/ssd-seagate-sas.png",
      image: null,
    },
  },
};
const diskLocations = [
  {
    x: 476,
    y: 46,
    BAY: "1-1",
    occupied: false,
    image: null,
  },
  {
    x: 464,
    y: 46,
    BAY: "1-2",
    occupied: false,
    image: null,
  },
  {
    x: 439,
    y: 46,
    BAY: "1-3",
    occupied: false,
    image: null,
  },
  {
    x: 428,
    y: 46,
    BAY: "1-4",
    occupied: false,
    image: null,
  },
  {
    x: 417,
    y: 46,
    BAY: "1-5",
    occupied: false,
    image: null,
  },
  {
    x: 406,
    y: 46,
    BAY: "1-6",
    occupied: false,
    image: null,
  },
  {
    x: 382,
    y: 46,
    BAY: "1-7",
    occupied: false,
    image: null,
  },
  {
    x: 371,
    y: 46,
    BAY: "1-8",
    occupied: false,
    image: null,
  },
  {
    x: 358,
    y: 46,
    BAY: "1-9",
    occupied: false,
    image: null,
  },
  {
    x: 347,
    y: 46,
    BAY: "1-10",
    occupied: false,
    image: null,
  },
  {
    x: 322,
    y: 46,
    BAY: "1-11",
    occupied: false,
    image: null,
  },
  {
    x: 311,
    y: 46,
    BAY: "1-12",
    occupied: false,
    image: null,
  },
  {
    x: 300,
    y: 46,
    BAY: "1-13",
    occupied: false,
    image: null,
  },
  {
    x: 289,
    y: 46,
    BAY: "1-14",
    occupied: false,
    image: null,
  },
  {
    x: 265,
    y: 46,
    BAY: "1-15",
    occupied: false,
    image: null,
  },
  {
    x: 254,
    y: 46,
    BAY: "1-16",
    occupied: false,
    image: null,
  },
  {
    x: 238,
    y: 46,
    BAY: "2-1",
    occupied: false,
    image: null,
  },
  {
    x: 227,
    y: 46,
    BAY: "2-2",
    occupied: false,
    image: null,
  },
  {
    x: 202,
    y: 46,
    BAY: "2-3",
    occupied: false,
    image: null,
  },
  {
    x: 191,
    y: 46,
    BAY: "2-4",
    occupied: false,
    image: null,
  },
  {
    x: 180,
    y: 46,
    BAY: "2-5",
    occupied: false,
    image: null,
  },
  {
    x: 169,
    y: 46,
    BAY: "2-6",
    occupied: false,
    image: null,
  },
  {
    x: 145,
    y: 46,
    BAY: "2-7",
    occupied: false,
    image: null,
  },
  {
    x: 134,
    y: 46,
    BAY: "2-8",
    occupied: false,
    image: null,
  },
  {
    x: 121,
    y: 46,
    BAY: "2-9",
    occupied: false,
    image: null,
  },
  {
    x: 110,
    y: 46,
    BAY: "2-10",
    occupied: false,
    image: null,
  },
  {
    x: 85,
    y: 46,
    BAY: "2-11",
    occupied: false,
    image: null,
  },
  {
    x: 74,
    y: 46,
    BAY: "2-12",
    occupied: false,
    image: null,
  },
  {
    x: 63,
    y: 46,
    BAY: "2-13",
    occupied: false,
    image: null,
  },
  {
    x: 52,
    y: 46,
    BAY: "2-14",
    occupied: false,
    image: null,
  },
  {
    x: 27,
    y: 46,
    BAY: "2-15",
    occupied: false,
    image: null,
  },
  {
    x: 16,
    y: 46,
    BAY: "2-16",
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
        assets.fade.image = p5.loadImage(assets.fade.path);
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
          assets.chassis.image.height + assets.fade.image.height
        );
        canvas.parent("p5-q30-storinator");
        p5.image(assets.fade.image,0,0);
        // increment the y positions of the disks by the height of the fade.
        diskLocations.forEach((loc) => {
          loc.y += assets.fade.image.height;
        });
        //p5.noLoop();
      };
      // NOTE: Draw is here
      p5.draw = (_) => {
        p5.image(assets.chassis.image, 0, assets.fade.image.height
        );
        diskLocations.forEach((loc) => {
          if (loc.occupied) {
            p5.image(loc.image, loc.x, loc.y );
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
