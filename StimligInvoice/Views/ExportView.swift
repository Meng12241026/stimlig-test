import SwiftUI
import SwiftData
import MessageUI

struct ExportView: View {
    @Query(sort: \Invoice.date) private var invoices: [Invoice]

    @State private var csvURL: URL?
    @State private var showingMail = false
    @State private var showingShare = false
    @State private var alertMessage: String?

    private let exporter = CSVExporter()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    summaryHeader

                    actionCard(
                        icon: "envelope.fill",
                        title: "寄到 Email",
                        subtitle: "用內建 Mail 寄出 CSV 附檔，可寄給自己或會計"
                    ) {
                        prepareCSVAndPresent { showingMail = true }
                    }
                    .disabled(invoices.isEmpty)

                    actionCard(
                        icon: "icloud.and.arrow.up.fill",
                        title: "同步到雲端 / 試算表",
                        subtitle: "透過 iOS 分享：iCloud Drive、Google Drive、Numbers、Sheets…"
                    ) {
                        prepareCSVAndPresent { showingShare = true }
                    }
                    .disabled(invoices.isEmpty)

                    if invoices.isEmpty {
                        Text("還沒有任何發票，請先去掃描幾張")
                            .foregroundStyle(.secondary)
                            .padding(.top, 24)
                    }
                }
                .padding()
            }
            .navigationTitle("匯出")
            .sheet(isPresented: $showingMail) {
                if MailComposer.canSendMail {
                    MailComposer(
                        subject: "發票 CSV \(today)",
                        body: "附上 \(invoices.count) 張發票，總金額 $\(formatted(grandTotal))。",
                        attachmentURL: csvURL,
                        onFinish: { _ in showingMail = false }
                    )
                } else {
                    VStack(spacing: 16) {
                        Text("這台裝置沒有設定 Mail 帳號")
                            .font(.headline)
                        Text("請先在「設定 → Mail」加入帳號，或改用「同步到雲端 / 試算表」。")
                            .multilineTextAlignment(.center)
                            .foregroundStyle(.secondary)
                        Button("關閉") { showingMail = false }
                            .buttonStyle(.borderedProminent)
                    }
                    .padding()
                }
            }
            .sheet(isPresented: $showingShare) {
                if let url = csvURL {
                    ShareSheet(items: [url])
                }
            }
            .alert("匯出失敗", isPresented: alertBinding) {
                Button("知道了", role: .cancel) { alertMessage = nil }
            } message: {
                Text(alertMessage ?? "")
            }
        }
    }

    private var summaryHeader: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("即將匯出")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            HStack(alignment: .firstTextBaseline) {
                Text("\(invoices.count)")
                    .font(.system(size: 36, weight: .bold).monospacedDigit())
                Text("張發票")
                    .foregroundStyle(.secondary)
                Spacer()
                Text("$\(formatted(grandTotal))")
                    .font(.title3.monospacedDigit())
                    .fontWeight(.semibold)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }

    private func actionCard(
        icon: String,
        title: String,
        subtitle: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.title)
                    .frame(width: 44, height: 44)
                    .background(.tint.opacity(0.15), in: Circle())
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline)
                        .foregroundStyle(.primary)
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.leading)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundStyle(.secondary)
            }
            .padding()
            .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
    }

    private var grandTotal: Decimal {
        invoices.reduce(0) { $0 + $1.totalAmount }
    }

    private var today: String {
        CSVExporter.dateFormatter.string(from: .now)
    }

    private var alertBinding: Binding<Bool> {
        Binding(get: { alertMessage != nil }, set: { if !$0 { alertMessage = nil } })
    }

    private func prepareCSVAndPresent(_ present: () -> Void) {
        do {
            csvURL = try exporter.writeCSV(invoices: invoices)
            present()
        } catch {
            alertMessage = error.localizedDescription
        }
    }

    private func formatted(_ value: Decimal) -> String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.maximumFractionDigits = 0
        return f.string(from: NSDecimalNumber(decimal: value)) ?? "0"
    }
}

#Preview {
    ExportView()
        .modelContainer(DataController.makeContainer(inMemory: true))
}
