function mergeUniqueLists(list1, list2) {
    // Проверка пустоты списков
    if (list1.length === 0 && list2.length === 0) {
        return [];
    }

    const mergedList = [...list1]; // Создаем новый массив и копируем элементы из первого списка

    // Цикл по второму списку
    for (const item of list2) {
        // Проверяем, есть ли его версия в нижнем регистре в первом списке
        if (!mergedList.some(existingItem => existingItem.toLowerCase() === item.toLowerCase())) {
            mergedList.push(item); // Добавляем, если нет
        }
    }

    return mergedList; // Возвращаем объединенный список
}

// Пример использования
const list1 = ['Zidan Rahmandani', 'Exploit', 'Zidansec', 'CrimeFlare', 'Hacking', 'Tools', 'Osint', 'Github', 'Belajar Hacking', 'Vulnerability', 'subangXploits'];
const list2 = ['CloudFlare', 'WAF', 'Penetration Testing', 'ZidanSec'];
const result = mergeUniqueLists(list1, list2);
console.log(result);