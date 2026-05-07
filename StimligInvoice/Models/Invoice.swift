import Foundation
import SwiftData

@Model
final class Invoice {
    /// 發票號碼，例：AB-12345678
    var invoiceNumber: String?
    /// 開立日期
    var date: Date
    /// 賣方名稱
    var sellerName: String
    /// 賣方統編（8 碼）
    var sellerTaxID: String?
    /// 買方統編（可選）
    var buyerTaxID: String?
    /// 總金額
    var totalAmount: Decimal
    /// 稅額
    var taxAmount: Decimal?
    /// 品項描述（OCR 抽出的商品列表，以換行分隔）
    var itemsDescription: String
    /// 自動分類後的會計科目
    var categoryRaw: String
    /// 原始 OCR 文字，方便 debug 與重新分析
    var rawText: String
    /// 建立時間
    var createdAt: Date

    init(
        invoiceNumber: String? = nil,
        date: Date = .now,
        sellerName: String = "",
        sellerTaxID: String? = nil,
        buyerTaxID: String? = nil,
        totalAmount: Decimal = 0,
        taxAmount: Decimal? = nil,
        itemsDescription: String = "",
        category: AccountingCategory = .other,
        rawText: String = ""
    ) {
        self.invoiceNumber = invoiceNumber
        self.date = date
        self.sellerName = sellerName
        self.sellerTaxID = sellerTaxID
        self.buyerTaxID = buyerTaxID
        self.totalAmount = totalAmount
        self.taxAmount = taxAmount
        self.itemsDescription = itemsDescription
        self.categoryRaw = category.rawValue
        self.rawText = rawText
        self.createdAt = .now
    }

    var category: AccountingCategory {
        get { AccountingCategory(rawValue: categoryRaw) ?? .other }
        set { categoryRaw = newValue.rawValue }
    }
}
