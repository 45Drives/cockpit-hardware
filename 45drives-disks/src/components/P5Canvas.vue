<template>
  <div id="p5-canvas" class="mx-auto"></div>
</template>

<script>
import P5 from "p5"
export default {
  name: "P5Canvas",
  mounted() {
    const script = function(p5) {
      var speed = 2;
      var posX = 35;

      // NOTE: Set up is here
      p5.setup = _ => {
        const canvas = p5.createCanvas(570, 900);
        canvas.parent("p5-canvas");
      };
      // NOTE: Draw is here
      p5.draw = _ => {
        p5.background(245);
        const degree = p5.frameCount * 3;
        const y = p5.sin(p5.radians(degree)) * 50;

        p5.push();
        p5.translate(0, p5.height / 2);
        p5.fill(66, 184, 131);
        p5.stroke(53, 73, 94);
        p5.strokeWeight(5);
        p5.ellipse(posX, y, 50, 50);
        p5.pop();
        posX += speed;

        if (posX > p5.width - 35 || posX < 35) {
          speed *= -1;
        }
      };
    };
    // NOTE: Use p5 as an instance mode
    new P5(script);
  }
};
</script>