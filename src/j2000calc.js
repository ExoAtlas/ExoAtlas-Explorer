// Constants for J2000 epoch
const J2000_EPOCH = new Date(Date.UTC(2000, 0, 1, 12, 0, 0)); 
const MS_PER_DAY = 86400000; 

export function ΔJ2000(t = new Date().getTime()) {
    const timeDifference = t - J2000_EPOCH.getTime(); 
    const daysSinceJ2000 = timeDifference / MS_PER_DAY; 
    //console.log("Current J2000 Epoch Fraction: " + daysSinceJ2000);
    return daysSinceJ2000;
}


