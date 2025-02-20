/*!
 * Built by Revolist
 */
import { s as scaleValue } from './utils.js';

const initialParams = {
  contentSize: 0,
  clientSize: 0,
  virtualSize: 0,
  maxSize: 0,
};
class LocalScrollService {
  constructor(cfg) {
    this.cfg = cfg;
    this.preventArtificialScroll = { rgRow: null, rgCol: null };
    // to check if scroll changed
    this.previousScroll = { rgRow: 0, rgCol: 0 };
    this.params = { rgRow: Object.assign({}, initialParams), rgCol: Object.assign({}, initialParams) };
  }
  static getVirtualContentSize(contentSize, clientSize, virtualSize = 0) {
    return contentSize + (virtualSize ? clientSize - virtualSize : 0);
  }
  setParams(params, dimension) {
    const virtualContentSize = LocalScrollService.getVirtualContentSize(params.contentSize, params.clientSize, params.virtualSize);
    this.params[dimension] = Object.assign(Object.assign({}, params), { maxSize: virtualContentSize - params.clientSize, virtualContentSize });
  }
  // apply scroll values after scroll done
  setScroll(e) {
    this.cancelScroll(e.dimension);
    this.preventArtificialScroll[e.dimension] = window.requestAnimationFrame(() => {
      const params = this.getParams(e.dimension);
      e.coordinate = Math.ceil(e.coordinate);
      this.previousScroll[e.dimension] = this.wrapCoordinate(e.coordinate, params);
      this.preventArtificialScroll[e.dimension] = null;
      this.cfg.afterScroll(Object.assign(Object.assign({}, e), { coordinate: params.virtualSize ? this.convert(e.coordinate, params, false) : e.coordinate }));
    });
  }
  // initiate scrolling event
  scroll(coordinate, dimension, force = false, delta) {
    this.cancelScroll(dimension);
    if (!force && this.previousScroll[dimension] === coordinate) {
      this.previousScroll[dimension] = 0;
      return;
    }
    const param = this.getParams(dimension);
    this.cfg.beforeScroll({
      dimension: dimension,
      coordinate: param.virtualSize ? this.convert(coordinate, param) : coordinate,
      delta,
    });
  }
  getParams(dimension) {
    return this.params[dimension];
  }
  // check if scroll outside of region to avoid looping
  wrapCoordinate(c, param) {
    if (c < 0) {
      return 0;
    }
    if (c > param.maxSize) {
      return param.maxSize;
    }
    return c;
  }
  // prevent already started scroll, performance optimization
  cancelScroll(dimension) {
    if (typeof this.preventArtificialScroll[dimension] === 'number') {
      window.cancelAnimationFrame(this.preventArtificialScroll[dimension]);
      this.preventArtificialScroll[dimension] = null;
      return true;
    }
    return false;
  }
  /* convert virtual to real and back, scale range */
  convert(pos, param, toReal = true) {
    const minRange = param.clientSize;
    const from = [0, param.virtualContentSize - minRange];
    const to = [0, param.contentSize - param.virtualSize];
    if (toReal) {
      return scaleValue(pos, from, to);
    }
    return scaleValue(pos, to, from);
  }
}

export { LocalScrollService as L };
