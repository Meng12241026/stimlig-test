import Foundation
import Vision
import UIKit

/// 把發票圖片轉成原始文字行的 OCR 服務。
/// 目前使用 Apple Vision framework（離線、免費、繁中支援良好）。
/// 之後若取得 Claude API key，可在 `recognize` 內改成呼叫 Vision API。
struct InvoiceOCRService {

    enum OCRError: Error, LocalizedError {
        case invalidImage
        case recognitionFailed(String)

        var errorDescription: String? {
            switch self {
            case .invalidImage: return "圖片格式無法辨識"
            case .recognitionFailed(let msg): return "OCR 失敗：\(msg)"
            }
        }
    }

    func recognize(image: UIImage) async throws -> [String] {
        guard let cgImage = image.cgImage else {
            throw OCRError.invalidImage
        }

        return try await withCheckedThrowingContinuation { continuation in
            let request = VNRecognizeTextRequest { request, error in
                if let error {
                    continuation.resume(throwing: OCRError.recognitionFailed(error.localizedDescription))
                    return
                }
                let observations = request.results as? [VNRecognizedTextObservation] ?? []
                let lines = observations.compactMap { $0.topCandidates(1).first?.string }
                continuation.resume(returning: lines)
            }
            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true
            request.recognitionLanguages = ["zh-Hant", "zh-Hans", "en-US"]

            let handler = VNImageRequestHandler(cgImage: cgImage, orientation: .up)
            do {
                try handler.perform([request])
            } catch {
                continuation.resume(throwing: OCRError.recognitionFailed(error.localizedDescription))
            }
        }
    }
}
