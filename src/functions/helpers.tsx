export const generateId = (len) => {
    var char = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    var id = char[~~(Math.random() * char.length)]


    var p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return id + [...Array(len - 1)].reduce(a => a + p[~~(Math.random() * p.length)], '');

}