"use strict";

let FLUID = 'Fluid', TORQUE = 'Torque', ELECTRICITY = 'Electricity', COAL = 'Coal'

let verticalPipe = {
    id: 0,
    name: 'Vertical Piping',
    icon: 'https://image.freepik.com/free-icon/pipes-angles_318-63213.png',
    description: 'Vertical piping uses the height difference between 2 components to convert potential energy of a fluid to velocity.' +
                 '<br>It has a maximum flow rate of 100 m<sup>3</sup>/s.',
    
    params: {
        q_max: {
            name: 'q<sub>max</sub>',
            description: 'The maximum flow rate this pipe can handle. Any excess will be stuck at the input.',
            type: 'constant',
            editable: false,
            default: 100,
            unit: ' m<sup>3</sup>/s',
            displayValue: function(val) { return val },
        }
    },
    
    inputs: {
        0: {
            type: FLUID,
            location: {
                x: 0.5,
                y: 0
            }
        }
    },
    
    outputs: {
        0: {
            type: FLUID,
            
            location: {
                x: 0.5,
                y: 1
            }
        }
    },
    
    resolve: function(inputStates, params) {
        var inputState = inputStates[0]
        
        if (!inputState)
            return null;
            
        return [{
            e_pot: 0,
            v: Math.sqrt(2 * inputState.e_pot),
            q: Math.min(params.q_max, inputState.q),
            rho: inputState.rho,
        }];
    },
}

let waterTurbine = {
    id: 1,
    name: 'Water Turbine',
    icon: 'https://image.freepik.com/free-icon/francis-turbine_318-50737.png',
    description: 'This component uses the force of water with high velocity to turn the blades of a turbine, thus creating a resulting torque.',
    
    params: {
        q_max: {
            name: 'q<sub>max</sub>',
            description: 'The maximum flow rate this turbine can handle. Any excess will be stuck at the input.',
            type: 'constant',
            editable: false,
            default: 50,
            unit: ' m<sup>3</sup>/s',
            displayValue: function(val) { return val },
        },
        eta: {
            name: '&eta;<sub>turbine</sub>',
            type: 'behaviour',
            description: 'The efficiency of the turbine. This value depends on the flow rate entering the turbine. A lower efficiency will produce less torque ' +
                         'for the same amount of fluid.',
            unit: '%',
            displayValue: function(val) { return Math.round(val * 100) },
            editable: false,
            x_axis: 'Flow Rate (m³/s)',
            y_axis: 'Efficiency',
            values: [
                {x: 0, y: 0},
                {x: 10, y: 0.45},
                {x: 20, y: 0.8},
                {x: 30, y: 0.91},
                {x: 35, y: 0.95},
                {x: 40, y: 0.9},
                {x: 45, y: 0.85},
                {x: 50, y: 0.2}],
        },
        n: {
            name: 'Rotations per minute',
            description: 'The rotational velocity of the output torque in rotations per minute.',
            type: 'constant',
            editable: false,
            default: 3000,
            unit: ' rpm',
            displayValue: function(val) { return val; },
        }
    },
    
    inputs: {
        0: {
            type: FLUID,
            location: {
                x: 0.5,
                y: 0
            }
        }
    },
    
    outputs: {
        0: {
            type: FLUID,
            fromInput: 0,
            location: {
                x: 0.5,
                y: 1
            }
        },
        1: {
            type: TORQUE,
            location: {
                x: 1,
                y: 0.5
            }
        }
    },
    
    resolveParams: function(inputStates) {
        var inputState = inputStates[0];
        
        return {
            q_max: waterTurbine.params.q_max.default,
            eta: interpolate(Math.min(inputState.q, waterTurbine.params.q_max.default), waterTurbine.params.eta.values),
            n: waterTurbine.params.n.default,
        };
    },
    
    resolve: function(inputStates, params) {
        var inputState = inputStates[0];
        
        return [{
            e_pot: 0,
            v: Math.max(0, Math.min(inputState.v, 0.1)),
            q: Math.min(inputState.q, params.q_max),
            rho: inputState.rho,
        }, {
            T: (Math.pow(inputState.v, 2) / 2) * inputState.rho * Math.min(inputState.q, params.q_max) * params.eta / (params.n / 60),
            n: params.n,
        }];
    },
};

let generator = {
    id: 2,
    name: 'Synchronous Generator',
    icon: 'http://www.generatorinstallers.co.uk/images/uploads/general/generator-auto-switchover-system-v02.png',
    description: 'A synchronous generator can supply electrical power to the grid by spinning its magnetized rotor. The rotor is spun using torque.',
    
    inputs: {
        0: {
            type: TORQUE,
            location: {
                x: 0,
                y: 0.5
            }
        }
    },
    
    outputs: {
        0: {
            type: ELECTRICITY,
            location: {
                x: 1,
                y: 0.5
            }
        }
    },
    
    resolve: function(inputStates) {
        let inputState = inputStates[0];
        
        let p = 2.0;
        let f_grid = 60;
        let v_rot = 120 * f_grid / p;
        
        return [{
            P_elec: inputState.T * (inputState.n / 60),
            f: 50,
            U: 33000,
        }];  
    },
};

