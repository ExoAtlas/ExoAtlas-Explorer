// planetdata.js

// Define J2000 epoch timestamp in milliseconds
const J2000_TIMESTAMP = new Date(Date.UTC(2000, 0, 1, 12, 0, 0)).getTime();

export const planetsData = [
    {
        ID: '00000199',
        name: 'Mercury',
        radius: 2440.5/1000, //radius in km
        texture: './textures/mercury/mercury_texture_4k.jpg',
        keplerianElements: {
            a: 0.38709893, // Semi-major axis in AU
            e: 0.20563069, // Eccentricity
            i: 7.00487, // Inclination in deg
            Ω: 48.33167, // Longitude of ascending node in deg
            ω: 77.45645, // Argument of perihelion in deg
            M0: 126.46272, // Mean anomaly at epoch in deg
            t0: J2000_TIMESTAMP, // J2000 epoch time in seconds
        },
        position: [],  // y, z, x
        //rotationalspeed: 4, 
    },
    {
        ID: '00000299',
        name: 'Venus',
        radius: 6051.8/1000, //radius in km
        texture: './textures/venus/venus_texture_4k.jpg',
        keplerianElements: {
            a: 0.72333199, // Semi-major axis in AU
            e: 0.00677323, // Eccentricity
            i: 3.39471, // Inclination in deg
            Ω: 76.68069, // Longitude of ascending node in deg
            ω: 131.53298, // Argument of perihelion in deg
            M0: 333.76606, // Mean anomaly at epoch in deg
            t0: J2000_TIMESTAMP, // J2000 epoch time in deg
        },
        position: [],  // y, z, x
        //rotationalspeed: 4, 
    },
    {
        ID: '00000399',
        name: 'Earth',
        radius: 6378.137/1000, //radius in km
        texture: './textures/earth/earth_texture_5k.jpg',
        keplerianElements: {
            a: 1.00000011, // Semi-major axis in AU
            e: 0.01671022, // Eccentricity
            i: 0.00005, // Inclination in deg
            Ω: -11.26064, // Longitude of ascending node in deg
            ω: 102.94719, // Argument of perihelion in deg
            M0: 8.7778, // Mean anomaly at epoch in deg
            t0: J2000_TIMESTAMP, // J2000 epoch time in deg
        },
        position: [],  // y, z, x
        //rotationalspeed: 4, 
    },
    {
        ID: '00000499',
        name: 'Mars',
        radius: 3396.2/1000, //radius in km
        texture: './textures/mars/mars_texture_12k.jpg',
        keplerianElements: {
            a: 1.52366231, // Semi-major axis in AU
            e: 0.09341233, // Eccentricity
            i: 1.85061, // Inclination in deg
            Ω: 49.57854, // Longitude of ascending node in deg
            ω: 336.04084, // Argument of perihelion in deg
            M0: 329.83394, // Mean anomaly at epoch in deg
            t0: J2000_TIMESTAMP, // J2000 epoch time in deg
        },
        position: [],  // y, z, x
        //rotationalspeed: 4, 
    },
    {
        ID: '00000599',
        name: 'Jupiter',
        radius: 71492/1000, //radius in km
        texture: './textures/mars/mars_texture_12k.jpg',
        keplerianElements: {
            a: 5.20336301, // Semi-major axis in AU
            e: 0.04839266, // Eccentricity
            i: 1.30530, // Inclination in deg
            Ω: 100.55615, // Longitude of ascending node in deg
            ω: 14.75385, // Argument of perihelion in deg
            M0: 279.09438, // Mean anomaly at epoch in deg
            t0: J2000_TIMESTAMP, // J2000 epoch time in seconds
        },
        position: [],  // y, z, x
        //rotationalspeed: 4, 
    },
    {
        ID: '00000699',
        name: 'Saturn',
        radius: 60268/1000, //radius in km
        texture: './textures/mars/mars_texture_12k.jpg',
        keplerianElements: {
            a: 9.53707032, // Semi-major axis in AU
            e: 0.05415060, // Eccentricity
            i: 2.48446, // Inclination in deg
            Ω: 113.71504, // Longitude of ascending node in deg
            ω: 92.43194, // Argument of perihelion in deg
            M0: 203.79734, // Mean anomaly at epoch in deg
            t0: J2000_TIMESTAMP, // J2000 epoch time in seconds
        },
        position: [],  // y, z, x
        //rotationalspeed: 4, 
    },
    {
        ID: '00000799',
        name: 'Uranus',
        radius: 25559/1000, //radius in km
        texture: './textures/mars/mars_texture_12k.jpg',
        keplerianElements: {
            a: 19.19126393, // Semi-major axis in AU
            e: 0.04716771, // Eccentricity
            i: 0.76986, // Inclination in deg
            Ω: 74.22988, // Longitude of ascending node in deg
            ω: 170.96424, // Argument of perihelion in deg
            M0: 68.03806, // Mean anomaly at epoch in deg
            t0: J2000_TIMESTAMP, // J2000 epoch time in seconds
        },
        position: [],  // y, z, x
        //rotationalspeed: 4, 
    },
    {
        ID: '00000899',
        name: 'Neptune',
        radius: 24764/1000, //radius in km
        texture: './textures/mars/mars_texture_12k.jpg',
        keplerianElements: {
            a: 30.06896348, // Semi-major axis in AU
            e: 0.00858587, // Eccentricity
            i: 1.76917, // Inclination in deg
            Ω: 131.72169, // Longitude of ascending node in deg
            ω: 44.97135, // Argument of perihelion in deg
            M0: 128.18699, // Mean anomaly at epoch in deg
            t0: J2000_TIMESTAMP, // J2000 epoch time in seconds
        },
        position: [],  // y, z, x
        //rotationalspeed: 4, 
    },
    {
        ID: '00000999',
        name: 'Pluto',
        radius: 1188/1000, //radius in km
        texture: './textures/mars/mars_texture_12k.jpg',
        keplerianElements: {
            a: 39.48168677, // Semi-major axis in AU
            e: 0.24880766, // Eccentricity
            i: 17.14175, // Inclination in deg
            Ω: 110.30347, // Longitude of ascending node in deg
            ω: 224.06676, // Argument of perihelion in deg
            M0: 264.55858, // Mean anomaly at epoch in deg
            t0: J2000_TIMESTAMP, // J2000 epoch time in seconds
        },
        position: [],  // y, z, x
        //rotationalspeed: 4, 
    },
];
