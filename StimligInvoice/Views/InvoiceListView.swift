import SwiftUI
import SwiftData

struct InvoiceListView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Invoice.date, order: .reverse) private var invoices: [Invoice]
    @State private var showingScanner = false

    var body: some View {
        NavigationStack {
            Group {
                if invoices.isEmpty {
                    emptyState
                } else {
                    list
                }
            }
            .navigationTitle("發票")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingScanner = true
                    } label: {
                        Label("掃描", systemImage: "plus.viewfinder")
                    }
                }
            }
            .sheet(isPresented: $showingScanner) {
                ScanFlowView()
            }
        }
    }

    private var list: some View {
        List {
            ForEach(invoices) { invoice in
                NavigationLink {
                    InvoiceEditorView(invoice: invoice) {}
                        .navigationTitle("編輯發票")
                        .navigationBarTitleDisplayMode(.inline)
                } label: {
                    InvoiceRow(invoice: invoice)
                }
            }
            .onDelete(perform: delete)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "tray")
                .font(.system(size: 56))
                .foregroundStyle(.secondary)
            Text("還沒有任何發票")
                .font(.headline)
            Text("按右上角的 + 開始掃描")
                .foregroundStyle(.secondary)
            Button {
                showingScanner = true
            } label: {
                Label("掃描第一張", systemImage: "doc.viewfinder")
            }
            .buttonStyle(.borderedProminent)
            .padding(.top, 8)
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func delete(at offsets: IndexSet) {
        for i in offsets { context.delete(invoices[i]) }
        try? context.save()
    }
}

struct InvoiceRow: View {
    let invoice: Invoice

    static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "zh_Hant_TW")
        f.dateFormat = "MM/dd"
        return f
    }()

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: invoice.category.icon)
                .font(.title2)
                .frame(width: 36, height: 36)
                .background(.tint.opacity(0.15), in: Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(invoice.sellerName.isEmpty ? "（未命名店家）" : invoice.sellerName)
                    .font(.body)
                    .lineLimit(1)
                HStack(spacing: 6) {
                    Text(invoice.category.displayName)
                    Text("·")
                    Text(Self.dateFormatter.string(from: invoice.date))
                }
                .font(.caption)
                .foregroundStyle(.secondary)
            }
            Spacer()
            Text("$\(formatted(invoice.totalAmount))")
                .font(.body.monospacedDigit())
                .fontWeight(.medium)
        }
        .padding(.vertical, 4)
    }

    private func formatted(_ value: Decimal) -> String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.maximumFractionDigits = 0
        return f.string(from: NSDecimalNumber(decimal: value)) ?? "0"
    }
}

#Preview {
    InvoiceListView()
        .modelContainer(DataController.makeContainer(inMemory: true))
}
