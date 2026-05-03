import SwiftUI
import SwiftData
import Charts

struct StatsView: View {
    @Query(sort: \Invoice.date) private var invoices: [Invoice]
    @State private var selectedRange: DateRange = .month

    enum DateRange: String, CaseIterable, Identifiable {
        case week = "本週"
        case month = "本月"
        case year = "本年"
        case all = "全部"
        var id: String { rawValue }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Picker("區間", selection: $selectedRange) {
                        ForEach(DateRange.allCases) { Text($0.rawValue).tag($0) }
                    }
                    .pickerStyle(.segmented)

                    summaryCard
                    chartCard
                    breakdownCard
                }
                .padding()
            }
            .navigationTitle("統計")
        }
    }

    // MARK: - Filtering

    private var filtered: [Invoice] {
        let now = Date()
        let cal = Calendar.current
        let start: Date? = {
            switch selectedRange {
            case .week: return cal.date(byAdding: .day, value: -7, to: now)
            case .month: return cal.date(byAdding: .month, value: -1, to: now)
            case .year: return cal.date(byAdding: .year, value: -1, to: now)
            case .all: return nil
            }
        }()
        guard let start else { return invoices }
        return invoices.filter { $0.date >= start }
    }

    private var totalsByCategory: [(category: AccountingCategory, total: Decimal)] {
        var map: [AccountingCategory: Decimal] = [:]
        for inv in filtered { map[inv.category, default: 0] += inv.totalAmount }
        return map.map { ($0.key, $0.value) }
            .sorted { $0.total > $1.total }
    }

    private var grandTotal: Decimal {
        filtered.reduce(0) { $0 + $1.totalAmount }
    }

    // MARK: - Cards

    private var summaryCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("總支出")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text("$\(format(grandTotal))")
                .font(.system(size: 36, weight: .bold).monospacedDigit())
            Text("\(filtered.count) 張發票")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }

    @ViewBuilder
    private var chartCard: some View {
        if !totalsByCategory.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                Text("科目分佈").font(.headline)
                Chart(totalsByCategory, id: \.category) { item in
                    SectorMark(
                        angle: .value("金額", NSDecimalNumber(decimal: item.total).doubleValue),
                        innerRadius: .ratio(0.55),
                        angularInset: 2
                    )
                    .foregroundStyle(by: .value("科目", item.category.displayName))
                }
                .frame(height: 240)
            }
            .padding()
            .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
        }
    }

    private var breakdownCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("明細").font(.headline)
            if totalsByCategory.isEmpty {
                Text("尚無資料")
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 24)
            } else {
                ForEach(totalsByCategory, id: \.category) { item in
                    HStack {
                        Image(systemName: item.category.icon)
                            .frame(width: 28)
                        Text(item.category.displayName)
                        Spacer()
                        Text("$\(format(item.total))")
                            .font(.body.monospacedDigit())
                    }
                    .padding(.vertical, 4)
                    Divider()
                }
            }
        }
        .padding()
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }

    private func format(_ value: Decimal) -> String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.maximumFractionDigits = 0
        return f.string(from: NSDecimalNumber(decimal: value)) ?? "0"
    }
}

#Preview {
    StatsView()
        .modelContainer(DataController.makeContainer(inMemory: true))
}
