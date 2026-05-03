import SwiftUI
import MessageUI
import UIKit

/// 包裝 MFMailComposeViewController，讓 SwiftUI 可以直接寄信並夾帶 CSV 附檔。
struct MailComposer: UIViewControllerRepresentable {
    let subject: String
    let body: String
    let attachmentURL: URL?
    let onFinish: (Result<MFMailComposeResult, Error>) -> Void

    static var canSendMail: Bool { MFMailComposeViewController.canSendMail() }

    func makeUIViewController(context: Context) -> MFMailComposeViewController {
        let vc = MFMailComposeViewController()
        vc.setSubject(subject)
        vc.setMessageBody(body, isHTML: false)
        vc.mailComposeDelegate = context.coordinator
        if let url = attachmentURL,
           let data = try? Data(contentsOf: url) {
            vc.addAttachmentData(data, mimeType: "text/csv", fileName: url.lastPathComponent)
        }
        return vc
    }

    func updateUIViewController(_ uiViewController: MFMailComposeViewController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(onFinish: onFinish) }

    final class Coordinator: NSObject, MFMailComposeViewControllerDelegate {
        let onFinish: (Result<MFMailComposeResult, Error>) -> Void
        init(onFinish: @escaping (Result<MFMailComposeResult, Error>) -> Void) { self.onFinish = onFinish }

        func mailComposeController(
            _ controller: MFMailComposeViewController,
            didFinishWith result: MFMailComposeResult,
            error: Error?
        ) {
            controller.dismiss(animated: true)
            if let error { onFinish(.failure(error)) }
            else { onFinish(.success(result)) }
        }
    }
}

/// UIActivityViewController 包裝，給 iCloud Drive / Google Sheets / Files 等分享用。
struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
