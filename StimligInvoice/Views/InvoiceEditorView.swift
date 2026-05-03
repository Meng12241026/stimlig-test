import SwiftUI

/// 顯示 OCR 解析後的草稿，使用者可調整任一欄位再儲存。
struct InvoiceEditorView: View {
    @Bindable var invoice: Invoice
    var onSave: () -> Void

    var body: some View {
        Form {
            Section("基本資訊") {
                TextField("店家", text: $invoice.sellerName)
                DatePicker("日期", selection: $invoice.date, displayedComponents: .date)
                amountField("金額", value: Binding(
                    get: { invoice.totalAmount },
                    set: { invoice.totalAmount = $0 }
                ))
                amountField("稅額（可空）", value: Binding(
                    get: { invoice.taxAmount ?? 0 },
                    set: { invoice.taxAmount = $0 == 0 ? nil : $0 }
                ))
            }

            Section("發票") {
                TextField("發票號碼", text: stringBinding(\.invoiceNumber))
                TextField("賣方統編", text: stringBinding(\.sellerTaxID))
                    .keyboardType(.numberPad)
                TextField("買方統編", text: stringBinding(\.buyerTaxID))
                    .keyboardType(.numberPad)
            }

            Section("會計科目") {
                Picker("科目", selection: $invoice.category) {
                    ForEach(AccountingCategory.allCases) { c in
                        Label(c.displayName, systemImage: c.icon).tag(c)
                    }
                }
                .pickerStyle(.menu)
            }

            Section("品項") {
                TextEditor(text: $invoice.itemsDescription)
                    .frame(minHeight: 80)
            }

            Section {
                Button {
                    onSave()
                } label: {
                    Text("儲存發票")
                        .frame(maxWidth: .infinity)
                        .fontWeight(.semibold)
                }
                .buttonStyle(.borderedProminent)
            }
        }
    }

    private func stringBinding(_ keyPath: ReferenceWritableKeyPath<Invoice, String?>) -> Binding<String> {
        Binding(
            get: { invoice[keyPath: keyPath] ?? "" },
            set: { invoice[keyPath: keyPath] = $0.isEmpty ? nil : $0 }
        )
    }

    @ViewBuilder
    private func amountField(_ title: String, value: Binding<Decimal>) -> some View {
        HStack {
            Text(title)
            Spacer()
            TextField("0", value: value, format: .number)
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
        }
    }
}
