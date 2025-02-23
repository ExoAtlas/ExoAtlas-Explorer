// Constants for J2000 epoch
const J2000_EPOCH = new Date(Date.UTC(2000, 0, 1, 12, 0, 0)); 
const MS_PER_DAY = 86400000; 

export function ΔJ2000(t = new Date().getTime()) {
    const timeDifference = t - J2000_EPOCH.getTime(); 
    const daysSinceJ2000 = timeDifference / MS_PER_DAY; 
    //console.log("Current J2000 Epoch Fraction: " + daysSinceJ2000);
    return daysSinceJ2000;
}

//function ΔJ2000rounded() {
    //const currentJ2000Fraction = ΔJ2000();
    //const roundedJ2000FractionEpoch = currentJ2000Fraction.toFixed(5);    
    // Log the value to the console
    //console.log("Current J2000 Epoch Fraction: " + roundedJ2000FractionEpoch);
    //return roundedJ2000FractionEpoch
//}

// Automatically update J2000 epoch fraction on page load
//updateJ2000Epoch();


//ΔJ2000()


