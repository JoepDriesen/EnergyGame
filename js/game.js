"use strict";

let g_ControllingOutputs;
let g_ComponentInstances;
let g_CurrentLevel;

let g_MedalsEarned;

function game(level) {
    g_ControllingOutputs = [];
    g_ComponentInstances = {};
    g_CurrentLevel = null;

    g_MedalsEarned = [];

    g_CurrentLevel = level;
    var medals = ['bronze', 'silver', 'gold']
    for (var medal_i in medals) {
        if (localStorage.getItem(level.name + '-' + medals[medal_i])) {
            g_MedalsEarned.push(medals[medal_i]);
        }
    }
    
    awardMedals();
    
    UI.initialize(componentClick, connectorClick, instanceClick, inputLClick, inputRClick, outputLClick, outputRClick, workspaceClick, deleteInstance);
    UI.createComponents(level.components, instantiateComponent);
    UI.createInputs(level.inputs);
    UI.createOutputs(level.outputs);
    
    for (var input_i in level.inputs) {
        level.inputs[input_i].component = null;
        level.inputs[input_i].connectedTo = null;
    }
    for (var output_i in level.outputs) {
        level.outputs[output_i].component = null;
        level.outputs[output_i].connectedTo = null;
        if (level.outputs[output_i].ref.controlling)
            g_ControllingOutputs.push(level.outputs[output_i]);
    }
    
    var now,
    dt   = 0,
    last = timestamp(),
    step = 1/20;

    function frame() {
      now = timestamp();
      dt = dt + Math.min(1, (now - last) / 1000);
      while(dt > step) {
        dt = dt - step;
        
        update(step);
        
        let medal = level.winCondition()
        if (medal) {
            if ($.inArray(medal, g_MedalsEarned) < 0) {
                if (medal == 'silver' || medal == 'gold') {
                    g_MedalsEarned.push('bronze');
                    localStorage.setItem(level.name + '-bronze', true);
                }
                if (medal == 'gold') {
                    g_MedalsEarned.push('silver');
                    localStorage.setItem(level.name + '-silver', true);
                }
                g_MedalsEarned.push(medal);
                localStorage.setItem(level.name + '-' + medal, true);
                
                UI.showWinBox(medal);
    
                awardMedals();
            }
        }
      }
      
      last = now;
      requestAnimationFrame(frame);
    }
    
    requestAnimationFrame(frame);
}

function componentClick(comp) {
    UI.showComponentInfo(comp);
}

function connect(input, output) {
    if (input.component && input.component == output.component) {
        error('Can\'t connect input and output of the same component');
        return false;
    }
    if (input.connectedTo) {
        error('This input has already been connected to an output!');
        return false;
    }
    if (output.connectedTo) {
        error('This output has already been connected to an input!');
        return false;
    }
    if (input.ref.type != output.ref.type) {
        error('Can\'t connect an input of type \''+ input.ref.type + '\' to an output of type \'' + output.ref.type + '\'.');
        return false;
    }
    
    function isInChain(component, output) {
        if (!output.component)
            return false;
        if (output.component == component)
            return true;
        for (var input_i in output.component.inputs) {
            if (!output.component.inputs[input_i].connectedTo)
                continue;
            if (isInChain(component, output.component.inputs[input_i].connectedTo))
                return true;
        }
        return false;
    }
    if (isInChain(input.component, output)) {
        error('Huehue, nice try, you cannot form loops!');
        return false;
    }
    
    input.connectedTo = output;
    output.connectedTo = input;
    
    return true;
}

function connectorClick(comp_id, output_i) {
    var comp = comp_id ? g_ComponentInstances[comp_id] : g_CurrentLevel;
    var input = comp.outputs[output_i].connectedTo;
    input.connectedTo = null;
    comp.outputs[output_i].connectedTo = null;
    
    UI.removeConnector(comp_id, output_i);
}

function deleteInstance(instance_id) {
    var inst = g_ComponentInstances[instance_id];
    
    for (var input_i in inst.inputs) {
        if (inst.inputs[input_i].connectedTo) {
            var conOut = inst.inputs[input_i].connectedTo;
            conOut.connectedTo = null;
            
            var output_i;
            var comp = conOut.component ? conOut.component : g_CurrentLevel;
            for (output_i in comp.outputs) {
                if (comp.outputs[output_i] == conOut)
                    break;
            }
            UI.removeConnector(conOut.component ? comp.id : null, output_i);
        }
    }
    
    for (var output_i in inst.outputs) {
        if (inst.outputs[output_i].connectedTo) {
            inst.outputs[output_i].connectedTo.connectedTo = null;
            UI.removeConnector(inst.id, output_i);
        }
    }
    
    delete g_ComponentInstances[instance_id];
    UI.deleteInstance(instance_id);
}

function error(msg) {
    UI.showError(msg);
}

function instanceClick(instance_id) {
    UI.showInstanceInfo(g_ComponentInstances[instance_id]);
}

