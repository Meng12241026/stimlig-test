import SwiftUI

struct RootView: View {
    var body: some View {
        TabView {
            InvoiceListView()
                .tabItem { Label("發票", systemImage: "doc.text.image") }

            StatsView()
                .tabItem { Label("統計", systemImage: "chart.pie.fill") }

            ExportView()
                .tabItem { Label("匯出", systemImage: "square.and.arrow.up") }
        }
    }
}

#Preview {
    RootView()
        .modelContainer(DataController.makeContainer(inMemory: true))
}
