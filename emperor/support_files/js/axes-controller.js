define([
    "jquery",
    "underscore",
    "view",
    "viewcontroller",
    "d3"
], function ($, _, DecompositionView, ViewControllers, d3) {

  // we only use the base attribute class, no need to get the base class
  var EmperorViewControllerABC = ViewControllers.EmperorViewControllerABC;

  /**
   * @class AxesController
   *
   * Controls the axes that are displayed on screen as well as their
   * orientation.
   *
   * @param {Node} container Container node to create the controller in.
   * @param {Object} decompViewDict This is object is keyed by unique
   * identifiers and the values are DecompositionView objects referring to a
   * set of objects presented on screen. This dictionary will usually be shared
   * by all the tabs in the application. This argument is passed by reference.
   *
   * @return {AxesController}
   * @constructs AxesController
   * @extends EmperorViewControllerABC
   */
  function AxesController(container, decompViewDict){
    var helpmenu = 'Change the visible dimensions of the data';
    var title = 'Axes';
    var scope = this;

    if (decompViewDict === undefined){
      throw Error('The decomposition view dictionary cannot be undefined');
    }
    for(var dv in decompViewDict){
      if(!dv instanceof DecompositionView){
        throw Error('The decomposition view dictionary ' +
            'can only have decomposition views');
      }
    }
    if (_.size(decompViewDict) <= 0){
      throw Error('The decomposition view dictionary cannot be empty');
    }
    this.decompViewDict = decompViewDict;

    // Picks the first key in the dictionary as the active key
    this.activeViewKey = Object.keys(decompViewDict)[0];

    EmperorViewControllerABC.call(this, container, title, helpmenu);

    /**
     * @type {Node}
     * jQuery object containing the scree plot.
     *
     * The style set here is important, allows for automatic resizing.
     *
     * @private
     */
    this.$_screePlotContainer = $('<div name="scree-plot">');
    this.$_screePlotContainer.css({'display': 'inline-block',
                                   'position': 'relative',
                                   'width': '100%',
                                   'height': '40%',
                                   'padding-bottom': '100%',
                                   'vertical-align': 'middle',
                                   'overflow': 'hidden'});

    this.$body.append(this.$_screePlotContainer);

    /**
     * @type {Node}
     * The SVG node where the scree plot lives. For use with D3.
     */
    this.svg = null;

    /**
     * @type {Node}
     * The display table where information about currently visible axes is
     * shown.
     *
     */
    this.$table = null;

    // initialize interface elements here
    $(this).ready(function() {
      scope.buildDisplayTable();
      scope._buildScreePlot();
    });

    return this;
  }
  AxesController.prototype = Object.create(EmperorViewControllerABC.prototype);
  AxesController.prototype.constructor = EmperorViewControllerABC;

  /**
   * Create a table to display the visible axis information.
   *
   * Note that when this method is executed the table is destroyed, if it
   * exists, and recreated with the appropriate information.
   *
   */
  AxesController.prototype.buildDisplayTable = function (){
    if(this.$table !== null){
      this.$table.remove();
    }

    var view = this.decompViewDict[this.activeViewKey];
    var percents = view.decomp.percExpl;
    var names = ['First', 'Second', 'Third'];

    var table = "<table>";
    table += "<col align='left'><col align='right'>";
    _.each(view.visibleDimensions, function(dimension, index){
      table += "<tr>";
      table += "<td>" + names[index] +  " Axis" + "</td>";
      table += "<td>PC " + (dimension+1) + " - " +
               percents[dimension].toFixed(2) + "%</td>";
      table += "</tr>";

    });
    table += "</table>";

    this.$table = $(table);
    this.$table.css({"width": "inherit",
                     "display": "table",
                     "padding-bottom": "10%"
    });

    this.$header.append(this.$table);
  }

  /**
   * Method to build the scree plot and updates the interface appropriately.
   *
   * @private
   *
   */
  AxesController.prototype._buildScreePlot = function (){
    var scope = this;
    var percents = this.decompViewDict[this.activeViewKey].decomp.percExpl;
    percents = _.map(percents, function(val, index){
      // +1 to account for zero-indexing
      return {'axis': 'PC ' + (index + 1), 'percent': val};
    });

    // this chart is based on the example hosted in
    // https://bl.ocks.org/mbostock/3885304
    var margin = {top: 10, right: 10, bottom: 30, left: 40},
        width = this.$body.width() - margin.left - margin.right,
        height = (this.$body.height() * 0.40) - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], 0.1);

    var y = d3.scale.linear()
      .range([height, 0]);

    var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

    var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .ticks(4);

    // the container of the scree plot
    var svg = d3.select(this.$_screePlotContainer.get(0)).append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", (-margin.left) + ' ' +
                       (-margin.top) + ' ' +
                       (width + margin.left + margin.right) + ' ' +
                       (height + margin.top + margin.bottom))
      .style('display', 'inline-block')
      .style('position', 'absolute')
      .style('left', '0')
      .style('top', '0')
      .append("g");

    // creation of the chart itself
    x.domain(percents.map(function(d) { return d.axis; }));
    y.domain([0, d3.max(percents, function(d) { return d.percent; })]);

    // create the x axis
    svg.append("g")
      .attr("font", "10px sans-serif")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    // create the y axis
    svg.append("g")
      .attr("font", "10px sans-serif")
      .call(yAxis)
      .append("text")
      .attr('transform', 'translate(' + (margin.left*(-0.8)) +
                         ',' + height/2 + ') rotate(-90)')
      .style("text-anchor", "middle")
      .text("% Variation Explained");

    // draw the bars in the chart
    svg.selectAll(".bar")
      .data(percents)
      .enter().append("rect")
      .attr("name", function(d) { return d.axis; })
      .attr("fill", "steelblue")
      .attr("x", function(d) { return x(d.axis); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.percent); })
      .attr("height", function(d) { return height - y(d.percent); })
      .on("mouseover", function(d) {
        $(this).css('fill', 'teal');
      })
      .on("mouseout", function(d) {
        $(this).css('fill', 'steelblue');
      });

    // figure title
    svg.append("text")
      .attr("x", (width / 2))
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .text("Scree Plot");

    // set the style for the axes lines and ticks
    svg.selectAll('axis,path,line')
      .style('fill', 'none')
      .style('stroke', 'black')
      .style('stroke-width', '2')
      .style('shape-rendering', 'crispEdges');

    this.screePlot = svg;

    /*
      Once we have create the plot, we bind each of the bars to a context
      menu, hence the selector searches for all the 'rect' tags inside the
      controller's div.

      The functionality itself is rather simple, each of the options in the
      context menu allows the user to select the clicked bar as the first,
      second or third visible axis. With each of these changes, we re-build
      the display table to reflect the currently visible data.

      Finally, there is one option that allows users to reorient the
      coordinates for that axis.
     */
    $.contextMenu({
      selector: '#' + this.identifier + ' rect',
      trigger: 'left',
      items: {
        'first-axis': {
          name: 'Set as first axis',
          callback: function(key, opts) {
            var name = $(this).attr('name');
            scope.updateVisibleAxes(name, 0);
            scope.buildDisplayTable();
          }
        },
        'second-axis': {
          name: 'Set as second axis',
          callback: function(key, opts) {
            var name = $(this).attr('name');
            scope.updateVisibleAxes(name, 1);
            scope.buildDisplayTable();
          }
        },
        'third-axis': {
          name: 'Set as third axis',
          callback: function(key, opts) {
            var name = $(this).attr('name');
            scope.updateVisibleAxes(name, 2);
            scope.buildDisplayTable();
          }
        },
        'sep1': '---------',
        'flip-axis': {
          name: 'Flip axis orientation',
          callback: function(key, opts) {
            var name = $(this).attr('name');
            scope.flipAxis(name);
          }
        }
      }
    });
  }

  /**
   * Callback to change the visible axes in the current plot.
   *
   * @param {String} name The name of the axis to set as a new visible axis.
   * @param {Integer} position The position where the new axis will be set.
   */
  AxesController.prototype.updateVisibleAxes = function (name, position){
    var decView = this.decompViewDict[this.activeViewKey];
    var visibleDimensions = decView.visibleDimensions;

    visibleDimensions[position] = parseInt(name.split(' ')[1]) - 1;
    decView.changeVisibleDimensions(visibleDimensions);
  }

  /*
   * Callback to change the orientation of an axis
   *
   * @param {String} name The name of the axis to re-orient, for example 'PC
   * 1'.
   *
   **/
  AxesController.prototype.flipAxis = function (name){
    var decView = this.decompViewDict[this.activeViewKey];
    decView.flipAxisOrientation(parseInt(name.split(' ')[1]) - 1);
  }

  return AxesController;
});