"use strict";

function timestamp() {
  return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
}

// Creates svg element, returned as jQuery object
function $svgEl(elem) {
  return $(document.createElementNS('http://www.w3.org/2000/svg', elem));
}

function interpolate(x, values) {
    let last_x = null;
    let last_y = null;
    
    for (var entry_i in values) {
        if (x < values[entry_i].x) {
            if (last_x === null)
                return values[entry_i].y;
                
            return last_y + (values[entry_i].y - last_y) * ((x - last_x) / (values[entry_i].x - last_x))
        }
        last_x = values[entry_i].x;
        last_y = values[entry_i].y;
    }
    
    return last_y;
}

let UNITS = {
    e_pot: {
        display: 'e<sub>potential</sub>',
        unit: 'J/kg',
        description: 'Potential energy per kg of fluid',
    },
    v: {
        display: 'v',
        unit: 'm/s',
        description: 'Velocity (speed)',
    },
    q: {
        display: 'q',
        unit: 'm<sup>3</sup>/s',
        description: 'Flow',
    },
    T: {
        display: '&tau;',
        unit: 'Nm',
        description: 'Torque (rotational energy)'
    },
    P_elec: {
        display: 'P<sub>Electric</sub>',
        unit: 'W',
        description: 'Electric Power'
    },
    f: {
        display: 'f',
        unit: 'Hz',
        description: 'The electric frequency'
    },
    U: {
        display: 'U',
        unit: 'V',
        description: 'Electrical Voltage',
    },
    rho: {
        display: '&rho;',
        unit: 'kg/m<sup>3</sup>',
        description: 'Density',
    },
    n: {
        display: 'n',
        unit: 'rpm',
        description: 'Rotational velocity'
    },
    dm: {
        display: 'm',
        unit: 'kg/s',
        description: 'Mass flow'
    },
    s: {
        display: 's',
        unit: '',
        description: 'Steam saturation (1 = water, 0 = vapour, in between = steam)',
    },
    p: {
        display: 'p',
        unit: 'Pa',
        description: 'Pressure',
    },
    fluid: {
        display: 'Fluid',
        unit: '',
        description: 'The fluid used in this cycle.'
    },
    t: {
        display: 'T',
        unit: 'K',
        description: 'Temperature'
    },
};