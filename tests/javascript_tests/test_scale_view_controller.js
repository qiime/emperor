requirejs([
    'jquery',
    'underscore',
    'three',
    'model',
    'view',
    'viewcontroller',
    'scaleviewcontroller'
], function($, _, THREE, model, DecompositionView, viewcontroller,
            ScaleViewController) {
  $(document).ready(function() {
    var ScalarViewControllerABC = viewcontroller.ScalarViewControllerABC;
    var DecompositionModel = model.DecompositionModel;
    var Plottable = model.Plottable;

    module('ScaleViewController', {
      setup: function() {
        this.sharedDecompositionViewDict = {};

        // setup function
        name = 'pcoa';
        ids = ['PC.636', 'PC.635', 'PC.634'];
        coords = [
          [-0.276542, -0.144964, 0.066647, -0.067711, 0.176070, 0.072969,
          -0.229889, -0.046599],
          [-0.237661, 0.046053, -0.138136, 0.159061, -0.247485, -0.115211,
          -0.112864, 0.064794],
          [-0.237661, 0.046053, -0.138136, 0.159061, -0.247485, -0.115211,
          -0.112864, 0.064794]];
        pct_var = [26.6887048633, 16.2563704022, 13.7754129161, 11.217215823,
        10.024774995, 8.22835130237, 7.55971173665, 6.24945796136];
        md_headers = ['SampleID', 'Mixed', 'Treatment', 'DOB'];
        metadata = [['PC.636', '14.2', 'Control', '20070314'],
        ['PC.635', 'StringValue', 'Fast', '20071112'],
        ['PC.634', '14.7', 'Fast', '20071112']];
        decomp = new DecompositionModel(name, ids, coords, pct_var, md_headers,
            metadata);
        var dv = new DecompositionView(decomp);
        this.sharedDecompositionViewDict.scatter = dv;

        name = 'biplot';
        ids = ['tax_1', 'tax_2'];
        coords = [
          [-1, -0.144964, 0.066647, -0.067711, 0.176070, 0.072969,
          -0.229889, -0.046599],
          [-0.237661, 0.046053, -0.138136, 0.159061, -0.247485, -0.115211,
          -0.112864, 0.064794]];
        pct_var = [26.6887048633, 16.2563704022, 13.7754129161, 11.217215823,
        10.024774995, 8.22835130237, 7.55971173665, 6.24945796136];
        md_headers = ['SampleID', 'Gram'];
        metadata = [['tax_1', '1'],
        ['tax_2', '0']];
        this.decomp = new DecompositionModel(name, ids, coords, pct_var,
            md_headers, metadata);
        this.dv = new DecompositionView(this.decomp);
        this.sharedDecompositionViewDict.biplot = dv;
      },
      teardown: function() {
        this.sharedDecompositionViewDict = undefined;
        this.decomp = undefined;
      }
    });

    test('Constructor tests', function(assert) {
      var container = $('<div id="does-not-exist" style="height:11px; ' +
                        'width:12px"></div>');

      assert.ok(ScaleViewController.prototype instanceof
                ScalarViewControllerABC);

      var controller = new ScaleViewController(container,
        this.sharedDecompositionViewDict);

      controller.setMetadataField('SampleID');
      equal(controller.title, 'Scale');

      var testColumn = controller.bodyGrid.getColumns()[0];
      equal(testColumn.field, 'value');

      // verify the checked value is set properly
      equal(controller.$scaledValue.is(':checked'), false);
      equal(controller.$select.val(), 'SampleID');
      equal(controller.getMetadataField(), 'SampleID');
    });

    test('Testing setPlottableAttributes helper function', function(assert) {
      // testing with one plottable
      var idx = 0;
      plottables = [{idx: idx}];
      deepEqual(this.dv.markers[idx].scale.x, 1);
      deepEqual(this.dv.markers[idx].scale.y, 1);
      deepEqual(this.dv.markers[idx].scale.z, 1);
      deepEqual(this.dv.markers[idx + 1].scale.x, 1);
      deepEqual(this.dv.markers[idx + 1].scale.y, 1);
      deepEqual(this.dv.markers[idx + 1].scale.z, 1);
      ScaleViewController.prototype.setPlottableAttributes(
        this.dv, 2.5, plottables);
      deepEqual(this.dv.markers[idx].scale.x, 2.5);
      deepEqual(this.dv.markers[idx].scale.y, 2.5);
      deepEqual(this.dv.markers[idx].scale.z, 2.5);
      deepEqual(this.dv.markers[idx + 1].scale.x, 1);
      deepEqual(this.dv.markers[idx + 1].scale.y, 1);
      deepEqual(this.dv.markers[idx + 1].scale.z, 1);
      equal(this.dv.needsUpdate, true);

      // testing with multiple plottable
      plottables = [{idx: idx}, {idx: idx + 1}];
      ScaleViewController.prototype.setPlottableAttributes(this.dv, 0.4,
                                                           plottables);
      deepEqual(this.dv.markers[idx].scale.x, 0.4);
      deepEqual(this.dv.markers[idx].scale.y, 0.4);
      deepEqual(this.dv.markers[idx].scale.z, 0.4);
      deepEqual(this.dv.markers[idx + 1].scale.x, 0.4);
      deepEqual(this.dv.markers[idx + 1].scale.y, 0.4);
      deepEqual(this.dv.markers[idx + 1].scale.z, 0.4);
      equal(this.dv.needsUpdate, true);
    });

    test('Testing toJSON', function() {
      var container = $('<div id="does-not-exist" style="height:11px; ' +
                        'width:12px"></div>');
      var controller = new ScaleViewController(
        container, this.sharedDecompositionViewDict);
      controller.setMetadataField('SampleID');

      var obs = controller.toJSON();
      var exp = {category: 'SampleID', globalScale: '1', scaleVal: false,
                 data: {'PC.636': 1, 'PC.635': 1, 'PC.634': 1}};
      deepEqual(obs, exp);
    });

    test('Testing fromJSON', function() {
      var json = {category: 'SampleID', globalScale: '1.0', scaleVal: false,
                  data: {'PC.636': 1.1, 'PC.635': 1, 'PC.634': 0.7}};

      var container = $('<div id="does-not-exist" style="height:11px; ' +
                        'width:12px"></div>');
      var controller = new ScaleViewController(
        container, this.sharedDecompositionViewDict);

      controller.fromJSON(json);
      var idx = 0;
      var scatter = controller.decompViewDict.scatter;
      deepEqual(scatter.markers[idx].scale.x, 1.1);
      deepEqual(scatter.markers[idx].scale.y, 1.1);
      deepEqual(scatter.markers[idx].scale.z, 1.1);
      deepEqual(scatter.markers[idx + 1].scale.x, 1);
      deepEqual(scatter.markers[idx + 1].scale.y, 1);
      deepEqual(scatter.markers[idx + 1].scale.z, 1);
      deepEqual(scatter.markers[idx + 2].scale.x, 0.7);
      deepEqual(scatter.markers[idx + 2].scale.y, 0.7);
      deepEqual(scatter.markers[idx + 2].scale.z, 0.7);
      equal(controller.$select.val(), 'SampleID');
      equal(controller.$scaledValue.is(':checked'), false);
    });

    test('Testing fromJSON scaled', function() {
      var json = {category: 'DOB', globalScale: '1.0', scaleVal: true,
                  data: {'20070314': 1, '20071112': 5}};

      var container = $('<div id="does-not-exist" style="height:11px; ' +
                        'width:12px"></div>');
      var controller = new ScaleViewController(
        container, this.sharedDecompositionViewDict);

      controller.fromJSON(json);
      var idx = 0;
      deepEqual(controller.decompViewDict.scatter.markers[idx].scale.x, 1);
      deepEqual(controller.decompViewDict.scatter.markers[idx].scale.y, 1);
      deepEqual(controller.decompViewDict.scatter.markers[idx].scale.z, 1);
      deepEqual(controller.decompViewDict.scatter.markers[idx + 1].scale.x, 5);
      deepEqual(controller.decompViewDict.scatter.markers[idx + 1].scale.y, 5);
      deepEqual(controller.decompViewDict.scatter.markers[idx + 1].scale.z, 5);
      equal(controller.$select.val(), 'DOB');
      equal(controller.$scaledValue.is(':checked'), true);
    });

    test('Testing toJSON (null)', function() {
      var container = $('<div id="does-not-exist" style="height:11px; ' +
                        'width:12px"></div>');
      var controller = new ScaleViewController(
        container, this.sharedDecompositionViewDict);
      controller.setMetadataField(null);

      var obs = controller.toJSON();
      var exp = {category: null, globalScale: '1.0', scaleVal: false,
                 data: {}};
      deepEqual(obs, exp);
    });

    test('Testing fromJSON (null)', function() {
      var json = {category: null, globalScale: '1.0', scaleVal: false,
                  data: {}};

      var container = $('<div id="does-not-exist" style="height:11px; ' +
                        'width:12px"></div>');
      var controller = new ScaleViewController(
        container, this.sharedDecompositionViewDict);

      controller.fromJSON(json);
      var idx = 0;
      var scatter = controller.decompViewDict.scatter;
      deepEqual(scatter.markers[0].scale.x, 1);
      deepEqual(scatter.markers[0].scale.y, 1);
      deepEqual(scatter.markers[0].scale.z, 1);
      deepEqual(scatter.markers[1].scale.x, 1);
      deepEqual(scatter.markers[1].scale.y, 1);
      deepEqual(scatter.markers[1].scale.z, 1);
      deepEqual(scatter.markers[2].scale.x, 1);
      deepEqual(scatter.markers[2].scale.y, 1);
      deepEqual(scatter.markers[2].scale.z, 1);
      equal(controller.getMetadataField(), null);
      equal(controller.$scaledValue.is(':checked'), false);
    });

    test('Testing getScale', function() {
      var container = $('<div id="does-not-exist" style="height:11px; ' +
                        'width:12px"></div>');
      var controller = new ScaleViewController(
        container, this.sharedDecompositionViewDict);
      var data = ['1.0', 'no', 'false', 'something', '2.0'];

      //test standard values
      var obs = controller.getScale(data, false);
      var exp = {'1.0': 1, 'no': 1, 'false': 1, 'something': 1, '2.0': 1};
      deepEqual(obs, exp);

      //test scaled values
      obs = controller.getScale(data, true);
      exp = {'1.0': 1, 'no': 0, 'false': 0, 'something': 0, '2.0': 5};
      deepEqual(obs, exp);
    });
  });
});
