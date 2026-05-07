import Foundation

/// 解析 OCR 抽出的文字行，套用台灣統一發票常見格式抽出結構化欄位。
/// 主要規則：
/// - 發票號碼：兩個英文字母 + 8 碼數字（可能有 `-` 或空白）
/// - 統一編號：8 碼數字
/// - 日期：民國年（114/01/15）或西元年（2025/01/15、2025-01-15）
/// - 金額：包含「總計」「合計」「應付」「TOTAL」等關鍵字之列
struct ParsedInvoice {
    var invoiceNumber: String?
    var date: Date?
    var sellerName: String
    var sellerTaxID: String?
    var buyerTaxID: String?
    var totalAmount: Decimal
    var taxAmount: Decimal?
    var items: [String]
    var rawText: String
}

struct TaiwanInvoiceParser {

    private static let invoiceNumberPattern = #"([A-Z]{2})[\s\-]?(\d{8})"#
    private static let taxIDPattern = #"(?<![\d])(\d{8})(?![\d])"#
    private static let rocDatePattern = #"(\d{2,3})[/\-\.年](\d{1,2})[/\-\.月](\d{1,2})"#
    private static let adDatePattern = #"(20\d{2})[/\-\.年](\d{1,2})[/\-\.月](\d{1,2})"#
    private static let amountPattern = #"([\d,]+(?:\.\d+)?)"#
    private static let totalKeywords = ["總計", "合計", "應付", "應收", "總額", "TOTAL", "Total", "金額"]
    private static let taxKeywords = ["稅額", "營業稅", "TAX"]
    private static let sellerKeywords = ["賣方", "店家", "店名"]
    private static let buyerKeywords = ["買方", "客戶"]

    func parse(lines: [String]) -> ParsedInvoice {
        let trimmed = lines.map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        let raw = trimmed.joined(separator: "\n")

        let invoiceNumber = Self.extractInvoiceNumber(from: trimmed)
        let date = Self.extractDate(from: trimmed)
        let (sellerTaxID, buyerTaxID) = Self.extractTaxIDs(from: trimmed)
        let total = Self.extractAmount(from: trimmed, keywords: Self.totalKeywords) ?? 0
        let tax = Self.extractAmount(from: trimmed, keywords: Self.taxKeywords)
        let seller = Self.extractSellerName(from: trimmed, sellerTaxID: sellerTaxID)
        let items = Self.extractItems(from: trimmed)

        return ParsedInvoice(
            invoiceNumber: invoiceNumber,
            date: date,
            sellerName: seller,
            sellerTaxID: sellerTaxID,
            buyerTaxID: buyerTaxID,
            totalAmount: total,
            taxAmount: tax,
            items: items,
            rawText: raw
        )
    }

    // MARK: - 發票號碼

    private static func extractInvoiceNumber(from lines: [String]) -> String? {
        let regex = try? NSRegularExpression(pattern: invoiceNumberPattern)
        for line in lines {
            let range = NSRange(line.startIndex..., in: line)
            if let m = regex?.firstMatch(in: line, range: range),
               let letters = Range(m.range(at: 1), in: line),
               let digits = Range(m.range(at: 2), in: line) {
                return "\(line[letters])-\(line[digits])"
            }
        }
        return nil
    }

    // MARK: - 日期

    private static func extractDate(from lines: [String]) -> Date? {
        let calendar = Calendar(identifier: .gregorian)
        let adRegex = try? NSRegularExpression(pattern: adDatePattern)
        let rocRegex = try? NSRegularExpression(pattern: rocDatePattern)

        for line in lines {
            let range = NSRange(line.startIndex..., in: line)
            if let m = adRegex?.firstMatch(in: line, range: range),
               let y = Range(m.range(at: 1), in: line),
               let mo = Range(m.range(at: 2), in: line),
               let d = Range(m.range(at: 3), in: line),
               let year = Int(line[y]), let month = Int(line[mo]), let day = Int(line[d]) {
                var c = DateComponents(); c.year = year; c.month = month; c.day = day
                if let date = calendar.date(from: c) { return date }
            }
        }
        for line in lines {
            let range = NSRange(line.startIndex..., in: line)
            if let m = rocRegex?.firstMatch(in: line, range: range),
               let y = Range(m.range(at: 1), in: line),
               let mo = Range(m.range(at: 2), in: line),
               let d = Range(m.range(at: 3), in: line),
               let rocYear = Int(line[y]), let month = Int(line[mo]), let day = Int(line[d]),
               rocYear < 200 {
                var c = DateComponents(); c.year = rocYear + 1911; c.month = month; c.day = day
                if let date = calendar.date(from: c) { return date }
            }
        }
        return nil
    }

