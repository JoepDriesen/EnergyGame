let SOLID = 'Solid',
    LIQUID = 'Liquid',
    STEAM = 'Steam',
    GAS = 'Gaseous';
    
let steamTable = {
    sat_table: [],
    sheat_table: {},
    
    
    c_p: 4181, // J/kg - specific heat of water
    rho_liquid: 1000, // Assume constant in liquid form
    
    getStateT: function(p, T) {
        if (T < 273.01)
            return SOLID;
        
        if (T > 373.95 + 273)
            return GAS;
            
        let props = steamTable.getPropsT(T);
        if (Math.abs(p - props.p) < 1)
            return STEAM;
        if (p > props.p)
            return LIQUID;
        return GAS;
    },
    
    getStateS: function(p, s) {
        if (p < 1000)
            return SOLID;
        if (p > 22064000)
            return GAS;
            
        let props = steamTable.getPropsP(p);
        if (s > props.sg)
            return GAS;
        if (s < props.sf)
            return LIQUID;
        return STEAM;
    },
    getPropsT: function(T) {
        let last_e = null;
        
        for (var entry_i in steamTable.sat_table) {
            let e = steamTable.sat_table[entry_i];
            
            if (e.t == T)
                return e;
            
            if (e.t > T) {
                if (last_e === null)
                    return null;
                    
                let r = (T - last_e.t) / (e.T - last_e.t);
                return {
                    t: T,
                    p: last_e.p + r * (e.p - last_e.p),
                    vf: last_e.vf + r * (e.vf - last_e.vf),
                    vg: last_e.vg + r * (e.vg - last_e.vg),
                    hf: last_e.hf + r * (e.hf - last_e.hf),
                    hg: last_e.hg + r * (e.hg - last_e.hg),
                    sf: last_e.sf + r * (e.sf - last_e.sf),
                    sg: last_e.sg + r * (e.sg - last_e.sg),
                };
            }
            
            last_e = e;
        }
        
        return null;
    },
    getPropsP: function(p) {
        let last_e = null;
        
        for (var entry_i in steamTable.sat_table) {
            let e = steamTable.sat_table[entry_i];
            
            if (e.p == p)
                return e;
            
            if (e.p > p) {
                if (last_e === null)
                    return null;
                    
                let r = (p - last_e.p) / (e.p - last_e.p);
                return {
                    t: last_e.t + r * (e.t - last_e.t),
                    p: p,
                    vf: last_e.vf + r * (e.vf - last_e.vf),
                    vg: last_e.vg + r * (e.vg - last_e.vg),
                    hf: last_e.hf + r * (e.hf - last_e.hf),
                    hg: last_e.hg + r * (e.hg - last_e.hg),
                    sf: last_e.sf + r * (e.sf - last_e.sf),
                    sg: last_e.sg + r * (e.sg - last_e.sg),
                };
            }
            
            last_e = e;
        }
        
        return null;
    },
    getPropsSf: function(sf) {
        let last_e = null;
        
        for (var entry_i in steamTable.sat_table) {
            let e = steamTable.sat_table[entry_i];
            
            if (e.sf == sf)
                return e;
            
            if (e.sf > sf) {
                if (last_e === null)
                    return null;
                    
                let r = (sf - last_e.sf) / (e.sf - last_e.sf);
                return {
                    t: last_e.t + r * (e.t - last_e.t),
                    p: last_e.p + r * (e.p - last_e.p),
                    vf: last_e.vf + r * (e.vf - last_e.vf),
                    vg: last_e.vg + r * (e.vg - last_e.vg),
                    hf: last_e.hf + r * (e.hf - last_e.hf),
                    hg: last_e.hg + r * (e.hg - last_e.hg),
                    sf: sf,
                    sg: last_e.sg + r * (e.sg - last_e.sg),
                };
            }
            
            last_e = e;
        }
        
        return null;
    },
    getPropsSg: function(sg) {
        let last_e = null;
        
        for (var entry_i in steamTable.sat_table) {
            let e = steamTable.sat_table[entry_i];
            
            if (e.sg == sg)
                return e;
            
            if (e.sg > sg) {
                if (last_e === null)
                    return null;
                    
                let r = (sg - last_e.sg) / (e.sg - last_e.sg);
                return {
                    t: last_e.t + r * (e.t - last_e.t),
                    p: last_e.p + r * (e.p - last_e.p),
                    vf: last_e.vf + r * (e.vf - last_e.vf),
                    vg: last_e.vg + r * (e.vg - last_e.vg),
                    hf: last_e.hf + r * (e.hf - last_e.hf),
                    hg: last_e.hg + r * (e.hg - last_e.hg),
                    sf: last_e.sf + r * (e.sf - last_e.sf),
                    sg: sg,
                };
            }
            
            last_e = e;
        }
        
        return null;
    },
    
    getLiquidProps: function(t) {
        return {
            t: t,
            rho: steamTable.rho,
            h: steamTable.c_p * t,
            s: steamTable.c_p,
        };
    },
    
    getLiquidS: function(t) {
        
    },
    
    getVaporPropsT: function(p, t) {
        let pLow, pLowE, pHigh, pHighE;
        
        for (var pressure in steamTable.sheat_table) {
            if (p <= pressure) {
                if (p == pressure || pLow === null) {
                    pLow = pressure;
                    pLowE = steamTable.sheat_table[pressure];
                }
                
                pHigh = pressure;
                pHighE = steamTable.sheat_table[pressure];
                break;
            }
            pLow = pressure;
            pLowE = steamTable.sheat_table[pressure];
        }
        
        let tLow;
        for (var e_i in pLowE) {
            let e = pLowE[e_i];
            if (t <= e.t) {
                if (t == e.t || tLow == null) {
                    tLow = e;
                }
                if (Math.abs(e.t - t) < Math.abs(tLow.t - t))
                    pLowE = e;
                else
                    pLowE = tLow;
                break;
            }
            tLow = e;
        }
        for (var e_i in pHighE) {
            let e = pHighE[e_i];
            if (t <= e.t) {
                if (t == e.t || tLow == null) {
                    tLow = e;
                }
                if (Math.abs(e.t - t) < Math.abs(tLow.t - t))
                    pHighE = e;
                else
                    pHighE = tLow;
                break;
            }
            tLow = e;
        }
        r = (p - pLow) / (pHigh - pLow);
        return {
            t: t,
            p: p,
            rho: 1 / (pLowE.v + r * (pHighE.v - pLowE.v)),
            h: pLowE.h + r * (pHighE.h - pLowE.h),
            s: pLowE.s + r * (pHighE.s - pLowE.s),
        };
    },
    
    getVaporPropsS: function(p, s) {
        let pLow, pLowE, pHigh, pHighE;
        
        for (var pressure in steamTable.sheat_table) {
            if (p <= pressure) {
                if (p == pressure || pLow === null) {
                    pLow = pressure;
                    pLowE = steamTable.sheat_table[pressure];
                }
                
                pHigh = pressure;
                pHighE = steamTable.sheat_table[pressure];
                break;
            }
            pLow = pressure;
            pLowE = steamTable.sheat_table[pressure];
        }
        
        let sLow;
        for (var e_i in pLowE) {
            let e = pLowE[e_i];
            if (s <= e.s) {
                if (s == e.s || sLow == null) {
                    sLow = e;
                }
                if (Math.abs(e.s - s) < Math.abs(sLow.s - s))
                    pLowE = e;
                else
                    pLowE = sLow;
                break;
            }
            sLow = e;
        }
        for (var e_i in pHighE) {
            let e = pHighE[e_i];
            if (s <= e.s) {
                if (s == e.s || tLow == null) {
                    sLow = e;
                }
                if (Math.abs(e.s - s) < Math.abs(sLow.s - s))
                    pHighE = e;
                else
                    pHighE = sLow;
                break;
            }
            sLow = e;
        }
        r = (p - pLow) / (pHigh - pLow);
        return {
            t: pLowE.t + r * (pHighE.t - pLowE.t),
            p: p,
            rho: 1 / (pLowE.v + r * (pHighE.v - pLowE.v)),
            h: pLowE.h + r * (pHighE.h - pLowE.h),
            s: s,
        };
    },
};

