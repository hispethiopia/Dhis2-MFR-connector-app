var char = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
var p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";


export const generateId = (len) => {
    var id = char[~~(Math.random() * char.length)]
    return id + [...Array(len - 1)].reduce(a => a + p[~~(Math.random() * p.length)], '');
}


export const generatePassword = () => {
    const length = 8;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let password = "";

    // Ensure the password contains at least one uppercase letter, one lowercase letter, one number, and one special character
    const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercaseLetters = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const specialCharacters = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    // Randomly select one character from each of the required sets
    password += uppercaseLetters.charAt(Math.floor(Math.random() * uppercaseLetters.length));
    password += lowercaseLetters.charAt(Math.floor(Math.random() * lowercaseLetters.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += specialCharacters.charAt(Math.floor(Math.random() * specialCharacters.length));

    // Generate the rest of the password
    for (let i = 4; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // Shuffle the password to ensure the required characters are not always at the start
    password = password.split('').sort(() => 0.5 - Math.random()).join('');

    return password;
}

export const changeToPHCUName = (name) =>{
    return ((name).replace(/\s+/g, ' ').replace(/health center/gi, '')).trim() + "_PHCU"

}