function instantiateComponent(comp, uiEl) {
    var id;
    do {
        id = Math.round(Math.random() * 10000);
    } while (id in g_ComponentInstances || id === 0);
    
    let compInst = {
        id: id,
        component: comp,
        params: {},
        inputs: {},
        outputs: {},
    };
    
    for (var param in comp.params) {
        compInst.params[param] = comp.params[param].default;
    }
    for (var input_i in comp.inputs) {
        compInst.inputs[input_i] = {
            connectedTo: null,
            ref: comp.inputs[input_i],
        };
        compInst.inputs[input_i].component = compInst;
    }
    for (var output_i in comp.outputs) {
        compInst.outputs[output_i] = {
            connectedTo: null,
            ref: comp.outputs[output_i],
        };
        compInst.outputs[output_i].component = compInst;
    }
    
    g_ComponentInstances[id] = compInst;
    
    return id;
}

var g_Connecting = null;
var g_ConnectingInput = null;
function inputLClick(comp_id, input_i) {
    var comp = comp_id ? g_ComponentInstances[comp_id] : g_CurrentLevel;
    
    if (g_Connecting)
        inputRClick(comp_id, input_i);
    else
        UI.showInput(comp.inputs[input_i], input_i);
}

function inputRClick(comp_id, input_i) {
    var comp = comp_id ? g_ComponentInstances[comp_id] : g_CurrentLevel;
    
    if (g_Connecting) {
        if (g_ConnectingInput)
            return error('Can\'t connect 2 inputs');
        
        if (connect(comp.inputs[input_i], g_Connecting)) {
            var output_i;
            var conComp = g_Connecting.component ? g_Connecting.component : g_CurrentLevel;
            for (var i in conComp.outputs) {
                if (conComp.outputs[i] == g_Connecting) {
                    output_i = i;
                    break;
                }
            }
            UI.finishLineDraw(g_Connecting.component ? g_Connecting.component.id : null, output_i);
        }
        else
            UI.stopLineDraw();
        
        g_Connecting = null;
        
    } else if (!comp.inputs[input_i].connectedTo) {
        UI.startLineDraw(comp.inputs[input_i].ref.type);
        
        g_Connecting = comp.inputs[input_i];
        g_ConnectingInput = true;
    }
}

function outputLClick(comp_id, output_i) {
    var comp = comp_id ? g_ComponentInstances[comp_id] : g_CurrentLevel;
    
    if (g_Connecting)
        outputRClick(comp_id, output_i);
    else
        UI.showOutput(comp.outputs[output_i], output_i);
}

function outputRClick(comp_id, output_i) {
    var comp = comp_id ? g_ComponentInstances[comp_id] : g_CurrentLevel;
            
    if (g_Connecting) {
        if (!g_ConnectingInput)
            return error('Can\'t connect 2 outputs');
        
        if (connect(g_Connecting, comp.outputs[output_i]))
            UI.finishLineDraw(comp_id ? comp_id : null, output_i);
        else
            UI.stopLineDraw();
        
        g_Connecting = null;
        
    } else if (!comp.outputs[output_i].connectedTo) {
        UI.startLineDraw(comp.outputs[output_i].ref.type);
        
        g_Connecting = comp.outputs[output_i];
        g_ConnectingInput = false;
    }
}