let flowsplit = {
    id: 3,
    name: 'Flow Splitter',
    icon: 'http://uxrepo.com/static/icon-sets/iconic/svg/split.svg',
    description: 'This component splits a flow into 2 separate flows, each having a flow rate depending on the splitting factor. <br><br>' +
                 'The sum of all exiting flow rates will always equal the input flow rate.',
    
    params: {
        split_ratio: {
            name: 'Splitting Factor',
            type: 'percentage',
            editable: true,
            description: 'The percentage of the input flow that will be redirected to the first output. The second output will receive all the remaining flow.',
            min: 0,
            max: 1,
            default: 0.5,
            unit: '%',
            displayValue: function(val) { return Math.round(val * 100) },
        }
    },
    
    inputs: {
        0: {
            type: FLUID,
            location: {
                x: 0.5,
                y: 0
            }
        }
    },
    
    outputs: {
        0: {
            type: FLUID,
            location: {
                x: 0.3,
                y: 1
            }
        },
        1: {
            type: FLUID,
            location: {
                x: 0.7,
                y: 1
            }
        }
    },
    
    resolve: function(inputStates, params) {
        let inputState = inputStates[0];
        
        return [{
            e_pot: inputState.e_pot,
            v: inputState.v,
            q: inputState.q * params.split_ratio,
            rho: inputState.rho,
        }, {
            e_pot: inputState.e_pot,
            v: inputState.v,
            q: inputState.q * (1 - params.split_ratio),
            rho: inputState.rho,
        }];  
    },
};

let flowcollect = {
    id: 4,
    name: 'Flow Collector',
    icon: 'http://uxrepo.com/static/icon-sets/google-material/svg/android-call-merge.svg',
    description: 'This component merges 2 fluid flows into one, having a flow rate equal to the sum of the input flow rates.',
    
    inputs: {
        0: {
            type: FLUID,
            location: {
                x: 0.3,
                y: 0
            }
        },
        1: {
            type: FLUID,
            location: {
                x: 0.7,
                y: 0
            }
        }
    },
    
    outputs: {
        0: {
            type: FLUID,
            location: {
                x: 0.5,
                y: 1
            }
        },
    },
    
    resolve: function(inputStates) {
        function get (state, param) {
            return (state && state[param]) ? state[param] : 0;
        }
        
        let q1 = get(inputStates[0], 'q');
        let q2 = get(inputStates[1], 'q');
        
        return [{
            e_pot: (get(inputStates[0], 'e_pot') * q1 + get(inputStates[1], 'e_pot') * q2) / (q1 + q2),
            v: (get(inputStates[0], 'v') * q1 + get(inputStates[1], 'v') * q2) / (q1 + q2),
            q: q1 + q2,
            rho: (get(inputStates[0], 'rho') * q1 + get(inputStates[1], 'rho') * q2) / (q1 + q2),
        }];  
    },
};

let elsubstation = {
    id: 5,
    name: 'Electrical Substation',
    icon: 'https://maxcdn.icons8.com/windows8/PNG/26/Industry/factory_breakdown-26.png',
    description: 'This component merges 2 electrical currents into one, resulting in an electrical power equal to the sum of the 2 input powers.',
    
    inputs: {
        0: {
            type: ELECTRICITY,
            location: {
                x: 0,
                y: 0.3
            }
        },
        1: {
            type: ELECTRICITY,
            location: {
                x: 0,
                y: 0.7
            }
        }
    },
    
    outputs: {
        0: {
            type: ELECTRICITY,
            location: {
                x: 1,
                y: 0.5
            }
        },
    },
    
    resolve: function(inputStates, params) {
        function get (state, param) {
            return (state && state[param]) ? state[param] : 0;
        }
        
        let p1 = get(inputStates[0], 'P_elec');
        let p2 = get(inputStates[1], 'P_elec');
        
        return [{
            P_elec: p1 + p2,
            f: 50,
            U: 33000,
        }];  
    },
};

let pump = {
    id: 6,
    name: 'Pump',
    icon: '/img/pump.png',
    description: 'This component raises the pressure of a fluid.<br>Be carefull not to feed vapor into a pump, as this will destroy it!',
    
    inputs: {
        0: {
            type: FLUID,
            location: {
                x: 0.3,
                y: 0
            }
        }
    },
    
    outputs: {
        0: {
            type: FLUID,
            location: {
                x: 0.5,
                y: 1
            }
        },
    },
    
    resolve: function(inputStates) {
        return null;
    },
};

