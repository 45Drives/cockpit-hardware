export default function resizeHook(p5, cnv_id, max_w) {
  p5.canvas_id = cnv_id;
  p5.max_w = max_w;

  p5.windowResized = (_) => {
    let cnv = document.getElementById(p5.canvas_id);
    let app = document.getElementById("App");
    if (cnv) {
      cnv.style.width = `${Math.min(
        p5.int(app.clientWidth - 60),
        p5.int(p5.max_w)
      )}px`;
      cnv.style.height = `auto`;
    }
  };

  p5.isOverflown = (cnv, app) => {
    return cnv.clientWidth > app.clientWidth;
  };

  p5.setInitSize = () => {
    let cnv = document.getElementById(p5.canvas_id);
    let app = document.getElementById("App");
    if (cnv) {
      cnv.style.width = `${p5.int(p5.max_w)}px`;
      cnv.style.height = `auto`;
      if (p5.isOverflown(cnv, app)) {
        cnv.style.width = `${Math.min(
          p5.int(app.clientWidth - 60),
          p5.int(p5.max_w)
        )}px`;
        cnv.style.height = `auto`;
      }
    }
  };

  p5.setInitSize();
}
