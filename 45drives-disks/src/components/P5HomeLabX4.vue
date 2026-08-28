<template>
    <div id="p5-x4-homelab" class="self-stretch m-2 flex justify-center"></div>
  </template>
  
  <script>
  import P5 from "p5";
  import { ref, watch, onMounted, inject } from "vue";
  import zfsAnimation from "./zfsAnimation.js";
  import loadingAnimation from "./loadingAnimation.js";
  import resizeHook from "./resizeHook.js";
  
  const assets = {
    chassis: {
      path: "img/chassis/x4-homelab.png",
      image: null,
    },
    // fade: {
    //   path: "img/chassis/hl4-chassis-fade.png",
    //   image: null,
    // },
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
        default: {
          path: "img/disks/ssd-generic.png",
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
 
  // Chassis art is 144x165 so that one drive bay is exactly the width of the
  // shared 30x120 caddy sprites, matching every other chassis sketch. Disks are
  // drawn 1:1 and the canvas is displayed 1:1, so nothing is ever interpolated.
  // Raising DISPLAY_SCALE makes the unit bigger but the browser then upscales
  // the caddy sprites, which makes the drives look blurry.
  const DISPLAY_SCALE = 1;

  // Bay label geometry. Labels sit in the strip above the bay opening so they
  // never overlap the drive art. BAY_LABEL_GAP is the clear space kept between
  // the bottom of the text and the top of the drive.
  const BAY_WIDTH = 30;
  const BAY_LABEL_SIZE = 7.5;
  const BAY_LABEL_GAP = 1;

  const diskLocations = [    // Chassis image is 144x165, bays measured from x4-homelab.png
    { x: 10, y: 11, BAY: "1-1", HDD: true, occupied: false, image: null },
    { x: 42, y: 11, BAY: "1-2", HDD: true, occupied: false, image: null },
    { x: 73, y: 11, BAY: "1-3", HDD: true, occupied: false, image: null },
    { x: 105, y: 11, BAY: "1-4", HDD: true, occupied: false, image: null },
  ];

  
  export default {
    name: "P5HomeLabX4",
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
          return slotHdd
            ? assets.disks.hdd.empty.image
            : assets.disks.ssd.empty.image;
        }
        if (assets.loadingFlag && diskType === "SSD" && slotHdd)
          return assets.disks.caddy.loading.image;
        if (assets.loadingFlag && diskType === "SSD" && !slotHdd)
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
      }
  
      const p5Script = function (p5) {
        loadingAnimation(p5);
        zfsAnimation(p5);
        p5.preload = (_) => {
          assets.chassis.image = p5.loadImage(assets.chassis.path);
          console.log("Chassis image dimensions:", assets.chassis.image.width, assets.chassis.image.height);
          // assets.fade.image = p5.loadImage(assets.fade.path);
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
            assets.chassis.image.height
          );
          canvas.parent("p5-x4-homelab");
          resizeHook(p5,canvas.id(),assets.chassis.image.width * DISPLAY_SCALE);
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

          // Bay labels ("1-1".."1-4") drawn in the strip above each bay so they
          // never sit on top of the drive art. The selected bay is highlighted
          // to match the selection outline.
          p5.push();
          p5.textAlign(p5.CENTER, p5.BOTTOM);
          p5.textSize(BAY_LABEL_SIZE);
          p5.textStyle(p5.BOLD);
          p5.noStroke();
          diskLocations.forEach((loc) => {
            const cx = loc.x + BAY_WIDTH / 2;
            const by = loc.y - BAY_LABEL_GAP;
            if (loc.BAY === currentDisk.value) {
              p5.fill(206, 242, 212);
            } else {
              p5.fill(235);
            }
            p5.text(loc.BAY, cx, by);
          });
          p5.pop();
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
  