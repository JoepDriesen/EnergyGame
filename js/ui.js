"use strict";

let componentDict;
let inputDict;
let outputDict;
let _instantiateCallback;



function drop(ui) {
    var compEl = $(ui.draggable).clone();
    var comp = componentDict[compEl.data('comp-id')];
    var workspace = $("#workspace");
    
    workspace.append(compEl);
    var newId = _instantiateCallback(comp, compEl);
    compEl.attr('id', 'component-' + newId);
    compEl.data('component-id', newId);
    
    compEl.css({
        top: (ui.offset.top - workspace.offset().top) + 'px',
        left: (ui.offset.left - workspace.offset().left) + 'px',
        margin: 0
    });
            
    for (var input_i in comp.inputs) {
        var input = comp.inputs[input_i];
                
        var inputEl = $('<img id="input-' + newId + '-' + input_i + '" class="input input-' + input.type.toLowerCase() + '" src="/img/dum.png">');
        compEl.append(inputEl);
        
        inputEl.css('top', Math.round(input.location.y * 100) + '%');
        inputEl.css('margin-top', -Math.round(20 * (1 - input.location.y)));
        inputEl.css('left',  Math.round(input.location.x * 100) + '%');
        inputEl.css('margin-left', -Math.round(20 * (1 - input.location.x)));
        
        inputDict[inputEl.attr('id')] = input_i;
        inputEl.click(UIinputClick);
        inputEl.bind('contextmenu', function(e) {
            e.preventDefault();
            UIinputClick(e);
        });
    }
            
    for (var output_i in comp.outputs) {
        var output = comp.outputs[output_i];
                
        var outputEl = $('<img id="output-' + newId + '-' + output_i + '" class="output output-' + output.type.toLowerCase() + '" src="/img/dum.png">');
        compEl.append(outputEl);
        
        outputEl.css('top', Math.round(output.location.y * 100) + '%');
        outputEl.css('margin-top', -Math.round(20 * (1 - output.location.y)));
        outputEl.css('left',  Math.round(output.location.x * 100) + '%');
        outputEl.css('margin-left', -Math.round(20 * (1 - output.location.x)));
        
        outputDict[outputEl.attr('id')] = output_i;
        outputEl.click(UIoutputClick);
        outputEl.bind('contextmenu', function(e) {
            e.preventDefault();
            UIoutputClick(e);
        });
    }
    
    compEl.click(UIInstanceClickWrap(newId));
    
}

var UILastClicked;
function UIComponentClick(ev) {
    UILastClicked = $($(ev.target));
    
    UI.componentClickCallback(componentDict[$(this).data('comp-id')]);
    
    ev.stopPropagation();
}

function UIConnectorClick(ev) {
    UILastClicked = $($(ev.target));
    
    var id = $($(ev.target)).attr('id').split('-');
    UI.connectorClickCallback(id[1] == 'null' ? null : id[1], id[2]);
    
    ev.stopPropagation();
}

function UIDeleteInstance(ev) {
    var instance_id = $(ev.target).attr('data-instance-id');
    
    UI.deleteInstanceCallback(instance_id);
    
    ev.stopPropagation();
}

function UIinputClick(ev) {
    UILastClicked = $(ev.target);
    
    if (ev.button == 2) {
        UI.inputRClickCallback(
            UILastClicked.parent().data('component-id'),
            inputDict[UILastClicked.attr('id')]
        );
        return false; 
    } else {
        UI.inputLClickCallback(
            UILastClicked.parent().data('component-id'),
            inputDict[UILastClicked.attr('id')]
        );
    }
    
    ev.stopPropagation();
}
function UIInstanceClickWrap(instance_id) {
    var instID = instance_id;
    return function() {
        UI.instanceClickCallback(instID);
    }
}
function UIoutputClick(ev) {
    UILastClicked = $(ev.target);
    
    if (ev.button == 2) {
        UI.outputRClickCallback(
            UILastClicked.parent().data('component-id'),
            outputDict[UILastClicked.attr('id')]
        );
        return false;
    } else {
        UI.outputLClickCallback(
            UILastClicked.parent().data('component-id'),
            outputDict[UILastClicked.attr('id')]
        );
    }
    
    ev.stopPropagation();
}