let coalboiler = {
    id: 7,
    name: 'Coal Boiler',
    icon: 'http://www.innovateyourhome.co.uk/media/1038/boiler-icon.png',
    description: 'A combustion chamber that burns coal to heat a fluid stream.',
    
    params: {
        q_max: {
            name: 'q<sub>max</sub>',
            description: 'The maximum fluid flow rate this boiler can handle. Any excess will be stuck at the input.',
            type: 'constant',
            editable: false,
            default: 5,
            unit: ' m<sup>3</sup>/s',
            displayValue: function(val) { return val },
        },
    },
    
    inputs: {
        0: {
            type: COAL,
            location: {
                x: 0,
                y: 0.5
            }
        },
        1: {
            type: FLUID,
            location: {
                x: 0.5,
                y: 0
            }
        }
    },
    
    outputs: {
        0: {
            type: FLUID,
            location: {
                x: 0.5,
                y: 1
            }
        },
    },
    
    resolve: function(inputStates, params) {
        if (inputStates[1] === null)
            return null;
        
        if (inputStates[0] === null)
            return inputStates[1];
            
        let e_coal = 28000000; // J/kg - specific energy of coal
        let eta_boiler = 0.9; // Boiler heat isolation Efficiency
        let T_coal = 2200; // Burning temperature of COAL
        let epsilon = (T_coal - inputStates[1].t) / T_coal; // Efficiency of heat exchange - dont think this is correct
        
        let Q_burning = e_coal * inputStates[0].dm * eta_boiler * 0.7; // J/s - Heating generated by burning the coal
        
        if (inputStates[1].fluid.toLowerCase() != 'water') {
            error('Fluid \'' + inputStates[1].fluid + '\' has not been implemented yet, sorry');
            return null;
        }
        
        let q = Math.min(params.q_max, inputStates[1].q)
        let c_p_water = 4181; // J/kg - specific heat of water
        let h_0 = c_p_water * (inputStates[1].t - 273); // J/kg - enthalpy of water at this temperate, assume constant specific enthalpy below 373K
        let h_1 = h_0 + (Q_burning / (q * inputStates[1].rho)); // J/kg - enthalpy of water after adding the burning heat
        
        let props = steamTable.getPropsP(inputStates[1].p); // Pressure of water stays constant while passing through the boiler
        
        let s, t, rho;
        if (h_1 < props.hf) {
            // Liquid water
            s = 0;
            t = 273 + h_1 / c_p_water;
            rho = inputStates[1].rho;
        } else if (h_1 > props.hg) {
            // Steam
            s = 1;
            t = 1000;
            rho = 0.1;
        } else {
            // Saturated steam
            s = (h_1 - props.hf) / (props.hg - props.hf);
            t = props.t;
            rho = 1 / (props.vf + s * (props.vg - props.vf));
        }
        
        return [{
            fluid: inputStates[1].fluid,
            t: t,
            p: inputStates[1].p,
            q: q,
            rho: rho,
            s: s,
        }];
    },
};

let steamturbine = {
    id: 8,
    name: 'Steam Turbine',
    icon: 'https://d30y9cdsu7xlg0.cloudfront.net/png/62804-200.png',
    description: 'A turbine whose blades are spun under the influence of pressurised vapor (steam). The resulting rotational energy is output as a torque.',
    
    inputs: {
        0: {
            type: FLUID,
            location: {
                x: 0,
                y: 0.5
            }
        },
    },
    
    outputs: {
        0: {
            type: FLUID,
            location: {
                x: 0.5,
                y: 1
            }
        },
        1: {
            type: TORQUE,
            location: {
                x: 1,
                y: 0.5
            }
        }
    },
    
    resolve: function(inputStates, params) {
        return null;
    },
};

let watertank = {
    id: 9,
    name: 'Water Tank',
    icon: 'https://d30y9cdsu7xlg0.cloudfront.net/png/30192-200.png',
    description: 'A water supply for closed loop processes. <br><br>Make sure the input flow rate equals the output flow rate or the tank will fill up/empty out.',
    
    inputs: {
        0: {
            type: FLUID,
            location: {
                x: 0.3,
                y: 1
            }
        },
    },
    
    outputs: {
        0: {
            type: FLUID,
            controlling: true,
            state: {
                T: 300,
                q: 1,
                rho: 1000,
            },
            location: {
                x: 0.7,
                y: 1
            }
        },
    },
    
    resolve: function(inputStates, params) {
        return null;
    },
    
};

let heatexchanger = {
    id: 10,
    name: 'Heat Exchanger',
    icon: '/img/heatexchange.png',
    description: 'A water supply for closed loop processes. <br><br>Make sure the input flow rate equals the output flow rate or the tank will fill up/empty out.',
    
    inputs: {
        0: {
            type: FLUID,
            location: {
                x: 0,
                y: 0.3
            }
        },
        1: {
            type: FLUID,
            location: {
                x: 1,
                y: 0.7
            }
        },
    },
    
    outputs: {
        0: {
            type: FLUID,
            location: {
                x: 1,
                y: 0.3
            }
        },
        1: {
            type: FLUID,
            location: {
                x: 0,
                y: 0.7
            }
        },
    },
    
    resolve: function(inputStates, params) {
        return null;
    },
    
};