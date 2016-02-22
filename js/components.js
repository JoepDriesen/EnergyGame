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
    icon: '/img/generator.png',
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
    icon: '/img/collector.png',
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
    
    params: {
        dm_max: {
            name: 'm<sub>max</sub>',
            description: 'The maximum fluid flow rate this turbine can handle. Any excess will be stuck at the input.',
            type: 'constant',
            editable: false,
            default: 100,
            unit: ' kg/s',
            displayValue: function(val) { return val },
        },
        p_out: {
            name: 'Exit Pressure',
            type: 'integer',
            editable: true,
            description: 'The pressure of the fluid at the end of the turbine. This determines the power output of the turbine. Mimimum pressure is atmospheric pressure (44.1kPa).',
            min: 101325,
            max: 1000000,
            default: 101325,
            unit: 'kPa',
            displayValue: function(val) { return (val/1000).toFixed(2); },
        },
    },
    
    inputs: {
        0: {
            type: FLUID,
            location: {
                x: 0.5,
                y: 0
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
    },
    
    resolve: function(inputStates, params) {
        let input = inputStates[0];
        
        if (input === null)
            return null;
        
        if (input.p >= params.p_out) {
            return [{
                fluid: input.fluid,
                t: input.t,
                p: input.p,
                dm: Math.min(input.dm, params.dm_max),
                rho: input.rho,
                s: input.s,
            }];
        }
        
        if (input.s <= 0) {
            // will always stays FLUID due to isentropic compression
            return [{
                fluid: input.fluid,
                t: input.t,
                p: params.p_out,
                dm: Math.min(input.dm, params.dm_max),
                rho: input.rho,
                s: input.s,
            }];
        }
        else if (input.s >= 1) {
            // will always stay GAS due to isentropic commpression
            let inVapor = steamTable.getVaporPropsT(input.p, input.t);
            
            let outVapor = steamTable.getVaporPropsS(params.p_out, inVapor.s);
            
            return [{
                fluid: input.fluid,
                t: outVapor.t,
                p: params.p_out,
                dm: Math.min(input.dm, params.dm_max),
                rho: outVapor.rho,
                s: input.s,
            }];
        } else {
            // Might come out of saturated steam area
            let inProps = steamTable.getPropsP(input.p);
            let inEntropy = inProps.sf + input.s * (inProps.sg - inProps.sf);
            let outProps = steamTable.getPropsP(params.p_out);
            
            if (outProps === null) {
                // Pressure too high for saturated steam, this is GAS
                let outVapor = steamTable.getVaporPropsS(params.p_out, inEntropy);
            
                return [{
                    fluid: input.fluid,
                    t: outVapor.t,
                    p: params.p_out,
                    dm: Math.min(input.dm, params.dm_max),
                    rho: outVapor.rho,
                    s: input.s,
                }];
            } else if (inEntropy <= outProps.sf) {
                // We have come out of saturated steam into liquid
                let saturationPoint = steamTable.getPropsSf(inEntropy);
                
                return [{
                    fluid: input.fluid,
                    t: outProps.t + (p_out - saturationPoint.p) / (steamTable.rho_liquid * steamTable.c_p),
                    p: params.p_out,
                    dm: Math.min(input.dm, params.dm_max),
                    rho: steamTable.rho_liquid,
                    s: 0,
                }];
            } else if (inEntropy >= outProps.sf) {
                // We have come out of saturated steam into gas
                let outVapor = steamTable.getVaporPropsS(params.p_out, inEntropy);
            
                return [{
                    fluid: input.fluid,
                    t: outVapor.t,
                    p: params.p_out,
                    dm: Math.min(input.dm, params.dm_max),
                    rho: outVapor.rho,
                    s: input.s,
                }];
            } else {
                // still in saturated gas area
                let outRho = 1 / (outProps.vf + outProps.s * (outProps.vg - outProps.vf))
                return [{
                    fluid: input.fluid,
                    t: outProps.t,
                    p: params.p_out,
                    dm: Math.min(input.dm, params.dm_max),
                    rho: outRho,
                    s: outProps.s,
                }];
            }
        }
    },
};

let coalboiler = {
    id: 7,
    name: 'Coal Boiler',
    icon: '/img/boiler-icon.png',
    description: 'A combustion chamber that burns coal to heat a fluid stream.',
    
    params: {
        dm_max: {
            name: 'm<sub>max</sub>',
            description: 'The maximum fluid flow rate this boiler can handle. Any excess will be stuck at the input.',
            type: 'constant',
            editable: false,
            default: 100,
            unit: ' kg/s',
            displayValue: function(val) { return val },
        },
        dm_coal: {
            name: 'm<sub>coal</sub>',
            description: 'The mass flow rate of coal into this boiler.',
            type: 'integer',
            editable: true,
            min: 0,
            max: 20,
            default: 10,
            unit: 'kg/s',
            displayValue: function(val) { return val; },
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
            return [inputStates[1]];
            
        let e_coal = 28000000; // J/kg - specific energy of coal
        let eta_boiler = 0.9; // Boiler heat isolation Efficiency
        let T_coal = 2200; // Burning temperature of COAL
        let epsilon = (T_coal - inputStates[1].t) / T_coal; // Efficiency of heat exchange - dont think this is correct
        
        let Q_burning = e_coal * Math.min(inputStates[0].dm, params.dm_coal) * eta_boiler * 0.7; // J/s - Heating generated by burning the coal
        
        if (inputStates[1].fluid.toLowerCase() != 'water') {
            error('Fluid \'' + inputStates[1].fluid + '\' has not been implemented yet, sorry');
            return null;
        }
        
        let dm = Math.min(params.dm_max, inputStates[1].dm)
        let c_p_water = 4181; // J/kg - specific heat of water
        let h_0 = c_p_water * (inputStates[1].t - 273); // J/kg - enthalpy of water at this temperate, assume constant specific enthalpy below 373K
        let h_1 = h_0 + (Q_burning / dm); // J/kg - enthalpy of water after adding the burning heat
        
        let props = steamTable.getPropsP(inputStates[1].p); // Pressure of water stays constant while passing through the boiler
        
        let s, t, rho, S;
        if (h_1 < props.hf) {
            // Liquid water
            s = 0;
            t = 273 + h_1 / steamTable.c_p;
            rho = inputStates[1].rho;
            S = steamTable.c_p;
        } else if (h_1 > props.hg) {
            // Steam
            s = 1;
            t = 1000;
            rho = 0.1;
            S: 0;
        } else {
            // Saturated steam
            s = (h_1 - props.hf) / (props.hg - props.hf);
            t = props.t;
            rho = 1 / (props.vf + s * (props.vg - props.vf));
            S = props.sf + s * (props.sg - props.sf);
        }
        
        return [{
            fluid: inputStates[1].fluid,
            t: t,
            p: inputStates[1].p,
            dm: dm,
            rho: rho,
            s: s,
        }];
    },
};

let steamturbine = {
    id: 8,
    name: 'Steam Turbine',
    icon: 'https://d30y9cdsu7xlg0.cloudfront.net/png/62804-200.png',
    description: 'A turbine whose blades are spun under the influence of pressurised vapor (steam). The resulting rotational energy is output as a torque.' +
                 '<br><br>To produce any torque, the input pressure must be higher than the output pressure.',
    
    params: {
        dm_max: {
            name: 'm<sub>max</sub>',
            description: 'The maximum fluid flow rate this turbine can handle. Any excess will be stuck at the input.',
            type: 'constant',
            editable: false,
            default: 100,
            unit: ' kg/s',
            displayValue: function(val) { return val },
        },
        p_out: {
            name: 'Exit Pressure',
            type: 'integer',
            editable: true,
            description: 'The pressure of the fluid at the end of the turbine. This determines the power output of the turbine. Mimimum pressure is atmospheric pressure (101.325kPa).',
            min: 101325,
            max: 1000000,
            default: 101325,
            unit: 'kPa',
            displayValue: function(val) { return (val/1000).toFixed(2); },
        },
        n: {
            name: 'Rotations per minute',
            description: 'The rotational velocity of the output torque in rotations per minute.',
            type: 'constant',
            editable: false,
            default: 3000,
            unit: ' rpm',
            displayValue: function(val) { return val; },
        },
    },
    
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
        let input = inputStates[0];
        
        if (input == null)
            return null;
        
        if (input.p <= params.p_out) {
            return [{
                fluid: input.fluid,
                t: input.t,
                p: input.p,
                dm: Math.min(input.dm, params.dm_max),
                rho: input.rho,
                s: input.s,
            },
            {
                T: 0,
                n: 0,
            }];
        }
        
        if (input.s >= 0 && input.s <= 1) {
            // will never exit Saturated steam area due to isentropic behaviour
            let inProps = steamTable.getPropsP(input.p);
            let inEntropy = inProps.sf + input.s  * (inProps.sg - inProps.sf);
            let inh = inProps.hf + input.s * (inProps.hg - inProps.hf);
            let props = steamTable.getPropsP(params.p_out);
            let outS = (inEntropy - props.sf) / (props.sg - props.sf);
            let outh = props.hf + outS * (props.hg - props.hf);
            let dh = inh - outh;
            let P_turb = dh * input.dm;
            
            return [{
                fluid: input.fluid,
                t: props.t,
                p: params.p_out,
                dm: Math.min(input.dm, params.dm_max),
                rho: 1 / (props.vf + outS * (props.vg - props.vf)),
                s: outS,
            }, {
                T: P_turb / params.n,
                n: params.n,
            }]
        }
        
        
        return null;
    },
};

let watertank = {
    id: 9,
    name: 'Pressurized Water Tank (Out-of-order)',
    icon: 'https://d30y9cdsu7xlg0.cloudfront.net/png/30192-200.png',
    description: 'A water supply for closed loop processes. <br><br>Make sure the input flow rate equals the output flow rate or the tank will fill up/empty out.' +
                 '<br><br>Make sure the input pressure equals tank pressure or bad things will happen.',
    
    params: {
        p_out: {
            name: 'Exit Pressure',
            type: 'integer',
            editable: true,
            description: 'The pressure of the fluid at the output of the tank. Minimum pressure is atmospheric pressure (44.1kPa).',
            min: 101325,
            max: 1000000,
            default: 101325,
            unit: 'kPa',
            displayValue: function(val) { return (val/1000).toFixed(2); },
        },
    },
    
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
                t: 300,
                dm: 1000,
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
    name: 'Heat Exchanger (Out-of-order)',
    icon: '/img/heatexchange.png',
    description: 'A heat exchanger that doesn\'t work.',
    
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