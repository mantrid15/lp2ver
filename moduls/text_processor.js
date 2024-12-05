import translate from 'translate-google';


const textic = 'Sponsor open source projects you depend on\n' +
    'Contributors are working behind the scenes to make open source better for everyone—give them the help and recognition they deserve.'
const translateText = async (text) => {
    try {
        // const res = await translate(text, { to: 'ru' });
        // console.log(res); // Вывод переведенного текста
        return await translate(text, { to: 'ru' });
    } catch (err) {
        // console.error(err);
        return 'Without translate'
    }
};
export default translateText;
// Пример использования
const tru = await translateText(textic);
console.log(tru)
