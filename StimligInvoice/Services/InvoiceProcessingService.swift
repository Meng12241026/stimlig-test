import Foundation
import UIKit

/// 一次完成「OCR → 解析 → 分類 → 建立 Invoice」的整合服務。
struct InvoiceProcessingService {
    let ocr = InvoiceOCRService()
    let parser = TaiwanInvoiceParser()
    let classifier = CategoryClassifier()

    func process(image: UIImage) async throws -> Invoice {
        let lines = try await ocr.recognize(image: image)
        let parsed = parser.parse(lines: lines)
        let category = classifier.classify(sellerName: parsed.sellerName, items: parsed.items)

        return Invoice(
            invoiceNumber: parsed.invoiceNumber,
            date: parsed.date ?? .now,
            sellerName: parsed.sellerName,
            sellerTaxID: parsed.sellerTaxID,
            buyerTaxID: parsed.buyerTaxID,
            totalAmount: parsed.totalAmount,
            taxAmount: parsed.taxAmount,
            itemsDescription: parsed.items.joined(separator: "\n"),
            category: category,
            rawText: parsed.rawText
        )
    }
}
