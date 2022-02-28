import SpotlightPainter from "parsegraph-spotlightpainter";
import Color from "parsegraph-color";
import Animator from "parsegraph-animator";
import lerp from "parsegraph-lerp";
import smoothstep from "parsegraph-smoothstep";
import { Projector, Projected } from "parsegraph-projector";
import { LayoutNode } from "parsegraph-layout";
import { Matrix3x3, matrixIdentity3x3 } from "parsegraph-matrix";
import Method from 'parsegraph-method';

const FOCUSED_SPOTLIGHT_COLOR = new Color(1, 1, 1, 0.5);
const FOCUSED_SPOTLIGHT_SCALE = 6;

export default class AnimatedSpotlight implements Projected {
  private _painters: Map<Projector, SpotlightPainter>;
  _animator: Animator;
  _fromNode: LayoutNode;
  _toNode: LayoutNode;
  _spotlightColor: Color;
  _world: Matrix3x3;
  _scheduleUpdate: Method;

  constructor() {
    this._painters = new Map();
    this._animator = new Animator(480);
    this._fromNode = null;
    this._toNode = null;
    this._spotlightColor = FOCUSED_SPOTLIGHT_COLOR;
    this._scheduleUpdate = new Method();
    this._world = matrixIdentity3x3();
  }

  dispose() {
    this._painters.forEach(painter=>painter.clear());
    this._painters.clear();
  }

  unmount(projector: Projector) {
    if (!this._painters.has(projector)) {
      return;
    }
    this._painters.get(projector).clear();
    this._painters.delete(projector);
  }

  focusedNode() {
    return this._toNode;
  }

  setColor(color: Color) {
    this._spotlightColor = color;
  }

  getSpotlightScale(node: LayoutNode) {
    const s = node.value().getLayout().absoluteSize();
    const srad = Math.min(
      FOCUSED_SPOTLIGHT_SCALE *
        s.width() *
        node.value().getLayout().absoluteScale(),
      FOCUSED_SPOTLIGHT_SCALE *
        s.height() *
        node.value().getLayout().absoluteScale()
    );
    return srad;
  }

  drawNodeFocus(projector: Projector) {
    const node = this.focusedNode();
    const srad = this.getSpotlightScale(node);
    this.drawSpotlight(
      projector,
      node.value().getLayout().absoluteX(),
      node.value().getLayout().absoluteY(),
      srad,
      this._spotlightColor
    );
  }

  animator() {
    return this._animator;
  }

  restart(toNode: LayoutNode) {
    //console.log("Restarting", toNode.state().id());
    this.animator().restart();
    this._fromNode = this._toNode;
    this._toNode = toNode;
    this.scheduleUpdate();
  }

  drawSpotlight(projector: Projector, x: number, y: number, srad: number, color: Color) {
    //console.log(projector, x, y, srad, color);
    if (!this.focusedNode()) {
      return;
    }
    if (!this._painters.has(projector)) {
      this._painters.set(projector, new SpotlightPainter(projector.glProvider()));
    }
    //console.log(x, y, srad, color);
    this._painters.get(projector).drawSpotlight(x, y, srad, color);
  }

  animating() {
    return this.animator().animating();
  }

  animate(projector: Projector, t: number) {
    if (!this.focusedNode()) {
      //console.log("Not animating");
      return;
    }
    t = smoothstep(t);
    let x = this._toNode.value().getLayout().absoluteX();
    let y = this._toNode.value().getLayout().absoluteY();
    let scale = this.getSpotlightScale(this._toNode);
    if (this._fromNode) {
      x = lerp(this._fromNode.value().getLayout().absoluteX(), x, t);
      y = lerp(this._fromNode.value().getLayout().absoluteY(), y, t);
      scale = lerp(this.getSpotlightScale(this._fromNode), scale, t);
      //console.log(this._fromNode.value().getLayout().absoluteX());
      //console.log(this._toNode.value().getLayout().absoluteX());
      //console.log(x, y);
    }
    this.drawSpotlight(projector, x, y, scale, this._spotlightColor);
  }

  tick() {
    return this.animating();
  }

  paint(projector: Projector) {
    // console.log("Painting animated spotlight");
    this.unmount(projector);
    if (!this.animating() && this.focusedNode()) {
      this.drawNodeFocus(projector);
    }
    return false;
  }

  setWorldTransform(world: Matrix3x3) {
    this._world = world;
  }

  render(projector: Projector) {
    projector.render();
    const gl = projector.glProvider().gl();
    gl.viewport(0, 0, projector.width(), projector.height());
    gl.enable(gl.BLEND);
    //console.log(projector.width(), projector.height());
    //console.log("Rendering animated spotlight");
    if (this.animator().animating()) {
      this.unmount(projector);
      const t = this.animator().t();
      if (t >= 1) {
        this.animator().stop();
      }
      this.animate(projector, t);
    }
    if (this._painters.has(projector)) {
      this._painters.get(projector).render(this._world);
    }
    return this.animating();
  }

  scheduleUpdate() {
    this._scheduleUpdate.call();
  }

  setOnScheduleUpdate(cb:()=>void, cbObj?:object) {
    this._scheduleUpdate.set(cb, cbObj);
  }
}