function update(dt) {
    // Reset states
    for (var comp_id in g_ComponentInstances) {
        for (var input_i in g_ComponentInstances[comp_id].inputs)
            g_ComponentInstances[comp_id].inputs[input_i].stateUpdated = false;
        for (var output_i in g_ComponentInstances[comp_id].outputs)
            g_ComponentInstances[comp_id].outputs[output_i].stateUpdated = false;
    }
    
    var resolveQueue = g_ControllingOutputs.slice();
    
    let inputChainWillUpdate = function (inputs) {
        for (var input_i in inputs) {
            if (inputs[input_i].stateUpdated)
                return true;
            if (inputs[input_i].connectedTo) {
                let out = inputs[input_i].connectedTo;
                if (out.component === null)
                    return true;
                if (inputChainWillUpdate(out.component.inputs))
                    return true;
            }
        }
        return false;
    };
                
    while (resolveQueue.length > 0) {
        var toResolve = resolveQueue.shift();
        
        if (toResolve.ref && toResolve.ref.controlling) {
            // This is a controlling output
            if (!toResolve.connectedTo)
                continue;
            
            toResolve.state = toResolve.ref.state;
            if (toResolve.connectedTo.ref.absorb)
                toResolve.connectedTo.state = toResolve.connectedTo.ref.state;
            else
                toResolve.connectedTo.state = toResolve.state;
            toResolve.connectedTo.stateUpdated = true;
            
            // Put this component in the resolve queue
            if (toResolve.connectedTo.component)
                resolveQueue.push(toResolve.connectedTo.component);
        } else {
            // This is a component
            var allInputsUpdated = true;
            for (var input_i in toResolve.inputs)
                allInputsUpdated &= toResolve.inputs[input_i].stateUpdated || !toResolve.inputs[input_i].connectedTo;
            
            if (!allInputsUpdated) {
                let ok = false;
                for (var input_i in toResolve.inputs) {
                    if (!toResolve.inputs[input_i].stateUpdated && inputChainWillUpdate([toResolve.inputs[input_i]])) {
                        ok = true;
                        break;
                    }
                }
                if (ok)
                    resolveQueue.push(toResolve);
            }
            else {
                let inputStates = [];
                for (var input_i in toResolve.inputs)
                    inputStates.push(toResolve.inputs[input_i].state);
                
                if (toResolve.component.resolveParams)
                    toResolve.params = toResolve.component.resolveParams(inputStates);
                    
                var outputStates = toResolve.component.resolve(inputStates, toResolve.params);
                
                for (var output_i in toResolve.outputs) {
                    var output = toResolve.outputs[output_i];
                    
                    if (outputStates)
                        output.state = outputStates[output_i];
                    else
                        output.state = null;
                        
                    output.stateUpdated = true;
                    
                    if (!output.connectedTo)
                        continue;
                    
                    if (output.connectedTo.ref.absorb)
                        output.connectedTo.state = output.connectedTo.ref.state;
                    else
                        output.connectedTo.state = output.state;
                    output.connectedTo.stateUpdated = true;
                    
                    if (output.connectedTo.component)
                        resolveQueue.push(output.connectedTo.component);
                }
            }
        }
    }
    
    for (var comp_id in g_ComponentInstances) {
        var comp = g_ComponentInstances[comp_id];
        for (var input_i in comp.inputs) {
            if (!comp.inputs[input_i].stateUpdated) {
                comp.inputs[input_i].state = null;
                
                let cascadeNull = function (comp) {
                    for (var output_i in comp.outputs) {
                        if (comp.outputs[output_i].stateUpdated)
                            continue;
                            
                        comp.outputs[output_i].state = null;
                        comp.outputs[output_i].stateUpdated = true;
                        
                        if (comp.outputs[output_i].connectedTo) {
                            comp.outputs[output_i].connectedTo.state = null;
                            comp.outputs[output_i].connectedTo.stateUpdated = true;
                            
                            if (comp.outputs[output_i].connectedTo.component)
                                cascadeNull(comp.outputs[output_i].connectedTo.component);
                        }
                    }
                }
                cascadeNull(comp);
            }
        }
    }
}

function resetLevel() {
    if (confirm("Are you sure you wish to delete all your progress?")) {
        game(g_CurrentLevel);
    }
    
    return false;
}

function workspaceClick() {
    if (g_Connecting) {
        UI.stopLineDraw();
        g_Connecting = null;
    }
}

function awardMedals() {
    let levels = ['level1', 'level2', 'level3', 'level4'];
    for (var l_i in levels) {
        let lev = levels[l_i];
        let medal;
        if (localStorage.getItem(lev + '-gold'))
            medal = 'gold';
        else if (localStorage.getItem(lev + '-silver'))
            medal = 'silver';
        else if (localStorage.getItem(lev + '-bronze'))
            medal = 'bronze';
        
        if (medal) {
            $('.' + lev + '-btn').find('.medal').html('<img src="/img/' + medal + '.png">');
            $('.' + lev + '-btn').attr('title', 'You have earned a ' + medal + ' medal for this level!');
        }
    }
}


$(function() {
    $('#lvl1-btn a').click(function() {
        if (confirm('Are you sure you wish to start level 1? You will lose all your current progress.')) {
            $('.lvl-btn').removeClass('active');
            $('#lvl1-btn').addClass('active');
            game(level_1);
        }
        return false;
    });
    $('#lvl2-btn a').click(function() {
        if ($(this).parent('li').hasClass('disabled'))
            return false;
            
        if (confirm('Are you sure you wish to start level 2? You will lose all your current progress.')) {
            $('.lvl-btn').removeClass('active');
            $('#lvl2-btn').addClass('active');
            game(level_2);
            alert('Due to time constraints, this level has not been completely finished. Bugs may occur.')
        }
        return false;
    });
    $('#lvl3-btn a').click(function() {
        if ($(this).parent('li').hasClass('disabled'))
            return false;
            
        if (confirm('Are you sure you wish to start level 3? You will lose all your current progress.')) {
            alert("Sorry, level 3 did not get finished in time...");
        }
        return false;
    });
    $('#lvl4-btn a').click(function() {
        if ($(this).parent('li').hasClass('disabled'))
            return false;
            
        if (confirm('Are you sure you wish to start level 4? You will lose all your current progress.')) {
            alert("Sorry, level 4 did not get finished in time...");
        }
        return false;
    });
    
    if (localStorage.getItem('level1-bronze'))
        $('#lvl2-btn').removeClass('disabled');
    if (localStorage.getItem('level2-bronze'))
        $('#lvl3-btn').removeClass('disabled');
    if (localStorage.getItem('level3-bronze'))
        $('#lvl4-btn').removeClass('disabled');
        
    game(level_1);
});