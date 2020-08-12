import fs from "fs";

const load = async (filename) => {
    let data = await fs.readFileSync(filename);
    return JSON.parse(data);
}

const isLoadable = (filename) => {
    let boolean = fs.existsSync(filename);
    console.log(boolean)
    return boolean;
}

module.exports = {
    load,
    isLoadable
}