function UIworkspaceClick(ev) {
    UILastClicked = $(ev.target);
    
    UI.workspaceClickCallback();
}


let UILineDraw = null;

let UI = {
    createComponents: function (components, instantiateCallback) {
        let compBar = $("#component-bar");
        
        for (var comp_i in components) {
            var comp = components[comp_i];
            componentDict[comp.id] = comp;
            _instantiateCallback = instantiateCallback;
            
            var compEl = $('<div id="component-template-' + comp.id + '" class="component-icon clearfix" data-comp-id="' + comp.id + '">' +
                           '  <img class="icon-img" src="' + comp.icon + '">' +
                           '  <span class="icon-text">' + comp.name + '</span>' +
                           '</div>');
            
            compBar.append(compEl);
            
            compEl.click(UIComponentClick);
            compEl.draggable({
                zIndex: 2500,
                appendTo: 'body',
                helper: 'clone',
            })
        }
    },
    
    createInputs: function(inputs) {
        var workspace = $('#workspace');
        
        for (var input_i in inputs) {
            var input = inputs[input_i].ref;
            
            var inputEl = $('<img id="input-global-' + input_i + '" class="input input-global input-' + input.type.toLowerCase() + '" src="/img/dum.png">');
            inputEl.css({
                'top': Math.round(input.location.y * 100) + '%',
                'margin-top': Math.round(-20 * input.location.y),
                'left': Math.round(input.location.x * 100) + '%',
                'margin-left': Math.round(-20 * input.location.x),
            });
            inputEl.click(UIinputClick);
            inputEl.bind('contextmenu', function(e) {
                e.preventDefault();
                UIinputClick(e);
            });
            
            inputDict[inputEl.attr('id')] = input_i;
            
            workspace.append(inputEl);
        }
    },
    createOutputs: function(outputs) {
        var workspace = $('#workspace');
        
        for (var output_i in outputs) {
            var output = outputs[output_i].ref;
            
            var outputEl = $('<img id="output-global-' + output_i + '" class="output output-global output-' + output.type.toLowerCase() + '" src="/img/dum.png">');
            outputEl.css({
                'top': Math.round(output.location.y * 100) + '%',
                'margin-top': Math.round(-20 * output.location.y),
                'left': Math.round(output.location.x * 100) + '%',
                'margin-left': Math.round(-20 * output.location.x),
            });
            outputEl.click(UIoutputClick);
            outputEl.bind('contextmenu', function(e) {
                e.preventDefault();
                UIoutputClick(e);
            });
            
            outputDict[outputEl.attr('id')] = output_i;
            
            workspace.append(outputEl);
        }
    },
    deleteInstance: function(instance_id) {
        $('#component-' + instance_id).remove();
        $('#info-bar .instance-info').hide();
    },
    
    initialize: function(componentClickCallback, connectorClickCallback, instanceClickCallback,
                         inputLClickCallback, inputRClickCallback,
                         outputLClickCallback, outputRClickCallback,
                         workspaceClickCallback, deleteInstanceCallback) {
        componentDict = {};
        inputDict = {};
        outputDict = {};
        _instantiateCallback = function(comp) {};

        let ws = $("#workspace");
        ws.empty();
        ws.append($('<div class="bg"></div>'));
        ws.append($svgEl('svg'));
        
        $('#component-bar').empty();
        $('#info-bar>div').hide();
        
        this.componentClickCallback = componentClickCallback;
        this.connectorClickCallback = connectorClickCallback;
        this.instanceClickCallback = instanceClickCallback;
        this.inputLClickCallback = inputLClickCallback;
        this.inputRClickCallback = inputRClickCallback;
        this.outputLClickCallback = outputLClickCallback;
        this.outputRClickCallback = outputRClickCallback;
        this.workspaceClickCallback = workspaceClickCallback;
        this.deleteInstanceCallback = deleteInstanceCallback;
        
        ws.droppable({
			drop: function(event,ui){
				drop(ui);
			}
        });
        ws.click(UIworkspaceClick);
        $("#error-box").find('.alert button.close').click(function() {
            $("#error-box").hide();
        });
        $('#goals-panel').find('td.bronze').text(g_CurrentLevel.goals.bronze);
        $('#goals-panel').find('th.bronze .glyphicon').attr('title', g_CurrentLevel.goalHints.bronze);
        $('#goals-panel').find('td.silver').text(g_CurrentLevel.goals.silver);
        $('#goals-panel').find('th.silver .glyphicon').attr('title', g_CurrentLevel.goalHints.silver);
        $('#goals-panel').find('td.gold').text(g_CurrentLevel.goals.gold);
        $('#goals-panel').find('th.gold .glyphicon').attr('title', g_CurrentLevel.goalHints.gold);
        
        for (var hint_i in g_CurrentLevel.hints) {
            var hint = g_CurrentLevel.hints[hint_i];
            var hintEl = $('<div class="hint">' + hint.text + '</div>');
            if (hint.width)
                hintEl.width(hint.width);
            if (hint['margin-left'])
                hintEl.css('margin-left', hint['margin-left']);
            if (hint['margin-top'])
                hintEl.css('margin-top', hint['margin-top']);
            if (hint.top)
                hintEl.css('top', hint.top);
            if (hint.bottom)
                hintEl.css('bottom', hint.bottom);
            if (hint.left)
                hintEl.css('left', hint.left);
            if (hint.right)
                hintEl.css('right', hint.right);
                
            if (hint.arrow) {
                var arEl = $('<img class="hint-arrow" src="/img/arrow.png">');
                arEl.height(hint.arrow.height);
                arEl.css({top: hint.arrow.top, bottom: hint.arrow.bottom, left: hint.arrow.left, right: hint.arrow.right})
                if (hint.arrow.rotate)
                    arEl.css('transform', 'rotate(' + hint.arrow.rotate + 'deg)');
                    
                hintEl.append(arEl);
            }
            
            ws.append(hintEl);
        }
        
        $('#info-bar .btn-delete').unbind('click');
        $('#info-bar .btn-delete').click(UIDeleteInstance);
    },
    
    removeConnector: function(comp_id, output_i) {
        $('line#connector-' + comp_id + '-' + output_i).remove();
    },
    
    resetAll: function() {
        
    },
    
    showComponentInfo: function(component) {
        $("#info-bar>div").hide();
        var info = $("#info-bar .component-info");
        
        info.find('.name').text(component.name);
        info.find('.icon').attr('src', component.icon);
        info.find('.description').html(component.description);
        
        info.find('ol.inputs').empty();
        for (var input_i in component.inputs)
            info.find('ol.inputs').append($('<li>' + component.inputs[input_i].type + '</li>'));
        info.find('ol.outputs').empty();
        for (var output_i in component.outputs)
            info.find('ol.outputs').append($('<li>' + component.outputs[output_i].type + '</li>'));
            
        info.show();
    },
    showError: function(msg) {
        $("#error-box").find('.alert span.text').text(msg);
        $("#error-box").show();
    },
    showInput: function(input, input_i) {
        $("#info-bar>div").hide();
        var info = $("#info-bar .io-info");
        
        info.find('.name').text(input.ref.name ? input.ref.name : (input.component.component.name + ' input ' + (parseInt(input_i) + 1)));
        info.find('.icon').attr('src', input.ref.icon ? input.ref.icon : input.component.component.icon);
        if (input.ref.description)
            info.find('.description').text(input.ref.description);
        else
            info.find('.description').text('');
        info.find('.type').text(input.ref.type);
        
        info.find('table.state').empty();
        for (var stateParam in (input.state ? input.state : input.ref.state)) {
            var param_info = UNITS[stateParam];
            var param_val = (input.state ? input.state : input.ref.state)[stateParam];
            if (param_val.toFixed)
                param_val = param_val.toFixed(2);
                
            info.find('table.state').append($('<tr><th>' + param_info.display + '</th>' +
                                              '<td>' + param_val + ' <b>' + param_info.unit + '</b></td>' +
                                              '<td>' + param_info.description + '</td></tr>'));
        }
        if (!input.state && !input.ref.state)
            info.find('table.state').append($('<tr><th colspan=3>Unknown</th></tr>'))
        
        info.show();
    },
    showInstanceInfo: function(instance) {
        $("#info-bar>div").hide();
        var info = $("#info-bar .instance-info");
        
        info.find('.name').text(instance.component.name);
        info.find('.icon').attr('src', instance.component.icon);
        info.find('.description').html(instance.component.description);
        info.find('.btn-delete').attr("data-instance-id", instance.id);
        
        let parsEl = info.find('.params');
        parsEl.empty();
        for (var param_i in instance.component.params) {
            let closure_param_i = param_i.slice();
            let param = instance.component.params[param_i];
            let parEl = $('<div class="param clearfix"><b class="pull-left">' + param.name + '</b></div>');
            parsEl.append(parEl);
            
            if (param.type == 'percentage') {
                let slider = $('<div class="slider"></div>');
                parEl.append($('<span class="val pull-right">' + param.displayValue(instance.params[param_i]) + param.unit + '</span>'));
                if (param.editable) {
                    parEl.append(slider);
                    slider.slider({
                        min: param.min * 100,
                        max: param.max * 100,
                        value: Math.round(instance.params[param_i] * 100),
                        slide: function(e, ui) {
                            instance.params[closure_param_i] = ui.value / 100.0;
                            parEl.find('.val').text(param.displayValue(instance.params[closure_param_i]) + param.unit)
                        }
                    });
                }
            }
            if (param.type == 'integer') {
                let slider = $('<div class="slider"></div>');
                parEl.append($('<span class="val pull-right">' + param.displayValue(instance.params[param_i]) + param.unit + '</span>'));
                if (param.editable) {
                    parEl.append(slider);
                    slider.slider({
                        min: param.min,
                        max: param.max,
                        value: instance.params[param_i],
                        slide: function(e, ui) {
                            instance.params[closure_param_i] = ui.value;
                            parEl.find('.val').text(param.displayValue(instance.params[closure_param_i]) + param.unit)
                        }
                    });
                }
            }
            if (param.type == 'constant') {
                parEl.append($('<span class="val pull-right">' + param.displayValue(instance.params[param_i]) + param.unit + '</span>'))
            }
            if (param.type == 'behaviour') {
                parEl.append($('<span class="val pull-right">' + (instance.params[param_i] ? (param.displayValue(instance.params[param_i]) + param.unit) : 'Unknown') + '</span>'));
                
                let svg = $svgEl('svg');
                parEl.append(svg);
                
                let vis = d3.select(svg.get(0)),
                    WIDTH = 450,
                    HEIGHT = 150,
                    MARGINS = {
                        top: 5,
                        right: 10,
                        bottom: 20,
                        left: 30
                    };
                    
                
                let xRange = d3.scale.linear().range([MARGINS.left, WIDTH - MARGINS.right]).domain([d3.min(param.values, function (d) {
                    return d.x;
                }), d3.max(param.values, function (d) {
                    return d.x;
                })]);

                let yRange = d3.scale.linear().range([HEIGHT - MARGINS.bottom, MARGINS.top]).domain([d3.min(param.values, function (d) {
                    return d.y;
                }), d3.max(param.values, function (d) {
                    return d.y;
                })]);

                let xAxis = d3.svg.axis()
                    .scale(xRange)
                    .innerTickSize(-(HEIGHT - MARGINS.top - MARGINS.bottom))
                    .outerTickSize(0)
                    .tickPadding(10)
                    .tickSubdivide(true);

                let yAxis = d3.svg.axis()
                    .scale(yRange)
                    .innerTickSize(-(WIDTH - MARGINS.left - MARGINS.right))
                    .outerTickSize(0)
                    .tickPadding(10)
                    .orient("left")
                    .tickSubdivide(true);

                vis.append("svg:g")
                   .attr("class", "x axis")
                   .attr("transform", "translate(0," + (HEIGHT - MARGINS.bottom) + ")")
                   .call(xAxis)
                .append("text")
                    .attr("x", WIDTH - MARGINS.right - 5)
                    .attr("y", -5)
                    .style("text-anchor", "end")
                    .text(param.x_axis);

                vis.append("svg:g")
                   .attr("class", "y axis")
                   .attr("transform", "translate(" + (MARGINS.left) + "," + 0 + ")")
                   .call(yAxis);

                var lineFunc = d3.svg.line()
                    .x(function (d) {
                        return xRange(d.x);
                    })
                    .y(function (d) {
                        return yRange(d.y);
                    })
                    .interpolate('linear');
                
                vis.append("svg:path")
                   .attr("d", lineFunc(param.values))
                   .attr("stroke", "blue")
                   .attr("stroke-width", 2)
                   .attr("fill", "none");

            }
            parsEl.append($('<p class="param-description small">' + param.description + '</p>'));
            parsEl.append($('<hr class="param-line">'));
            
        }
        info.show();
    },
    showOutput: function(output, output_i) {
        $("#info-bar>div").hide();
        var info = $("#info-bar .io-info");
        
        info.find('.name').text(output.ref.name ? output.ref.name : (output.component.component.name + ' output ' + (parseInt(output_i, 10) + 1)));
        info.find('.icon').attr('src', output.ref.icon ? output.ref.icon : output.component.component.icon);
        if (output.ref.description)
            info.find('.description').text(output.ref.description);
        else
            info.find('.description').text('');
        info.find('.type').text(output.ref.type);
        
        info.find('table.state').empty();
        for (var stateParam in (output.state ? output.state : output.ref.state)) {
            var param_info = UNITS[stateParam];
            var param_val = (output.state ? output.state : output.ref.state)[stateParam];
            if (param_val.toFixed)
                param_val = param_val.toFixed(2);
                
            info.find('table.state').append($('<tr><th>' + param_info.display + '</th>' +
                                              '<td>' + param_val + ' <b>' + param_info.unit + '</b></td>' +
                                              '<td>' + param_info.description + '</td></tr>'));
        }
        if (!output.state && !output.ref.state)
            info.find('table.state').append($('<tr><th colspan=3>Unknown</th></tr>'));
            
        info.show();
    },
    showWinBox: function(medal) {
        let wb = $('#winBox');
        
        wb.find('.medal').text(medal);
        wb.find('img').attr('src', '/img/' + medal + '.png');
        wb.modal();
        
    },
    
    startLineDraw: function(connType) {
        var ws = $('#workspace').find('svg');
        var yOffset = $('#workspace').offset().top;
        var xOffset = $('#workspace').offset().left;
        
        var line = $svgEl('line');
        line.attr({
            x1: (100 * (UILastClicked.offset().left - ws.offset().left + UILastClicked.width() / 2) / ws.width()) + '%',
            y1: (100 * (UILastClicked.offset().top - ws.offset().top + UILastClicked.height() / 2) / ws.height()) + '%',
        });
        line.attr({
            x2: line.attr('x1'),
            y2: line.attr('y1'),
        });
        line.addClass('connector-' + connType.toLowerCase());
        
        ws.append(line);
        
        ws.mousemove(function(ev) {
            line.attr({
                x2: ev.pageX - xOffset,
                y2: ev.pageY - yOffset
            });
        });
        
        UILineDraw = line;
    },
    finishLineDraw: function(outputCompId, output_i, type) {
        if (UILineDraw) {
            $('#workspace').find('svg').unbind('mousemove');
            
            var ws = $('#workspace').find('svg');
            UILineDraw.attr({
                x2: (100 * (UILastClicked.offset().left - ws.offset().left + UILastClicked.width() / 2) / ws.width()) + '%',
                y2: (100 * (UILastClicked.offset().top - ws.offset().top + UILastClicked.height() / 2) / ws.height()) + '%',
            });
            UILineDraw.attr('id', 'connector-' + outputCompId + '-' + output_i);
            
            UILineDraw.click(UIConnectorClick);
        }
            
        UILineDraw = null;
    },
    stopLineDraw: function() {
        if (UILineDraw) {
            $('#workspace').find('svg').unbind('mousemove');
            UILineDraw.remove();
        }
            
        UILineDraw = null;
    },
    
};