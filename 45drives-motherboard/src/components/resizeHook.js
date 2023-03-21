export default function resizeHook(p5, cnv_id, max_w, max_h) {
  p5.canvas_id = cnv_id;
  p5.max_w = max_w;
  p5.max_h = max_h;

  p5.windowResized = (_) => {
    let cnv = document.getElementById(p5.canvas_id);
    let app = document.getElementById("MotherboardContainer");
    if (cnv) {
      cnv.style.width = `${Math.min(
        p5.int(app.clientWidth-10),
        p5.int(p5.max_w)
      )}px`;
      cnv.style.height = `auto`;
      if(p5.isOverflownHeight(cnv,app)){
        cnv.style.height = `${Math.min(
          p5.int((app.clientHeight*0.85)),
          p5.int(p5.max_h)
        )}px`;
        cnv.style.width = `auto`;
      }
    }
  };

  p5.isOverflownHeight = (cnv, app) => {
    return cnv.clientHeight > p5.int(app.clientHeight*0.85);
  };

  p5.isOverflownWidth = (cnv, app) => {
    return cnv.clientWidth > app.clientWidth - 10;
  };

  p5.setInitSize = () => {
    let cnv = document.getElementById(p5.canvas_id);
    let app = document.getElementById("MotherboardContainer");
    if (cnv) {
      cnv.style.height = `${p5.int(p5.max_h)}px`;
      cnv.style.width = `auto`;
      if (p5.isOverflownHeight(cnv, app)) {
        cnv.style.height = `${Math.min(
          p5.int((app.clientHeight*0.85)),
          p5.int(p5.max_h)
        )}px`;
        cnv.style.width = `auto`;
      }
      if(p5.isOverflownWidth(cnv,app)){
        cnv.style.width = `${Math.min(
          p5.int(app.clientWidth-10),
          p5.int(p5.max_w)
        )}px`;
        cnv.style.height = `auto`;
      }
    }
  };

  p5.setInitSize();
}