    // MARK: - 統一編號

    private static func extractTaxIDs(from lines: [String]) -> (seller: String?, buyer: String?) {
        var found: [(line: String, id: String)] = []
        let regex = try? NSRegularExpression(pattern: taxIDPattern)
        for line in lines {
            let range = NSRange(line.startIndex..., in: line)
            regex?.enumerateMatches(in: line, range: range) { match, _, _ in
                if let m = match, let r = Range(m.range(at: 1), in: line) {
                    found.append((line, String(line[r])))
                }
            }
        }

        var seller: String?
        var buyer: String?
        for entry in found {
            if Self.totalKeywords.allSatisfy({ !entry.line.contains($0) }) {
                if buyerKeywords.contains(where: { entry.line.contains($0) }) {
                    buyer = entry.id
                } else if sellerKeywords.contains(where: { entry.line.contains($0) }) {
                    seller = entry.id
                }
            }
        }
        // fallback：第一個當賣方，第二個當買方
        let unique = Array(NSOrderedSet(array: found.map { $0.id })) as? [String] ?? []
        if seller == nil { seller = unique.first }
        if buyer == nil, unique.count > 1 { buyer = unique[1] }
        return (seller, buyer)
    }

    // MARK: - 金額

    private static func extractAmount(from lines: [String], keywords: [String]) -> Decimal? {
        let regex = try? NSRegularExpression(pattern: amountPattern)
        var candidates: [Decimal] = []
        for line in lines where keywords.contains(where: { line.localizedCaseInsensitiveContains($0) }) {
            let range = NSRange(line.startIndex..., in: line)
            regex?.enumerateMatches(in: line, range: range) { match, _, _ in
                if let m = match, let r = Range(m.range(at: 1), in: line) {
                    let cleaned = line[r].replacingOccurrences(of: ",", with: "")
                    if let d = Decimal(string: cleaned) { candidates.append(d) }
                }
            }
        }
        return candidates.max()
    }

    // MARK: - 賣方店家名稱

    private static func extractSellerName(from lines: [String], sellerTaxID: String?) -> String {
        // 優先：有「賣方/店名」關鍵字的同一行
        for line in lines {
            for kw in sellerKeywords where line.contains(kw) {
                let cleaned = line
                    .replacingOccurrences(of: kw, with: "")
                    .replacingOccurrences(of: ":", with: "")
                    .replacingOccurrences(of: "：", with: "")
                    .trimmingCharacters(in: .whitespaces)
                if !cleaned.isEmpty { return cleaned }
            }
        }
        // 其次：賣方統編所在行去掉數字
        if let id = sellerTaxID, let line = lines.first(where: { $0.contains(id) }) {
            let cleaned = line.replacingOccurrences(of: id, with: "")
                .replacingOccurrences(of: "統一編號", with: "")
                .replacingOccurrences(of: "統編", with: "")
                .trimmingCharacters(in: .whitespacesAndNewlines)
            if !cleaned.isEmpty { return cleaned }
        }
        // 最後：找含中文的第一行（通常是抬頭店名）
        for line in lines {
            if line.contains(where: { $0.unicodeScalars.contains(where: { 0x4E00...0x9FFF ~= $0.value }) }),
               !line.contains("發票"), !line.contains("號") {
                return line
            }
        }
        return lines.first ?? ""
    }

    // MARK: - 品項

    /// 抓出可能的品項列：通常含金額但不是總計/稅額/統編行。
    private static func extractItems(from lines: [String]) -> [String] {
        let amountRegex = try? NSRegularExpression(pattern: amountPattern)
        let exclude: Set<String> = ["發票", "統一編號", "統編", "電話", "TEL", "地址", "ADDRESS"]
        return lines.filter { line in
            guard amountRegex?.firstMatch(in: line, range: NSRange(line.startIndex..., in: line)) != nil else {
                return false
            }
            if totalKeywords.contains(where: { line.contains($0) }) { return false }
            if taxKeywords.contains(where: { line.contains($0) }) { return false }
            if exclude.contains(where: { line.contains($0) }) { return false }
            // 排除純粹的統編（8 碼數字）
            let digitsOnly = line.filter { $0.isNumber }
            if digitsOnly.count == 8, line.filter({ !$0.isNumber && !$0.isWhitespace }).isEmpty {
                return false
            }
            return true
        }
    }
}
