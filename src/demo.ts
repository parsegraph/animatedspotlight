import AnimatedSpotlight from ".";
import {Projection, BasicProjector} from "parsegraph-projector";
import TimingBelt from 'parsegraph-timingbelt';
import {BasicPositioned, Positioned} from 'parsegraph-layout';
import Direction, {DirectionNode} from 'parsegraph-direction';
import Color from 'parsegraph-color';
import { make2DProjection, makeTranslation3x3, matrixMultiply3x3, Matrix3x3, matrixIdentity3x3 } from "parsegraph-matrix";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("demo");
  root.style.position = "relative";

  const belt = new TimingBelt();

  const proj = new BasicProjector();

  const as = new AnimatedSpotlight();
  as.setColor(new Color(0, 0, 0, 1));
  belt.addRenderable(new Projection(proj, as));

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "0px";
  container.style.top = "0px";
  container.style.pointerEvents = "none";
  root.appendChild(proj.container());
  container.style.fontSize = "18px";
  container.style.fontFamily = "sans";

  const style = {
    minHeight: 90,
    minWidth: 90,
    borderThickness: 2,
    verticalPadding: 8,
    horizontalPadding: 8,
    verticalSeparation: 10,
    horizontalSeparation: 10,
  }

  const n = new DirectionNode<Positioned>();
  const npos = new BasicPositioned(n);
  npos.setBlockStyle(style);
  n.setValue(npos);

  const c = new DirectionNode<Positioned>();
  const cpos = new BasicPositioned(c);
  cpos.setBlockStyle(style);
  c.setValue(cpos);
  n.connectNode(Direction.FORWARD, c);

  let selected = n;
  const refresh = () => {
    n.value().getLayout().commitLayoutIteratively();
    const rand = () => Math.floor(Math.random() * 255);
    document.body.style.backgroundColor = `rgb(${rand()}, ${rand()}, ${rand()})`;
    container.style.color = `rgb(${rand()}, ${rand()}, ${rand()})`;
    container.style.left = `${Math.random() * root.clientWidth}px`;
    container.style.top = `${Math.random() * root.clientHeight}px`;
    selected = selected === n ? c : n;
    let world = make2DProjection(proj.width(), proj.height(), !proj.isOffscreen());
    world = matrixMultiply3x3(makeTranslation3x3(proj.width()/2, proj.height()/2), world);
    as.setWorldTransform(world);
    as.restart(selected);
  };

  const dot = document.createElement("div");
  dot.style.position = "absolute";
  dot.style.right = "8px";
  dot.style.top = "8px";
  dot.style.width = "16px";
  dot.style.height = "16px";
  dot.style.borderRadius = "8px";
  dot.style.transition = "background-color 400ms";
  dot.style.backgroundColor = "#222";
  root.appendChild(dot);

  container.style.transition = "color 2s, left 2s, top 2s";
  document.body.style.transition = "background-color 2s";
  let timer: any = null;
  let dotTimer: any = null;
  let dotIndex = 0;
  const dotState = ["#f00", "#c00"];
  const refreshDot = () => {
    dotIndex = (dotIndex + 1) % dotState.length;
    dot.style.backgroundColor = dotState[dotIndex];
  };
  const interval = 3000;
  const dotInterval = 500;
  root.addEventListener("click", () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
      clearInterval(dotTimer);
      dotTimer = null;
      dot.style.transition = "background-color 3s";
      dot.style.backgroundColor = "#222";
    } else {
      refresh();
      dot.style.transition = "background-color 400ms";
      refreshDot();
      timer = setInterval(refresh, interval);
      dotTimer = setInterval(refreshDot, dotInterval);
    }
  });
});
