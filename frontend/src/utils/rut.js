export function calculateDV(rutBody) {
    let sum = 0;
    let multiplier = 2;

    // Iterate backwards over the digits
    for (let i = String(rutBody).length - 1; i >= 0; i--) {
        sum += parseInt(String(rutBody).charAt(i)) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = 11 - (sum % 11);

    if (remainder === 11) return '0';
    if (remainder === 10) return 'K';
    return String(remainder);
}

export function parseStudentQR(code) {
    // Check if it matches the 18-digit pattern from the examples
    // Example: 870041246420885246 -> RUT 20885246
    // Example: 870047907822456482 -> RUT 22456482
    // It seems the last 8 digits are the RUT body

    if (!code || typeof code !== 'string') return code;

    // Clean whitespace
    const cleanCode = code.trim();

    // If it's the 18-digit code
    if (cleanCode.length === 18 && /^\d+$/.test(cleanCode)) {
        // Extract the last 8 digits which seem to be the RUT body
        const rutBody = cleanCode.slice(-8);

        // Calculate DV
        const dv = calculateDV(rutBody);

        // Return formatted RUT
        return `${parseInt(rutBody)}-${dv}`;
    }

    return cleanCode;
}
