// 依店家名稱與品項關鍵字，自動歸類到台灣常用會計科目。
// 命中關鍵字越長，分數越高。

const RULES = {
  meals: ['餐廳', '小吃', '便當', '麵', '飯', '鍋', '咖啡', 'Coffee', 'Cafe', 'café',
          '茶', '飲', '麥當勞', '肯德基', '星巴克', '路易莎', '85度C', '85度c', 'Pizza',
          '披薩', '涮涮', '燒肉', '壽司', '拉麵', '牛排', '夜市', '早餐', '午餐', '晚餐',
          '雞排', '手搖', '珍珠', '鹹酥雞', '炸雞', '便利商店', '7-11', '全家', '萊爾富',
          '美廉', 'OK超商'],
  transportation: ['計程車', 'Uber', '高鐵', '台鐵', '捷運', '客運', '公車', '停車',
                   '悠遊卡', '一卡通', 'iPASS', 'ETC', '遠通', 'Taxi', '車資', '票價',
                   'MRT', 'HSR', 'TRA'],
  fuel: ['加油', '中油', '台塑', '汽油', '柴油', '油資', 'Gasoline', '98', '95', '92'],
  officeSupplies: ['文具', '金石堂', '誠品', '墨水', '原子筆', '紙', '夾', '釘書',
                   '資料夾', '墨匣', '碳粉', '影印', '列印', '辦公'],
  utilities: ['台電', '自來水', '瓦斯', '水費', '電費', '天然氣', '欣湖', '欣欣'],
  communication: ['中華電信', '遠傳', '台灣大哥大', '亞太', '電信', '網路費', '光纖',
                  'MOD', '上網費', '通信費'],
  purchases: ['進貨', '批發', '原料', '零件', '材料', '貨款'],
  rent: ['房租', '租金', '押金', '管理費'],
  repairs: ['維修', '修理', '保養', '更換', '服務廠'],
  advertising: ['廣告', 'Facebook', 'Google Ads', 'Meta', '投放', '行銷', '推廣'],
  medical: ['藥局', '藥房', '診所', '醫院', '牙醫', '中醫', '藥品', '口罩',
            '屈臣氏', '康是美', '大樹', '丁丁'],
  clothing: ['UNIQLO', 'ZARA', 'GU', 'NET', 'Net', '服飾', '衣', '鞋', 'Nike',
             'Adidas', 'lativ', 'PAZZO', '百貨'],
  entertainment: ['KTV', '酒', '啤酒', '紅酒', '錢櫃', '好樂迪', '電影', '威秀', '影城'],
  education: ['補習', '課程', '訓練', '研習', '學費', 'Coursera', 'Udemy'],
  travel: ['旅館', '飯店', '民宿', 'Hotel', 'Airbnb', 'Booking', 'Agoda',
           '機票', '華航', '長榮', '星宇'],
  insurance: ['保險', '國泰', '南山', '富邦人壽', '新光人壽', '保費'],
  software: ['Apple', 'iCloud', 'Google', 'Adobe', 'Microsoft', 'Office', '訂閱',
             'Netflix', 'Spotify', 'YouTube Premium', 'Notion', 'Figma',
             'ChatGPT', 'Claude'],
  books: ['書', '雜誌', '報紙', '讀冊', '博客來'],
};

export function classify(sellerName, items = []) {
  const haystack = [sellerName, ...items].join(' ').toLowerCase();
  const scores = {};
  for (const [category, keywords] of Object.entries(RULES)) {
    for (const kw of keywords) {
      if (haystack.includes(kw.toLowerCase())) {
        scores[category] = (scores[category] || 0) + kw.length;
      }
    }
  }
  let best = 'other';
  let bestScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > bestScore) {
      best = cat;
      bestScore = score;
    }
  }
  return best;
}
