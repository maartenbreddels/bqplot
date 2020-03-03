import { expect } from 'chai';
import { DummyManager } from './dummy-manager';
import bqplot = require('..');
// import {Figure} from '../src/Figure.js';
// import {FigureModel} from '../src/FigureModel.js';
import {create_figure_scatter} from './widget-utils'
import * as d3Timer from 'd3-timer';


// text pixel coordinate
const test_x = 200;
const test_y = 200;
const pixel_red = [255, 0, 0, 255];

describe("figure >", () => {
    beforeEach(async function() {
        this.manager = new DummyManager({ bqplot: bqplot });
    });

    it("should not create a WebGL renderer if not needed", async function() {
        const x = {dtype: 'float32', value: new DataView((new Float32Array([0.5, 0.5])).buffer)};
        const y = {dtype: 'float32', value: new DataView((new Float32Array([2.0, 2.5])).buffer)};
        const { figure } = await create_figure_scatter(this.manager, x, y);

        expect(figure.renderer).to.be.undefined;
    });

    it("should create a WebGL renderer when needed", async function() {
        const x = {dtype: 'float32', value: new DataView((new Float32Array([0.5, 0.5])).buffer)};
        const y = {dtype: 'float32', value: new DataView((new Float32Array([2.0, 2.5])).buffer)};
        const { figure } = await create_figure_scatter(this.manager, x, y, true);

        expect(figure.renderer).to.not.be.undefined;
    });

    it("canvas/png render check", async function() {
        const x = {dtype: 'float32', value: new DataView((new Float32Array([0.5, 0.5])).buffer)};
        const y = {dtype: 'float32', value: new DataView((new Float32Array([2.0, 2.5])).buffer)};
        const { scatter, figure } = await create_figure_scatter(this.manager, x, y);
        // we render a huge red scatter point, and check if the path of svg->canvas (and thus
        // png) results in a red pixels at the test coordinates.
        scatter.model.set('default_size', 1e6);
        scatter.model.set('colors', ['red']);
        scatter.d3el.selectAll(".object_grp").data();

        d3Timer.timerFlush(); // this makes sure the animations are all executed
        const canvas = await figure.get_rendered_canvas();
        const context = canvas.getContext("2d");
        const pixel = context.getImageData(test_x, test_y, 1, 1);
        expect(Array.prototype.slice.call(pixel.data)).to.deep.equals(pixel_red);
    });

    it("min aspect check", async function() {
        const x = {dtype: 'float32', value: new DataView((new Float32Array([0.5, 0.5])).buffer)};
        const y = {dtype: 'float32', value: new DataView((new Float32Array([2.0, 2.5])).buffer)};
        const { figure } = await create_figure_scatter(this.manager, x, y);

        // the dom is 400x500
        expect(figure.width).to.be.equals(400);
        expect(figure.height).to.be.equals(500);

        let width
        let height;
        // current aspect is 400/500 ~= 0.8 < 2, so we expect the height to decrease
        figure.model.set('min_aspect_ratio', 2);
        ({width, height} = figure.getFigureSize());
        expect(width).to.be.equals(400);
        expect(height).to.be.equals(200);

        // relaxing it, we expect it to grow again
        figure.model.set('min_aspect_ratio', 1.0);
        ({width, height} = figure.getFigureSize());
        expect(width).to.be.equals(400);
        expect(height).to.be.equals(400);

        // and back to its original size
        figure.model.set('min_aspect_ratio', 0.1);
        ({width, height} = figure.getFigureSize());
        expect(width).to.be.equals(400);
        expect(height).to.be.equals(500);
    });

    it("max aspect check", async function() {
        const x = {dtype: 'float32', value: new DataView((new Float32Array([0.5, 0.5])).buffer)};
        const y = {dtype: 'float32', value: new DataView((new Float32Array([2.0, 2.5])).buffer)};
        const { figure } = await create_figure_scatter(this.manager, x, y);

        // the dom is 400x500
        expect(figure.width).to.be.equals(400);
        expect(figure.height).to.be.equals(500);

        let width
        let height;
        // current aspect is 400/500 ~= 0.8 > 2, so we expect the width to decrease
        figure.model.set('max_aspect_ratio', 0.5);
        ({width, height} = figure.getFigureSize());
        expect(width).to.be.equals(250);
        expect(height).to.be.equals(500);

        // relaxing it, we expect it to grow again
        figure.model.set('max_aspect_ratio', 0.6);
        ({width, height} = figure.getFigureSize());
        expect(width).to.be.equals(300);
        expect(height).to.be.equals(500);

        // and back to its original size
        figure.model.set('max_aspect_ratio', 1);
        ({width, height} = figure.getFigureSize());
        expect(width).to.be.equals(400);
        expect(height).to.be.equals(500);
    });

});
