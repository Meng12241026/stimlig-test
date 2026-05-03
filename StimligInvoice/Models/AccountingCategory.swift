import Foundation

/// 台灣中小企業常用的會計科目分類。
enum AccountingCategory: String, CaseIterable, Codable, Identifiable {
    case meals = "餐飲費"
    case transportation = "交通費"
    case officeSupplies = "文具用品"
    case utilities = "水電瓦斯"
    case communication = "通訊費"
    case purchases = "進貨"
    case rent = "租金支出"
    case repairs = "修繕費"
    case advertising = "廣告費"
    case medical = "醫療保健"
    case clothing = "服飾"
    case entertainment = "交際應酬"
    case education = "教育訓練"
    case travel = "旅運費"
    case fuel = "油料費"
    case insurance = "保險費"
    case software = "軟體訂閱"
    case books = "書報雜誌"
    case other = "其他"

    var id: String { rawValue }

    var displayName: String { rawValue }

    var icon: String {
        switch self {
        case .meals: return "fork.knife"
        case .transportation: return "tram.fill"
        case .officeSupplies: return "pencil.and.ruler"
        case .utilities: return "bolt.fill"
        case .communication: return "phone.fill"
        case .purchases: return "shippingbox.fill"
        case .rent: return "house.fill"
        case .repairs: return "wrench.and.screwdriver.fill"
        case .advertising: return "megaphone.fill"
        case .medical: return "cross.case.fill"
        case .clothing: return "tshirt.fill"
        case .entertainment: return "wineglass.fill"
        case .education: return "graduationcap.fill"
        case .travel: return "airplane"
        case .fuel: return "fuelpump.fill"
        case .insurance: return "shield.fill"
        case .software: return "app.badge.fill"
        case .books: return "book.fill"
        case .other: return "tray.fill"
        }
    }
}