function FixSteamTables() {
    let _steam_sat = [
        [0.01,0.00061,0.00100,205.99,0,2374.9,0.001,2500.9,2500.9,0,9.1555,9.1555],
[5,0.00087,0.00100,147.01,21.02,2381.8,21.0,2489.1,2510.1,0.0763,8.9485,9.0248],
[10,0.00123,0.00100,106.30,42.02,2388.6,42.0,2477.2,2519.2,0.1511,8.7487,8.8998],
[15,0.00171,0.00100,77.875,62.98,2395.5,63.0,2465.3,2528.3,0.2245,8.5558,8.7803],
[20,0.00234,0.00100,57.757,83.91,2402.3,83.9,2453.5,2537.4,0.2965,8.3695,8.6660],
[25,0.00317,0.00100,43.337,104.83,2409.1,104.8,2441.7,2546.5,0.3672,8.1894,8.5566],
[30,0.00425,0.00100,32.878,125.73,2415.9,125.7,2429.8,2555.5,0.4368,8.0152,8.4520],
[35,0.00563,0.00101,25.205,146.63,2422.7,146.6,2417.9,2564.5,0.5051,7.8466,8.3517],
[40,0.00739,0.00101,19.515,167.53,2429.4,167.5,2406.0,2573.5,0.5724,7.6831,8.2555],
[45,0.00960,0.00101,15.252,188.43,2436.1,188.4,2394.0,2582.4,0.6386,7.5247,8.1633],
[50,0.01235,0.00101,12.027,209.33,2442.7,209.3,2382.0,2591.3,0.7038,7.3710,8.0748],
[55,0.01576,0.00102,9.5643,230.24,2449.3,230.3,2369.8,2600.1,0.7680,7.2218,7.9898],
[60,0.01995,0.00102,7.6672,251.16,2455.9,251.2,2357.6,2608.8,0.8313,7.0768,7.9081],
[65,0.02504,0.00102,6.1935,272.09,2462.4,272.1,2345.4,2617.5,0.8937,6.9359,7.8296],
[70,0.03120,0.00102,5.0395,293.03,2468.9,293.2,2333.0,2626.1,0.9551,6.7989,7.7540],
[75,0.03860,0.00103,4.1289,313.99,2475.2,314.0,2320.6,2634.6,1.0158,6.6654,7.6812],
[80,0.04741,0.00103,3.4052,334.96,2481.6,335.0,2308.0,2643.0,1.0756,6.5355,7.6111],
[85,0.05787,0.00103,2.8258,355.95,2487.8,356.0,2295.3,2651.3,1.1346,6.4088,7.5434],
[90,0.07018,0.00104,2.3591,376.97,2494.0,377.0,2282.5,2659.5,1.1929,6.2852,7.4781],
[95,0.08461,0.00104,1.9806,398.00,2500.0,398.1,2269.5,2667.6,1.2504,6.1647,7.4151],
[100,0.10142,0.00104,1.6718,419.06,2506.0,419.2,2256.4,2675.6,1.3072,6.0469,7.3541],
[110,0.14338,0.00105,1.2093,461.26,2517.7,461.4,2229.7,2691.1,1.4188,5.8193,7.2381],
[120,0.19867,0.00106,0.8912,503.60,2528.9,503.8,2202.1,2705.9,1.5279,5.6012,7.1291],
[130,0.27028,0.00107,0.66800,546.09,2539.5,546.4,2173.7,2720.1,1.6346,5.3918,7.0264],
[140,0.36154,0.00108,0.50845,588.77,2549.6,589.2,2144.2,2733.4,1.7392,5.1901,6.9293],
[150,0.47616,0.00109,0.39245,631.66,2559.1,632.2,2113.7,2745.9,1.8418,4.9953,6.8371],
[160,0.6182,0.00110,0.30678,674.79,2567.8,675.5,2081.9,2757.4,1.9426,4.8065,6.7491],
[170,0.7922,0.00111,0.24259,718.20,2575.7,719.1,2048.8,2767.9,2.0417,4.6233,6.6650],
[180,1.0028,0.00113,0.19384,761.92,2582.8,763.1,2014.1,2777.2,2.1392,4.4448,6.5840],
[190,1.2552,0.00114,0.15636,806.00,2589.0,807.4,1977.9,2785.3,2.2355,4.2704,6.5059],
[200,1.5549,0.00116,0.12721,850.47,2594.2,852.3,1939.7,2792.0,2.3305,4.0997,6.4302],
[210,1.9077,0.00117,0.10429,895.39,2598.3,897.6,1899.7,2797.3,2.4245,3.9318,6.3563],
[220,2.3196,0.00119,0.08609,940.82,2601.2,943.6,1857.3,2800.9,2.5177,3.7663,6.2840],
[230,2.7971,0.00121,0.07150,986.81,2602.9,990.2,1812.7,2802.9,2.6101,3.6027,6.2128],
[240,3.3469,0.00123,0.05971,1033.4,2603.1,1037.6,1765.4,2803.0,2.7020,3.4403,6.1423],
[250,3.9762,0.00125,0.05008,1080.8,2601.8,1085.8,1715.1,2800.9,2.7935,3.2786,6.0721],
[260,4.6923,0.00128,0.04217,1129.0,2598.7,1135.0,1661.6,2796.6,2.8849,3.1167,6.0016],
[270,5.5030,0.00130,0.03562,1178.1,2593.7,1185.3,1604.4,2789.7,2.9765,2.9539,5.9304],
[280,6.4166,0.00133,0.03015,1228.3,2586.4,1236.9,1543.0,2779.9,3.0685,2.7894,5.8579],
[290,7.4418,0.00137,0.02556,1279.9,2576.5,1290.0,1476.7,2766.7,3.1612,2.6222,5.7834],
[300,8.5879,0.00140,0.02166,1332.9,2563.6,1345.0,1404.6,2749.6,3.2552,2.4507,5.7059],
[310,9.8651,0.00145,0.01834,1387.9,2547.1,1402.2,1325.7,2727.9,3.3510,2.2734,5.6244],
[320,11.284,0.00150,0.01547,1445.3,2526.0,1462.2,1238.4,2700.6,3.4494,2.0878,5.5372],
[330,12.858,0.00156,0.01298,1505.8,2499.2,1525.9,1140.1,2666.0,3.5518,1.8904,5.4422],
[340,14.601,0.00164,0.01078,1570.6,2464.4,1594.5,1027.3,2621.8,3.6601,1.6755,5.3356],
[350,16.529,0.00174,0.00880,1642.1,2418.1,1670.9,892.7,2563.6,3.7784,1.4326,5.211],
[360,18.666,0.00190,0.00695,1726.3,2351.8,1761.7,719.8,2481.5,3.9167,1.1369,5.0536],
[370,21.044,0.00222,0.00495,1844.1,2230.3,1890.7,443.8,2334.5,4.1112,0.69,4.8012],
[373.95,22.064,0.00311,0.00311,2015.7,2015.7,2084.3,0,2084.3,4.4070,0,4.4070],
    ];

    for (var entry_i in _steam_sat) {
        let e = _steam_sat[entry_i];
        steamTable.sat_table.push({
            t: e[0] + 273, //K
            p: e[1] * 1000000, // Pa
            vf: e[2],
            vg: e[3],
            hf: 1000 * e[6], // J/kg
            hg: 1000 * e[8], // J/kg
            sf: 1000 * e[9], // J/kg
            sg: 1000 * e[11], // J/kg
        });
    }
    
    let _superheat = {
        10000: [
            [50,14.87,2443.3,2592.0,8.174],
[100,17.20,2515.5,2687.5,8.449],
[150,19.51,2587.9,2783.0,8.689],
[200,21.83,2661.3,2879.6,8.905],
[250,24.14,2736.1,2977.4,9.102],
[300,26.45,2812.3,3076.7,9.283],
[350,28.76,2890.0,3177.5,9.451],
[400,31.06,2969.3,3279.9,9.609],
[450,33.37,3050.3,3384.0,9.758],
[500,35.68,3132.9,3489.7,9.900],
[600,40.30,3303.3,3706.3,10.163],
[700,44.91,3480.8,3929.9,10.406],
[800,49.53,3665.3,4160.6,10.631],
[900,54.14,3856.9,4398.3,10.843],
[1000,58.76,4055.2,4642.8,11.043]],
        200000: [
            [150,0.9599,2577.1,2769.1,7.281],
[200,1.0805,2654.6,2870.7,7.508],
[250,1.1989,2731.4,2971.2,7.710],
[300,1.3162,2808.8,3072.1,7.894],
[350,1.4330,2887.3,3173.9,8.064],
[400,1.5493,2967.1,3277.0,8.224],
[450,1.6655,3048.5,3381.6,8.373],
[500,1.7814,3131.4,3487.7,8.515],
[600,2.0130,3302.2,3704.8,8.779],
[700,2.2443,3479.9,3928.8,9.022],
[800,2.4755,3664.7,4159.8,9.248],
[900,2.7066,3856.3,4397.6,9.460],
[1000,2.9375,4054.8,4642.3,9.660]],
        500000: [
            [200,0.4250,2643.3,2855.8,7.061],
[250,0.4744,2723.8,2961.0,7.272],
[300,0.5226,2803.2,3064.6,7.461],
[350,0.5702,2883.0,3168.1,7.635],
[400,0.6173,2963.7,3272.3,7.796],
[450,0.6642,3045.6,3377.7,7.947],
[500,0.7109,3129.0,3484.5,8.089],
[600,0.8041,3300.4,3702.5,8.354],
[700,0.8970,3478.5,3927.0,8.598],
[800,0.9897,3663.6,4158.4,8.824],
[900,1.0823,3855.4,4396.6,9.036],
[1000,1.1748,4054.0,4641.4,9.236]],
        1000000: [
            [200,0.2060,2622.2,2828.3,6.696],
[250,0.2328,2710.4,2943.1,6.927],
[300,0.2580,2793.6,3051.6,7.125],
[350,0.2825,2875.7,3158.2,7.303],
[400,0.3066,2957.9,3264.5,7.467],
[450,0.3305,3040.9,3371.3,7.620],
[500,0.3541,3125.0,3479.1,7.764],
[600,0.4011,3297.5,3698.6,8.031],
[700,0.4478,3476.2,3924.1,8.276],
[800,0.4944,3661.7,4156.1,8.502],
[900,0.5408,3853.9,4394.8,8.715],
[1000,0.5872,4052.7,4639.9,8.916]],
        1600000: [
            [225,0.1329,2645.1,2857.8,6.554],
[250,0.1419,2692.9,2919.9,6.675],
[300,0.1587,2781.6,3035.4,6.886],
[350,0.1746,2866.6,3146.0,7.071],
[400,0.1901,2950.7,3254.9,7.239],
[450,0.2053,3035.0,3363.5,7.395],
[500,0.2203,3120.1,3472.6,7.541],
[600,0.2500,3293.9,3693.9,7.810],
[700,0.2794,3473.5,3920.5,8.056],
[800,0.3087,3659.5,4153.3,8.283],
[900,0.3378,3852.1,4392.6,8.497],
[1000,0.3669,4051.2,4638.2,8.697]],
        2500000: [
            [250,0.0871,2663.3,2880.9,6.411],
[300,0.0989,2762.2,3009.6,6.646],
[350,0.1098,2852.5,3127.0,6.842],
[400,0.1201,2939.8,3240.1,7.017],
[450,0.1302,3026.2,3351.6,7.177],
[500,0.1400,3112.8,3462.7,7.325],
[600,0.1593,3288.5,3686.8,7.598],
[700,0.1784,3469.3,3915.2,7.846],
[800,0.1972,3656.2,4149.2,8.074],
[900,0.2160,3849.4,4389.3,8.288],
[1000,0.2347,4048.9,4635.6,8.490]],
        4000000: [
            [275,0.0546,2668.9,2887.3,6.231],
[300,0.0589,2726.2,2961.7,6.364],
[350,0.0665,2827.4,3093.3,6.584],
[400,0.0734,2920.7,3214.5,6.771],
[450,0.0800,3011.0,3331.2,6.939],
[500,0.0864,3100.3,3446.0,7.092],
[600,0.0989,3279.4,3674.9,7.371],
[700,0.1110,3462.4,3906.3,7.621],
[800,0.1229,3650.6,4142.3,7.852],
[900,0.1348,3844.8,4383.9,8.067],
[1000,0.1465,4045.1,4631.2,8.270]],
        6000000: [
            [300,0.0362,2668.4,2885.5,6.070],
[350,0.0423,2790.4,3043.9,6.336],
[400,0.0474,2893.7,3178.2,6.543],
[450,0.0522,2989.9,3302.9,6.722],
[500,0.0567,3083.1,3423.1,6.883],
[600,0.0653,3267.2,3658.7,7.169],
[700,0.0736,3453.0,3894.3,7.425],
[800,0.0817,3643.2,4133.1,7.658],
[900,0.0896,3838.8,4376.6,7.875],
[1000,0.0976,4040.1,4625.4,8.079]],
        9000000: [
            [350,0.0258,2724.9,2957.3,6.038],
[400,0.0300,2849.2,3118.8,6.288],
[450,0.0335,2956.3,3258.0,6.487],
[500,0.0368,3056.3,3387.4,6.660],
[600,0.0429,3248.4,3634.1,6.961],
[700,0.0486,3438.8,3876.1,7.223],
[800,0.0541,3632.0,4119.1,7.461],
[900,0.0596,3829.6,4365.7,7.680],
[1000,0.0649,4032.4,4616.7,7.886]],
        15000000: [
            [375,0.0139,2650.4,2858.9,5.705],
[400,0.0157,2740.6,2975.7,5.882],
[450,0.0185,2880.7,3157.9,6.143],
[500,0.0208,2998.4,3310.8,6.348],
[600,0.0249,3209.3,3583.1,6.680],
[700,0.0286,3409.8,3839.1,6.957],
[800,0.0321,3609.2,4091.1,7.204],
[900,0.0355,3811.2,4343.7,7.429],
[1000,0.0388,4017.1,4599.2,7.638]],
        25000000: [
            [375,0.00196,1799.9,1849.4,4.034],
[400,0.00601,2428.5,2578.6,5.140],
[450,0.00918,2721.2,2950.6,5.676],
[500,0.01114,2887.3,3165.9,5.964],
[600,0.01414,3140.0,3493.5,6.364],
[700,0.01664,3359.9,3776.0,6.670],
[800,0.01892,3570.7,4043.8,6.932],
[900,0.02108,3780.2,4307.1,7.167],
[1000,0.02315,3991.5,4570.2,7.382]]
    };
    
    for (var entry_i in _superheat) {
        let e = _superheat[entry_i];
        
        steamTable.sheat_table[entry_i] = $.map(e, function(data) {
            return {
                t: 273 + data[0],
                v: data[1],
                h: 1000 * data[3],
                s: 1000 * data[4],
            };
        });
    }
}

FixSteamTables();