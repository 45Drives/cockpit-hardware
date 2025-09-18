<template>
    <div id="p5-hl15beast-homelab" class="self-stretch m-2 flex justify-center"></div>
  </template>
  
  <script>
  import P5 from "p5";
  import { ref, watch, onMounted, inject } from "vue";
  import zfsAnimation from "./zfsAnimation.js";
  import loadingAnimation from "./loadingAnimation.js";
  import resizeHook from "./resizeHook.js";
  
  const assets = {
    chassis: {
      path: "img/chassis/hl15beast-homelab.png",
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
  
  const diskLocations = [
    // ----- ROW 1 (HDD/caddy allowed) -----
    { x: 494, y: 205, BAY: "1-1", HDD: true, occupied: false, image: null },
    { x: 459.5, y: 205, BAY: "1-2", HDD: true, occupied: false, image: null },
    { x: 424.5, y: 205, BAY: "1-3", HDD: true, occupied: false, image: null },
    { x: 390, y: 205, BAY: "1-4", HDD: true, occupied: false, image: null },
    { x: 355.5, y: 205, BAY: "1-5", HDD: true, occupied: false, image: null },
    { x: 320.5, y: 205, BAY: "1-6", HDD: true, occupied: false, image: null },
    { x: 285.5, y: 205, BAY: "1-7", HDD: true, occupied: false, image: null },
    { x: 250, y: 205, BAY: "1-8", HDD: true, occupied: false, image: null },
    { x: 216.5, y: 205, BAY: "1-9", HDD: true, occupied: false, image: null },
    { x: 181.5, y: 205, BAY: "1-10", HDD: true, occupied: false, image: null },
    { x: 147.25, y: 205, BAY: "1-11", HDD: true, occupied: false, image: null },
    { x: 112.4, y: 205, BAY: "1-12", HDD: true, occupied: false, image: null },
    { x: 77.4, y: 205, BAY: "1-13", HDD: true, occupied: false, image: null },
    { x: 42.5, y: 205, BAY: "1-14", HDD: true, occupied: false, image: null },
    { x: 7.5, y: 205, BAY: "1-15", HDD: true, occupied: false, image: null },

    // ----- ROW 2 (SSD-only) -----
    { x: 382, y: 58, BAY: "1-16", HDD: false, occupied: false, image: null },
    { x: 394, y: 58, BAY: "1-17", HDD: false, occupied: false, image: null },
    { x: 419.5, y: 58, BAY: "1-18", HDD: false, occupied: false, image: null },
    { x: 431.5, y: 58, BAY: "1-19", HDD: false, occupied: false, image: null },
    { x: 443.5, y: 58, BAY: "1-20", HDD: false, occupied: false, image: null },
    { x: 455.5, y: 58, BAY: "1-21", HDD: false, occupied: false, image: null },
    { x: 481.7, y: 58, BAY: "1-22", HDD: false, occupied: false, image: null },
    { x: 493.7, y: 58, BAY: "1-23", HDD: false, occupied: false, image: null },
  ];

  
  export default {
    name: "P5HomeLabHL15BEAST",
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
  
 /*      function getDiskImage(occupied, modelName, modelFamily, diskType, slotHdd) {
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
      } */

      function getDiskImage(occupied, modelName, modelFamily, diskType, slotHdd) {
        // Empty bay shows the correct empty for the row
        if (!occupied) return slotHdd ? assets.disks.hdd.empty.image : assets.disks.ssd.empty.image;

        // While loading, keep row types strict
        if (assets.loadingFlag) {
          if (slotHdd) {
            if (diskType === "HDD") return assets.disks.hdd.loading.image;
            if (diskType === "SSD") return assets.disks.caddy.loading.image;
            return null;
          } else {
            return assets.disks.ssd.loading.image; // SSD-only row
          }
        }

        // SSD-only row (row 2): never render HDDs/caddies
        if (!slotHdd) {
          if (diskType !== "SSD") return null;
          return assets.disks.ssd.default.image;
        }

        // Row 1 rules (HDDs or SSDs-in-caddies)
        if (diskType === "SSD") {
          if (/Seagate Nytro/.test(modelFamily)) return assets.disks.caddy.seagate.image;
          if (/SEAGATE XS400LE10003/.test(modelName)) return assets.disks.caddy.seagateSas.image;
          if (/Micron_5100_|Micron_5200_/.test(modelName)) return assets.disks.caddy.micron5200.image;
          if (/Micron_5300_/.test(modelName)) return assets.disks.caddy.micron5300.image;
          return assets.disks.caddy.default.image;
        }

        if (diskType === "HDD") {
          if (/ST18000|ST16000|ST20000|ST14000|ST12000/.test(modelName)) return assets.disks.hdd.seagateSt.image;
          if (/Seagate Enterprise/.test(modelFamily)) return assets.disks.hdd.seagate.image;
          if (/TOSHIBA/.test(modelName)) return assets.disks.hdd.toshiba.image;
          return assets.disks.hdd.default.image;
        }

        return null;
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
          canvas.parent("p5-hl15beast-homelab");
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
              const w = loc.image.width * 1.11;
              const h = loc.image.height * 1.11;
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
            let idx = diskLocations.findIndex(
              (loc) => loc.BAY === currentDisk.value
            );
            if (diskLocations[idx].image) {
              if (enableZfsAnimations.flag) {
                p5.showZfs(currentDisk.value, zfsInfo, diskLocations);
              }
              const img = diskLocations[idx].image;
              const w = img.width * 1.11;
              const h = img.height * 1.11;
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
  
        p5.mouseClicked = (_) => {
          let mx = p5.mouseX;
          let my = p5.mouseY;
          diskLocations.forEach((loc) => {
            if (loc.image) {
              const w = loc.image.width * 1.11;
              const h = loc.image.height * 1.11;
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
  