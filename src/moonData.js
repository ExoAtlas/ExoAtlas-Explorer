const J2000_TIMESTAMP = new Date(Date.UTC(2000, 0, 1, 12, 0, 0)).getTime();

export const moonData = [
    {
        ID: "9999999",
        name: "Placeholder Moon",
        keplerianElements: { a: 1, e: 0, i: 0, Ω: 0, ω: 0, M0: 0, t0: J2000_TIMESTAMP },
        position: []
      }
    ];