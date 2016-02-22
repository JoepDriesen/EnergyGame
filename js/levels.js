"use strict";

let level_1 = {
    name: 'level1',
    components: [verticalPipe, waterTurbine, generator, flowsplit, flowcollect, elsubstation],
    inputs: {
        0: {
            ref: {
                name: 'River',
                icon: 'http://www.clker.com/cliparts/M/N/X/t/M/W/river-4-hi.png',
                description: 'A river to drain any excess water.',
                type: FLUID,
                fluid: 'Water',
                state: {
                    e_pot: 0,
                    v: 3,
                    q: 10000,
                    rho: 1000,
                },
                absorb: true,
                
                location: {
                    x: 0.3,
                    y: 1
                }
            }
        },
        1: {
            ref: {
                name: 'Grid',
                icon: 'http://www.interactivebill.com/assets/grid-icon.png',
                description: 'The power grid.',
                type: ELECTRICITY,
                state: {
                    f: 50,
                    U: 33000,
                    P_elec: 0,
                },
                
                location: {
                    x: 1,
                    y: 0.5
                }
            }
        }
    },
    outputs: {
        0: {
            ref: {
                name: 'Reservoir',
                icon: 'http://games-helper.com/data/think/images/icon_265.png',
                description: 'A nearly infinite supply of water that has great potential energy because it is situated at a higher altitude than the power converting station.',
                type: FLUID,
                controlling: true,
                fluid: 'Water',
                state: {
                    e_pot: 981, // J/kg
                    v: 0,   // Pa
                    q: 100, // m3/s
                    rho: 1000, // kg/m3
                },
                
                location: {
                    x: 0.2,
                    y: 0
                }
            },
            connectedTo: null,
        }
    },
    
    goals: {
        bronze: 'Supply electric power to the \'Grid\' input',
        silver: 'Generate more than 10 MW.',
        gold: 'Generate more than 10 MW with 5 components or less.',
    },
    winCondition: function() {
        var gridInputState = level_1.inputs[1].state;
        
        if (gridInputState && gridInputState.P_elec > 10000000 && Object.keys(g_ComponentInstances).length <= 5)
            return 'gold';
            
        if (gridInputState && gridInputState.P_elec > 10000000)
            return 'silver';
            
        if (gridInputState && gridInputState.P_elec > 0)
            return 'bronze';
        
        return false;
    },
    
    hints: [
       {
            text: 'These boxes are inputs or outputs.',
            width: 210,
            top: '40px',
            left: '20%',
            'margin-left': '-135px',
            arrow: {
                top: '-20px',
                left: '100px',
                height: '20px',
            }
       },
       {
            text: 'By right-clicking on an input/output, you can connect them to an output/input of the same type.',
            width: 210,
            bottom: '45px',
            left: '20%',
            'margin-left': '165px',
            arrow: {
                bottom: '-25px',
                left: '0px',
                height: '20px',
                rotate: 180,
            }
       },
       {
            text: 'This is a list of all the components available to you to accomplish the design goals. Drag them ' +
                  'onto the workspace to start using them.',
            width: 300,
            bottom: '35px',
            left: '30px',
            'margin-left': '0',
            arrow: {
                bottom: '-25px',
                left: '90px',
                height: '20px',
                rotate: 90,
            }
       },
       {
            text: 'The electrical grid',
            width: 120,
            top: '50%',
            right: '20px',
            'margin-top': '-65px',
            arrow: {
                bottom: '-25px',
                right: '20px',
                height: '20px',
                rotate: 90
            }
       },
       {
            text: 'If you get stuck, click on stuff and read the descriptions for clues on what to do next!',
            width: 300,
            top: '50%',
            left: '50%',
            'margin-top': '-200px',
            'margin-left': '-100px',
       },
       {
            text: 'Click on a connection to delete it.',
            width: 150,
            top: '50%',
            left: '20px',
            'margin-top': '-100px',
            'margin-left': '-00px',
       },
    ]
};

let level_2 = {
    name: 'level2',
    components: [coalboiler, pump, steamturbine, watertank, heatexchanger, generator],
    inputs: {
        0: {
            ref: {
                name: 'River',
                icon: 'http://www.clker.com/cliparts/M/N/X/t/M/W/river-4-hi.png',
                description: 'A river to drain any excess water.',
                type: FLUID,
                state: {
                    fluid: 'Water',
                    t: 293,
                    p: 101325,
                    dm: 10000000,
                    rho: 1000,
                    s: 0,
                },
                absorb: true,
                
                location: {
                    x: 0.3,
                    y: 1
                }
            }
        },
        1: {
            ref: {
                name: 'Grid',
                icon: 'http://www.interactivebill.com/assets/grid-icon.png',
                description: 'The power grid.',
                type: ELECTRICITY,
                state: {
                    f: 50,
                    U: 33000,
                    P_elec: 0,
                },
                
                location: {
                    x: 1,
                    y: 0.5
                }
            }
        }
    },
    
    outputs: {
        0: {
            ref: {
                name: 'Coal Supply',
                icon: 'http://images.clipartpanda.com/coal-clipart-7cabnRpcA.png',
                description: 'An infinite coal supply. How convenient',
                type: COAL,
                controlling: true,
                state: {
                    dm: 500,
                },
                
                location: {
                    x: 0,
                    y: 0.5
                }
            }
        },
        1: {
            ref: {
                name: 'River',
                icon: 'http://www.clker.com/cliparts/M/N/X/t/M/W/river-4-hi.png',
                description: 'A river can supply a near infinite amount of water.',
                type: FLUID,
                controlling: true,
                state: {
                    fluid: 'Water',
                    t: 293,
                    p: 101325,
                    dm: 10000000,
                    rho: 1000,
                    s: 0,
                },
                location: {
                    x: 0.4,
                    y: 1
                }
            }
        },
        
    },
    
    goals: {
        bronze: 'Supply electric power to the \'Grid\' input',
        silver: 'Unavailable',
        gold: 'Unavailable',
    },
    winCondition: function() {
        var gridInputState = level_2.inputs[1].state;
        
        if (gridInputState && gridInputState.P_elec > 0)
            return 'bronze';
        
        return false;
    },
    
    hints: [
       {
            text: 'The electrical grid',
            width: 120,
            top: '50%',
            right: '20px',
            'margin-top': '-65px',
            arrow: {
                bottom: '-25px',
                right: '20px',
                height: '20px',
                rotate: 90
            }
       },
    ]
};