import SwiftUI
import SwiftData

@main
struct StimligInvoiceApp: App {
    let container = DataController.makeContainer()

    var body: some Scene {
        WindowGroup {
            RootView()
        }
        .modelContainer(container)
    }
}
