import Foundation

/// 把 Invoice 列表輸出成 CSV，可給 Email、iCloud Drive、Google Sheets 匯入。
struct CSVExporter {

    static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "zh_Hant_TW")
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    /// 產生 CSV 字串。第一行為欄位標題。
    func makeCSV(invoices: [Invoice]) -> String {
        var rows: [String] = [
            ["日期", "店家", "賣方統編", "發票號碼", "會計科目", "金額", "稅額", "品項"]
                .map(Self.escape).joined(separator: ",")
        ]
        let sorted = invoices.sorted { $0.date < $1.date }
        for inv in sorted {
            let row: [String] = [
                Self.dateFormatter.string(from: inv.date),
                inv.sellerName,
                inv.sellerTaxID ?? "",
                inv.invoiceNumber ?? "",
                inv.category.displayName,
                Self.formatAmount(inv.totalAmount),
                inv.taxAmount.map(Self.formatAmount) ?? "",
                inv.itemsDescription.replacingOccurrences(of: "\n", with: " | ")
            ]
            rows.append(row.map(Self.escape).joined(separator: ","))
        }
        return rows.joined(separator: "\r\n")
    }

    /// 寫到暫存檔並回傳 URL，方便分享 / 寄信。檔名含日期。
    func writeCSV(invoices: [Invoice]) throws -> URL {
        let csv = makeCSV(invoices: invoices)
        // 加 BOM 讓 Excel 正確顯示繁中
        let bom = "\u{FEFF}"
        let data = (bom + csv).data(using: .utf8) ?? Data()
        let filename = "invoices-\(Self.dateFormatter.string(from: .now)).csv"
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
        try data.write(to: url, options: .atomic)
        return url
    }

    // MARK: - Helpers

    private static func escape(_ field: String) -> String {
        if field.contains(",") || field.contains("\"") || field.contains("\n") {
            return "\"" + field.replacingOccurrences(of: "\"", with: "\"\"") + "\""
        }
        return field
    }

    private static func formatAmount(_ value: Decimal) -> String {
        let n = NSDecimalNumber(decimal: value)
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.minimumFractionDigits = 0
        f.maximumFractionDigits = 2
        return f.string(from: n) ?? "0"
    }
}
