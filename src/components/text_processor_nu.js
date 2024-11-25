import translate from 'translate-google';


const textic = 'Over the weekend I decided to try out Supabase and I can say it is a tool I would be using from henceforth. Supabase is an open source firebase alternative,'

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
// const tru = await translateText(textic);
// console.log(tru)
