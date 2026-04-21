export default function zfsAnimation(p5) {
  p5.zfsAnimationSteps = 24;
  p5.zfsAnimationIndex = 0;
  p5.zfsAnimationDir = 1;
  p5.zfsAnimationColors = {
    vdev_faulted: {
      start: p5.color(244, 63, 94, 100),
      end: p5.color(239, 68, 68, 200),
    },
    vdev_degraded: {
      start: p5.color(249, 115, 22, 100),
      end: p5.color(252, 211, 77, 200),
    },
    vdev_online: {
      start: p5.color(34, 197, 94, 100),
      end: p5.color(74, 222, 128, 200),
    },
    dev_offline: {
      start: p5.color(249, 115, 22, 192),
      end: p5.color(249, 115, 22, 0),
    },
    dev_online: {
      start: p5.color(74, 222, 128, 192),
      end: p5.color(34, 197, 94, 0),
    },
    dev_removed: {
      start: p5.color(239, 68, 68, 192),
      end: p5.color(244, 63, 94, 0),
    },
    dev_unavail: {
      start: p5.color(239, 68, 68, 192),
      end: p5.color(244, 63, 94, 0),
    },
  };

  p5.updateZfsAnimationState = () => {
    if (p5.zfsAnimationIndex > p5.zfsAnimationSteps) {
      p5.zfsAnimationDir = -1;
    } else if (p5.zfsAnimationIndex <= 0) {
      p5.zfsAnimationDir = 1;
    }
    p5.zfsAnimationIndex = p5.int(p5.zfsAnimationIndex + p5.zfsAnimationDir);
  };

  p5.setLineDash = (list) => {
    p5.drawingContext.setLineDash(list);
  };

  p5.getDiskDrawRect = (loc, y_offset = 0) => {
    if (!loc) return null;

    const hasCustomW = typeof loc.w === "number";
    const hasCustomH = typeof loc.h === "number";

    const w = hasCustomW ? loc.w : loc.image?.width;
    const hBase = hasCustomH ? loc.h : loc.image?.height;

    if (typeof w !== "number" || typeof hBase !== "number") return null;

    const rotate = loc.rotate || 0;

    // Preserve old behavior for legacy components:
    // only apply y_offset when using image-native sizing.
    const h = hasCustomH ? hBase : hBase + y_offset;

    return {
      x: loc.x,
      y: loc.y,
      w,
      h,
      rotate,
    };
  };

  p5.drawDiskOverlayRect = (rect, drawFn) => {
    if (!rect) return;

    const { x, y, w, h, rotate } = rect;

    p5.push();

    if (rotate === -90 || rotate === 90) {
      p5.translate(x, y);
      p5.rotate((rotate * Math.PI) / 180);
      drawFn(-h, 0, h, w);
    } else {
      drawFn(x, y, w, h);
    }

    p5.pop();
  };

  p5.animateZpools = (loc, steps, index, from, to, zfsAnimationDir, y_offset = 0) => {
    const rect = p5.getDiskDrawRect(loc, y_offset);
    if (!rect) return;

    p5.colorMode(p5.RGB);
    p5.noFill();
    p5.strokeWeight(3);

    const dashValue = zfsAnimationDir === 1 ? 4 : 6;
    p5.setLineDash([dashValue, dashValue]);
    p5.stroke(p5.lerpColor(from, to, index / steps));

    p5.drawDiskOverlayRect(rect, (x, y, w, h) => {
      p5.rect(x, y, w, h);
    });
  };

  p5.animateVdevs = (loc, steps, index, from, to, y_offset = 0) => {
    const rect = p5.getDiskDrawRect(loc, y_offset);
    if (!rect) return;

    p5.colorMode(p5.RGB);
    p5.noStroke();
    p5.fill(p5.lerpColor(from, to, index / steps));

    p5.drawDiskOverlayRect(rect, (x, y, w, h) => {
      p5.rect(x, y, w, h);
    });
  };

  p5.showZfs = (cd, zfsInfo, diskLocations, y_offset = 0) => {
    if (!zfsInfo.zfs_installed) return;
    if (!(zfsInfo.zfs_disks && zfsInfo.zfs_disks[cd])) return;

    const pool_idx = zfsInfo.zpools.findIndex(
      (pool) => pool.name === zfsInfo.zfs_disks[cd].zpool_name
    );

    if (pool_idx === -1) return;

    p5.updateZfsAnimationState();

    zfsInfo.zpools[pool_idx].vdevs[
      zfsInfo.zfs_disks[cd].vdev_idx
    ].disks.forEach((dsk) => {
      const dsk_idx = diskLocations.findIndex((loc) => loc.BAY === dsk.name);
      if (dsk_idx === -1 || !diskLocations[dsk_idx]) return;

      let from = p5.color(255, 255, 255, 100);
      let to = p5.color(0, 0, 0, 0);

      if (dsk.state === "ONLINE") {
        from = p5.zfsAnimationColors.dev_online.start;
        to = p5.zfsAnimationColors.dev_online.end;
      } else if (dsk.state === "OFFLINE") {
        from = p5.zfsAnimationColors.dev_offline.start;
        to = p5.zfsAnimationColors.dev_offline.end;
      } else if (dsk.state === "REMOVED") {
        from = p5.zfsAnimationColors.dev_removed.start;
        to = p5.zfsAnimationColors.dev_removed.end;
      } else if (dsk.state === "UNAVAIL") {
        from = p5.zfsAnimationColors.dev_unavail.start;
        to = p5.zfsAnimationColors.dev_unavail.end;
      }

      p5.animateVdevs(
        diskLocations[dsk_idx],
        p5.zfsAnimationSteps,
        p5.zfsAnimationIndex,
        from,
        to,
        y_offset
      );
    });

    zfsInfo.zpools[pool_idx].vdevs.forEach((vdev) => {
      vdev.disks.forEach((dsk) => {
        const dsk_idx = diskLocations.findIndex((loc) => loc.BAY === dsk.name);
        if (dsk_idx === -1 || !diskLocations[dsk_idx]) return;

        let from = p5.color(255, 255, 255, 100);
        let to = p5.color(0, 0, 0, 0);

        if (vdev.state === "ONLINE") {
          from = p5.zfsAnimationColors.vdev_online.start;
          to = p5.zfsAnimationColors.vdev_online.end;
        } else if (vdev.state === "DEGRADED") {
          from = p5.zfsAnimationColors.vdev_degraded.start;
          to = p5.zfsAnimationColors.vdev_degraded.end;
        } else if (vdev.state === "FAULTED") {
          from = p5.zfsAnimationColors.vdev_faulted.start;
          to = p5.zfsAnimationColors.vdev_faulted.end;
        } else if (vdev.state === "UNAVAIL") {
          from = p5.zfsAnimationColors.vdev_faulted.start;
          to = p5.zfsAnimationColors.vdev_faulted.end;
        }

        p5.animateZpools(
          diskLocations[dsk_idx],
          p5.zfsAnimationSteps,
          p5.zfsAnimationIndex,
          from,
          to,
          p5.zfsAnimationDir,
          y_offset
        );
      });
    });
  };
}