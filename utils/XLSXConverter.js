const XLSX = require('xlsx');

let convert = (records) => {
    let worksheet = XLSX.utils.json_to_sheet(records);
    let workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'data');
    XLSX.writeFile(workbook, 'assets/sheets/sheet.xlsx');
}

module.exports = {
    convert
}